# sakar-crm

## Docker Deployment

This repository now includes production-ready container files for:

- Next.js frontend
- Express + TypeScript backend
- PostgreSQL
- local uploads mounted through Docker volumes

### Files

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `backend/.dockerignore`
- `frontend/.dockerignore`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.env.example`

### Quick Start

1. Copy `.env.example` to `.env` and fill in the values.
2. Start the development stack:

```bash
docker compose up --build
```

3. Open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

### Stop

```bash
docker compose down
```

### Rebuild

```bash
docker compose up --build --force-recreate
```

### Production

Use the production compose file:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Volumes

- `postgres_data` persists PostgreSQL data
- `uploads_data` persists local lead uploads under `/app/uploads`

### Notes

- The backend image uses a multi-stage build and runs as a non-root user.
- The backend uses `npm ci`.
- The frontend Dockerfile is prepared for a production Next.js build, but this repo currently does not include a `frontend/package-lock.json`. Add one before using a strict `npm ci` frontend build in CI/CD.
- Local uploads remain volume-backed and are compatible with a later S3 migration by switching `STORAGE_PROVIDER`.
