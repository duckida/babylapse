# Babylapse

Babylapse is a single-instance deployment target for Lapse-compatible behavior, designed to run locally as one Next.js app with Firebase + local file storage.

## What was carried over from Lapse

- Hackatime project fetching behavior was preserved, including sorting by `most_recent_heartbeat` and mapping to `{ name, totalSeconds }`.
- Timelapse filtering semantics for Hackatime project views were preserved:
    - `myTimelapsesForProject`: includes `PUBLIC` and `UNLISTED`.
    - `timelapsesForProject`: includes `PUBLIC`, and also `UNLISTED` for privileged callers.
- Hackatime sync now pushes one heartbeat per snapshot using the same heartbeat format used in Lapse (`heartbeats.bulk`).
- API input validation remains strongly typed with Zod.

## Required services

- **Node.js + pnpm** for running Next.js locally.
- **Firebase Firestore** for timelapse metadata.
- **Local filesystem directory** for uploaded media files.

## Environment variables

Create `apps/babylapse/.env.local` with:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (use escaped `\n` newlines)
- `BABYLAPSE_UPLOAD_DIR` (optional, default: `<repo>/data/uploads`)
- `BABYLAPSE_APP_URL` (default: `http://localhost:3000`)
- `HACKATIME_URL` (default: `https://hackatime.hackclub.com`)
- `HACKATIME_CLIENT_ID`
- `HACKATIME_CLIENT_SECRET` (optional; used if your OAuth app requires it)
- `HACKATIME_REDIRECT_URI` (default: `http://localhost:3000/auth/callback`)

## Local setup

1. Install deps from repo root:
   - `pnpm install --filter @lapse/babylapse...`
2. Create `apps/babylapse/.env.local`.
3. Start app:
   - `pnpm --filter @lapse/babylapse dev`

## Endpoints

- `GET /api/v1/hackatime/projects`
    - Expects `Authorization: Bearer <hackatime_oauth_access_token>`
    - Returns `projects` array with Lapse-compatible summary objects.
- `GET /api/v1/hackatime/timelapses`
    - `mode=mine&ownerId=...&projectKey=...`
    - `hackatimeUserId=...&projectKey=...&privileged=true|false`
- `POST /api/v1/hackatime/timelapses`
    - Creates a Firestore `timelapses` record.
    - If `hackatimeAccessToken` is provided, synchronizes `snapshots` to Hackatime by pushing heartbeats.
- `POST /api/v1/storage/upload`
    - Saves binary payload to local disk.
    - Requires `x-file-name` header.

## Firebase setup

1. Create Firebase project.
2. Create Firestore database in production mode.
3. Create a service account with Firestore access.
4. Copy service account values into `.env.local`.
5. Create Firestore composite indexes as prompted for query combinations:
   - `ownerId + hackatimeProject + createdAt desc`
   - `hackatimeUserId + hackatimeProject + createdAt desc`

## OAuth callback

- `GET /auth/callback` now exchanges `code` for tokens via Hackatime OAuth, fetches the authenticated Hackatime user ID, stores tokens in Firestore (`hackatimeTokens`), and then redirects to `/` with a status query param.
