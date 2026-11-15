"""
Job Matching and Skill Gap Engine (Day 1 Deterministic Baseline)
Calculates normalized weighted scores and analyzes career readiness gaps.
"""

from typing import List, Dict, Any

ROLE_BENCHMARKS = {
    "Full Stack Developer": ["React", "Node.js", "Express", "MongoDB", "JavaScript", "REST API", "Git"],
    "Frontend Developer": ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Git"],
    "Backend Developer": ["Node.js", "Express", "MongoDB", "SQL", "REST API", "Docker", "Git"],
    "AI/ML Engineer": ["Python", "Machine Learning", "FastAPI", "Pandas", "NumPy", "Git"],
}

COURSE_CATALOGUE = {
    "Node.js": {"title": "Complete Node.js & Express Developer Course", "hours": 20},
    "MongoDB": {"title": "MongoDB Data Modeling and Aggregation Pipelines", "hours": 15},
    "React": {"title": "Modern React with Redux & Hooks", "hours": 25},
    "Docker": {"title": "Docker & Containerization Fundamentals", "hours": 10},
    "TypeScript": {"title": "TypeScript from Scratch for Enterprise Apps", "hours": 12},
    "FastAPI": {"title": "Building High Performance APIs with FastAPI", "hours": 14},
    "REST API": {"title": "RESTful API Architecture & Security", "hours": 8},
}

def calculate_job_match(
    student_skills: List[str],
    job_required_skills: List[Any],
    student_cgpa: float,
    job_min_cgpa: float
) -> Dict[str, Any]:
    """
    Computes weighted skill match percentage and checks eligibility.
    """
    normalized_student_skills = {s.strip().lower() for s in student_skills}
    
    total_weight = 0.0
    accumulated_score = 0.0
    matched_skills = []
    missing_skills = []

    for req in job_required_skills:
        req_name = req.name.strip()
        weight = float(req.weight)
        total_weight += weight

        if req_name.lower() in normalized_student_skills:
            accumulated_score += weight
            matched_skills.append(req_name)
        else:
            missing_skills.append(req_name)

    # Normalize score out of 100
    skill_match_score = (accumulated_score / total_weight * 100.0) if total_weight > 0 else 0.0
    cgpa_eligible = student_cgpa >= job_min_cgpa

    # Combined score
    overall_match = round(skill_match_score * 0.9 + (10.0 if cgpa_eligible else 0.0), 1)
    overall_match = min(100.0, max(0.0, overall_match))

    recommendation = (
        f"Matches {len(matched_skills)} required skill(s). "
        f"{'Eligible' if cgpa_eligible else 'Below CGPA threshold'}. "
        f"{f'Missing skills to acquire: {', '.join(missing_skills)}.' if missing_skills else 'All core skills satisfied!'}"
    )

    return {
        "match_percentage": overall_match,
        "cgpa_eligible": cgpa_eligible,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "breakdown": {
            "skill_match_score": round(skill_match_score, 1),
            "cgpa_score": 100.0 if cgpa_eligible else 0.0
        },
        "recommendation_summary": recommendation
    }

def analyze_gap(target_role: str, acquired_skills: List[str]) -> Dict[str, Any]:
    """
    Analyzes missing skills against industry career path benchmark.
    """
    benchmarks = ROLE_BENCHMARKS.get(target_role, ROLE_BENCHMARKS["Full Stack Developer"])
    normalized_acquired = {s.strip().lower() for s in acquired_skills}

    matched = []
    missing = []
    
    for skill in benchmarks:
        if skill.lower() in normalized_acquired:
            matched.append(skill)
        else:
            missing.append(skill)

    readiness_score = round((len(matched) / len(benchmarks)) * 100, 1) if benchmarks else 0.0
    gap_percentage = round(100.0 - readiness_score, 1)

    recommended_courses = []
    for miss in missing:
        course_info = COURSE_CATALOGUE.get(miss, {"title": f"Practical Guide to {miss}", "hours": 12})
        recommended_courses.append({
            "skill": miss,
            "title": course_info["title"],
            "estimated_hours": course_info["hours"]
        })

    return {
        "target_role": target_role,
        "readiness_score": readiness_score,
        "gap_percentage": gap_percentage,
        "acquired_skills": matched,
        "missing_critical_skills": missing,
        "recommended_courses": recommended_courses
    }

