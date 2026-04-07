# Setup Guide for babylapse

This guide will help you set up babylapse on Vercel with Firebase Firestore, Vercel Blob Storage, and Upstash Redis.

## Quick Start Checklist

### 1. Firebase Setup (5 minutes)

1. **Create a Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Follow the wizard to create your project

2. **Enable Firestore Database**
   - In Firebase Console, go to "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (you can secure it later)
   - Select a location close to your users

3. **Generate Service Account Key**
   - Go to "Project Settings" (gear icon)
   - Click "Service accounts" tab
   - Click "Generate new private key"
   - Save the downloaded JSON file securely
   - Extract these values:
     - `project_id` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY`

### 2. Vercel Setup (5 minutes)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Initialize Your Project**
   ```bash
   cd babylapse
   vercel link
   ```

4. **Enable Vercel Blob Storage**
   - Go to your Vercel dashboard
   - Navigate to Storage → Create Database → Blob
   - Or use CLI: `vercel blob create`
   - This will give you a `BLOB_READ_WRITE_TOKEN`

### 3. Upstash Redis Setup (3 minutes)

Since Vercel KV has been sunset, we use Upstash Redis (available via Vercel Marketplace):

1. **Create Upstash Redis via Vercel Marketplace**
   - Go to https://vercel.com/marketplace/upstash
   - Click "Connect" and select your Vercel project
   - A new Redis database will be automatically provisioned
   - Environment variables will be automatically added to your project

2. **Or Create Upstash Redis Directly**
   - Go to https://console.upstash.io
   - Click "Create Database"
   - Choose a region close to your users
   - Copy the REST API credentials:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

### 4. Configure Environment Variables

Create a `.env.local` file or set these in Vercel dashboard:

```bash
# Firebase (from your service account JSON)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-sa@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Vercel Blob (from Vercel Storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Upstash Redis (from Upstash console or Vercel Marketplace)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Application Secrets
JWT_SECRET_ACCESS_TOKENS=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Hackatime (optional - get from Hackatime developer portal)
HACKATIME_CLIENT_ID=your-client-id
HACKATIME_CLIENT_SECRET=your-client-secret
```

### 5. Deploy to Vercel

```bash
# Set all environment variables (or use Vercel UI)
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add JWT_SECRET_ACCESS_TOKENS
vercel env add ENCRYPTION_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Deploy
vercel deploy --prod
```

### 6. Verify Deployment

1. Visit your deployed URL
2. Check `/api/health` endpoint
3. Test file upload functionality
4. Verify Firestore connection
5. Test Redis operations (sessions, caching)

## Troubleshooting

### Firebase Connection Errors
- Ensure Firestore is enabled in your Firebase project
- Check that your service account has proper permissions
- Verify the private key format (should include newlines as `\n`)

### Vercel Blob Errors
- Make sure Blob storage is enabled in Vercel dashboard
- Check your token is valid in Storage settings
- Review Vercel Function logs for detailed errors

### Upstash Redis Errors
- Verify your Redis database exists: check Upstash console
- Ensure REST API credentials are correct
- Check region proximity (should match your Vercel deployment region)
- Review Upstash usage metrics for rate limiting issues

### Build Failures
- Run `npm install` locally first
- Check Node.js version (18+ required)
- Review build logs in Vercel dashboard

## Security Best Practices

1. **Never commit `.env.local`** to git
2. **Use production mode** in Firebase when ready
3. **Set up Firestore security rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
4. **Rotate secrets regularly**
5. **Enable HTTPS** (automatic with Vercel)
6. **Configure CORS** for client-side access if needed

## Architecture Overview

- **Database**: Firebase Firestore (user data, timelapses, comments, OAuth grants)
- **File Storage**: Vercel Blob (video files, thumbnails, snapshots)
- **Cache/Sessions**: Upstash Redis (session tokens, rate limiting, temporary data)
- **Compute**: Vercel Serverless Functions (API routes, background jobs)

## Next Steps

- Customize the app branding
- Set up custom domain in Vercel
- Configure OAuth2 with Hackatime
- Add analytics and monitoring
- Set up CI/CD pipeline
- Configure automated backups for Firestore

For more help, check the main README.md or open an issue.
