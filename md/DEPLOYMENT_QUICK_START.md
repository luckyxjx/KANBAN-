# Deployment Quick Start (30 Minutes)

Fast-track deployment guide. Follow these steps in order.

---

## Step 1: Generate JWT Secret (1 min)

```bash
openssl rand -base64 32
```

Save the output.

---

## Step 2: Neon Database (3 min)

1. Go to [neon.tech](https://neon.tech) → Sign up with GitHub
2. Create project
3. Copy connection string (includes `?sslmode=require`)
4. Save it

---

## Step 3: Google OAuth (5 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID (Web application)
4. Add redirect URI: `http://localhost:3000/auth/google/callback` (update later)
5. Copy Client ID and Secret

---

## Step 4: Deploy Backend - Render (10 min)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. New → Web Service → Select your repo
3. Configure:
   - Root Directory: `backend`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && npm run start:prod`
4. Add Environment Variables:

```
DATABASE_URL = <paste-neon-url>
JWT_SECRET = <paste-generated-secret>
JWT_EXPIRES_IN = 1h
JWT_REFRESH_EXPIRES_IN = 7d
GOOGLE_CLIENT_ID = <paste-from-google>
GOOGLE_CLIENT_SECRET = <paste-from-google>
GOOGLE_CALLBACK_URL = https://kanban-backend-xxx.onrender.com/auth/google/callback
NODE_ENV = production
PORT = 3000
FRONTEND_URL = https://kanban-app-xxx.vercel.app
```

5. Create Web Service → Wait for deploy
6. Copy backend URL: `https://kanban-backend-xxx.onrender.com`
7. Update Google OAuth redirect URI with this URL

---

## Step 5: Deploy Frontend - Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Add New → Project → Select your repo
3. Configure:
   - Root Directory: `frontend`
   - Framework: Vite
4. Add Environment Variable:

```
VITE_API_URL = https://kanban-backend-xxx.onrender.com
```

5. Deploy → Wait
6. Copy frontend URL: `https://kanban-app-xxx.vercel.app`

---

## Step 6: Final Update (2 min)

1. Go back to Render
2. Update `FRONTEND_URL` to your Vercel URL
3. Manual Deploy → Redeploy

---

## Step 7: Test (5 min)

1. Visit your Vercel URL
2. Sign in with Google
3. Create workspace
4. Create board
5. Test drag-and-drop
6. Open in another tab to test real-time

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth not working | Check Google redirect URI matches Render URL exactly |
| CORS errors | Ensure FRONTEND_URL in Render matches Vercel URL |
| Database connection failed | Verify DATABASE_URL includes `?sslmode=require` |
| Backend sleeping | Normal on free tier - upgrade to Starter ($7/mo) for always-on |
| WebSocket not working | Check VITE_API_URL is correct, hard refresh browser |

---

## URLs to Save

After deployment:

- **Frontend**: `https://kanban-app-xxx.vercel.app`
- **Backend**: `https://kanban-backend-xxx.onrender.com`
- **Database**: `postgresql://...@neon.tech/...`

---

## Environment Variables Checklist

### Backend (Render)

- [ ] DATABASE_URL (from Neon)
- [ ] JWT_SECRET (generated)
- [ ] JWT_EXPIRES_IN = 1h
- [ ] JWT_REFRESH_EXPIRES_IN = 7d
- [ ] GOOGLE_CLIENT_ID (from Google)
- [ ] GOOGLE_CLIENT_SECRET (from Google)
- [ ] GOOGLE_CALLBACK_URL (Render URL)
- [ ] NODE_ENV = production
- [ ] PORT = 3000
- [ ] FRONTEND_URL (Vercel URL)

### Frontend (Vercel)

- [ ] VITE_API_URL (Render URL)

---

## Total Time: ~30 minutes
## Total Cost: $0 (all free tiers!)

---

## Next Steps

1. Monitor logs for first 24 hours
2. Test from different devices
3. Gather user feedback
4. Plan scaling if needed

---

**Status**: ✅ Ready to Deploy

