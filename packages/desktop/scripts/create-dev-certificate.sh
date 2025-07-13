#!/bin/bash

# Script for creating a self-signed certificate for signing Electron applications on macOS
# This certificate allows running the application locally without Gatekeeper blocking

echo "🔐 Creating self-signed certificate for Electron application..."

# Certificate name
CERT_NAME="Developer ID Application: Cyoda Platform"

# Check if certificate already exists
if security find-certificate -c "$CERT_NAME" > /dev/null 2>&1; then
    echo "✅ Certificate '$CERT_NAME' already exists"
    echo "📋 List of existing code signing certificates:"
    security find-identity -v -p codesigning
    exit 0
fi

echo "📝 Creating certificate configuration file..."

# Create temporary certificate configuration file
cat > cert_config.conf << EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = Developer ID Application: Cyoda Platform
O = Cyoda Platform
C = US

[v3_req]
keyUsage = digitalSignature
extendedKeyUsage = codeSigning
EOF

echo "🔑 Generating private key and certificate..."

# Generate private key and self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout cyoda_private_key.pem -out cyoda_cert.pem -days 365 -nodes -config cert_config.conf

echo "📦 Creating PKCS#12 file..."

# Create PKCS#12 file (combines certificate and private key)
openssl pkcs12 -export -out cyoda_cert.p12 -inkey cyoda_private_key.pem -in cyoda_cert.pem -passout pass:

echo "🔐 Importing certificate to keychain..."

# Import certificate to keychain
security import cyoda_cert.p12 -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign -T /usr/bin/security

echo "🛡️ Setting up certificate trust..."

# Set certificate trust for code signing
security set-key-partition-list -S apple-tool:,apple: -s -k "" ~/Library/Keychains/login.keychain-db

echo "🧹 Cleaning up temporary files..."

# Remove temporary files
rm -f cert_config.conf cyoda_private_key.pem cyoda_cert.pem cyoda_cert.p12

echo "✅ Self-signed certificate created successfully!"
echo ""
echo "📋 Available code signing certificates:"
security find-identity -v -p codesigning

echo ""
echo "ℹ️  Now you can:"
echo "   1. Build the application: yarn make"
echo "   2. Run it on macOS without security warnings"
echo ""
echo "⚠️  Note: This certificate is for local development only."
echo "   For distribution, use an official Apple Developer certificate."
