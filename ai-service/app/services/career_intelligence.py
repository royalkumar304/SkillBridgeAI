"""
SkillBridge AI — Career Intelligence & Learning Recommendation Engine (Day 4)
Provides deterministic, explainable skill gap analysis, level-aware matching,
and structured learning paths backed by verified official documentation.
"""

from typing import List, Dict, Any, Optional

# Verified learning resources catalog referencing official documentation and tutorials
LEARNING_RESOURCE_CATALOGUE = {
    "React": [
        {
            "level": "beginner",
            "title": "React Quick Start & Interactive Essentials",
            "provider": "React Official Docs",
            "description": "Master components, props, state, and event handling using modern React functional components.",
            "estimated_hours": 10,
            "source_url": "https://react.dev/learn",
        },
        {
            "level": "intermediate",
            "title": "Managing State & Effect Lifecycles in React",
            "provider": "React Official Docs",
            "description": "Deep dive into useContext, useReducer, useEffect, custom hooks, and memoization patterns.",
            "estimated_hours": 15,
            "source_url": "https://react.dev/learn/managing-state",
        },
        {
            "level": "advanced",
            "title": "Advanced React Patterns & Performance Optimization",
            "provider": "React Official Docs",
            "description": "Learn Concurrent Mode, Server Components, Code Splitting, and Suspense.",
            "estimated_hours": 18,
            "source_url": "https://react.dev/reference/react",
        },
    ],
    "Node.js": [
        {
            "level": "beginner",
            "title": "Getting Started with Node.js & Event Loop",
            "provider": "Node.js Official Docs",
            "description": "Understand asynchronous non-blocking I/O, core modules (fs, path, http), and npm package management.",
            "estimated_hours": 12,
            "source_url": "https://nodejs.org/docs/latest/api/",
        },
        {
            "level": "intermediate",
            "title": "Building Production Node.js APIs & Streams",
            "provider": "Node.js Official Learning",
            "description": "Master readable/writable streams, buffer manipulation, cluster module, and worker threads.",
            "estimated_hours": 16,
            "source_url": "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
        },
        {
            "level": "advanced",
            "title": "High-Throughput Node.js Architecture & Security",
            "provider": "Node.js Security Working Group",
            "description": "Memory profiling, garbage collection tuning, rate limiting, and vulnerability prevention.",
            "estimated_hours": 20,
            "source_url": "https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot",
        },
    ],
    "Express": [
        {
            "level": "beginner",
            "title": "Express.js Fast Track: Routing & Middleware",
            "provider": "Express.js Official Guide",
            "description": "Learn Express application structure, route parameters, request handlers, and built-in middleware.",
            "estimated_hours": 8,
            "source_url": "https://expressjs.com/en/starter/installing.html",
        },
        {
            "level": "intermediate",
            "title": "Secure REST API Development with Express",
            "provider": "Express.js Official Guide",
            "description": "Implement authentication guards, CORS policies, Helmet security headers, and structured error handling.",
            "estimated_hours": 14,
            "source_url": "https://expressjs.com/en/advanced/best-practice-security.html",
        },
    ],
    "MongoDB": [
        {
            "level": "beginner",
            "title": "MongoDB Basics & Document Modeling",
            "provider": "MongoDB University",
            "description": "Learn JSON-like document storage, BSON types, CRUD operations, and Compass query construction.",
            "estimated_hours": 10,
            "source_url": "https://learn.mongodb.com/",
        },
        {
            "level": "intermediate",
            "title": "MongoDB Schema Design & Aggregation Pipelines",
            "provider": "MongoDB University",
            "description": "Master aggregation stages ($match, $group, $lookup, $unwind) and indexing strategies for high throughput.",
            "estimated_hours": 15,
            "source_url": "https://www.mongodb.com/docs/manual/aggregation/",
        },
    ],
    "Python": [
        {
            "level": "beginner",
            "title": "The Python Tutorial: Syntax to Object-Oriented Design",
            "provider": "Python Software Foundation",
            "description": "Core data structures, comprehensions, functions, OOP classes, and standard library modules.",
            "estimated_hours": 12,
            "source_url": "https://docs.python.org/3/tutorial/",
        },
        {
            "level": "intermediate",
            "title": "Python Concurrency, Type Hinting & Packaging",
            "provider": "Python Software Foundation",
            "description": "Asyncio event loops, coroutines, type hinting with mypy, and pip packaging standards.",
            "estimated_hours": 16,
            "source_url": "https://docs.python.org/3/library/asyncio.html",
        },
    ],
    "Docker": [
        {
            "level": "beginner",
            "title": "Docker Essentials: Containers, Images & Dockerfiles",
            "provider": "Docker Official Docs",
            "description": "Container lifecycle management, multi-stage Dockerfiles, image caching, and port forwarding.",
            "estimated_hours": 8,
            "source_url": "https://docs.docker.com/get-started/",
        },
        {
            "level": "intermediate",
            "title": "Docker Compose & Multi-Container Networking",
            "provider": "Docker Official Docs",
            "description": "Orchestrate multi-service applications (React + Node + MongoDB) with volumes and virtual networks.",
            "estimated_hours": 12,
            "source_url": "https://docs.docker.com/compose/",
        },
    ],
    "Kubernetes": [
        {
            "level": "beginner",
            "title": "Kubernetes Core Architecture & Pod Deployment",
            "provider": "Kubernetes Official Tutorials",
            "description": "Understand Control Plane, Nodes, Pods, Deployments, and kubectl commands.",
            "estimated_hours": 14,
            "source_url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        },
        {
            "level": "intermediate",
            "title": "Kubernetes Services, Ingress & Helm Deployments",
            "provider": "Kubernetes Official Documentation",
            "description": "Configure ClusterIP, NodePort, LoadBalancer services, Ingress controllers, and ConfigMaps.",
            "estimated_hours": 18,
            "source_url": "https://kubernetes.io/docs/concepts/services-networking/service/",
        },
    ],
    "AWS": [
        {
            "level": "beginner",
            "title": "AWS Cloud Foundations: EC2, S3 & IAM",
            "provider": "Amazon Web Services",
            "description": "Cloud security principles, IAM roles, S3 bucket policies, and deploying compute instances.",
            "estimated_hours": 12,
            "source_url": "https://aws.amazon.com/getting-started/",
        },
        {
            "level": "intermediate",
            "title": "Serverless & Microservices on AWS",
            "provider": "Amazon Web Services",
            "description": "Deploy serverless functions with AWS Lambda, API Gateway, and CloudFront CDN distribution.",
            "estimated_hours": 16,
            "source_url": "https://aws.amazon.com/serverless/",
        },
    ],
    "TypeScript": [
        {
            "level": "beginner",
            "title": "TypeScript Handbook: Everyday Types & Interfaces",
            "provider": "TypeScript Official Docs",
            "description": "Type annotations, interfaces, union types, type narrowing, and strict compile options.",
            "estimated_hours": 10,
            "source_url": "https://www.typescriptlang.org/docs/handbook/intro.html",
        },
        {
            "level": "intermediate",
            "title": "Generics, Utility Types & Advanced Inference",
            "provider": "TypeScript Official Docs",
            "description": "Build reusable generic interfaces, mapped types, conditional types, and declaration files.",
            "estimated_hours": 14,
            "source_url": "https://www.typescriptlang.org/docs/handbook/2/generics.html",
        },
    ],
    "FastAPI": [
        {
            "level": "beginner",
            "title": "FastAPI User Guide: Path Operations & Pydantic",
            "provider": "FastAPI Documentation",
            "description": "Build high-performance REST endpoints with automatic OpenAPI documentation and type validation.",
            "estimated_hours": 8,
            "source_url": "https://fastapi.tiangolo.com/tutorial/",
        },
        {
            "level": "intermediate",
            "title": "FastAPI Dependency Injection & Background Tasks",
            "provider": "FastAPI Documentation",
            "description": "Implement security dependencies, OAuth2 scopes, async background jobs, and test clients.",
            "estimated_hours": 12,
            "source_url": "https://fastapi.tiangolo.com/tutorial/dependencies/",
        },
    ],
    "Tailwind CSS": [
        {
            "level": "beginner",
            "title": "Utility-First CSS with Tailwind",
            "provider": "Tailwind Labs",
            "description": "Responsive breakpoints, flexbox/grid utilities, typography, and dark mode configuration.",
            "estimated_hours": 6,
            "source_url": "https://tailwindcss.com/docs/utility-first",
        },
    ],
    "Git": [
        {
            "level": "beginner",
            "title": "Pro Git: Branching, Merging & Remote Workflows",
            "provider": "Git Official Documentation",
            "description": "Learn branching strategies, stash, merge conflicts, interactive rebasing, and pull requests.",
            "estimated_hours": 6,
            "source_url": "https://git-scm.com/doc",
        },
    ],
    "SQL": [
        {
            "level": "beginner",
            "title": "Relational Databases & SQL Query Fundamentals",
            "provider": "PostgreSQL Documentation",
            "description": "DDL/DML operations, JOIN syntax (INNER, LEFT, RIGHT), GROUP BY aggregations, and primary/foreign keys.",
            "estimated_hours": 10,
            "source_url": "https://www.postgresql.org/docs/current/tutorial.html",
        },
    ],
    "REST API": [
        {
            "level": "beginner",
            "title": "RESTful Web API Architectural Constraints",
            "provider": "MDN Web Docs",
            "description": "HTTP request methods (GET, POST, PUT, PATCH, DELETE), status codes, idempotency, and statelessness.",
            "estimated_hours": 6,
            "source_url": "https://developer.mozilla.org/en-US/docs/Glossary/REST",
        },
    ],
}

LEVEL_HIERARCHY = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
}

ROLE_BENCHMARKS = {
    "Full Stack Developer": ["React", "Node.js", "Express", "MongoDB", "JavaScript", "REST API", "Git"],
    "Frontend Developer": ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS", "TypeScript", "Git"],
    "Backend Developer": ["Node.js", "Express", "MongoDB", "SQL", "REST API", "Docker", "Git"],
    "AI/ML Engineer": ["Python", "FastAPI", "Docker", "SQL", "Git"],
    "Cloud & DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Python", "Git"],
}


def evaluate_job_skill_gap(
    student_skills: List[Dict[str, Any]],
    job_required_skills: List[Dict[str, Any]],
    job_preferred_skills: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Evaluates student skills against job-specific required and preferred skills.
    Distinguishes full match, partial match (proficiency level lower than required),
    and missing skills with level-aware scoring.
    """
    if job_preferred_skills is None:
        job_preferred_skills = []

    # Map student skills by lowercase name: { "react": 2 }
    student_map = {}
    for s in student_skills:
        name = str(s.get("name", "")).strip().lower()
        level_str = str(s.get("level", "beginner")).strip().lower()
        numeric_level = LEVEL_HIERARCHY.get(level_str, 1)
        if name:
            student_map[name] = {
                "original_name": s.get("name", "").strip(),
                "level_str": level_str,
                "numeric_level": numeric_level,
            }

    matched_skills = []
    partially_matched_skills = []
    missing_skills = []

    total_weight = 0.0
    accumulated_weight = 0.0

    for req in job_required_skills:
        req_name = str(req.get("name", "")).strip()
        weight = float(req.get("weight", 20.0))
        min_level_str = str(req.get("minimumLevel") or req.get("minimum_level") or "beginner").strip().lower()
        min_level_num = LEVEL_HIERARCHY.get(min_level_str, 1)

        total_weight += weight
        req_key = req_name.lower()

        if req_key in student_map:
            st_info = student_map[req_key]
            if st_info["numeric_level"] >= min_level_num:
                # Full level match
                matched_skills.append({
                    "name": req_name,
                    "student_level": st_info["level_str"],
                    "required_level": min_level_str,
                    "weight": weight,
                })
                accumulated_weight += weight
            else:
                # Partial match (has skill but lower level)
                partially_matched_skills.append({
                    "name": req_name,
                    "student_level": st_info["level_str"],
                    "required_level": min_level_str,
                    "weight": weight,
                    "reason": f"Skill held at {st_info['level_str']} level; job requires {min_level_str} level.",
                })
                # Partial match contributes 50% of the weight
                accumulated_weight += weight * 0.5
        else:
            missing_skills.append({
                "name": req_name,
                "required_level": min_level_str,
                "weight": weight,
            })

    skill_coverage = round((accumulated_weight / total_weight * 100.0), 1) if total_weight > 0 else 0.0
    skill_coverage = min(100.0, max(0.0, skill_coverage))

    # Actionable suggestions
    suggestions = []
    if missing_skills:
        missing_names = [m["name"] for m in missing_skills]
        suggestions.append(f"Critical Gap: Acquire foundational competency in {', '.join(missing_names)}.")
    if partially_matched_skills:
        for p in partially_matched_skills:
            suggestions.append(f"Level Gap: Elevate {p['name']} from {p['student_level']} to {p['required_level']} proficiency.")
    if not missing_skills and not partially_matched_skills:
        suggestions.append("Outstanding fit: You satisfy all required competencies for this opportunity.")

    # Build prioritized learning path
    learning_path = []
    targeted_skills = [m["name"] for m in missing_skills] + [p["name"] for p in partially_matched_skills]
    
    # Also include preferred skills if missing
    for pref in job_preferred_skills:
        pref_name = str(pref.get("name", "")).strip()
        if pref_name and pref_name.lower() not in student_map and pref_name not in targeted_skills:
            targeted_skills.append(pref_name)

    for skill_name in targeted_skills:
        # Match case-insensitively with catalogue
        resources = []
        for cat_key, cat_res in LEARNING_RESOURCE_CATALOGUE.items():
            if cat_key.lower() == skill_name.lower():
                resources = cat_res
                break

        if resources:
            for r in resources:
                learning_path.append({
                    "skill": skill_name,
                    "level": r["level"],
                    "title": r["title"],
                    "provider": r["provider"],
                    "description": r["description"],
                    "estimated_hours": r["estimated_hours"],
                    "source_url": r["source_url"],
                    "priority": "HIGH" if any(m["name"].lower() == skill_name.lower() for m in missing_skills) else "MEDIUM",
                })
        else:
            # Fallback resource with documentation guideline
            learning_path.append({
                "skill": skill_name,
                "level": "beginner",
                "title": f"{skill_name} Official Developer Guide & Fundamentals",
                "provider": "Official Technology Documentation",
                "description": f"Structured documentation, setup tutorials, and reference manual for {skill_name}.",
                "estimated_hours": 10,
                "source_url": f"https://devdocs.io/#q={skill_name.lower()}",
                "priority": "HIGH" if any(m["name"].lower() == skill_name.lower() for m in missing_skills) else "MEDIUM",
            })

    return {
        "skill_coverage": skill_coverage,
        "matched_skills": matched_skills,
        "partially_matched_skills": partially_matched_skills,
        "missing_skills": missing_skills,
        "actionable_suggestions": suggestions,
        "learning_path": learning_path,
    }


def evaluate_career_readiness(
    target_role: str,
    student_skills: List[Dict[str, Any]],
    student_cgpa: Optional[float] = None,
    projects: Optional[List[Dict[str, Any]]] = None,
    experience: Optional[List[Dict[str, Any]]] = None,
    profile_complete_percent: float = 0.0,
) -> Dict[str, Any]:
    """
    Computes a transparent, explainable career readiness score.
    Formula:
      - 50% Skill Coverage against role benchmark
      - 30% Practical Evidence (Projects & Verified Experience)
      - 20% Academic & Profile Completeness
    """
    if projects is None:
        projects = []
    if experience is None:
        experience = []

    benchmark = ROLE_BENCHMARKS.get(target_role, ROLE_BENCHMARKS["Full Stack Developer"])
    
    student_skill_names = {str(s.get("name", "")).strip().lower() for s in student_skills if s.get("name")}
    
    if not student_skill_names:
        return {
            "sufficient_data": False,
            "readiness_score": 0.0,
            "target_role": target_role,
            "message": "Insufficient profile data. Add skills, academic background, and projects to evaluate readiness.",
            "breakdown": {
                "skill_coverage_score": 0.0,
                "practical_evidence_score": 0.0,
                "academic_completeness_score": 0.0,
            },
            "matched_benchmark_skills": [],
            "missing_benchmark_skills": benchmark,
            "improvement_areas": ["Add technical skills to your profile", "Add projects to provide evidence"],
        }

    # 1. Skill Coverage Score (max 50 points)
    matched_benchmark = []
    missing_benchmark = []
    for b in benchmark:
        if b.lower() in student_skill_names:
            matched_benchmark.append(b)
        else:
            missing_benchmark.append(b)

    benchmark_ratio = len(matched_benchmark) / len(benchmark) if benchmark else 0.0
    skill_coverage_score = round(benchmark_ratio * 50.0, 1)

    # 2. Practical Evidence Score (max 30 points)
    # Up to 20 pts from projects (5 pts per project with tech stack, max 4 projects)
    # Up to 10 pts from experience (5 pts per experience, max 2)
    project_score = min(20.0, len(projects) * 5.0)
    experience_score = min(10.0, len(experience) * 5.0)
    practical_evidence_score = round(project_score + experience_score, 1)

    # 3. Academic & Completeness Score (max 20 points)
    # Profile completeness contributes up to 10 points
    # CGPA >= 7.0 contributes 10 points, >= 6.0 contributes 6 points
    completeness_pts = (profile_complete_percent / 100.0) * 10.0
    cgpa_pts = 10.0 if (student_cgpa is not None and student_cgpa >= 7.0) else (6.0 if (student_cgpa is not None and student_cgpa >= 6.0) else 0.0)
    academic_score = round(completeness_pts + cgpa_pts, 1)

    total_readiness = round(skill_coverage_score + practical_evidence_score + academic_score, 1)
    total_readiness = min(100.0, max(0.0, total_readiness))

    improvement_areas = []
    if missing_benchmark:
        improvement_areas.append(f"Learn core benchmark skills: {', '.join(missing_benchmark[:3])}")
    if len(projects) < 2:
        improvement_areas.append("Add at least 2 featured projects demonstrating target skills")
    if len(experience) == 0:
        improvement_areas.append("Seek an internship or industry collaboration to build verified experience")
    if profile_complete_percent < 100:
        improvement_areas.append("Complete missing profile details to reach 100% readiness index")

    return {
        "sufficient_data": True,
        "readiness_score": total_readiness,
        "target_role": target_role,
        "message": f"Evaluated based on {len(matched_benchmark)}/{len(benchmark)} benchmark skills, {len(projects)} projects, and {len(experience)} experiences.",
        "breakdown": {
            "skill_coverage_score": skill_coverage_score,
            "practical_evidence_score": practical_evidence_score,
            "academic_completeness_score": academic_score,
        },
        "matched_benchmark_skills": matched_benchmark,
        "missing_benchmark_skills": missing_benchmark,
        "improvement_areas": improvement_areas,
    }
