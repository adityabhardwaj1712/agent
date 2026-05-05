# Developer Quick-Start Guide

## 🚀 Getting Started with Backend Professionalization

This guide helps you start working on the backend modernization tasks immediately.

---

## Prerequisites

```bash
# Ensure you have these installed:
- Python 3.10+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional but recommended)
```

---

## 1. Environment Setup (5 minutes)

```bash
# Clone the repository
git clone <repo-url>
cd agent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Minimum required:
# - DATABASE_URL
# - REDIS_URL
# - OPENAI_API_KEY or ANTHROPIC_API_KEY
```

---

## 2. Run Database Migrations (2 minutes)

```bash
# Start PostgreSQL and Redis (if using Docker)
docker-compose up -d postgres redis

# Run migrations
python -m app.db.migrations

# Verify database
psql -U postgres -d agentcloud -c "\dt"
```

## 5. Testing Your Changes

### Run All Tests
```bash
# Unit tests
pytest tests/ -v

# Integration tests
pytest tests/integration/ -v --asyncio-mode=auto

# Load tests (optional)
pytest tests/load/ -v
```

### Manual Testing
```bash
# Start the development server
uvicorn app.main:app --reload --port 8000

# Test health endpoint
curl http://localhost:8000/health/ready

# Test task submission
curl -X POST http://localhost:8000/api/v1/tasks/submit \
  -H "Content-Type: application/json" \
  -d '{"payload": "Test task", "model": "gpt-4o-mini"}'
```

---

## 6. Common Issues & Solutions

### Issue 1: Database Connection Errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Issue 2: Redis Connection Errors
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli ping
```

---

## 10. Useful Commands Cheat Sheet

```bash
# Development
uvicorn app.main:app --reload              # Start dev server
pytest tests/ -v -s                        # Run tests with output
ruff check . --fix                         # Lint and auto-fix
black app/                                 # Format code

# Database
psql $DATABASE_URL                         # Open DB shell
python -m app.db.migrations                # Run migrations

# Git
git checkout -b feature/task-name          # New branch
git add . && git commit -m "message"       # Commit
git push origin feature/task-name          # Push
```

---

## 12. Next Steps

1. ✅ **Set up your environment** (completed this guide)
2. 📋 **Choose a task** from IMPLEMENTATION_CHECKLIST.md
3. 📖 **Read the detailed implementation** in BACKEND_PROFESSIONALIZATION_ROADMAP.md
4. 💻 **Start coding** following the workflow above
5. ✅ **Test thoroughly** before submitting PR
6. 🎉 **Mark your task complete** and celebrate!

---

**Happy Coding! 🚀**

Questions? Reach out to the team or open a GitHub Discussion.
