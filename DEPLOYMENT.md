# Deployment Guide: Multi-Tenant Kanban App

## Overview
Deploy the full-stack Kanban application using free tiers:
- **Database**: Neon (PostgreSQL)
- **Backend**: Render
- **Frontend**: Vercel

---

## Step 1: Database Setup (Neon)

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub/Google
3. Create a new project

### 1.2 Get Database URL
1. Copy the connection string from Neon dashboard
2. It looks like: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. Save this for later

---

## Step 2: Google OAuth Setup

### 2.1 Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add authorized redirect URIs:
   - `https://your-backend-url.onrender.com/auth/google/callback`
   - (You'll update this after deploying backend)
7. Copy Client ID and Client Secret

---

## Step 3: Backend Deployment (Render)

### 3.1 Prepare Backend for Production

Update `backend/src/main.ts` to disable HTTPS in production:

```typescript
// Remove or modify HTTPS configuration for production
let httpsOptions: any = undefined;
if (configService.get('NODE_ENV') === 'development') {
  // HTTPS only in development
  try {
    const keyPath = configService.get('HTTPS_KEY_PATH');
    const certPath = configService.get('HTTPS_CERT_PATH');
    
    if (keyPath && certPath) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }
  } catch (error) {
    console.warn('HTTPS certificates not found, using HTTP');
  }
}
```

### 3.2 Create Render Web Service
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `kanban-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm run start:prod`
   - **Instance Type**: Free

### 3.3 Add Environment Variables in Render

Click "Environment" tab and add:

```env
DATABASE_URL=<your-neon-connection-string>
JWT_SECRET=<generate-random-secret-key>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-backend-url.onrender.com/auth/google/callback
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Important**: 
- Replace `<your-neon-connection-string>` with Neon database URL
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Update GOOGLE_CALLBACK_URL after deployment
- Update FRONTEND_URL after deploying frontend

### 3.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://your-app.onrender.com`

### 3.5 Update Google OAuth Redirect URI
1. Go back to Google Cloud Console
2. Update OAuth redirect URI with your actual Render URL
3. Save changes

---

## Step 4: Frontend Deployment (Vercel)

### 4.1 Prepare Frontend

Update `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### 4.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.3 Add Environment Variables in Vercel

Go to "Settings" → "Environment Variables":

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### 4.4 Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL: `https://your-app.vercel.app`

### 4.5 Update Backend CORS
1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy backend

---

## Step 5: Final Configuration

### 5.1 Update Backend Environment Variables
In Render, update:
```env
FRONTEND_URL=https://your-actual-frontend.vercel.app
GOOGLE_CALLBACK_URL=https://your-actual-backend.onrender.com/auth/google/callback
```

### 5.2 Update Google OAuth
In Google Cloud Console, ensure redirect URI is:
```
https://your-actual-backend.onrender.com/auth/google/callback
```

### 5.3 Test the Application
1. Visit your Vercel URL
2. Click "Sign in with Google"
3. Create a workspace
4. Create a board
5. Test real-time features

---

## Troubleshooting

### Database Connection Issues
- Ensure Neon connection string includes `?sslmode=require`
- Check Render logs for connection errors

### OAuth Not Working
- Verify Google OAuth redirect URI matches exactly
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure FRONTEND_URL and backend URL are correct

### CORS Errors
- Verify FRONTEND_URL in backend matches your Vercel URL exactly
- Check that credentials are enabled in CORS config

### Build Failures
- Check Render build logs
- Ensure all dependencies are in package.json
- Verify Prisma schema is valid

---

## Cost Breakdown (All Free!)

- **Neon**: Free tier (512 MB storage, 1 GB data transfer)
- **Render**: Free tier (750 hours/month, sleeps after 15 min inactivity)
- **Vercel**: Free tier (100 GB bandwidth, unlimited deployments)

**Note**: Render free tier sleeps after inactivity. First request after sleep takes ~30 seconds to wake up.

---

## Production Checklist

- [ ] Database deployed to Neon
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Google OAuth configured with production URLs
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Database migrations run successfully
- [ ] Test authentication flow
- [ ] Test workspace creation
- [ ] Test board operations
- [ ] Test real-time updates

---

## Monitoring

### Render Logs
- View logs in Render dashboard
- Monitor for errors and performance issues

### Vercel Analytics
- Enable Vercel Analytics for frontend monitoring
- Track page views and performance

### Database
- Monitor Neon dashboard for connection count
- Check storage usage

---

## Scaling (When Needed)

If you outgrow free tiers:
- **Neon**: Upgrade to Pro ($19/month) for more storage
- **Render**: Upgrade to Starter ($7/month) for always-on service
- **Vercel**: Pro plan ($20/month) for more bandwidth

---

## Security Notes

1. **JWT Secret**: Use a strong random secret in production
2. **Database**: Neon provides SSL by default
3. **HTTPS**: Render and Vercel provide HTTPS automatically
4. **OAuth**: Keep client secrets secure in environment variables
5. **CORS**: Only allow your frontend domain

---

## Backup Strategy

### Database Backups
- Neon provides automatic backups on paid plans
- For free tier, periodically export data:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

### Code Backups
- GitHub repository serves as code backup
- Tag releases for version control

---

## Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test OAuth flow step by step
5. Check database connection in Render logs
