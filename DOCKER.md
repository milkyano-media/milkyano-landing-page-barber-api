# Docker Setup for Barber Core API (Production)

This guide provides instructions for running the Barber Core API using Docker in production environments.

> **Note**: This Docker setup is for production use only. For local development, use the standard Node.js setup with `npm install` and `npm run dev`.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Update environment variables** in `.env` file with your actual values:
   - Database credentials
   - JWT secrets (use strong, unique values)
   - Square API credentials
   - Twilio credentials
   - Remove MOCK_OTP for production

3. **Build and start services**:
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations** (manual step):
   ```bash
   docker-compose run --rm migrate
   ```

5. **Seed database** (optional, for initial setup):
   ```bash
   docker-compose exec api npm run db:seed
   ```

## Services

- **api**: Barber Core API (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

## Common Commands

### Start services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check service status
docker-compose ps
```

### Database operations
```bash
# Run migrations
docker-compose run --rm migrate

# Create new migration
docker-compose exec api npx prisma migrate dev --name your_migration_name

# Reset database
docker-compose exec api npx prisma migrate reset

# Seed database
docker-compose exec api npm run db:seed
```

### Maintenance
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Access API shell
docker-compose exec api sh

# View real-time logs
docker-compose logs -f api
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `PORT`: API port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `SQUARE_ACCESS_TOKEN`: Square API access token
- `SQUARE_LOCATION_ID`: Square location ID
- `REDIS_URL`: Redis connection string
- `MOCK_OTP`: Mock OTP for development (leave empty in production)

## Health Checks

The API includes health check endpoints:

- `GET /health`: Basic health check
- `GET /health/ready`: Readiness check (includes database connectivity)

## Troubleshooting

### Database connection issues
```bash
# Check if postgres is running
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d barber_core_api_db
```

### API not starting
```bash
# Check API logs
docker-compose logs api

# Verify environment variables
docker-compose config

# Rebuild if needed
docker-compose build --no-cache api
```

### Port conflicts
If ports are already in use, modify them in `.env`:
```
PORT=3001
DB_PORT=5433
REDIS_PORT=6380
```

## Docker Hub Deployment

### Building and Pushing Images

```bash
# Login to Docker Hub
docker login -u syahiidkamiltech

# Build and push production image
make push

# Build and push preview image
make push-preview
```

### Using Pre-built Images

For production deployment:

```bash
# Production deployment (uses docker-compose.yml)
docker-compose up -d

# Preview deployment (uses docker-compose.preview.yml)
docker-compose -f docker-compose.preview.yml up -d
```

### Available Images

- **Production**: `syahiidkamiltech/barber-core-api:latest`
- **Preview**: `syahiidkamiltech/barber-core-api-preview:latest`

## Production Deployment

For production deployment:

1. Use strong secrets for JWT_SECRET and JWT_REFRESH_TOKEN_SECRET
2. Set NODE_ENV=production
3. Configure proper CORS_ORIGINS
4. Enable rate limiting
5. Set up proper logging with Logtail
6. Use managed database and Redis services
7. Configure health checks and monitoring

### Deployment Options

1. **Production Deployment** (docker-compose.yml):
   ```bash
   # Deploy production
   docker-compose up -d
   
   # Run migrations
   docker-compose run --rm migrate
   ```

2. **Preview Deployment** (docker-compose.preview.yml):
   ```bash
   # Deploy preview environment
   docker-compose -f docker-compose.preview.yml up -d
   
   # Run preview migrations
   docker-compose -f docker-compose.preview.yml run --rm migrate-preview
   ```

3. **Using Kubernetes** (recommended for scale):
   - Use the Docker Hub images
   - Configure secrets and ConfigMaps
   - Set up ingress and load balancing

4. **Using Cloud Services**:
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances

## Security Notes

- Never commit `.env` files
- Use strong, unique passwords
- Rotate JWT secrets regularly
- Keep Docker images updated
- Use non-root user in containers (already configured)
- Enable TLS for production deployments
- Use secrets management services (AWS Secrets Manager, etc.)