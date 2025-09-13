# Staging deployment (Docker Compose)

Quick start (PowerShell)

- cd C:\Users\himan\code\Synapse\Synapse-server
- Copy .env.staging.example to .env.staging and set values
- docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
- Verify: Invoke-RestMethod http://localhost:8787/api/health

What this runs

- api (Node 20-alpine)
  - Exposes port 8787
  - Persists rendered media to a named volume `output` (mounted at /app/server/output)
  - Honors env vars for JWT, CORS, SMTP, and Remotion composition ID

Updating

- docker compose -f docker-compose.staging.yml --env-file .env.staging pull
- docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

Logs

- docker compose -f docker-compose.staging.yml logs -f api

Tear down

- docker compose -f docker-compose.staging.yml down
- To remove volumes: docker compose -f docker-compose.staging.yml down -v

Notes

- On Windows, ensure Docker Desktop is running.
- If you host the frontend elsewhere, configure CORS_ORIGIN in .env.staging to your web origin.
- SMTP variables are optional; without them, the contact endpoint logs payloads and returns success.
