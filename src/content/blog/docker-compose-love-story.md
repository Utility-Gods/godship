---
title: "How I Learned to Stop Worrying and Love Docker Compose"
excerpt: "A practical guide to taming microservices with Docker Compose - from manual chaos to automated harmony"
publishDate: "2024-04-09"
image: "/blog/docker-compose.png"
category: "DevOps"
author: "Siddharth Jain"
tags: [docker, docker-compose, devops, microservices, containers, networking, ports]
---

After a decade of building systems, I've found that Docker Compose is the sweet spot for most projects. Not as complex as Kubernetes, but powerful enough to handle real-world applications. Here's how I use it to manage a typical microservices stack from my home office in Udaipur.

## The Setup We're Building

Let's start with what we're trying to achieve:

![Docker Compose Architecture](/blog/docker-compose1.png)

This is a common setup you'll encounter:
- FastAPI service handling your main API
- Go service for background processing
- PostgreSQL for data storage
- Redis for caching
- Nginx Proxy Manager for SSL and routing

## The Pain Points (Without Docker Compose)

If you've tried managing this manually, you know the headaches:
- "Which port was PostgreSQL on again?"
- "Why can't my FastAPI service see Redis?"
- "Did I remember to set all the environment variables?"
- "Where did my database data go after restart?"

## The Solution: One YAML to Rule Them All

Here's the complete `docker-compose.yml` that solves all these problems:

```yaml
version: '3.8'

services:
  nginx-proxy:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    volumes:
      - ./data/nginx/data:/data
      - ./data/nginx/letsencrypt:/etc/letsencrypt
    networks:
      - app_network

  fastapi:
    build: ./fastapi
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app_network

  goservice:
    build: ./goservice
    restart: unless-stopped
    environment:
      - DB_CONNECTION=postgres://user:password@postgres:5432/mydb
      - REDIS_ADDR=redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app_network

  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app_network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app_network

volumes:
  postgres_data:
  redis_data:

networks:
  app_network:
    driver: bridge
```

## Let's Break It Down

### 1. Service Communication
Services can talk to each other using their service names. No more IP hunting:
```yaml
environment:
  - DATABASE_URL=postgresql://user:password@postgres:5432/mydb
  - REDIS_URL=redis://redis:6379/0
```

### 2. Health Checks
Make sure services are actually ready, not just running:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### 3. Data Persistence
Keep your data safe across restarts:
```yaml
volumes:
  postgres_data:
  redis_data:
```

### 4. Network Isolation
Services on the same network can talk to each other, others can't:
```yaml
networks:
  app_network:
    driver: bridge
```

## Daily Operations

### Starting Everything
```bash
# Pull latest images and start services
docker-compose pull
docker-compose up -d
```

### Checking Status
```bash
# View running services
docker-compose ps

# Check logs
docker-compose logs -f service_name
```

### Maintenance
```bash
# Backup database
docker-compose exec postgres pg_dump -U user mydb > backup.sql

# Update services
docker-compose pull
docker-compose up -d --remove-orphans
```

## Monitoring Made Easy

Add Portainer for a nice web UI to manage everything:

```yaml
  portainer:
    image: portainer/portainer-ce
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
```

## Production Tips

1. **Use Environment Files**
   ```bash
   # .env
   POSTGRES_PASSWORD=your_secure_password
   REDIS_PASSWORD=another_secure_password
   ```

2. **Resource Limits**
   ```yaml
   services:
     fastapi:
       deploy:
         resources:
           limits:
             cpus: '0.50'
             memory: 512M
   ```

3. **Logging Configuration**
   ```yaml
   services:
     fastapi:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

## Why This Works So Well

1. **Simple to Understand**: One file describes your entire system
2. **Easy to Version**: Track infrastructure changes in git
3. **Works Everywhere**: From development to production
4. **Just Enough Features**: Perfect for small to medium projects
5. **No Learning Curve**: Basic YAML and Docker knowledge is enough

## When to Consider Kubernetes Instead

- Need automatic scaling
- Running across multiple servers
- Require advanced service discovery
- Have complex deployment patterns
- Managing hundreds of services

## Conclusion

Docker Compose hits the sweet spot for most projects. It's simple enough to understand quickly but powerful enough to run production workloads. Start here, and only move to Kubernetes when you actually need its features.

---
*P.S.: Running this setup in production? Remember to secure your services, set resource limits, and configure proper logging. Feel free to reach out if you need help!*
