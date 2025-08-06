# NexusERP Docker Development Environment

This document describes how to set up and run the NexusERP development environment using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8 or higher
- At least 4GB of available RAM
- At least 5GB of available disk space

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd NexusERP
   ```

2. **Create environment file**:
   ```bash
   cp .env.docker.example .env.docker
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Check service status**:
   ```bash
   docker-compose ps
   ```

5. **View logs**:
   ```bash
   docker-compose logs -f
   ```

## Services Overview

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Cache and session store |
| **MinIO** | 9000, 9090 | Object storage (S3 compatible) |
| **Nginx** | 80, 443 | Reverse proxy and load balancer |

### Application Services

| Service | Port | Description |
|---------|------|-------------|
| **Go Backend** | 8080 | RESTful API server |
| **Laravel Frontend** | 9000 | Web frontend (PHP-FPM) |

## Service Details

### PostgreSQL Database
- **Database**: `nexus_erp`
- **User**: `nexus`
- **Password**: `securepassword`
- **Data persistence**: `postgres_data` volume
- **Initialization**: Scripts in `database/init/` run on first startup

### Redis Cache
- **Password**: `redispassword`
- **Data persistence**: `redis_data` volume

### MinIO Object Storage
- **Access Key**: `nexus`
- **Secret Key**: `miniopassword`
- **Web Console**: http://localhost:9090
- **API Endpoint**: http://localhost:9000
- **Data persistence**: `minio_data` volume

### Nginx Reverse Proxy
- **Frontend**: http://localhost (port 80)
- **API**: http://localhost/api/
- **MinIO**: http://localhost/minio/
- **Health Check**: http://localhost/health
- **Configuration**: `nginx/` directory

## Development Workflow

### Starting Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres redis

# Start with logs
docker-compose up
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ DATA LOSS)
docker-compose down -v
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Accessing Services

#### Database Access
```bash
# Using docker-compose
docker-compose exec postgres psql -U nexus -d nexus_erp

# Using local psql (if installed)
psql -h localhost -p 5432 -U nexus -d nexus_erp
```

#### Redis Access
```bash
# Using docker-compose
docker-compose exec redis redis-cli -a redispassword

# Test connection
docker-compose exec redis redis-cli -a redispassword ping
```

#### MinIO Access
- Web Console: http://localhost:9090
- Login: `nexus` / `miniopassword`

#### Application Containers
```bash
# Go Backend
docker-compose exec go-backend sh

# Laravel Frontend
docker-compose exec laravel-frontend sh
```

## File Structure

```
NexusERP/
├── docker-compose.yml          # Main Docker Compose configuration
├── .env.docker.example         # Environment variables template
├── README.docker.md           # This file
├── nginx/                     # Nginx configuration
│   ├── nginx.conf            # Main Nginx config
│   └── conf.d/
│       └── default.conf      # Default server configuration
├── database/                  # Database configuration
│   └── init/                 # Database initialization scripts
│       └── 001_create_extensions.sql
├── backend/                   # Go backend source code
├── frontend/                  # Laravel frontend source code
└── volumes/                   # Docker volume mount points (created automatically)
    ├── postgres_data/
    ├── redis_data/
    ├── minio_data/
    └── nginx_logs/
```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost/health
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check port usage
   lsof -i :80
   lsof -i :5432
   
   # Stop conflicting services
   sudo lsof -t -i tcp:80 | xargs kill -9
   ```

2. **Permission issues**:
   ```bash
   # Fix volume permissions
   sudo chown -R $(id -u):$(id -g) ./volumes/
   ```

3. **Database connection issues**:
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Verify database is ready
   docker-compose exec postgres pg_isready -U nexus
   ```

4. **Service startup order**:
   ```bash
   # Start services in order
   docker-compose up -d postgres redis minio
   sleep 10
   docker-compose up -d nginx go-backend laravel-frontend
   ```

### Logs and Debugging

```bash
# View all service logs
docker-compose logs -f

# Debug specific service
docker-compose logs -f --tail=100 postgres

# Check service resource usage
docker stats

# Inspect service configuration
docker-compose config
```

### Cleanup

```bash
# Remove all containers and networks
docker-compose down

# Remove all data (⚠️ DATA LOSS)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Full cleanup
docker system prune -a
```

## Environment Variables

Key environment variables in `.env.docker`:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=nexus_erp
DB_USERNAME=nexus
DB_PASSWORD=securepassword

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispassword

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=nexus
MINIO_SECRET_KEY=miniopassword
```

## Security Notes

⚠️ **Important**: The default passwords are for development only. Change them before deploying to production:

- PostgreSQL: `securepassword`
- Redis: `redispassword`
- MinIO: `miniopassword`

## Next Steps

1. **Set up Go Backend**: See `backend/README.md`
2. **Set up Laravel Frontend**: See `frontend/README.md`
3. **Database Migrations**: Run initial database migrations
4. **API Documentation**: Generate and review API documentation
5. **Testing**: Set up testing environment

## Support

For issues and questions:
1. Check the logs: `docker-compose logs -f`
2. Review this documentation
3. Check the main project documentation
4. Open an issue in the project repository