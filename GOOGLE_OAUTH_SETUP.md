# 🔐 Google OAuth Setup Guide for SkillWise

## 📋 Prerequisites
- Google Cloud Console account
- Domain or localhost setup for development

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API (if not already enabled)

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - **App name**: SkillWise
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email for development)

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: SkillWise Web Client
   - **Authorized JavaScript origins**:
     ```
     https://localhost:5173
     https://localhost:5174
     http://localhost:5173
     http://localhost:5174
     ```
   - **Authorized redirect URIs**:
     ```
     https://localhost:5173/auth/google-callback
     https://localhost:5174/auth/google-callback
     http://localhost:5173/auth/google-callback
     http://localhost:5174/auth/google-callback
     ```

### 4. Get Your Credentials

1. Copy the **Client ID** (not the client secret)
2. Add to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   ```

### 5. Update Environment Variables

Add to your `.env` file in the server directory:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 6. Frontend Configuration

Update your Google OAuth configuration in the frontend:

```javascript
// In your Google OAuth initialization
const googleClientId = 'your_google_client_id_here';
```

## 🔧 Development Setup

### For Local Development with HTTPS

Since Google OAuth requires HTTPS, you need to set up local HTTPS:

1. **Install mkcert** (if not already installed):
   ```bash
   # Windows (with Chocolatey)
   choco install mkcert
   
   # macOS
   brew install mkcert
   
   # Linux
   sudo apt install mkcert
   ```

2. **Generate certificates**:
   ```bash
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

3. **Update Vite config** (already done in your setup):
   ```javascript
   // client/vite.config.js
   export default defineConfig({
     server: {
       https: {
         key: fs.readFileSync('localhost-key.pem'),
         cert: fs.readFileSync('localhost.pem'),
       },
     },
   });
   ```

## 🧪 Testing

### 1. Test Google Client Setup

Visit: `https://localhost:5000/api/test-google-client`

Should return:
```json
{
  "success": true,
  "message": "Google client initialized successfully",
  "clientId": "your_client_id"
}
```

### 2. Test OAuth Flow

1. Start your development servers:
   ```bash
   npm run dev
   ```

2. Visit: `https://localhost:5173`

3. Click "Continue with Google"

4. Should redirect to Google OAuth and back to role selection

## 🚨 Common Issues

### 1. "Invalid Client" Error
- Check that your Client ID is correct
- Ensure the domain is authorized in Google Console

### 2. "Redirect URI Mismatch"
- Add all your development URLs to authorized redirect URIs
- Include both HTTP and HTTPS versions

### 3. "OAuth consent screen not configured"
- Complete the OAuth consent screen setup
- Add your email as a test user

### 4. HTTPS Required
- Google OAuth requires HTTPS even for localhost
- Use mkcert for local HTTPS development

## 🔒 Security Notes

- **Never commit your Client Secret** (you don't need it for this setup)
- **Use environment variables** for all sensitive data
- **Add .env to .gitignore** to prevent accidental commits
- **Use HTTPS in production** with proper SSL certificates

## 📝 Environment Variables Checklist

Make sure these are set in your `.env` file:

```env
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Optional but recommended
NODE_ENV=development
FRONTEND_URL=https://localhost:5173
```

## 🎯 Next Steps

After setting up Google OAuth:

1. **Test the flow** with a new user
2. **Verify role selection** works correctly
3. **Check database entries** for new users
4. **Test existing user login** with Google

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check the server logs for detailed error messages
3. Verify all environment variables are set
4. Ensure HTTPS is working correctly
5. Test with the provided test endpoints

---

**Note**: This setup is for development. For production, you'll need to:
- Use a real domain
- Set up proper SSL certificates
- Configure production URLs in Google Console
- Use environment-specific configurations 