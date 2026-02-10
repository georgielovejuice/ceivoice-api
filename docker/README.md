# Production Docker Configuration

This folder contains production-grade Docker and infrastructure files.

## Files

- **Dockerfile.prod** - Production-grade multi-stage Dockerfile
- **docker-compose.prod.yml** - Production docker-compose with API + RabbitMQ
- **README.md** - Production deployment guide

## When to Use

Use these files when deploying to production. See `README.md` in this folder for complete instructions.

## Current Development Setup

For development, use:
- `Dockerfile` (root) - Dev mode
- `docker-compose.yml` (root) - RabbitMQ only

See `DOCKER.md` (root) for development instructions.
