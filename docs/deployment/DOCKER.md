# Docker Setup - Development

## Quick Start with Docker Compose

### Start RabbitMQ Only (for development)

```bash
docker-compose up -d
```

This starts:
- **RabbitMQ** on port 5672 (AMQP) and 15672 (Management UI)

### View Logs
```bash
docker-compose logs -f rabbitmq
```

### Stop Services
```bash
docker-compose down
```

### Access RabbitMQ Management UI
Open in browser: `http://localhost:15672`
- Username: `guest`
- Password: `guest`

---

## Running API in Development

Start the Node.js backend separately (not in Docker):

```bash
cd backend
pnpm install
cp .env.example .env
pnpm run dev
```

API runs on: `http://localhost:5000`

---

## Environment Variables

Set `RABBITMQ_URL` in `backend/.env`:

```env
RABBITMQ_ENABLED=true
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

---

## Troubleshooting

### RabbitMQ won't start
```bash
docker-compose logs rabbitmq
# Check if port 5672 is already in use
lsof -i :5672
```

### Connection refused
```bash
# Ensure RabbitMQ is running
docker-compose ps
# Wait for healthcheck to pass
```

---

## Production Infrastructure (Future)

When ready for production, we have:
- **Dockerfile**: Production-grade multi-stage build
- **.env.docker**: Environment template for production
- **DOCKER-PROD.md**: Complete production deployment guide (coming next)

For now, focus on development with local RabbitMQ! ✓
