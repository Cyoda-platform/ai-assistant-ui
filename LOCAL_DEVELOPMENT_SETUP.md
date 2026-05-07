# Local Development Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js v22+
- Yarn v4 (managed by Corepack)

### 2. Installation

```bash
# From repository root
corepack prepare yarn@4.9.4 --activate
corepack yarn install

# Navigate to web package
cd packages/web
cp .env.template .env
```

### 3. Environment Variables (.env)

Create `packages/web/.env` with:

```env
# API Configuration
VITE_APP_API_BASE=http://localhost:8000
VITE_APP_API_AUTH=dev-auth-token-12345
VITE_APP_QUESTION_POLLING_INTERVAL_MS=5000
VITE_APP_QUESTION_MAX_POLLING_INTERVAL=7000

# Cyoda Client Configuration
VITE_APP_CYODA_CLIENT_HOST=localhost:8000
VITE_APP_CYODA_CLIENT_ENV_PREFIX=dev-

# Auth0
VITE_APP_AUTH0_DOMAIN=<your-auth0-tenant>.auth0.com
VITE_APP_AUTH0_CLIENT_ID=<your-client-id>
VITE_APP_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_APP_AUTH0_AUDIENCE=https://api-dev.example.com
VITE_APP_AUTH0_ORGANIZATION=<your-org-id>
```

## Running the Application

### Start Development Server

```bash
cd packages/web
corepack yarn dev
```

The app will be available at: **http://localhost:5173**

### Build for Production

```bash
corepack yarn build
```

### Preview Production Build

```bash
corepack yarn preview
```

## API Configuration

- **VITE_APP_API_BASE**: Backend API base URL
  - Local development: `http://localhost:8000`
  - Vite dev server proxies `/api/*` to this URL
  - See vite.config.ts line 46 for proxy configuration

## Auth0 Setup

### Redirect URI
- **Value**: `http://localhost:5173?auth0=true`
- **Status**: ✅ Supported (hardcoded in main.tsx line 49)
- **Configuration**: Add to Auth0 dashboard "Allowed Callback URLs"

### Callback Handling
The app automatically appends `?auth0=true` to redirect URI:
```typescript
redirect_uri: `${import.meta.env.VITE_APP_AUTH0_REDIRECT_URI}?auth0=true`
```

### Required Auth0 Variables
- `VITE_APP_AUTH0_DOMAIN`: Your Auth0 tenant domain
- `VITE_APP_AUTH0_CLIENT_ID`: Application client ID
- `VITE_APP_AUTH0_AUDIENCE`: API audience identifier
- `VITE_APP_AUTH0_ORGANIZATION`: Organization ID

## Network & VPN

- **VPN Required?**: Depends on backend location
  - If backend is `https://ai-dev.kube3.cyoda.org` → May need VPN
  - If backend is `http://localhost:8000` → No VPN needed
- **Cloudflare WARP/Zero Trust**: Check with team based on backend setup

## Testing

### Run Tests

```bash
# Run tests once
corepack yarn test:run

# Watch mode
corepack yarn test:watch

# With coverage report
corepack yarn test:coverage
```

## Smoke Test Flow (After Login)

1. **Authentication** (5 min)
   - Click "Log in" → Redirected to Auth0
   - Complete login → Callback to http://localhost:5173?auth0=true
   - Verify user avatar displays in header
   - Verify user info dropdown works

2. **Chat** (5 min)
   - Send a message
   - Verify streaming response with typing animation
   - Test file attachment upload
   - Check message history

3. **Canvas** (5 min)
   - Open workflow canvas
   - Add a new state/node
   - Create connections between nodes
   - Test inline editing
   - Save workflow

4. **Panels** (3 min)
   - Toggle Chat History panel
   - Toggle Tasks panel
   - Toggle Cloud panel
   - Verify panel persistence

5. **Interactions** (2 min)
   - Test rename dialog
   - Test delete confirmation dialog
   - Verify all toolbar buttons
   - Test responsive design (resize window)

## Project Structure

```
packages/web/
├── src/
│   ├── components/
│   ├── services/
│   ├── plugins/
│   └── main.tsx
├── .env.template
├── vite.config.ts
└── package.json
```

## Troubleshooting

### Yarn Version Issues
```bash
corepack prepare yarn@4.9.4 --activate
corepack yarn --version  # Should show 4.9.4
```

### Dependencies Not Installing
```bash
corepack yarn cache clean
rm -rf node_modules
rm -rf .yarn/cache
corepack yarn install
```

### Port 5173 Already in Use
Vite will use next available port automatically, or specify:
```bash
corepack yarn dev -- --port 3000
```

## Test Users & Environments

- **Guest Mode**: Auto-generated public token (no login required)
- **Test Environments**: development, staging, production, test
- **Auth0 Test Users**: Configure in your Auth0 tenant
- **Organization**: Set via VITE_APP_AUTH0_ORGANIZATION

## API Integration

Key endpoints used:
- POST `/v1/chats` - Create chat
- POST `/v1/chats/transfer` - Transfer guest chats on login
- GET `/api/*` - Various API endpoints
- SSE streams supported (proxied correctly)

## Environment Variables Summary

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| VITE_APP_API_BASE | Yes | - | Backend URL |
| VITE_APP_AUTH0_DOMAIN | Yes | - | Auth0 tenant |
| VITE_APP_AUTH0_CLIENT_ID | Yes | - | App client ID |
| VITE_APP_AUTH0_REDIRECT_URI | Yes | - | Callback URL (no ?auth0=true here) |
| VITE_APP_AUTH0_AUDIENCE | Yes | - | API audience |
| VITE_APP_AUTH0_ORGANIZATION | Yes | - | Org ID |
| VITE_APP_API_AUTH | No | - | Auth token |
| VITE_APP_QUESTION_POLLING_INTERVAL_MS | No | 5000 | Polling interval |

## Notes

- Uses **Vite** for fast development
- API requests proxied in dev mode
- Hot module replacement enabled
- TypeScript support built-in
- Unit tests with Vitest
