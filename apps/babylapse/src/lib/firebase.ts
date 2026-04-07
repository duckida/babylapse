import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

interface FirebaseConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function firebaseConfigFromEnv(): FirebaseConfig {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey)
        throw new Error("Missing Firebase admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");

    return {
        projectId,
        clientEmail,
        privateKey
    };
}

function firebaseAdminApp(): App {
    const existing = getApps()[0];
    if (existing)
        return existing;

    const config = firebaseConfigFromEnv();
    return initializeApp({
        credential: cert(config)
    });
}

export function firestore() {
    return getFirestore(firebaseAdminApp());
}
