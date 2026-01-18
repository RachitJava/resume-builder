#!/bin/bash

# iOS App Build Script for macOS
# This script builds the iOS app and creates an IPA file

set -e

echo "🚀 Building DecisiveML iOS App..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Build the web app
echo "📦 Building web assets..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# Navigate to iOS project
cd ios/App

# Clean build folder
echo "🧹 Cleaning previous builds..."
rm -rf build/

# Build the app
echo "🔨 Building iOS app..."
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath "$PWD/build/DecisiveML.xcarchive" \
  -destination 'generic/platform=iOS' \
  clean archive \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

# Create IPA
echo "📱 Creating IPA file..."
cd build/DecisiveML.xcarchive/Products/Applications
mkdir -p Payload
cp -r App.app Payload/
zip -r DecisiveML-Resume-Builder.ipa Payload
mv DecisiveML-Resume-Builder.ipa ../../../

# Clean up
cd ../../../
rm -rf DecisiveML.xcarchive

echo "✅ Build complete!"
echo "📁 IPA location: $(pwd)/DecisiveML-Resume-Builder.ipa"
echo ""
echo "To install on your iPhone:"
echo "1. Connect your iPhone via USB"
echo "2. Open Xcode"
echo "3. Go to Window > Devices and Simulators"
echo "4. Drag DecisiveML-Resume-Builder.ipa to your device"
echo ""
echo "Or use: open -a Xcode $(pwd)/DecisiveML-Resume-Builder.ipa"
