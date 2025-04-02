#!/bin/sh

ROOT_DIR=/app

# Replace env vars in JavaScript files
echo "Replacing env constants in JS"
for file in $ROOT_DIR/js/* $ROOT_DIR/index.html $ROOT_DIR/css/* $ROOT_DIR/assets/*.js $ROOT_DIR/assets/*.css $ROOT_DIR/config.json

do
  echo "Processing $file ...";
  sed -i 's~APP_AI_API_AUTH_value~'$APP_AI_API_AUTH_value'~g' $file
  sed -i 's~APP_AI_API_BASE_value~'$APP_AI_API_BASE_value'~g' $file
  sed -i 's~APP_AI_AUTH0_DOMAIN_value~'$APP_AI_AUTH0_DOMAIN_value'~g' $file
  sed -i 's~APP_AI_AUTH0_CLIENT_ID_value~'$APP_AI_AUTH0_CLIENT_ID_value'~g' $file
  sed -i 's~APP_AI_AUTH0_AUDIENCE_value~'$APP_AI_AUTH0_AUDIENCE_value'~g' $file
  sed -i 's~APP_AI_AUTH0_REDIRECT_URI_value~'$APP_AI_AUTH0_REDIRECT_URI_value'~g' $file
  sed -i 's~APP_AI_AUTH0_ORGANIZATION_value~'$APP_AI_AUTH0_ORGANIZATION_value'~g' $file
done

echo "Starting Nginx"
nginx -g 'daemon off;'