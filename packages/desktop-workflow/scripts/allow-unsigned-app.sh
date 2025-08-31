#!/bin/bash

# Script for allowing unsigned Electron application execution on macOS
# This script disables quarantine and allows running the application

echo "🚫 Disabling quarantine for Electron application..."

# Path to application (may need to be changed depending on version)
APP_PATH="$(find out -name "*.app" -type d | head -1)"

if [ -z "$APP_PATH" ]; then
    echo "❌ Application not found in out/ folder"
    echo "   First build the application: yarn make"
    exit 1
fi

echo "📱 Found application: $APP_PATH"

echo "🔓 Removing quarantine attributes..."
# Remove quarantine attributes
sudo xattr -rd com.apple.quarantine "$APP_PATH"

echo "✅ Permissions configured!"
echo ""
echo "ℹ️  Now the application can be run without warnings:"
echo "   open '$APP_PATH'"
echo ""
echo "⚠️  Note: This setting applies only to this build."
echo "   Creating a new build will require repeating the procedure."
