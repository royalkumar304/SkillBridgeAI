"""
Python Security & Data Integrity Test Suite: AI Fallback & Deterministic Engine
Verifies that fallback algorithms never invent fake skills or return static scores.
"""
import unittest
from app.services.career_intelligence import evaluate_career_readiness, evaluate_job_skill_gap
from app.services.mock_matcher import analyze_gap

class TestAIFallbackIntegrity(unittest.TestCase):
    def test_01_empty_profile_insufficient_data(self):
        """Empty profile must return sufficient_data=False and 0.0 readiness score."""
        result = evaluate_career_readiness(
            target_role="Full Stack Developer",
            student_skills=[],
            student_cgpa=None,
            projects=[],
            experience=[],
            profile_complete_percent=0.0
        )
        self.assertFalse(result["sufficient_data"])
        self.assertEqual(result["readiness_score"], 0.0)
        self.assertEqual(result["breakdown"]["skill_coverage_score"], 0.0)
        self.assertEqual(result["breakdown"]["practical_evidence_score"], 0.0)
        self.assertEqual(result["breakdown"]["academic_completeness_score"], 0.0)

    def test_02_actual_skills_affect_matching(self):
        """Actual student skills directly determine benchmark matching."""
        result_few = evaluate_career_readiness(
            target_role="Full Stack Developer",
            student_skills=[{"name": "React"}],
            student_cgpa=7.5,
            projects=[],
            experience=[],
            profile_complete_percent=50.0
        )
        result_more = evaluate_career_readiness(
            target_role="Full Stack Developer",
            student_skills=[{"name": "React"}, {"name": "Node.js"}, {"name": "MongoDB"}],
            student_cgpa=7.5,
            projects=[],
            experience=[],
            profile_complete_percent=50.0
        )
        self.assertTrue(result_few["sufficient_data"])
        self.assertTrue(result_more["sufficient_data"])
        self.assertGreater(result_more["readiness_score"], result_few["readiness_score"])
        self.assertGreater(
            result_more["breakdown"]["skill_coverage_score"],
            result_few["breakdown"]["skill_coverage_score"]
        )

    def test_03_missing_skills_derived_from_role_benchmark(self):
        """Missing skills must be dynamically computed against the requested role benchmark."""
        result_frontend = analyze_gap(
            target_role="Frontend Developer",
            acquired_skills=["React", "JavaScript", "HTML", "CSS", "Tailwind CSS"]
        )
        # Should NOT contain random backend skills like Docker
        self.assertNotIn("Docker", result_frontend["missing_critical_skills"])
        # Should accurately list missing benchmark skills from Frontend Developer
        self.assertIn("Git", result_frontend["missing_critical_skills"])

    def test_04_no_static_fallback_score(self):
        """Readiness score must be calculated dynamically, never returning static 75.0 or 85.7."""
        result_zero_skills = analyze_gap(
            target_role="Full Stack Developer",
            acquired_skills=[]
        )
        self.assertEqual(result_zero_skills["readiness_score"], 0.0)
        self.assertEqual(result_zero_skills["gap_percentage"], 100.0)

        result_half_skills = analyze_gap(
            target_role="Full Stack Developer",
            acquired_skills=["React", "Node.js", "Express"]
        )
        self.assertNotEqual(result_half_skills["readiness_score"], 75.0)
        self.assertNotEqual(result_half_skills["readiness_score"], 85.7)

    def test_05_job_skill_gap_input_dependent(self):
        """Job skill gap must be evaluated from actual student skills vs required skills."""
        gap_empty = evaluate_job_skill_gap(
            student_skills=[],
            job_required_skills=[{"name": "Python", "weight": 20.0}]
        )
        self.assertEqual(gap_empty["skill_coverage"], 0.0)
        self.assertEqual(len(gap_empty["matched_skills"]), 0)
        self.assertEqual(gap_empty["missing_skills"][0]["name"], "Python")

        gap_matched = evaluate_job_skill_gap(
            student_skills=[{"name": "Python", "level": "intermediate"}],
            job_required_skills=[{"name": "Python", "weight": 20.0}]
        )
        self.assertEqual(gap_matched["skill_coverage"], 100.0)
        self.assertEqual(gap_matched["matched_skills"][0]["name"], "Python")
        self.assertEqual(len(gap_matched["missing_skills"]), 0)

    def test_06_score_bounded_between_zero_and_hundred(self):
        """Readiness and match scores must strictly stay between 0.0 and 100.0."""
        result = evaluate_career_readiness(
            target_role="Full Stack Developer",
            student_skills=[{"name": s} for s in ["React", "Node.js", "Express", "MongoDB", "JavaScript", "REST API", "Git", "Extra1", "Extra2"]],
            student_cgpa=9.9,
            projects=[{"title": f"P{i}"} for i in range(10)],
            experience=[{"company": f"C{i}"} for i in range(10)],
            profile_complete_percent=100.0
        )
        self.assertLessEqual(result["readiness_score"], 100.0)
        self.assertGreaterEqual(result["readiness_score"], 0.0)

if __name__ == "__main__":
    unittest.main()
