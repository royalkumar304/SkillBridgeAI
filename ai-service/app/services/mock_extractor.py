"""
Skill Extraction Service (Day 1 Mock / Baseline)
Identifies standard skills from raw text using a predefined industry skills catalogue.
Future implementation will bind to PyMuPDF and fine-tuned spaCy NER pipelines.
"""

import re
from typing import List, Dict, Tuple

INDUSTRY_SKILLS_CATALOGUE = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "Express",
    "MongoDB", "SQL", "PostgreSQL", "HTML", "CSS", "Tailwind CSS",
    "FastAPI", "Django", "Flask", "Docker", "Kubernetes", "Git",
    "GitHub", "REST API", "GraphQL", "AWS", "Azure", "GCP",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Data Structures", "Algorithms", "C++", "Java", "Spring Boot",
    "Redux", "Next.js", "Linux", "CI/CD", "Pandas", "NumPy"
]

def extract_skills_from_text(raw_text: str) -> Tuple[List[str], Dict[str, float]]:
    """
    Scans the input text for matches against standard skills taxonomy.
    Returns (extracted_skills, confidence_scores).
    """
    found_skills = []
    confidence_scores = {}
    
    clean_text = raw_text.lower()
    
    for skill in INDUSTRY_SKILLS_CATALOGUE:
        # Regex search for exact word boundary where possible
        pattern = r'(?:\b)' + re.escape(skill.lower()) + r'(?:\b)'
        if re.search(pattern, clean_text):
            found_skills.append(skill)
            # Baseline mock confidence score
            confidence_scores[skill] = 0.92
            
    # Fallback default if empty
    if not found_skills:
        found_skills = ["JavaScript", "HTML", "CSS"]
        confidence_scores = {"JavaScript": 0.75, "HTML": 0.85, "CSS": 0.85}
        
    return found_skills, confidence_scores

