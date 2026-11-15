# SkillBridge AI — Development & Git Workflow Guide

Welcome to the **SkillBridge AI** project development guide. This document establishes git conventions, local environment setups, and coding standards.

---

## 1. Git Workflow & Branching Strategy

```
main ──────── (Stable Production / Competition Demo)
  ▲
  │ PR / Merge
dev  ──────── (Integration & Staging branch)
  ▲
  ├── feat/frontend-views (Member 1)
  ├── feat/backend-core   (Member 2)
  ├── feat/ai-service     (Member 3)
  └── feat/integration    (Member 4)
```

### Rules:
1. **Never commit directly to `main`**: All features must be tested on `dev` before merging to `main`.
2. **Branch naming**: Use `feat/<feature-name>`, `fix/<bug-name>`, or `docs/<doc-name>`.
3. **Commit convention**:
   - `feat: add student profile skill selector`
   - `fix: resolve jwt expiration bug in authMiddleware`
   - `docs: update api-spec with matching schemas`

---

## 2. Environment Variables Standards

Each service maintains a `.env.example` template:
- **Never commit `.env` files** to Git.
- Always update `.env.example` when introducing a new config key.

### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/skillbridge_ai
JWT_SECRET=super_secret_jwt_key_skillbridge_2026
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

### AI Service (`ai-service/.env`):
```env
PORT=8000
HOST=0.0.0.0
DEBUG=True
ENVIRONMENT=development
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_AI_SERVICE_URL=http://localhost:8000
```

---

## 3. Running Services for Local Testing

### Backend:
```bash
cd backend
npm install
npm run dev
```

### AI Microservice:
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python run.py
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

