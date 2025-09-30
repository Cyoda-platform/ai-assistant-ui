# Docker Deployment Guide for React Application

This guide explains how the React application is configured for Kubernetes deployment with runtime environment variable injection.

## Overview

The application uses a **runtime environment variable injection** approach that allows a single Docker image to be deployed across multiple environments (dev, staging, production) by providing different environment variables through Kubernetes ConfigMaps and Secrets.

## How It Works

### 1. Build Time (Development)

During the Vite build process:
- The `.env.production` file contains **placeholder values** (e.g., `APP_AI_API_BASE_value`)
- Vite inlines these placeholder values into the compiled JavaScript files
- The build output is placed in the `dist/` directory

### 2. Docker Image Creation

The Dockerfile:
- Uses nginx as the base image
- Copies the built React application to `/app`
- Includes an `entrypoint.sh` script that runs before nginx starts
- Sets up proper permissions for the nginx user

### 3. Runtime (Kubernetes Deployment)

When the container starts:
1. The `entrypoint.sh` script executes
2. It searches for all `.html`, `.js`, and `.css` files in `/app`
3. It replaces placeholder values with actual environment variables from Kubernetes
4. Nginx starts and serves the modified files

## Environment Variables

### Required Variables

The following environment variables must be provided via Kubernetes ConfigMap/Secret:

#### API Configuration
- `APP_AI_API_AUTH_value` - API authentication token/key
- `APP_AI_API_BASE_value` - Base URL for the API (e.g., `https://api.example.com`)
- `APP_QUESTION_POLLING_INTERVAL_MS_value` - Polling interval in milliseconds (e.g., `5000`)
- `APP_QUESTION_MAX_POLLING_INTERVAL_value` - Maximum polling interval in milliseconds (e.g., `7000`)

#### Cyoda Client Configuration
- `APP_CYODA_CLIENT_HOST_value` - Cyoda client host (e.g., `cyoda.example.com`)
- `APP_CYODA_CLIENT_ENV_PREFIX_value` - Environment prefix (e.g., `dev-`, `prod-`)

#### Auth0 Configuration
- `APP_AI_AUTH0_DOMAIN_value` - Auth0 domain (e.g., `your-tenant.auth0.com`)
- `APP_AI_AUTH0_CLIENT_ID_value` - Auth0 client ID
- `APP_AI_AUTH0_AUDIENCE_value` - Auth0 API audience
- `APP_AI_AUTH0_REDIRECT_URI_value` - Auth0 redirect URI (e.g., `https://app.example.com`)
- `APP_AI_AUTH0_ORGANIZATION_value` - Auth0 organization ID

## Kubernetes Deployment Example

### ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-assistant-config
  namespace: your-namespace
data:
  APP_AI_API_BASE_value: "https://api.example.com"
  APP_QUESTION_POLLING_INTERVAL_MS_value: "5000"
  APP_QUESTION_MAX_POLLING_INTERVAL_value: "7000"
  APP_CYODA_CLIENT_HOST_value: "cyoda.example.com"
  APP_CYODA_CLIENT_ENV_PREFIX_value: "prod-"
  APP_AI_AUTH0_DOMAIN_value: "your-tenant.auth0.com"
  APP_AI_AUTH0_REDIRECT_URI_value: "https://app.example.com"
  APP_AI_AUTH0_AUDIENCE_value: "https://api.example.com"
```

### Secret Example

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-assistant-secrets
  namespace: your-namespace
type: Opaque
stringData:
  APP_AI_API_AUTH_value: "your-api-auth-token"
  APP_AI_AUTH0_CLIENT_ID_value: "your-auth0-client-id"
  APP_AI_AUTH0_ORGANIZATION_value: "your-auth0-org-id"
```

### Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-assistant-web
  namespace: your-namespace
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-assistant-web
  template:
    metadata:
      labels:
        app: ai-assistant-web
    spec:
      containers:
      - name: web
        image: your-registry/ai-assistant-web:latest
        ports:
        - containerPort: 8080
          name: http
        envFrom:
        - configMapRef:
            name: ai-assistant-config
        - secretRef:
            name: ai-assistant-secrets
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Building the Docker Image

### Local Build

```bash
# Navigate to the web package
cd packages/web

# Build the React application
yarn build

# Build the Docker image
docker build -t ai-assistant-web:latest .
```

### CI/CD Build

```bash
# Build with version tag
docker build -t your-registry/ai-assistant-web:v1.0.0 .
docker push your-registry/ai-assistant-web:v1.0.0
```

## Testing Locally

### Test with Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:8080"
    environment:
      - APP_AI_API_AUTH_value=test-auth-token
      - APP_AI_API_BASE_value=https://api-dev.example.com
      - APP_QUESTION_POLLING_INTERVAL_MS_value=5000
      - APP_QUESTION_MAX_POLLING_INTERVAL_value=7000
      - APP_CYODA_CLIENT_HOST_value=cyoda-dev.example.com
      - APP_CYODA_CLIENT_ENV_PREFIX_value=dev-
      - APP_AI_AUTH0_DOMAIN_value=dev-tenant.auth0.com
      - APP_AI_AUTH0_CLIENT_ID_value=test-client-id
      - APP_AI_AUTH0_AUDIENCE_value=https://api-dev.example.com
      - APP_AI_AUTH0_REDIRECT_URI_value=http://localhost:8080
      - APP_AI_AUTH0_ORGANIZATION_value=test-org-id
```

Run:
```bash
docker-compose up
```

### Test with Docker Run

```bash
docker run -p 8080:8080 \
  -e APP_AI_API_AUTH_value="test-auth-token" \
  -e APP_AI_API_BASE_value="https://api-dev.example.com" \
  -e APP_QUESTION_POLLING_INTERVAL_MS_value="5000" \
  -e APP_QUESTION_MAX_POLLING_INTERVAL_value="7000" \
  -e APP_CYODA_CLIENT_HOST_value="cyoda-dev.example.com" \
  -e APP_CYODA_CLIENT_ENV_PREFIX_value="dev-" \
  -e APP_AI_AUTH0_DOMAIN_value="dev-tenant.auth0.com" \
  -e APP_AI_AUTH0_CLIENT_ID_value="test-client-id" \
  -e APP_AI_AUTH0_AUDIENCE_value="https://api-dev.example.com" \
  -e APP_AI_AUTH0_REDIRECT_URI_value="http://localhost:8080" \
  -e APP_AI_AUTH0_ORGANIZATION_value="test-org-id" \
  ai-assistant-web:latest
```

## Troubleshooting

### Check if environment variables were replaced

```bash
# Exec into the running container
kubectl exec -it <pod-name> -n your-namespace -- sh

# Check if placeholders still exist in files
grep -r "APP_AI_API_BASE_value" /app/

# If you see matches, the replacement didn't work
# Check the entrypoint logs
kubectl logs <pod-name> -n your-namespace
```

### Common Issues

1. **Placeholder values still in the app**
   - Ensure environment variables are set in Kubernetes
   - Check that variable names match exactly (including `_value` suffix)
   - Verify the entrypoint.sh script has execute permissions

2. **Nginx fails to start**
   - Check nginx error logs: `kubectl logs <pod-name>`
   - Verify file permissions in the container
   - Ensure port 8080 is not already in use

3. **App loads but API calls fail**
   - Verify `APP_AI_API_BASE_value` is set correctly
   - Check network policies allow egress to the API
   - Verify Auth0 configuration is correct

## Security Considerations

1. **Use Secrets for sensitive data**: Store API tokens, Auth0 credentials in Kubernetes Secrets, not ConfigMaps
2. **RBAC**: Limit access to Secrets and ConfigMaps
3. **Network Policies**: Restrict ingress/egress traffic
4. **Image Scanning**: Scan Docker images for vulnerabilities
5. **Non-root user**: The Dockerfile runs nginx as the `nginx` user (non-root)

## File Structure

```
packages/web/
├── Dockerfile              # Docker image definition
├── entrypoint.sh          # Runtime environment variable injection script
├── nginx.conf             # Nginx configuration
├── .env.production        # Build-time placeholder values
├── dist/                  # Build output (created by 'yarn build')
│   ├── index.html
│   └── assets/
│       ├── *.js
│       └── *.css
└── DOCKER_DEPLOYMENT.md   # This file
```

## Migration Notes

This React application uses the **same deployment pattern** as the previous Vue.js version:
- Same placeholder value approach
- Same entrypoint.sh mechanism
- Same Kubernetes configuration structure
- Updated to handle Vite/React build output structure

The main difference is the file paths in `entrypoint.sh` which now uses `find` to locate all relevant files in the Vite build output.

