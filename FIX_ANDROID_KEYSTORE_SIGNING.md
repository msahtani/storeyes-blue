# Fix: Android Keystore Signing Error (Wrong Key)

## The Problem

Google Play Console error:

> "Votre Android App Bundle a été signé avec la mauvaise clé"

**Expected SHA1**: `4C:EC:B3:FD:E4:FA:EE:94:5B:EE:A8:96:98:F8:F8:9E:FB:52:26:28`
**Actual SHA1**: `C5:9F:31:20:C5:8A:90:C1:0A:1E:63:28:92:F3:11:40:F3:AF:4C:E3`

This means EAS Build is using a different keystore than the one used for your first app upload.

## Solution: Configure EAS to Use the Correct Keystore

### Step 1: Check if Credentials Exist in EAS

Run this command to check your Android credentials:

```bash
eas credentials
```

Select **Android** and then **production** profile. This will show you if credentials are already stored.

### Step 2: Upload the Original Keystore to EAS

You have two options:

#### Option A: If You Have the Original Keystore File

If you have the `.keystore` or `.jks` file that was used for the first upload:

1. **Upload it to EAS**:

   ```bash
   eas credentials
   ```

   - Select: **Android** → **production** → **Set up a new keystore**
   - Choose: **Upload existing keystore**
   - Provide the keystore file path and password

2. **EAS will store it securely** and use it for all future builds

#### Option B: If You Don't Have the Original Keystore

If you don't have the original keystore file, you have a few options:

**1. Check Google Play Console (App Signing by Google Play)**

If you enabled "App signing by Google Play", Google Play manages the signing key. You can:

- Go to Google Play Console
- Navigate to: **Release** → **Setup** → **App signing**
- Download the "App signing key certificate" (this is the key Google uses)
- But this won't help if you need to sign locally

**2. Check EAS Credentials (If It Was Created There)**

If your first build was created with EAS, the keystore might already be stored:

```bash
eas credentials
```

Select **Android** → **production** → View existing credentials. If you see credentials there, EAS will use them automatically.

**3. If You Can't Recover the Original Keystore**

Unfortunately, if you cannot recover the original keystore:

- You cannot update the existing app
- You would need to publish as a new app (new package name)
- Or contact Google Play Support (they might be able to help in rare cases)

### Step 3: Verify the Keystore SHA1

After uploading the keystore, verify it matches the expected SHA1:

**Expected SHA1**: `4C:EC:B3:FD:E4:FA:EE:94:5B:EE:A8:96:98:F8:F8:9E:FB:52:26:28`

You can check the SHA1 of a keystore file:

```bash
keytool -list -v -keystore your-keystore.jks
```

Or if you have the certificate:

```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

Look for "SHA1" in the output and compare with `4C:EC:B3:FD:E4:FA:EE:94:5B:EE:A8:96:98:F8:F8:9E:FB:52:26:28`

### Step 4: Rebuild with Correct Credentials

Once the correct keystore is configured in EAS:

```bash
eas build --platform android --profile production
```

EAS will automatically use the stored credentials for signing.

## Quick Commands

```bash
# Check existing credentials
eas credentials

# Configure credentials (if needed)
eas credentials

# Build with production profile (uses stored credentials)
eas build --platform android --profile production --clear-cache
```

## Important Notes

⚠️ **Never lose your keystore!** It's required for all app updates.

✅ **EAS Credentials Storage**: Once you upload a keystore to EAS, it's stored securely and used automatically for all builds with that profile.

✅ **App Signing by Google Play**: If enabled, Google manages the final signing key, but you still need the upload key for the AAB.

## Next Steps

1. Run `eas credentials` to check if credentials exist
2. If they don't match, upload the original keystore
3. Rebuild your AAB
4. The new AAB should now have the correct SHA1 signature
