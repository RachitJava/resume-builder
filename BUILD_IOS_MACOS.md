# Building iOS App on macOS

Since you're on macOS, you can build the iOS app locally!

## Quick Start (Easiest Method)

### Option 1: Open in Xcode (Recommended)

1. **Sync the latest changes:**
   ```bash
   cd frontend
   npm run build
   npx cap sync ios
   ```

2. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```
   Or manually: `open frontend/ios/App/App.xcworkspace`

3. **In Xcode:**
   - Select your iPhone from the device dropdown (or a simulator)
   - Click the ▶️ Play button
   - The app will build and install on your device!

### Option 2: Build IPA from Command Line

Run the build script:
```bash
./build-ios.sh
```

This will create `DecisiveML-Resume-Builder.ipa` in `frontend/ios/App/build/`

## Installing on Your iPhone

### Method 1: Direct from Xcode (Easiest)
1. Connect iPhone via USB
2. Trust the computer on your iPhone
3. In Xcode, select your iPhone from devices
4. Click ▶️ Run
5. On iPhone: Settings → General → VPN & Device Management → Trust the developer

### Method 2: Using Xcode Devices Window
1. Connect iPhone via USB
2. In Xcode: Window → Devices and Simulators
3. Drag the `.ipa` file to your device
4. Trust the developer on your iPhone (Settings → General → VPN & Device Management)

### Method 3: Using iOS App Signer (for distribution)
1. Download [iOS App Signer](https://dantheman827.github.io/ios-app-signer/)
2. Sign the IPA with your Apple Developer certificate
3. Install via Xcode or TestFlight

## For App Store Distribution

1. **Get Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com

2. **Configure Signing in Xcode:**
   - Open the project in Xcode
   - Select the App target
   - Go to "Signing & Capabilities"
   - Select your Team
   - Xcode will automatically create certificates

3. **Archive and Upload:**
   ```bash
   # In Xcode:
   # Product → Archive
   # Then: Distribute App → App Store Connect
   ```

## Troubleshooting

### "Untrusted Developer" on iPhone
- Go to Settings → General → VPN & Device Management
- Tap your developer name
- Tap "Trust"

### Build Errors
Make sure you've run:
```bash
cd frontend
npm install
npm run build
npx cap sync ios
```

### Signing Issues
For development/testing, you can use automatic signing:
- In Xcode, enable "Automatically manage signing"
- Select your Apple ID team

## Current Status

✅ iOS project created at `frontend/ios/`
✅ Xcode workspace ready: `frontend/ios/App/App.xcworkspace`
✅ Build script created: `build-ios.sh`
✅ All dependencies synced

## Next Steps

**For personal use:**
```bash
npx cap open ios
# Then click ▶️ in Xcode
```

**For distribution:**
- Use TestFlight (free with Apple Developer account)
- Or share the IPA file directly with testers
- Or publish to App Store

The easiest way is to just open Xcode and click Run! 🚀
