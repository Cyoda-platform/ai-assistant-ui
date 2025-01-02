#!/bin/sh

ROOT_DIR=/app

# Replace env vars in JavaScript files
echo "Replacing env constants in JS"
for file in $ROOT_DIR/js/* $ROOT_DIR/index.html $ROOT_DIR/css/* $ROOT_DIR/assets/*.js $ROOT_DIR/assets/*.css $ROOT_DIR/config.json

do
  echo "Processing $file ...";
  sed -i 's~HOST_value~'$HOST_value'~g' $file
done

echo "Starting Nginx"
nginx -g 'daemon off;'