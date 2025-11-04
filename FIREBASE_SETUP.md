# Firebase Authentication Setup Guide

## ✅ Code is Ready! Now Configure Firebase:

### 1. Create a Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `AI Swim Start Analyzer` (or any name)
4. Click through the setup steps (you can disable Google Analytics if you want)
5. Click **"Create Project"**

### 2. Enable Authentication Providers
1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab

**Enable Google Sign-In:**
4. Click on **"Google"** in the providers list
5. Toggle the **Enable** switch ON
6. Enter a support email (your email)
7. Click **"Save"**

**Enable Email/Password Sign-In:**
8. Click on **"Email/Password"** in the providers list
9. Toggle the **Enable** switch ON (first toggle only, not "Email link")
10. Click **"Save"**

### 3. Register Your Web App
1. In Firebase console, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Enter app nickname: `AI Swim Start Analyzer Web`
6. Click **"Register app"**

### 4. Copy Your Firebase Config
After registering, you'll see your Firebase configuration. Copy these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};
```

### 5. Add Config to .env.local
Open your `.env.local` file and paste the values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
```

### 6. Restart Your Dev Server
Stop your server (Ctrl+C) and restart:

```bash
pnpm dev
```

### 7. Test Authentication
1. Open http://localhost:3000
2. Click **"Sign In"** in the top right
3. You'll see a dialog with **Sign In** and **Sign Up** tabs

**Test Google Sign-In:**
- Click **"Continue with Google"**
- Select your Google account
- You should see your profile picture and name

**Test Email/Password Sign-Up:**
- Switch to the **"Sign Up"** tab
- Enter your name, email, and password
- Click **"Create Account"**
- You should be signed in

**Test Email/Password Sign-In:**
- Sign out (click logout icon)
- Click **"Sign In"** again
- Enter your email and password
- Click **"Sign In"**

**Sign Out:**
- Click the logout icon next to your profile

## 🎉 Done!

Your app now has:
- ✅ Google Sign-In
- ✅ Email/Password Sign-In
- ✅ Email/Password Sign-Up
- ✅ User profile display
- ✅ Sign out functionality
- ✅ Beautiful modal dialog UI
- ✅ Form validation and error handling
- ✅ No watermarks (fully customizable!)

## Troubleshooting

**"Firebase: Error (auth/invalid-api-key)"**
- Double-check your API key in `.env.local`
- Make sure there are no extra spaces

**Sign-in popup doesn't work:**
- Make sure Google provider is enabled in Firebase Console
- Check browser console for errors
- Try clearing browser cache

**"Unauthorized domain" error:**
- In Firebase Console → Authentication → Settings → Authorized domains
- Add `localhost` (should be there by default)

## Next Steps
- Users are now authenticated!
- You can access user info with `auth.currentUser`
- User sessions persist across page refreshes
- You can add more providers (GitHub, Facebook, etc.) anytime

Need help? Check: https://firebase.google.com/docs/auth
