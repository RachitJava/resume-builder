# Xcode iOS Build - Troubleshooting Guide

## Common Errors and Solutions

### Error: "No signing certificate found"

**Solution:**
1. In Xcode, select the "App" target (blue icon on left)
2. Go to "Signing & Capabilities" tab
3. Check "Automatically manage signing"
4. Select your Team (add Apple ID in Xcode → Settings → Accounts if needed)
5. For testing, you can use your personal Apple ID (free)

### Error: "Bundle identifier cannot be used"

**Solution:**
1. In Xcode, select "App" target
2. Go to "Signing & Capabilities"
3. Change Bundle Identifier to something unique:
   - Example: `com.yourname.decisiveml`
   - Or: `com.rachit.resumebuilder`

### Error: "Build input file cannot be found"

**Solution:**
```bash
cd frontend
npm run build
npx cap sync ios
```

Then in Xcode: Product → Clean Build Folder (Cmd+Shift+K)

### Error: "The app ID cannot be registered"

**Solution:**
Change the bundle identifier to something unique:
1. Xcode → App target → General tab
2. Bundle Identifier: Change to `com.YOURNAME.decisiveml`

### Error: "Provisioning profile doesn't match"

**Solution:**
1. Xcode → Settings → Accounts
2. Select your Apple ID
3. Click "Download Manual Profiles"
4. In project: Signing & Capabilities → Enable "Automatically manage signing"

### Error: "Swift Package Manager failed"

**Solution:**
```bash
cd frontend/ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData
```

Then in Xcode:
- File → Packages → Reset Package Caches
- File → Packages → Update to Latest Package Versions

### Error: "Command PhaseScriptExecution failed"

**Solution:**
1. Make sure Node.js is in PATH:
   ```bash
   which node
   # Should show: /usr/local/bin/node or similar
   ```

2. In Xcode Build Settings, add to PATH:
   - Search for "PATH"
   - Add: `/usr/local/bin:$PATH`

### Error: "Simulator not available"

**Solution:**
1. Xcode → Settings → Platforms
2. Download iOS Simulator
3. Or select a physical device instead

## Quick Fixes

### Reset Everything:
```bash
cd frontend
rm -rf node_modules
rm -rf ios
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

### Clean Xcode:
```bash
# Close Xcode first
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf frontend/ios/App/build
```

Then reopen Xcode and build.

### Update Capacitor:
```bash
cd frontend
npm update @capacitor/core @capacitor/cli @capacitor/ios
npx cap sync ios
```

## For Specific Error Messages

**Please share the exact error message you're seeing:**
- Screenshot of Xcode error
- Or copy the error text from the Issue Navigator (⌘+5)
- Or check the build log (⌘+9)

## Most Common Issue: Signing

If you're seeing signing errors, here's the simplest fix:

1. **In Xcode:**
   - Select "App" target (left sidebar)
   - "Signing & Capabilities" tab
   - Team: Select your Apple ID
   - Bundle Identifier: Change to `com.YOURNAME.decisiveml`
   - Check "Automatically manage signing"

2. **For testing without Apple Developer account:**
   - You can use a free Apple ID
   - The app will work for 7 days
   - Just rebuild after 7 days

## Still Having Issues?

Share the error message and I'll help you fix it!

Common things to check:
- [ ] Xcode is up to date
- [ ] You've run `npm run build` in frontend folder
- [ ] You've run `npx cap sync ios`
- [ ] You've selected a valid Team in Signing
- [ ] Bundle identifier is unique
