"""
Real Rule-Based NLP & Keyword Skill Extraction Pipeline
Provides deterministic taxonomy matching, alias resolution, snippet evidence, and confidence scoring.
"""

import re
from typing import List, Dict, Any, Tuple

# Comprehensive Standardized Industry Taxonomy
SKILL_TAXONOMY = {
    # Programming Languages
    "Python": {"category": "Languages", "aliases": ["python", "python3", "python 3", "py"]},
    "JavaScript": {"category": "Languages", "aliases": ["javascript", "js", "ecmascript", "es6"]},
    "TypeScript": {"category": "Languages", "aliases": ["typescript", "ts"]},
    "Java": {"category": "Languages", "aliases": ["java", "core java", "j2ee"]},
    "C++": {"category": "Languages", "aliases": ["c++", "cpp"]},
    "C#": {"category": "Languages", "aliases": ["c#", "c-sharp", "csharp", ".net c#"]},
    "Go": {"category": "Languages", "aliases": ["golang", "go language"]},
    "Rust": {"category": "Languages", "aliases": ["rust", "rust-lang"]},
    "SQL": {"category": "Languages", "aliases": ["sql", "structured query language", "pl/sql", "t-sql"]},
    "HTML": {"category": "Languages", "aliases": ["html", "html5"]},
    "CSS": {"category": "Languages", "aliases": ["css", "css3"]},

    # Frontend Frameworks & Libraries
    "React": {"category": "Frontend", "aliases": ["react", "react.js", "reactjs", "react-native"]},
    "Next.js": {"category": "Frontend", "aliases": ["next.js", "nextjs", "next js"]},
    "Angular": {"category": "Frontend", "aliases": ["angular", "angularjs", "angular.js"]},
    "Vue.js": {"category": "Frontend", "aliases": ["vue", "vue.js", "vuejs"]},
    "Redux": {"category": "Frontend", "aliases": ["redux", "redux toolkit", "rtk"]},
    "Tailwind CSS": {"category": "Frontend", "aliases": ["tailwind", "tailwindcss", "tailwind css"]},
    "Bootstrap": {"category": "Frontend", "aliases": ["bootstrap", "bootstrap 5"]},

    # Backend Frameworks & Runtimes
    "Node.js": {"category": "Backend", "aliases": ["node.js", "nodejs", "node js", "node"]},
    "Express": {"category": "Backend", "aliases": ["express", "express.js", "expressjs"]},
    "FastAPI": {"category": "Backend", "aliases": ["fastapi", "fast-api", "fast api"]},
    "Django": {"category": "Backend", "aliases": ["django", "django rest framework", "drf"]},
    "Flask": {"category": "Backend", "aliases": ["flask"]},
    "Spring Boot": {"category": "Backend", "aliases": ["spring boot", "springboot", "spring-boot", "spring framework"]},
    "NestJS": {"category": "Backend", "aliases": ["nestjs", "nest.js"]},

    # Databases & Caching
    "MongoDB": {"category": "Databases", "aliases": ["mongodb", "mongo", "nosql mongodb"]},
    "PostgreSQL": {"category": "Databases", "aliases": ["postgresql", "postgres", "psql"]},
    "MySQL": {"category": "Databases", "aliases": ["mysql", "my-sql"]},
    "Redis": {"category": "Databases", "aliases": ["redis"]},
    "SQLite": {"category": "Databases", "aliases": ["sqlite", "sqlite3"]},

    # Cloud, Containerization & DevOps
    "Docker": {"category": "Cloud & DevOps", "aliases": ["docker", "dockerfile", "docker-compose"]},
    "Kubernetes": {"category": "Cloud & DevOps", "aliases": ["kubernetes", "k8s"]},
    "AWS": {"category": "Cloud & DevOps", "aliases": ["aws", "amazon web services", "ec2", "s3", "lambda"]},
    "Google Cloud": {"category": "Cloud & DevOps", "aliases": ["gcp", "google cloud", "google cloud platform"]},
    "Azure": {"category": "Cloud & DevOps", "aliases": ["azure", "microsoft azure"]},
    "Git": {"category": "Cloud & DevOps", "aliases": ["git", "version control git"]},
    "GitHub": {"category": "Cloud & DevOps", "aliases": ["github"]},
    "CI/CD": {"category": "Cloud & DevOps", "aliases": ["ci/cd", "continuous integration", "github actions", "jenkins"]},
    "Linux": {"category": "Cloud & DevOps", "aliases": ["linux", "ubuntu", "unix", "bash"]},

    # AI, Machine Learning & Data Science
    "Machine Learning": {"category": "AI & Data", "aliases": ["machine learning", "ml"]},
    "Deep Learning": {"category": "AI & Data", "aliases": ["deep learning", "neural networks"]},
    "Natural Language Processing": {"category": "AI & Data", "aliases": ["nlp", "natural language processing"]},
    "PyTorch": {"category": "AI & Data", "aliases": ["pytorch", "torch"]},
    "TensorFlow": {"category": "AI & Data", "aliases": ["tensorflow", "tf", "keras"]},
    "Pandas": {"category": "AI & Data", "aliases": ["pandas"]},
    "NumPy": {"category": "AI & Data", "aliases": ["numpy"]},
    "Scikit-Learn": {"category": "AI & Data", "aliases": ["scikit-learn", "sklearn"]},

    # Architecture & Concepts
    "REST API": {"category": "Architecture", "aliases": ["rest api", "restful api", "restful", "rest"]},
    "GraphQL": {"category": "Architecture", "aliases": ["graphql", "graph-ql"]},
    "Microservices": {"category": "Architecture", "aliases": ["microservices", "microservice architecture"]},
    "Data Structures": {"category": "Fundamentals", "aliases": ["data structures", "dsa"]},
    "Algorithms": {"category": "Fundamentals", "aliases": ["algorithms", "algorithmic problem solving"]},
}

def _find_evidence_snippet(text: str, match_start: int, match_end: int, window: int = 60) -> str:
    """
    Extracts a readable sentence or context window around the matched skill.
    """
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)
    snippet = text[start:end].replace("\n", " ").strip()
    return f"...{snippet}..."

def extract_skills_pipeline(text: str) -> Dict[str, Any]:
    """
    Executes rule-based keyword and alias extraction with evidence and confidence scoring.
    """
    if not text or not text.strip():
        return {
            "extracted_skills": [],
            "skill_details": [],
            "total_count": 0,
            "pipeline_type": "RULE_BASED_TAXONOMY_NORMALIZER",
            "is_trained_ai": False,
        }

    clean_text = text
    lower_text = text.lower()

    detected_skills = {}

    for canonical_name, config in SKILL_TAXONOMY.items():
        category = config["category"]
        aliases = config["aliases"]

        # Sort aliases by length descending so longer phrases match first
        aliases_sorted = sorted(aliases, key=len, reverse=True)

        for alias in aliases_sorted:
            # Special regex handling for short symbols or punctuation
            escaped_alias = re.escape(alias)
            if alias in ["c++", "c#", "go", "r", "c"]:
                pattern = r'(?:\b|(?<=[^a-zA-Z0-9]))' + escaped_alias + r'(?:\b|(?=[^a-zA-Z0-9]))'
            else:
                pattern = r'\b' + escaped_alias + r'\b'

            matches = list(re.finditer(pattern, lower_text))
            if matches:
                first_match = matches[0]
                evidence = _find_evidence_snippet(clean_text, first_match.start(), first_match.end())

                # Calculate confidence: base 0.88 + frequency bonus (up to 0.98)
                freq = len(matches)
                confidence = min(0.98, round(0.88 + (freq - 1) * 0.03, 2))

                detected_skills[canonical_name] = {
                    "name": canonical_name,
                    "category": category,
                    "matched_alias": alias,
                    "frequency": freq,
                    "confidence": confidence,
                    "evidence": evidence
                }
                break  # Matched this canonical skill, move to next canonical skill

    skill_list = list(detected_skills.keys())
    skill_details = list(detected_skills.values())

    return {
        "extracted_skills": sorted(skill_list),
        "skill_details": sorted(skill_details, key=lambda x: x["category"]),
        "total_count": len(skill_list),
        "pipeline_type": "RULE_BASED_TAXONOMY_NORMALIZER",
        "is_trained_ai": False,
        "disclaimer": (
            "Notice: Skill extraction is performed via standardized industry taxonomy pattern matching "
            "and alias normalization. It is deterministic, explainable, and free of hallucination."
        )
    }
