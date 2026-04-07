import { firestore } from "@/lib/firebase";

export interface HackatimeTokenRecord {
    ownerId: string;
    hackatimeUserId: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number | null;
    createdAt: number;
    updatedAt: number;
}

const COLLECTION_NAME = "hackatimeTokens";

export async function saveHackatimeTokens(record: Omit<HackatimeTokenRecord, "createdAt" | "updatedAt">) {
    const now = Date.now();
    const ref = firestore().collection(COLLECTION_NAME).doc(record.ownerId);

    await ref.set({
        ...record,
        createdAt: now,
        updatedAt: now
    }, { merge: true });
}
