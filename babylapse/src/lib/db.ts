import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let firestoreInstance: Firestore | null = null

function initFirebase(): App {
  if (getApps().length > 0) {
    return getApps()[0]!
  }

  const firebaseConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
    throw new Error(
      'Missing Firebase configuration. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    )
  }

  return initializeApp({
    credential: cert({
      projectId: firebaseConfig.projectId,
      clientEmail: firebaseConfig.clientEmail,
      privateKey: firebaseConfig.privateKey,
    }),
  })
}

export function getDb(): Firestore {
  if (!firestoreInstance) {
    const app = initFirebase()
    firestoreInstance = getFirestore(app)
    firestoreInstance.settings({ ignoreUndefinedProperties: true })
  }
  return firestoreInstance
}

export async function closeDb() {
  // Firestore doesn't require explicit cleanup in serverless environments
  firestoreInstance = null
}
