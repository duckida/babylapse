import { firestore } from "@/lib/firebase";

export type TimelapseVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export interface TimelapseRecord {
    id: string;
    ownerId: string;
    hackatimeUserId: string;
    hackatimeProject: string;
    visibility: TimelapseVisibility;
    title: string;
    createdAt: string;
    snapshots?: number[];
    videoUrl?: string;
    thumbnailUrl?: string;
    hackatimeSyncStatus?: "PENDING" | "SYNCED" | "FAILED";
    hackatimeSyncError?: string;
}

const COLLECTION_NAME = "timelapses";

function mapDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): TimelapseRecord {
    const data = doc.data() as Omit<TimelapseRecord, "id">;
    return {
        id: doc.id,
        ...data
    };
}

export async function createTimelapse(record: Omit<TimelapseRecord, "id">): Promise<TimelapseRecord> {
    const collection = firestore().collection(COLLECTION_NAME);
    const created = await collection.add(record);
    const stored = await created.get();

    return mapDoc(stored as FirebaseFirestore.QueryDocumentSnapshot);
}

export async function updateTimelapse(id: string, changes: Partial<Omit<TimelapseRecord, "id">>): Promise<TimelapseRecord> {
    const ref = firestore().collection(COLLECTION_NAME).doc(id);
    await ref.set(changes, { merge: true });
    const stored = await ref.get();

    if (!stored.exists)
        throw new Error(`Timelapse ${id} no longer exists.`);

    return mapDoc(stored as FirebaseFirestore.QueryDocumentSnapshot);
}

export async function myTimelapsesForProject(ownerId: string, projectKey: string): Promise<TimelapseRecord[]> {
    const snapshot = await firestore()
        .collection(COLLECTION_NAME)
        .where("ownerId", "==", ownerId)
        .where("hackatimeProject", "==", projectKey)
        .orderBy("createdAt", "desc")
        .get();

    return snapshot.docs
        .map(mapDoc)
        .filter(x => x.visibility === "PUBLIC" || x.visibility === "UNLISTED");
}

export async function timelapsesForProject(hackatimeUserId: string, projectKey: string, privileged: boolean): Promise<TimelapseRecord[]> {
    const snapshot = await firestore()
        .collection(COLLECTION_NAME)
        .where("hackatimeUserId", "==", hackatimeUserId)
        .where("hackatimeProject", "==", projectKey)
        .orderBy("createdAt", "desc")
        .get();

    return snapshot.docs
        .map(mapDoc)
        .filter(x => x.visibility === "PUBLIC" || (privileged && x.visibility === "UNLISTED"));
}
