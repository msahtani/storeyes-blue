# Fix: ExpoSecureStore Native Module Error for TestFlight

## Problem

Getting error: `Unhandled JS Exception: Error: Cannot find native module 'ExpoSecureStore'` when building for iOS TestFlight.

## Solutions

### Solution 1: Clear EAS Build Cache (Recommended)

The most common fix is to clear the EAS build cache and rebuild:

```bash
# Clear the build cache and rebuild for iOS
eas build --platform ios --profile production --clear-cache
```

Or if you're using the preview profile:

```bash
eas build --platform ios --profile preview --clear-cache
```

### Solution 2: Reinstall Dependencies

Sometimes dependencies need to be reinstalled:

```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Then rebuild
eas build --platform ios --profile production --clear-cache
```

### Solution 3: Verify Plugin Configuration

The plugin is already correctly configured in `app.json`:

```json
"plugins": [
  "expo-router",
  "expo-secure-store"
]
```

Make sure `expo-secure-store` is in your `package.json` dependencies (it is: `~15.0.8`).

### Solution 4: Prebuild Locally (Optional)

If the above doesn't work, you can generate the native projects locally to verify everything is set up correctly:

```bash
# Generate iOS native project
npx expo prebuild --platform ios --clean

# This will create an ios/ folder
# Then you can build with EAS (it will use the prebuild)
eas build --platform ios --profile production
```

**Note:** After prebuild, you might want to add `ios/` to `.gitignore` if you prefer to keep using managed workflow.

### Solution 5: Update Expo CLI and SDK

Ensure you're using the latest Expo CLI:

```bash
npm install -g eas-cli@latest
npx expo install expo-secure-store@latest
```

## Quick Fix Steps Summary

1. **Run this command to clear cache and rebuild:**

   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

2. **If that doesn't work, try:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   eas build --platform ios --profile production --clear-cache
   ```

## Why This Happens

This error typically occurs because:

- The EAS build cache is stale and doesn't include the native module
- The native module wasn't properly linked during the build process
- There's a version mismatch between the package and the build environment

The `--clear-cache` flag forces EAS to rebuild everything from scratch, ensuring all native modules are properly included.
