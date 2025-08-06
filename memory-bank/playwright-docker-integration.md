# Playwright Docker Integration

## Docker Setup for Playwright

### Basic Dockerfile
```dockerfile
# Dockerfile.playwright
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files
COPY . .

# Install Playwright browsers (already included in base image)
# RUN npx playwright install --with-deps

# Run tests
CMD ["npx", "playwright", "test"]
```

### Multi-stage Dockerfile
```dockerfile
# Multi-stage Dockerfile for optimized builds
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

# Set environment variables
ENV CI=true
ENV NODE_ENV=test

# Run tests
CMD ["npx", "playwright", "test", "--reporter=json"]
```

### Development Dockerfile
```dockerfile
# Dockerfile.dev - For development with debugging
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Install additional tools for development
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install  # Include dev dependencies

COPY . .

# Expose port for Playwright trace viewer
EXPOSE 9323

# Run in headed mode for development
CMD ["npx", "playwright", "test", "--headed", "--debug"]
```

## Docker Compose Configuration

### Basic Docker Compose
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  playwright-tests:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
    environment:
      - CI=true
      - BASE_URL=http://web:3000
    depends_on:
      - web
      - database
    networks:
      - test-network

  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@database:5432/testdb
    depends_on:
      - database
    networks:
      - test-network

  database:
    image: postgres:13
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=testdb
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
```

### Advanced Docker Compose with Services
```yaml
# docker-compose.playwright.yml
version: '3.8'

services:
  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    volumes:
      - ./tests:/app/tests
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
      - ./playwright.config.js:/app/playwright.config.js
    environment:
      - CI=true
      - BASE_URL=http://web:3000
      - DATABASE_URL=postgresql://test:test@postgres:5432/testdb
      - REDIS_URL=redis://redis:6379
    command: npx playwright test --workers=2
    depends_on:
      web:
        condition: service_healthy
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - playwright-network

  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@postgres:5432/testdb
      - REDIS_URL=redis://redis:6379
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - playwright-network

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=testdb
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test -d testdb"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - playwright-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - playwright-network

volumes:
  postgres_data:

networks:
  playwright-network:
    driver: bridge
```

## CI/CD Docker Integration

### GitHub Actions with Docker
```yaml
# .github/workflows/playwright-docker.yml
name: Playwright Tests with Docker
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Build and run tests
      run: |
        docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
        
    - name: Copy test results
      if: always()
      run: |
        docker compose -f docker-compose.test.yml cp playwright-tests:/app/test-results ./test-results
        docker compose -f docker-compose.test.yml cp playwright-tests:/app/playwright-report ./playwright-report
        
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: |
          test-results/
          playwright-report/

    - name: Cleanup
      if: always()
      run: docker compose -f docker-compose.test.yml down -v
```

### GitLab CI with Docker
```yaml
# .gitlab-ci.yml
stages:
  - test

playwright-tests:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_TLS_CERTDIR: ""
  before_script:
    - docker info
    - docker compose version
  script:
    - docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
  after_script:
    - docker compose -f docker-compose.test.yml down -v
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/
    expire_in: 1 week
```

## Parallel Testing with Docker

### Multi-container Parallel Execution
```yaml
# docker-compose.parallel.yml
version: '3.8'

services:
  playwright-shard-1:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    command: npx playwright test --shard=1/4
    volumes:
      - ./test-results-1:/app/test-results
    environment:
      - CI=true
      - BASE_URL=http://web:3000
      - SHARD=1
    depends_on:
      - web
    networks:
      - test-network

  playwright-shard-2:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    command: npx playwright test --shard=2/4
    volumes:
      - ./test-results-2:/app/test-results
    environment:
      - CI=true
      - BASE_URL=http://web:3000
      - SHARD=2
    depends_on:
      - web
    networks:
      - test-network

  playwright-shard-3:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    command: npx playwright test --shard=3/4
    volumes:
      - ./test-results-3:/app/test-results
    environment:
      - CI=true
      - BASE_URL=http://web:3000
      - SHARD=3
    depends_on:
      - web
    networks:
      - test-network

  playwright-shard-4:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    command: npx playwright test --shard=4/4
    volumes:
      - ./test-results-4:/app/test-results
    environment:
      - CI=true
      - BASE_URL=http://web:3000
      - SHARD=4
    depends_on:
      - web
    networks:
      - test-network

  web:
    build: .
    ports:
      - "3000:3000"
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
```

### Dynamic Scaling with Docker Swarm
```yaml
# docker-stack.yml
version: '3.8'

services:
  playwright-tests:
    image: myapp/playwright:latest
    deploy:
      replicas: 4
      parallelism: 2
      update_config:
        parallelism: 1
        delay: 10s
    command: >
      sh -c "
        SHARD=$$(( ($$HOSTNAME | sed 's/.*\.//' | sed 's/[^0-9]*//g') + 1 ));
        npx playwright test --shard=$$SHARD/4
      "
    volumes:
      - test-results:/app/test-results
    networks:
      - overlay-network

  web:
    image: myapp/web:latest
    ports:
      - "3000:3000"
    networks:
      - overlay-network

volumes:
  test-results:
    driver: local

networks:
  overlay-network:
    driver: overlay
```

## Environment-Specific Configuration

### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  playwright-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "9323:9323"  # Playwright trace viewer
    environment:
      - NODE_ENV=development
      - BASE_URL=http://web:3000
      - HEADED=true
      - PWDEBUG=1
    command: tail -f /dev/null  # Keep container running
    networks:
      - dev-network

  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    networks:
      - dev-network

networks:
  dev-network:
    driver: bridge
```

### Production-like Testing
```yaml
# docker-compose.prod-test.yml
version: '3.8'

services:
  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    environment:
      - CI=true
      - BASE_URL=http://nginx:80
      - NODE_ENV=production
    depends_on:
      - nginx
    networks:
      - prod-test-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./build:/usr/share/nginx/html
    depends_on:
      - web
    networks:
      - prod-test-network

  web:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    networks:
      - prod-test-network

networks:
  prod-test-network:
    driver: bridge
```

## Docker Best Practices for Playwright

### Optimized Layer Caching
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy playwright config
COPY playwright.config.js ./

# Copy test files last (they change most frequently)
COPY tests/ ./tests/
COPY utils/ ./utils/

# Set environment variables
ENV CI=true
ENV NODE_ENV=test

# Create non-root user for security
RUN groupadd -r playwright && useradd -r -g playwright playwright
RUN mkdir -p /app/test-results && chown -R playwright:playwright /app
USER playwright

CMD ["npx", "playwright", "test"]
```

### Resource Management
```yaml
# Resource limits in docker-compose
services:
  playwright:
    build: .
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

### Health Checks and Monitoring
```dockerfile
# Add health check to Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

```yaml
# Monitoring with docker-compose
services:
  playwright:
    build: .
    healthcheck:
      test: ["CMD", "npx", "playwright", "--version"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Script Automation
```bash
#!/bin/bash
# run-tests.sh - Test automation script

set -e

# Build and run tests
echo "Building and running Playwright tests..."
docker compose -f docker-compose.test.yml build

# Run tests with proper cleanup
trap 'docker compose -f docker-compose.test.yml down -v' EXIT

docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Extract results
echo "Extracting test results..."
docker compose -f docker-compose.test.yml cp playwright-tests:/app/test-results ./test-results
docker compose -f docker-compose.test.yml cp playwright-tests:/app/playwright-report ./playwright-report

echo "Tests completed. Results available in test-results/ and playwright-report/"
```

### Docker Registry Integration
```bash
# Build and push to registry
#!/bin/bash

VERSION=${1:-latest}
REGISTRY=${REGISTRY:-your-registry.com}

# Build image
docker build -f Dockerfile.playwright -t $REGISTRY/playwright-tests:$VERSION .

# Push to registry
docker push $REGISTRY/playwright-tests:$VERSION

# Update docker-compose to use registry image
sed -i "s|build: .|image: $REGISTRY/playwright-tests:$VERSION|" docker-compose.test.yml
```