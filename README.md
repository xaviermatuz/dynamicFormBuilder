# DynamicFormBuilder – Dockerized Setup  

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)  
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)  
![Postgres](https://img.shields.io/badge/Postgres-336791?style=for-the-badge&logo=postgresql&logoColor=white)  

This project contains a **Django backend (API)**, **React frontend**, and **Postgres database**, fully containerized with Docker for both **development** and **production** environments.  

---

## 🚀 Requirements  

- [Docker](https://www.docker.com/) ≥ 20.x  
- [Docker Compose](https://docs.docker.com/compose/) ≥ v2.x  
- Git  

---

## 📂 Project Structure  

```
.
├── backend/                # Django backend
│   ├── Dockerfile          # Production backend
│   ├── Dockerfile.dev      # Development backend
│   ├── entrypoint.sh       # Startup script (migrate, collectstatic, start server)
│   ├── requirements.txt    # Production dependencies
│   ├── requirements-dev.txt# Development dependencies
│   └── ...
├── frontend/               # React (Vite/Next) frontend
│   ├── Dockerfile          # Production frontend (nginx)
│   ├── Dockerfile.dev      # Development frontend (hot reload)
│   └── ...
├── docker-compose.yml      # Base (production)
├── docker-compose.override.yml # Development overrides
├── .env                    # Local dev environment variables
├── .env.docker             # Docker-specific environment variables
└── README.md               # This file
```

---

## ⚙️ Environment Variables  

### `.env` (for running Django locally on your machine)  
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

### `.env.docker` (used inside Docker containers)  
```env
DATABASE_HOST=db
DATABASE_PORT=5432
```

👉 Django settings automatically read these variables to connect to the correct database.  

---

## 🛠 Development Setup (Hot Reload)  

Run all services with hot reload (Django `runserver`, React `npm run dev`):  

```bash
docker-compose up --build
```

- Backend → http://localhost:8000  
- Frontend → http://localhost:5173  

### Notes:  
- Code changes in `backend/` or `frontend/` update automatically (via mounted volumes).  
- Database data is persisted in a Docker volume (`postgres_data`).  

---

## 📦 Production Setup  

Build optimized images (Gunicorn + nginx) and run:  

```bash
docker-compose -f docker-compose.yml up --build -d
```

- Backend runs on Gunicorn (`:8000`).  
- Frontend served by nginx (`:80`).  
- Static files collected automatically via `entrypoint.sh`.  

### Check logs  
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

---

## 🗄 Database Management  

Run Django commands inside the backend container:  

```bash
# Migrations
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Open Django shell
docker-compose exec backend python manage.py shell
```

---

## 🔧 Useful Commands  

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (fresh DB)
docker-compose down -v

# Rebuild containers after dependencies change
docker-compose build
```

---

## ✅ Features  

- **Backend**: Django 5, DRF, JWT, Postgres, Gunicorn (prod).  
- **Frontend**: React + Vite/Next.js, Tailwind, nginx (prod).  
- **Database**: PostgreSQL 16, persisted in Docker volume.  
- **Environment Handling**: Separate `.env` (local) and `.env.docker` (containers).  
- **Entrypoint Script**: Runs migrations + collectstatic automatically.  
- **Dev Mode**: Hot reload for both backend and frontend.  

---

## ⚡ CI/CD with GitHub Actions  

This repo can include a GitHub Actions workflow (`.github/workflows/ci.yml`) that:  
- Spins up Postgres for tests.  
- Runs Django migrations and tests.  
- Builds the frontend to ensure no compile errors.  

🔒 **Security Note**:  
- CI should use **dummy secrets** (e.g., `test_user`, `test_pass`, `testsecret`) for testing only.  
- **Never commit production secrets**.  
- Use [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) for sensitive data in real deployments.  

---

## 📝 License  

MIT – use freely for development and production.  
