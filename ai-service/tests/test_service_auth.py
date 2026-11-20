"""
Automated Security Test Suite: AI Service Authentication & CORS Hardening
Uses standard library unittest with FastAPI TestClient.
"""
import os
import unittest
from fastapi.testclient import TestClient

# Set isolated test secret before importing app
TEST_SECRET = "test_internal_service_key_32_characters_minimum!!"
os.environ["INTERNAL_SERVICE_KEY"] = TEST_SECRET
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5001"

from app.main import app

class TestAIServiceAuthentication(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_public_health_check_no_auth(self):
        """Public health check must succeed without authentication (HTTP 200)."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "HEALTHY")

    def test_02_public_root_check_no_auth(self):
        """Public root check must succeed without authentication (HTTP 200)."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "ONLINE")

    def test_03_extract_skills_missing_auth_header(self):
        """Protected endpoint must reject request with missing authentication header (HTTP 401)."""
        response = self.client.post("/extract-skills", json={"text": "Python React"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("Missing service authentication header", response.json().get("detail", ""))

    def test_04_extract_skills_invalid_auth_header(self):
        """Protected endpoint must reject request with invalid authentication key (HTTP 401)."""
        response = self.client.post(
            "/extract-skills",
            headers={"X-Internal-Service-Key": "invalid_wrong_key_12345678901234567890"},
            json={"text": "Python React"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid service authentication credentials", response.json().get("detail", ""))

    def test_05_extract_skills_empty_auth_header(self):
        """Protected endpoint must reject request with empty authentication key (HTTP 401)."""
        response = self.client.post(
            "/extract-skills",
            headers={"X-Internal-Service-Key": ""},
            json={"text": "Python React"},
        )
        self.assertEqual(response.status_code, 401)

    def test_06_constant_time_comparison_partial_match(self):
        """Constant-time comparison must reject partially matched prefixes (HTTP 401)."""
        partial_key = TEST_SECRET[:16] + ("0" * (len(TEST_SECRET) - 16))
        response = self.client.post(
            "/extract-skills",
            headers={"X-Internal-Service-Key": partial_key},
            json={"text": "Python React"},
        )
        self.assertEqual(response.status_code, 401)

    def test_07_extract_skills_valid_auth_header(self):
        """Protected endpoint must accept valid authentication key (HTTP 200)."""
        response = self.client.post(
            "/extract-skills",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            json={"text": "Expert in Python, React, and PostgreSQL."},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("Python", data.get("extracted_skills", []))

    def test_08_cors_untrusted_origin_rejected(self):
        """CORS must reject untrusted external origins."""
        response = self.client.options(
            "/health",
            headers={
                "Origin": "http://evil-attacker.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Starlette CORSMiddleware returns 400 for disallowed origins
        self.assertEqual(response.status_code, 400)

    def test_09_cors_trusted_frontend_origin_allowed(self):
        """CORS must allow trusted frontend origin (http://localhost:5173)."""
        response = self.client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_10_cors_no_wildcard_with_credentials(self):
        """CORS must not allow wildcard origin ('*') with credentials enabled."""
        response = self.client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertNotEqual(response.headers.get("access-control-allow-origin"), "*")

    def test_11_pdf_upload_reject_non_pdf_extension(self):
        """PDF upload must reject non-pdf file extensions (HTTP 400)."""
        response = self.client.post(
            "/upload-resume-pdf",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            files={"file": ("malicious.exe", b"not a pdf", "application/x-msdownload")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Only PDF documents", response.json().get("detail", ""))

    def test_12_pdf_upload_reject_invalid_mime_type(self):
        """PDF upload must reject mismatching MIME types (HTTP 400)."""
        response = self.client.post(
            "/upload-resume-pdf",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            files={"file": ("fake.pdf", b"fake content", "image/png")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid MIME type", response.json().get("detail", ""))

    def test_13_pdf_upload_reject_empty_payload(self):
        """PDF upload must reject empty files (HTTP 400)."""
        response = self.client.post(
            "/upload-resume-pdf",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json().get("detail", "").lower())

    def test_14_pdf_upload_reject_oversized_payload(self):
        """PDF upload must reject files exceeding 5MB ceiling (HTTP 413)."""
        oversized_data = b"A" * (5 * 1024 * 1024 + 1024)
        response = self.client.post(
            "/upload-resume-pdf",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            files={"file": ("huge.pdf", oversized_data, "application/pdf")},
        )
        self.assertEqual(response.status_code, 413)

    def test_15_gap_analysis_protected_endpoint(self):
        """Gap analysis endpoint requires authentication and works with valid key (HTTP 200)."""
        # Without key -> 401
        res_unauth = self.client.post(
            "/analyze-skill-gap",
            json={"target_role": "Full Stack Developer", "acquired_skills": ["React"]},
        )
        self.assertEqual(res_unauth.status_code, 401)

        # With key -> 200
        res_auth = self.client.post(
            "/analyze-skill-gap",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            json={"target_role": "Full Stack Developer", "acquired_skills": ["React"]},
        )
        self.assertEqual(res_auth.status_code, 200)
        self.assertTrue(res_auth.json().get("success"))

    def test_16_job_matching_protected_endpoint(self):
        """Job matching endpoint requires authentication and works with valid key (HTTP 200)."""
        payload = {
            "student_skills": ["Python"],
            "job_required_skills": [{"name": "Python", "weight": 20.0, "minimum_level": "beginner"}],
            "student_cgpa": 8.0,
            "job_min_cgpa": 6.0,
        }
        res_unauth = self.client.post("/match-jobs", json=payload)
        self.assertEqual(res_unauth.status_code, 401)

        res_auth = self.client.post(
            "/match-jobs",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            json=payload,
        )
        self.assertEqual(res_auth.status_code, 200)
        self.assertTrue(res_auth.json().get("success"))

    def test_17_career_readiness_protected_endpoint(self):
        """Career readiness endpoint requires authentication and works with valid key (HTTP 200)."""
        payload = {
            "target_role": "Software Engineer",
            "student_skills": [{"name": "Python", "level": "intermediate"}],
            "student_cgpa": 8.5,
            "projects": [{"title": "Demo"}],
            "experience": [],
            "profile_complete_percent": 80,
        }
        res_unauth = self.client.post("/career-intelligence/readiness", json=payload)
        self.assertEqual(res_unauth.status_code, 401)

        res_auth = self.client.post(
            "/career-intelligence/readiness",
            headers={"X-Internal-Service-Key": TEST_SECRET},
            json=payload,
        )
        self.assertEqual(res_auth.status_code, 200)
        self.assertTrue(res_auth.json().get("success"))


if __name__ == "__main__":
    unittest.main()
