#!/bin/bash

# 🚀 Installation script for Cyoda on macOS
# Automatically resolves issues with unsigned applications

echo "🎯 Cyoda installer for macOS"
echo "================================"

# Check if script is run from folder with DMG or application
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Search for DMG files
DMG_FILES=($(find "$SCRIPT_DIR" -name "*.dmg" -type f 2>/dev/null))

# Search for .app files
APP_FILES=($(find "$SCRIPT_DIR" -name "*.app" -type d 2>/dev/null))

if [ ${#DMG_FILES[@]} -gt 0 ]; then
    echo "💿 Found DMG file: ${DMG_FILES[0]}"
    
    echo "🔓 Removing quarantine from DMG..."
    sudo xattr -rd com.apple.quarantine "${DMG_FILES[0]}" 2>/dev/null || true
    
    echo "📦 Mounting DMG..."
    hdiutil attach "${DMG_FILES[0]}" -quiet
    
    # Search for mounted application
    MOUNTED_APP=$(find /Volumes -name "Cyoda.app" -type d 2>/dev/null | head -1)
    
    if [ -n "$MOUNTED_APP" ]; then
        echo "📱 Found application: $MOUNTED_APP"
        
        echo "🔓 Removing quarantine from application..."
        sudo xattr -rd com.apple.quarantine "$MOUNTED_APP" 2>/dev/null || true
        
        echo "📂 Copying to Applications..."
        sudo cp -R "$MOUNTED_APP" /Applications/
        
        echo "🔧 Setting up permissions..."
        sudo chmod +x /Applications/Cyoda.app/Contents/MacOS/* 2>/dev/null || true
        sudo xattr -rd com.apple.quarantine /Applications/Cyoda.app 2>/dev/null || true
        
        echo "💿 Unmounting DMG..."
        hdiutil detach /Volumes/Cyoda* -quiet 2>/dev/null || true
        
        echo "✅ Installation completed!"
        echo "🚀 Application installed at /Applications/Cyoda.app"
        echo ""
        echo "Launch application:"
        echo "open /Applications/Cyoda.app"
        
    else
        echo "❌ Could not find application in DMG"
        exit 1
    fi
    
elif [ ${#APP_FILES[@]} -gt 0 ]; then
    echo "📱 Found application: ${APP_FILES[0]}"
    
    echo "🔓 Removing quarantine..."
    sudo xattr -rd com.apple.quarantine "${APP_FILES[0]}" 2>/dev/null || true
    
    echo "🔧 Setting up permissions..."
    sudo chmod +x "${APP_FILES[0]}/Contents/MacOS/"* 2>/dev/null || true
    
    echo "📂 Copying to Applications..."
    sudo cp -R "${APP_FILES[0]}" /Applications/
    
    echo "🔓 Final setup..."
    sudo xattr -rd com.apple.quarantine /Applications/Cyoda.app 2>/dev/null || true
    
    echo "✅ Installation completed!"
    echo "🚀 Application installed at /Applications/Cyoda.app"
    echo ""
    echo "Launch application:"
    echo "open /Applications/Cyoda.app"
    
else
    echo "❌ No DMG or .app files found"
    echo ""
    echo "🛠️ Manual installation:"
    echo "1. If you have a DMG file:"
    echo "   sudo xattr -rd com.apple.quarantine Cyoda-*.dmg"
    echo "   # Then open DMG and drag application to Applications"
    echo ""
    echo "2. If you have a .app file:"
    echo "   sudo xattr -rd com.apple.quarantine Cyoda.app"
    echo "   sudo cp -R Cyoda.app /Applications/"
    echo ""
    echo "3. Final command (in any case):"
    echo "   sudo xattr -rd com.apple.quarantine /Applications/Cyoda.app"
    echo "   sudo chmod +x /Applications/Cyoda.app/Contents/MacOS/*"
    
    exit 1
fi

echo ""
echo "🎉 Done! Cyoda is ready to use."
echo ""
echo "ℹ️  Note: This is a one-time procedure."
echo "   After installation, the application will run without issues."
