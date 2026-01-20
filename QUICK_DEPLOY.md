# Quick Deployment Guide

Follow these steps in order for fastest deployment:

## 1. Database (5 minutes)
1. Go to [neon.tech](https://neon.tech) → Sign up
2. Create project → Copy connection string
3. Save it somewhere safe

## 2. Google OAuth (5 minutes)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID
4. Add redirect URI: `https://YOUR-APP.onrender.com/auth/google/callback` (update later)
5. Copy Client ID and Secret

## 3. Backend - Render (10 minutes)
1. Go to [render.com](https://render.com) → Sign up with GitHub
2. New → Web Service → Connect your repo
3. Settings:
   - Root Directory: `backend`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm run start:prod`
4. Environment Variables (click "Add Environment Variable"):
   ```
   DATABASE_URL = <paste-neon-url>
   JWT_SECRET = <run: openssl rand -base64 32>
   JWT_EXPIRES_IN = 1h
   JWT_REFRESH_EXPIRES_IN = 7d
   GOOGLE_CLIENT_ID = <paste-from-google>
   GOOGLE_CLIENT_SECRET = <paste-from-google>
   GOOGLE_CALLBACK_URL = https://YOUR-APP.onrender.com/auth/google/callback
   NODE_ENV = production
   PORT = 3000
   FRONTEND_URL = https://YOUR-APP.vercel.app
   ```
5. Create Web Service → Wait for deploy
6. Copy your URL: `https://YOUR-APP.onrender.com`
7. Update Google OAuth redirect URI with this URL

## 4. Frontend - Vercel (5 minutes)
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. New Project → Import your repo
3. Settings:
   - Root Directory: `frontend`
   - Framework: Vite
4. Environment Variables:
   ```
   VITE_API_URL = https://YOUR-APP.onrender.com
   ```
5. Deploy → Wait
6. Copy your URL: `https://YOUR-APP.vercel.app`

## 5. Final Updates (2 minutes)
1. Go back to Render → Environment Variables
2. Update `FRONTEND_URL` with your Vercel URL
3. Manual Deploy → Redeploy

## 6. Test! 🎉
1. Visit your Vercel URL
2. Click "Sign in with Google"
3. Create workspace → Create board → Test features

---

## Troubleshooting

**"Board not found" error**: 
- Turn off Demo Mode toggle in the UI
- Sign in with Google OAuth

**OAuth not working**:
- Check Google redirect URI matches Render URL exactly
- Verify Client ID/Secret are correct

**CORS errors**:
- Ensure FRONTEND_URL in Render matches Vercel URL exactly
- Include https:// in URLs

**Backend sleeping**:
- Render free tier sleeps after 15 min
- First request takes ~30 seconds to wake up
- Consider upgrading to paid tier ($7/month) for always-on

---

## Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Or use this online: [randomkeygen.com](https://randomkeygen.com/)

---

## URLs to Save

After deployment, save these:
- Frontend: `https://YOUR-APP.vercel.app`
- Backend: `https://YOUR-APP.onrender.com`
- Database: `postgresql://...@neon.tech/...`
- Google Client ID: `xxx.apps.googleusercontent.com`

---

## Total Time: ~30 minutes
## Total Cost: $0 (all free tiers!)
