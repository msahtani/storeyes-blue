# Create New EAS Project with Slug "storeyes"

## Current Situation

- **app.json slug**: `storeyes` ✅
- **Old EAS project slug**: `storeyes-blue` (doesn't match)
- **Action needed**: Create new EAS project with slug "storeyes"

## Steps

### Step 1: Create New EAS Project

Run this command in your terminal:

```bash
eas init
```

This will:

- Detect your slug ("storeyes") from app.json
- Create a new EAS project with that slug
- Add the new `projectId` to your `app.json`

### Step 2: Configure Android Credentials

After creating the new project, you'll need to upload the **original keystore** that matches Google Play's expected SHA1:

**Expected SHA1**: `4C:EC:B3:FD:E4:FA:EE:94:5B:EE:A8:96:98:F8:F8:9E:FB:52:26:28`

Run:

```bash
eas credentials
```

Then:

1. Select **Android** → **production**
2. Select **Keystore: Manage everything needed to build your project**
3. Choose **Set up a new keystore** → **Upload existing keystore**
4. Provide the original keystore file that has SHA1: `4C:EC:B3:FD:E4:FA:EE:94:5B:EE:A8:96:98:F8:F8:9E:FB:52:26:28`

### Step 3: Build Your AAB

Once the correct keystore is configured:

```bash
eas build --platform android --profile production --clear-cache
```

## Important Notes

⚠️ **Old Project**: The old EAS project (with slug "storeyes-blue") and its credentials will still exist, but won't be used by this project anymore.

⚠️ **Keystore**: Make sure you have the original keystore file with SHA1 `4C:EC:B3:FD:E4:FA:EE:94:5B:EE:A8:96:98:F8:F8:9E:FB:52:26:28` before proceeding, otherwise you won't be able to update your Google Play app.

✅ **New Project**: After `eas init`, you'll have a clean project with slug "storeyes" that matches your app.json.
