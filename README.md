# SkillBridge AI — Academia–Industry Collaboration & Placement Platform

[![SIH 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/PS_ID-SIH26044-brightgreen.svg)]()
[![Stack](https://img.shields.io/badge/Stack-MERN_%2B_FastAPI-orange.svg)]()

> **SIH 2026 Problem Statement (SIH26044):**  
> *Portal for Academia - Industry collaboration for Skill Mapping, Internships and Placement.*  
> **Category:** Software | **Theme:** Smart Automation

---

## 🚀 Architecture Overview

SkillBridge AI bridges the gap between curriculum learning and real-world industry requirements by connecting **Students**, **Universities**, and **Recruiters** on a unified platform.

```
                      ┌──────────────────────────────────────┐
                      │    React + Vite Client (Port 5173)   │
                      │   Student / Recruiter / Admin Portals │
                      └──────────────────┬───────────────────┘
                                         │  HTTP / REST
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   Node.js Express API (Port 5000)    │
                      │  JWT Auth, Mongoose ORM, RBAC Routes │
                      └───────┬──────────────────────┬───────┘
                              │                      │
                  MongoDB     │                      │ Internal HTTP
               (Port 27017)   ▼                      ▼
           ┌──────────────────────┐      ┌───────────────────────────┐
           │   11 Document Models │      │ FastAPI Microservice (8000│
           │  Users, Jobs, Skills │      │ Skill Extractor & Matching│
           └──────────────────────┘      └───────────────────────────┘
```

---

## 📦 Monorepo Structure

```
SkillBridge-AI/
├── frontend/          # React + Vite + Tailwind CSS SPA (Port 5173)
├── backend/           # Node.js + Express.js + Mongoose REST API (Port 5000)
├── ai-service/        # Python + FastAPI ML/NLP microservice (Port 8000)
├── docs/              # System specifications, schemas, team roles
├── package.json       # Root script orchestrator
└── README.md          # Setup & execution guide
```

---

## 🛠️ Port Allocations

| Service | Port | Default URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | `5173` | `http://localhost:5173` | React Dashboard & Portals |
| **Backend API** | `5000` | `http://localhost:5000/api/v1` | Core REST APIs & Authentication |
| **AI Microservice** | `8000` | `http://localhost:8000` | Skill Extraction & Match Scoring |
| **MongoDB** | `27017` | `mongodb://localhost:27017/skillbridge_ai` | Document Database |

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (Tested on v26.4.0)
- **Python**: 3.10+ (Tested on v3.14.6)
- **MongoDB**: Local or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# Running on http://localhost:5000
```

### 3. AI Service Setup
```bash
cd ai-service
cp .env.example .env
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python run.py
# Running on http://localhost:8000
```

### 4. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 👥 4-Member Team Ownership

1. **Member 1 (Frontend Lead)**: React, Tailwind, Student & Recruiter layouts, forms, route guards.
2. **Member 2 (Backend Lead)**: Node.js, Express, Mongoose schemas, JWT RBAC, job & application APIs.
3. **Member 3 (AI/ML Lead)**: FastAPI, resume extraction, NLP skill normalization, gap scoring engine.
4. **Member 4 (Integration & DevOps Lead)**: Cross-service HTTP client, University Admin dashboard, testing, demo slides.

For details, refer to `docs/team-division.md`.

