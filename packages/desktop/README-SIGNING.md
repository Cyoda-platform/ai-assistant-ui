# Signing Electron Application for macOS

This guide will help you configure an Electron application for macOS to avoid security warnings when launching.

## 🚀 Quick Start

### Option 1: Local Development with Signing

If you have an Apple Developer certificate:

```bash
cd packages/desktop
npm run setup-macos
```

### Option 2: Local Development without Certificate (recommended)

```bash
cd packages/desktop
npm run make:unsigned
```

Then use the installation script:

```bash
./scripts/install-macos.sh
```

## 📋 What You Need to Know

### Code Signing on macOS

- **With Apple Developer Certificate**: Applications run without warnings
- **Without Certificate**: Applications require one-time user approval
- **Adhoc Signing**: Used for local development and testing

### Environment Variables

- `ENABLE_CODE_SIGNING=true` - Enable code signing (requires certificate)
- `ENABLE_CODE_SIGNING=false` - Use adhoc signing (default)

## 🔧 Development Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Choose Build Type

#### For Development (Unsigned)
```bash
yarn make:unsigned
```

#### For Production (Signed)
```bash
export ENABLE_CODE_SIGNING=true
yarn make:signed
```

### 3. Install Application

```bash
./scripts/install-macos.sh
```

## 🛡️ Security Configuration

### For Unsigned Applications

The installation script automatically:
- Removes quarantine attributes
- Sets proper permissions
- Copies to Applications folder

### Manual Security Setup

If needed, you can manually configure:

```bash
# Remove quarantine
sudo xattr -rd com.apple.quarantine /Applications/Cyoda.app

# Set permissions
sudo chmod +x /Applications/Cyoda.app/Contents/MacOS/*
```

## 📦 CI/CD Configuration

### GitHub Actions

The workflow is configured to build unsigned applications:

```yaml
- name: Build Electron app (unsigned)
  env:
    ENABLE_CODE_SIGNING: false
  run: |
    cd packages/desktop
    yarn install
    yarn make:unsigned
```

### Output Files

- **DMG**: `Cyoda-*.dmg` - Disk image for distribution
- **APP**: `Cyoda.app` - Application bundle
- **ZIP**: `Cyoda-*.zip` - Compressed application

## 🚀 Distribution

### For End Users

1. Download the DMG or ZIP file
2. Run the installation script: `./install-macos.sh`
3. Launch from Applications folder

### First Launch

For unsigned applications, users may see a security warning:
1. Right-click the application
2. Select "Open"
3. Click "Open" in the security dialog

## 🔍 Troubleshooting

### Common Issues

1. **"App can't be opened"**
   - Solution: Remove quarantine attributes
   - Command: `xattr -rd com.apple.quarantine /path/to/app`

2. **"App is damaged"**
   - Solution: Re-download and use installation script
   - Ensure files weren't corrupted during download

3. **Permission denied**
   - Solution: Set executable permissions
   - Command: `chmod +x /Applications/Cyoda.app/Contents/MacOS/*`

### Verification Commands

```bash
# Check quarantine status
xattr -l /Applications/Cyoda.app

# Check signature
codesign -dv /Applications/Cyoda.app

# Check permissions
ls -la /Applications/Cyoda.app/Contents/MacOS/
```

## 📚 Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [macOS Gatekeeper](https://support.apple.com/en-us/HT202491)

## ⚙️ Configuration Files

### forge.config.ts
Main configuration for Electron Forge with conditional signing.

### entitlements.mac.plist
Entitlements file for macOS sandboxing and permissions.

### Scripts
- `create-dev-certificate.sh` - Creates self-signed certificate
- `allow-unsigned-app.sh` - Removes quarantine from applications
- `install-macos.sh` - Automated installation script

## 🎯 Best Practices

1. **For Development**: Use unsigned builds with installation script
2. **For Distribution**: Consider Apple Developer Program for signed releases
3. **For CI/CD**: Use unsigned builds with automated quarantine removal
4. **For End Users**: Provide clear installation instructions

---

**Note**: This configuration allows running Electron applications on macOS without Apple Developer certificates while maintaining security best practices.
