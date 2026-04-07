# babylapse

A backwards-compatible Lapse clone with Hackatime integration, designed for single Vercel instance deployment using **Firestore**, **Vercel Blob Storage**, and **Upstash Redis**.

## Features

- 🔥 **Firestore Database** - Serverless NoSQL database from Firebase
- 📦 **Vercel Blob Storage** - Simple file storage for timelapses and thumbnails
- ⚡ **Upstash Redis** - Redis-compatible caching layer (via Vercel Marketplace)
- 🔐 **Hackatime Integration** - Full OAuth2 integration with Hackatime
- 🎬 **Timelapse Support** - Create, upload, and share coding timelapses
- 💬 **Comments** - Comment on timelapses
- 🔑 **OAuth2 Server** - Built-in OAuth2 provider for service clients

## Prerequisites

1. **Firebase Project** - Create a project at [Firebase Console](https://console.firebase.google.com)
2. **Vercel Account** - Sign up at [Vercel](https://vercel.com)
3. **Upstash Redis** - Create via [Vercel Marketplace](https://vercel.com/marketplace/upstash) or [Upstash Console](https://console.upstash.io)
4. **Node.js 18+** - Required for Next.js

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Enable Firestore Database:
   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (or set up security rules later)
4. Generate a service account key:
   - Go to "Project Settings" → "Service accounts"
   - Click "Generate new private key"
   - Save the JSON file securely

### 2. Vercel Setup

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Enable Vercel Blob Storage:
   - Via Dashboard: Go to Storage → Create Database → Blob
   - Or via CLI: `vercel blob create`

### 3. Upstash Redis Setup

**Note:** Vercel KV has been sunset. Use Upstash Redis instead.

**Option A: Via Vercel Marketplace (Recommended)**
1. Go to https://vercel.com/marketplace/upstash
2. Click "Connect" and select your Vercel project
3. Environment variables will be automatically added

**Option B: Direct Upstash Setup**
1. Go to https://console.upstash.io
2. Click "Create Database"
3. Choose a region close to your users
4. Copy the REST API credentials

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

#### Firebase (Firestore)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email from Firebase
- `FIREBASE_PRIVATE_KEY` - Service account private key from Firebase

#### Vercel Blob Storage
- `BLOB_READ_WRITE_TOKEN` - Get from Vercel dashboard or run `vercel blob get-token`

#### Upstash Redis
- `UPSTASH_REDIS_REST_URL` - Provided when you create an Upstash database
- `UPSTASH_REDIS_REST_TOKEN` - Provided when you create an Upstash database

#### Application
- `JWT_SECRET_ACCESS_TOKENS` - Random secret for JWT tokens
- `ENCRYPTION_KEY` - 32-character key for timelapse encryption
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., `https://your-app.vercel.app`)

#### Hackatime (Optional)
- `HACKATIME_CLIENT_ID` - Register your app with Hackatime
- `HACKATIME_CLIENT_SECRET` - Client secret from Hackatime

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Deployment to Vercel

1. Push your code to GitHub/GitLab/Bitbucket

2. Deploy to Vercel:
   ```bash
   vercel deploy --prod
   ```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings → "Environment Variables"
   - Add all required variables from `.env.example`
   - Or connect Upstash Redis via Vercel Marketplace for automatic configuration

4. Redeploy after setting environment variables

## Project Structure

```
babylapse/
├── src/
│   ├── lib/
│   │   ├── db.ts           # Firestore database connection
│   │   ├── redis.ts        # Upstash Redis connection
│   │   ├── storage.ts      # Vercel Blob storage utilities
│   │   └── firestore.ts    # Firestore data models and operations
│   ├── api/                # API routes
│   ├── app/                # Next.js App Router pages
│   └── jobs/               # Background job handlers
├── package.json
├── next.config.js
└── .env.example
```

## API Endpoints

The app provides the following main API endpoints:

- `POST /api/auth/*` - Authentication endpoints
- `GET/POST /api/timelapses` - Timelapse CRUD operations
- `GET/POST /api/comments` - Comment operations
- `GET/POST /api/hackatime/*` - Hackatime integration
- `POST /api/upload` - File upload endpoint
- `OAUTH2 endpoints` - OAuth2 server for service clients

## Backwards Compatibility

This app maintains full backwards compatibility with the original Lapse:

- Same API structure and response formats
- Compatible data models
- Hackatime integration preserved
- OAuth2 flow maintained

## Security Considerations

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **Use strong secrets** - Generate random strings for JWT and encryption keys
3. **Set up Firestore security rules** - Don't leave your database in test mode for production
4. **Enable HTTPS** - Vercel provides this automatically

## Troubleshooting

### Firebase Connection Issues
- Verify your service account key is correct
- Check that Firestore is enabled in your Firebase project
- Ensure the service account has proper permissions

### Vercel Blob Issues
- Make sure you've enabled Blob storage in your Vercel project
- Verify environment variables are set correctly
- Check Vercel dashboard for any service errors

### Upstash Redis Issues
- Verify your Upstash database exists and is accessible
- Check that REST API credentials are correct
- Ensure the database region matches your Vercel deployment region
- Review Upstash console for usage metrics and rate limiting

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
