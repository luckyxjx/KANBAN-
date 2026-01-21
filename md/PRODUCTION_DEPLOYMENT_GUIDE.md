# Production Deployment Guide - Multi-Tenant Kanban

Complete step-by-step guide to deploy your application to production.

## Overview

Your stack:
- **Frontend**: React + Vite → Vercel
- **Backend**: NestJS → Render
- **Database**: PostgreSQL → Neon
- **Auth**: Google OAuth 2.0
- **Real-time**: WebSocket (Socket.io)

**Total Cost**: $0 (all free tiers)

---

## Phase 1: Pre-Deployment Setup (15 minutes)

### 1.1 Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Save the output - you'll need it later.

### 1.2 Prepare Your Repository

Ensure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## Phase 2: Database Setup - Neon (5 minutes)

### 2.1 Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Create a new project

### 2.2 Get Connection String

1. In Neon dashboard, go to your project
2. Click "Connection string"
3. Copy the full connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this - you'll need it for backend deployment

**Important**: The `?sslmode=require` at the end is critical for production.

---

## Phase 3: Google OAuth Setup (10 minutes)

### 3.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Name it: `kanban-app`
4. Click "Create"

### 3.2 Enable Google+ API

1. In the search bar, search for "Google+ API"
2. Click on it
3. Click "Enable"

### 3.3 Create OAuth Credentials

1. Go to "Credentials" (left sidebar)
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, click "Configure OAuth Consent Screen" first:
   - User Type: "External"
   - Fill in app name: `Kanban App`
   - Add your email
   - Click "Save and Continue" through all screens
4. Back to "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Name: `Kanban Web Client`
7. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/auth/google/callback
   ```
   (We'll update this after deploying backend)
8. Click "Create"
9. Copy and save:
   - **Client ID**
   - **Client Secret**

---

## Phase 4: Backend Deployment - Render (15 minutes)

### 4.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub
4. Authorize Render to access your repositories

### 4.2 Create Web Service

1. Click "New +" → "Web Service"
2. Select your repository
3. Click "Connect"

### 4.3 Configure Service

Fill in the following:

- **Name**: `kanban-backend`
- **Environment**: `Node`
- **Region**: `Oregon` (or closest to you)
- **Branch**: `main`
- **Build Command**: 
  ```
  npm install && npx prisma generate && npm run build
  ```
- **Start Command**: 
  ```
  npx prisma migrate deploy && npm run start:prod
  ```
- **Instance Type**: `Free`
- **Root Directory**: `backend`

### 4.4 Add Environment Variables

Click "Environment" tab and add each variable:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste your Neon connection string |
| `JWT_SECRET` | Paste the secret you generated earlier |
| `JWT_EXPIRES_IN` | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `GOOGLE_CLIENT_ID` | Paste from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Paste from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://kanban-backend-xxx.onrender.com/auth/google/callback` (update after deployment) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `FRONTEND_URL` | `https://kanban-app-xxx.vercel.app` (update after frontend deployment) |

### 4.5 Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your backend URL from the dashboard
   - Format: `https://kanban-backend-xxx.onrender.com`

### 4.6 Update Google OAuth

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. Go to "Credentials" → Your OAuth 2.0 Client
3. Update "Authorized redirect URIs" to:
   ```
   https://kanban-backend-xxx.onrender.com/auth/google/callback
   ```
4. Click "Save"

### 4.7 Update Render Environment Variables

1. Go back to Render dashboard
2. Click on your service
3. Go to "Environment"
4. Update:
   - `GOOGLE_CALLBACK_URL`: `https://kanban-backend-xxx.onrender.com/auth/google/callback`
   - `FRONTEND_URL`: (leave for now, update after frontend deployment)
5. Click "Save Changes"
6. Render will auto-redeploy

---

## Phase 5: Frontend Deployment - Vercel (10 minutes)

### 5.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub
4. Authorize Vercel to access your repositories

### 5.2 Import Project

1. Click "Add New" → "Project"
2. Select your repository
3. Click "Import"

### 5.3 Configure Project

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 5.4 Add Environment Variables

Click "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://kanban-backend-xxx.onrender.com` |

### 5.5 Deploy

1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Once deployed, copy your frontend URL
   - Format: `https://kanban-app-xxx.vercel.app`

---

## Phase 6: Final Configuration (5 minutes)

### 6.1 Update Backend CORS

1. Go to Render dashboard
2. Click on your backend service
3. Go to "Environment"
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://kanban-app-xxx.vercel.app
   ```
5. Click "Save Changes"
6. Render will auto-redeploy

### 6.2 Verify Deployment

Wait 2-3 minutes for Render to redeploy, then test:

1. Visit your Vercel URL: `https://kanban-app-xxx.vercel.app`
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. Create a workspace
5. Create a board
6. Test drag-and-drop
7. Test real-time updates (open in another browser tab)

---

## Phase 7: Post-Deployment Verification

### 7.1 Check Logs

**Backend Logs** (Render):
1. Go to Render dashboard
2. Click your service
3. Click "Logs"
4. Look for any errors

**Frontend Logs** (Browser):
1. Visit your app
2. Open browser DevTools (F12)
3. Check Console tab for errors

### 7.2 Test Critical Features

- [ ] Google OAuth login works
- [ ] Workspace creation works
- [ ] Board creation works
- [ ] Card drag-and-drop works
- [ ] Real-time updates work (test in 2 tabs)
- [ ] Activity feed updates
- [ ] Workspace switching works
- [ ] Logout works

### 7.3 Monitor Performance

**First 24 hours**:
- Check Render logs for errors
- Monitor Vercel analytics
- Test from different devices/networks

---

## Troubleshooting

### OAuth Not Working

**Problem**: "Invalid redirect URI" error

**Solution**:
1. Verify Google redirect URI matches exactly:
   ```
   https://kanban-backend-xxx.onrender.com/auth/google/callback
   ```
2. Verify Client ID and Secret are correct
3. Wait 5 minutes for Google to propagate changes

### CORS Errors

**Problem**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Include `https://` in the URL
3. Redeploy backend after updating

### Database Connection Failed

**Problem**: "connect ECONNREFUSED" or "SSL connection error"

**Solution**:
1. Verify `DATABASE_URL` includes `?sslmode=require`
2. Check Neon dashboard - database should be active
3. Verify connection string is correct (copy from Neon again)

### Backend Sleeping

**Problem**: First request takes 30+ seconds

**Solution**:
- This is normal on Render free tier (sleeps after 15 min inactivity)
- Upgrade to Starter plan ($7/month) for always-on service

### WebSocket Connection Failed

**Problem**: Real-time updates not working

**Solution**:
1. Check browser console for WebSocket errors
2. Verify backend is running (check Render logs)
3. Verify `VITE_API_URL` is correct in frontend
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

---

## Environment Variables Reference

### Backend (Render)

```env
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT
JWT_SECRET=<your-generated-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://kanban-backend-xxx.onrender.com/auth/google/callback

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://kanban-app-xxx.vercel.app
```

### Frontend (Vercel)

```env
VITE_API_URL=https://kanban-backend-xxx.onrender.com
```

---

## Monitoring & Maintenance

### Daily

- Check Render logs for errors
- Monitor Vercel analytics
- Test authentication flow

### Weekly

- Review error logs
- Check database performance (Neon dashboard)
- Verify backups (if configured)

### Monthly

- Review security logs
- Check for dependency updates
- Plan capacity upgrades if needed

---

## Scaling (When Needed)

### If Backend is Slow

Upgrade Render plan:
- Free: 750 hours/month, sleeps after 15 min
- Starter: $7/month, always-on, 0.5 CPU
- Standard: $12/month, 1 CPU

### If Database is Full

Upgrade Neon plan:
- Free: 512 MB storage
- Pro: $19/month, 10 GB storage

### If Frontend Bandwidth Exceeded

Upgrade Vercel plan:
- Free: 100 GB bandwidth
- Pro: $20/month, 1 TB bandwidth

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Google OAuth credentials are secure
- [ ] Database connection uses SSL (sslmode=require)
- [ ] HTTPS is enforced (automatic on Render/Vercel)
- [ ] CORS is restricted to frontend domain only
- [ ] No secrets in code or git history
- [ ] Environment variables are set in deployment platform
- [ ] Rate limiting is enabled
- [ ] Input validation is enforced

---

## Backup Strategy

### Database Backups

Neon free tier doesn't include automated backups. To backup manually:

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Code Backups

Your GitHub repository is your code backup. Tag releases:

```bash
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **NestJS Docs**: https://docs.nestjs.com
- **React Docs**: https://react.dev

---

## Deployment Checklist

- [ ] JWT secret generated
- [ ] Neon database created and connection string saved
- [ ] Google OAuth credentials created
- [ ] Backend deployed to Render
- [ ] Google OAuth redirect URI updated
- [ ] Frontend deployed to Vercel
- [ ] Backend CORS updated with frontend URL
- [ ] All environment variables set correctly
- [ ] OAuth login tested
- [ ] Workspace creation tested
- [ ] Board operations tested
- [ ] Real-time updates tested
- [ ] No errors in logs
- [ ] Performance is acceptable

---

## Next Steps

1. **Monitor**: Watch logs for first 24 hours
2. **Optimize**: Identify and fix any performance issues
3. **Scale**: Upgrade plans if needed
4. **Backup**: Set up automated backups
5. **Document**: Update team documentation with production URLs

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: ✅ Production Ready

