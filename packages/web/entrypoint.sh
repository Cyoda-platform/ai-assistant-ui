#!/bin/sh

ROOT_DIR=/app

# Replace env vars in JavaScript and CSS files
echo "=========================================="
echo "Replacing environment variables in React build"
echo "=========================================="

# Check if required environment variables are set
if [ -z "$APP_AI_API_BASE_value" ]; then
  echo "WARNING: APP_AI_API_BASE_value is not set!"
fi

# Process all files in the build output
# Vite/React build structure: index.html at root, assets in /assets/
echo "Processing files in: $ROOT_DIR"

# Find and process all relevant files
find $ROOT_DIR -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) | while read file; do
  echo "Processing: $file"

  # API Configuration
  sed -i 's~APP_AI_API_AUTH_value~'"$APP_AI_API_AUTH_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_AI_API_BASE_value~'"$APP_AI_API_BASE_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_QUESTION_POLLING_INTERVAL_MS_value~'"$APP_QUESTION_POLLING_INTERVAL_MS_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_QUESTION_MAX_POLLING_INTERVAL_value~'"$APP_QUESTION_MAX_POLLING_INTERVAL_value"'~g' "$file" 2>/dev/null || true

  # Cyoda Client Configuration
  sed -i 's~APP_CYODA_CLIENT_HOST_value~'"$APP_CYODA_CLIENT_HOST_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_CYODA_CLIENT_ENV_PREFIX_value~'"$APP_CYODA_CLIENT_ENV_PREFIX_value"'~g' "$file" 2>/dev/null || true

  # Auth0 Configuration
  sed -i 's~APP_AI_AUTH0_DOMAIN_value~'"$APP_AI_AUTH0_DOMAIN_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_AI_AUTH0_CLIENT_ID_value~'"$APP_AI_AUTH0_CLIENT_ID_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_AI_AUTH0_AUDIENCE_value~'"$APP_AI_AUTH0_AUDIENCE_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_AI_AUTH0_REDIRECT_URI_value~'"$APP_AI_AUTH0_REDIRECT_URI_value"'~g' "$file" 2>/dev/null || true
  sed -i 's~APP_AI_AUTH0_ORGANIZATION_value~'"$APP_AI_AUTH0_ORGANIZATION_value"'~g' "$file" 2>/dev/null || true
done

echo "=========================================="
echo "Environment variable replacement complete"
echo "=========================================="
echo ""
echo "Starting Nginx..."
exec nginx -g 'daemon off;'