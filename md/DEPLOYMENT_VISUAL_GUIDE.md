# Visual Deployment Guide

Step-by-step visual walkthrough of the deployment process.

---

## Phase 1: Pre-Deployment (15 minutes)

### Step 1.1: Generate JWT Secret

```bash
$ openssl rand -base64 32
```

**Output Example**:
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/=
```

✅ **Save this value** - You'll need it for backend deployment

---

### Step 1.2: Prepare Your Code

```bash
$ git add .
$ git commit -m "Prepare for production deployment"
$ git push origin main
```

✅ **Code is ready** - All changes are pushed to GitHub

---

## Phase 2: Database Setup (5 minutes)

### Step 2.1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up"
3. Sign up with GitHub

```
┌─────────────────────────────────────┐
│  Neon Dashboard                     │
│                                     │
│  ✓ Account Created                  │
│  ✓ Project Created                  │
│  ✓ Database Ready                   │
└─────────────────────────────────────┘
```

### Step 2.2: Get Connection String

1. In Neon dashboard, click "Connection string"
2. Copy the full string

```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

✅ **Save this value** - You'll need it for backend deployment

---

## Phase 3: Google OAuth Setup (10 minutes)

### Step 3.1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project
3. Name: `kanban-app`

```
┌─────────────────────────────────────┐
│  Google Cloud Console               │
│                                     │
│  Project: kanban-app                │
│  Status: ✓ Created                  │
└─────────────────────────────────────┘
```

### Step 3.2: Enable Google+ API

1. Search for "Google+ API"
2. Click "Enable"

```
┌─────────────────────────────────────┐
│  APIs & Services                    │
│                                     │
│  Google+ API: ✓ Enabled             │
└─────────────────────────────────────┘
```

### Step 3.3: Create OAuth Credentials

1. Go to "Credentials"
2. Create OAuth 2.0 Client ID
3. Type: Web application
4. Add redirect URI: `http://localhost:3000/auth/google/callback`

```
┌─────────────────────────────────────┐
│  OAuth 2.0 Client                   │
│                                     │
│  Client ID: xxx.apps.googleusercontent.com
│  Client Secret: xxxxxxxxxxxxxxxx    │
│  Redirect URI: http://localhost:... │
└─────────────────────────────────────┘
```

✅ **Save Client ID and Secret** - You'll need them for backend deployment

---

## Phase 4: Backend Deployment (15 minutes)

### Step 4.1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render

```
┌─────────────────────────────────────┐
│  Render Dashboard                   │
│                                     │
│  ✓ Account Created                  │
│  ✓ GitHub Connected                 │
└─────────────────────────────────────┘
```

### Step 4.2: Create Web Service

1. Click "New +" → "Web Service"
2. Select your repository
3. Click "Connect"

```
┌─────────────────────────────────────┐
│  Create Web Service                 │
│                                     │
│  Repository: your-repo              │
│  Branch: main                       │
│  Status: ✓ Connected                │
└─────────────────────────────────────┘
```

### Step 4.3: Configure Service

Fill in the form:

```
┌─────────────────────────────────────┐
│  Service Configuration              │
│                                     │
│  Name: kanban-backend               │
│  Environment: Node                  │
│  Region: Oregon                     │
│  Root Directory: backend            │
│  Build Command:                     │
│    npm install &&                   │
│    npx prisma generate &&           │
│    npm run build                    │
│  Start Command:                     │
│    npx prisma migrate deploy &&     │
│    npm run start:prod               │
│  Instance Type: Free                │
└─────────────────────────────────────┘
```

### Step 4.4: Add Environment Variables

Click "Environment" and add each variable:

```
┌─────────────────────────────────────┐
│  Environment Variables              │
│                                     │
│  DATABASE_URL                       │
│  ├─ Value: postgresql://...         │
│  │                                  │
│  JWT_SECRET                         │
│  ├─ Value: aBcDeFgHiJkLmNoPqRs...  │
│  │                                  │
│  JWT_EXPIRES_IN                     │
│  ├─ Value: 1h                       │
│  │                                  │
│  JWT_REFRESH_EXPIRES_IN             │
│  ├─ Value: 7d                       │
│  │                                  │
│  GOOGLE_CLIENT_ID                   │
│  ├─ Value: xxx.apps.googleusercontent.com
│  │                                  │
│  GOOGLE_CLIENT_SECRET               │
│  ├─ Value: xxxxxxxxxxxxxxxx         │
│  │                                  │
│  GOOGLE_CALLBACK_URL                │
│  ├─ Value: https://kanban-backend-xxx.onrender.com/auth/google/callback
│  │                                  │
│  NODE_ENV                           │
│  ├─ Value: production               │
│  │                                  │
│  PORT                               │
│  ├─ Value: 3000                     │
│  │                                  │
│  FRONTEND_URL                       │
│  ├─ Value: https://kanban-app-xxx.vercel.app
│  │  (Update after frontend deploy)  │
│                                     │
└─────────────────────────────────────┘
```

### Step 4.5: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)

```
┌─────────────────────────────────────┐
│  Deployment Progress                │
│                                     │
│  Building...                        │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                     │
│  Estimated time: 5-10 minutes       │
└─────────────────────────────────────┘
```

### Step 4.6: Get Backend URL

Once deployed, copy your URL:

```
┌─────────────────────────────────────┐
│  Deployment Complete                │
│                                     │
│  Backend URL:                       │
│  https://kanban-backend-xxx.onrender.com
│                                     │
│  ✓ Copy this URL                    │
└─────────────────────────────────────┘
```

### Step 4.7: Update Google OAuth

1. Go back to Google Cloud Console
2. Update redirect URI:

```
https://kanban-backend-xxx.onrender.com/auth/google/callback
```

---

## Phase 5: Frontend Deployment (10 minutes)

### Step 5.1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

```
┌─────────────────────────────────────┐
│  Vercel Dashboard                   │
│                                     │
│  ✓ Account Created                  │
│  ✓ GitHub Connected                 │
└─────────────────────────────────────┘
```

### Step 5.2: Import Project

1. Click "Add New" → "Project"
2. Select your repository
3. Click "Import"

```
┌─────────────────────────────────────┐
│  Import Project                     │
│                                     │
│  Repository: your-repo              │
│  Status: ✓ Selected                 │
└─────────────────────────────────────┘
```

### Step 5.3: Configure Project

```
┌─────────────────────────────────────┐
│  Project Configuration              │
│                                     │
│  Framework Preset: Vite             │
│  Root Directory: frontend           │
│  Build Command: npm run build       │
│  Output Directory: dist             │
└─────────────────────────────────────┘
```

### Step 5.4: Add Environment Variables

```
┌─────────────────────────────────────┐
│  Environment Variables              │
│                                     │
│  VITE_API_URL                       │
│  ├─ Value: https://kanban-backend-xxx.onrender.com
│                                     │
└─────────────────────────────────────┘
```

### Step 5.5: Deploy

1. Click "Deploy"
2. Wait for deployment (2-3 minutes)

```
┌─────────────────────────────────────┐
│  Deployment Progress                │
│                                     │
│  Building...                        │
│  ████████████████░░░░░░░░░░░░░░░░░ │
│                                     │
│  Estimated time: 2-3 minutes        │
└─────────────────────────────────────┘
```

### Step 5.6: Get Frontend URL

Once deployed, copy your URL:

```
┌─────────────────────────────────────┐
│  Deployment Complete                │
│                                     │
│  Frontend URL:                      │
│  https://kanban-app-xxx.vercel.app  │
│                                     │
│  ✓ Copy this URL                    │
└─────────────────────────────────────┘
```

---

## Phase 6: Final Configuration (5 minutes)

### Step 6.1: Update Backend CORS

1. Go to Render dashboard
2. Click your backend service
3. Go to "Environment"
4. Update `FRONTEND_URL`:

```
https://kanban-app-xxx.vercel.app
```

5. Click "Save Changes"
6. Render will auto-redeploy

```
┌─────────────────────────────────────┐
│  Render Dashboard                   │
│                                     │
│  Service: kanban-backend            │
│  Status: Redeploying...             │
│  ████████████░░░░░░░░░░░░░░░░░░░░░ │
│                                     │
│  Wait for redeployment to complete  │
└─────────────────────────────────────┘
```

---

## Phase 7: Testing (5 minutes)

### Step 7.1: Visit Frontend

1. Open your frontend URL in browser
2. You should see the login page

```
┌─────────────────────────────────────┐
│  Kanban App                         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Sign in with Google        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ✓ Frontend is working              │
└─────────────────────────────────────┘
```

### Step 7.2: Test OAuth

1. Click "Sign in with Google"
2. Complete Google authentication
3. You should be redirected to dashboard

```
┌─────────────────────────────────────┐
│  Dashboard                          │
│                                     │
│  Welcome, [Your Name]!              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Create Workspace           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ✓ OAuth is working                 │
└─────────────────────────────────────┘
```

### Step 7.3: Test Features

1. Create workspace
2. Create board
3. Create list
4. Create card
5. Drag card between lists

```
┌─────────────────────────────────────┐
│  Board View                         │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  To Do   │  │  Doing   │        │
│  ├──────────┤  ├──────────┤        │
│  │ Card 1   │  │ Card 2   │        │
│  │ Card 3   │  │          │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ✓ All features working             │
└─────────────────────────────────────┘
```

### Step 7.4: Test Real-Time

1. Open board in two browser tabs
2. Create card in tab 1
3. Card should appear in tab 2 immediately

```
Tab 1                    Tab 2
┌──────────────┐        ┌──────────────┐
│  Board View  │        │  Board View  │
│              │        │              │
│  Create Card │        │              │
│  ✓ Created   │        │  ✓ Appears   │
│              │        │  instantly   │
└──────────────┘        └──────────────┘
```

---

## ✅ Deployment Complete!

```
┌─────────────────────────────────────┐
│  🎉 DEPLOYMENT SUCCESSFUL 🎉        │
│                                     │
│  Frontend: ✓ Deployed               │
│  Backend: ✓ Deployed                │
│  Database: ✓ Connected              │
│  OAuth: ✓ Configured                │
│  Real-time: ✓ Working               │
│                                     │
│  Your app is live!                  │
│                                     │
│  Frontend: https://kanban-app-xxx.vercel.app
│  Backend: https://kanban-backend-xxx.onrender.com
│                                     │
│  Share with users and celebrate! 🎊 │
└─────────────────────────────────────┘
```

---

## 📊 Deployment Summary

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Deployed | https://kanban-app-xxx.vercel.app |
| Backend | ✅ Deployed | https://kanban-backend-xxx.onrender.com |
| Database | ✅ Connected | Neon PostgreSQL |
| OAuth | ✅ Configured | Google OAuth 2.0 |
| Real-time | ✅ Working | WebSocket |

---

## 🆘 Troubleshooting

### Issue: OAuth not working

```
Error: Invalid redirect URI

Solution:
1. Go to Google Cloud Console
2. Check redirect URI matches exactly:
   https://kanban-backend-xxx.onrender.com/auth/google/callback
3. Wait 5 minutes for changes to propagate
4. Try again
```

### Issue: CORS errors

```
Error: Access to XMLHttpRequest blocked by CORS policy

Solution:
1. Go to Render dashboard
2. Check FRONTEND_URL matches your Vercel URL exactly
3. Include https:// in the URL
4. Redeploy backend
5. Hard refresh browser (Cmd+Shift+R)
```

### Issue: Database connection failed

```
Error: connect ECONNREFUSED

Solution:
1. Check DATABASE_URL includes ?sslmode=require
2. Verify Neon database is active
3. Copy connection string from Neon again
4. Update in Render environment variables
5. Redeploy backend
```

---

## 📞 Next Steps

1. **Monitor** - Watch logs for first 24 hours
2. **Optimize** - Identify performance issues
3. **Scale** - Upgrade plans if needed
4. **Backup** - Set up automated backups
5. **Document** - Update team documentation

---

**Status**: ✅ Production Ready

**Last Updated**: January 21, 2026

