# Project Setup Instructions

## Prerequisites

- **Node.js**: Version 16.9+ or 14.19+ (includes Corepack)
- **Yarn**: Will be managed by Corepack (no manual installation needed)

## Initial Setup

### 1. Prepare Corepack with Yarn 4.9.4

This project uses Yarn 4.9.4 managed by Corepack. Prepare and activate it:

```bash
corepack prepare yarn@4.9.4 --activate
```

This command downloads and activates the exact Yarn version specified in `package.json`.

### 2. Verify Yarn Version

Verify the correct Yarn version is being used:

```bash
corepack yarn --version
# Should output: 4.9.4
```

### 3. Install Dependencies

Install all project dependencies using Corepack:

```bash
corepack yarn install
```

This will install dependencies for all packages in the monorepo (web, desktop, etc.).

**Note:** If you have Yarn 1.x installed globally via Homebrew, you must use `corepack yarn` instead of just `yarn` to use the correct version.

## Running the Project

### Development Mode

Start the web application in development mode:

```bash
cd packages/web
corepack yarn dev
```

The application will be available at: **http://localhost:5173/**

### Build for Production

Build the web application:

```bash
cd packages/web
corepack yarn build
```

### Preview Production Build

Preview the production build locally:

```bash
cd packages/web
corepack yarn preview
```

**Note:** Always use `corepack yarn` instead of just `yarn` to ensure you're using Yarn 4.9.4.

## Project Structure

This is a monorepo using Yarn Workspaces:

- `packages/web/` - React web application (Vite)
- `packages/desktop/` - Desktop application
- `packages/desktop-workflow/` - Desktop workflow module

## Troubleshooting

### Issue: "packageManager" error or Yarn version mismatch

**Solution**: Prepare and activate the correct Yarn version:
```bash
corepack prepare yarn@4.9.4 --activate
```

### Issue: `yarn` command not found or using wrong version

**Solution**: Always use `corepack yarn` instead of `yarn`:
```bash
corepack yarn --version  # Should show 4.9.4
corepack yarn install
corepack yarn dev
```

### Issue: Dependencies not installing

**Solution**: Clear cache and reinstall:
```bash
corepack yarn cache clean
rm -rf node_modules
rm -rf .yarn/cache
corepack yarn install
```

## Environment Variables

The web application uses environment variables defined in `packages/web/.env`:

- `VITE_APP_API_BASE` - Backend API base URL
- `VITE_APP_AUTH0_*` - Auth0 configuration

For production, these are replaced at runtime via `entrypoint.sh`.

## Notes

- The project uses **Vite** for fast development and building
- API requests in dev mode are proxied to the configured backend
- The application connects to `https://ai-dev.kube3.cyoda.org` for API calls

