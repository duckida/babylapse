import { Firestore, DocumentReference, QuerySnapshot, Timestamp } from 'firebase-admin/firestore'
import { nanoid } from 'nanoid'

// Type definitions matching the original Prisma schema
export type PermissionLevel = 'USER' | 'ADMIN' | 'ROOT'
export type TimelapseVisibility = 'UNLISTED' | 'PUBLIC' | 'FAILED_PROCESSING'
export type VideoContainerKind = 'WEBM' | 'MP4'
export type ServiceClientTrustLevel = 'UNTRUSTED' | 'TRUSTED'

export interface User {
  id: string
  email: string
  createdAt: Date
  permissionLevel: PermissionLevel
  handle: string
  displayName: string
  profilePictureUrl: string
  bio: string
  urls: string[]
  hackatimeId?: string | null
  hackatimeAccessToken?: string | null
  hackatimeRefreshToken?: string | null
  slackId?: string | null
  lastHeartbeat: Date
  lastHandleChangeAt?: Date | null
}

export interface KnownDevice {
  id: string
  name: string
  ownerId: string
  draftTimelapses: DraftTimelapse[]
  legacyTimelapses: LegacyUnpublishedTimelapse[]
}

export interface LegacyUnpublishedTimelapse {
  id: string
  name: string
  description: string
  primarySession: string
  thumbnailS3Key: string
  snapshots: Date[]
  isMigrated: boolean
  deviceId: string
  ownerId: string
}

export interface DraftTimelapse {
  id: string
  createdAt: Date
  name: string | null
  description: string
  editList: any[]
  sessions: string[]
  thumbnailKey: string
  snapshots: Date[]
  iv: string
  associatedTimelapseId: string | null
  deviceId: string
  ownerId: string
}

export interface Timelapse {
  id: string
  createdAt: Date
  s3Key: string | null
  thumbnailS3Key: string | null
  hackatimeProject: string | null
  name: string
  description: string
  visibility: TimelapseVisibility
  duration: number
  snapshots: Date[]
  associatedJobId: string | null
  sourceDraftId: string | null
  ownerId: string
}

export interface Comment {
  id: string
  authorId: string
  timelapseId: string
  content: string
  createdAt: Date
}

export interface ServiceClient {
  id: string
  clientId: string
  clientSecretHash: string
  name: string
  description: string
  homepageUrl: string
  iconUrl: string
  scopes: string[]
  redirectUris: string[]
  trustLevel: ServiceClientTrustLevel
  createdByUserId: string | null
  createdAt: Date
  updatedAt: Date
  lastUsedAt: Date | null
  revokedAt: Date | null
}

export interface ServiceTokenAudit {
  id: string
  serviceClientId: string
  userId: string
  scope: string
  ip: string | null
  userAgent: string | null
  createdAt: Date
}

export interface ServiceGrant {
  id: string
  serviceClientId: string
  userId: string
  scopes: string[]
  createdAt: Date
  updatedAt: Date
  revokedAt: Date | null
  lastUsedAt: Date | null
}

export interface ProgramKey {
  id: string
  name: string
  keyHash: string
  keyPrefix: string
  scopes: string[]
  createdByUserId: string
  createdAt: Date
  lastUsedAt: Date | null
  revokedAt: Date | null
  expiresAt: Date
}

export interface ProgramKeyAudit {
  id: string
  programKeyId: string
  action: string
  endpoint: string | null
  ip: string | null
  userAgent: string | null
  createdAt: Date
}

export interface ServiceClientReview {
  id: string
  serviceClientId: string
  reviewedByUserId: string
  status: ServiceClientTrustLevel
  notes: string
  createdAt: Date
}

// Collection names
export const COLLECTIONS = {
  users: 'users',
  devices: 'devices',
  legacyTimelapses: 'legacy_timelapses',
  draftTimelapses: 'draft_timelapses',
  timelapses: 'timelapses',
  comments: 'comments',
  serviceClients: 'service_clients',
  serviceTokenAudits: 'service_token_audits',
  serviceGrants: 'service_grants',
  programKeys: 'program_keys',
  programKeyAudits: 'program_key_audits',
  serviceClientReviews: 'service_client_reviews',
} as const

// Helper functions for converting between Firestore Timestamp and Date
export function toFirestoreDate(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}

export function fromFirestoreDate(timestamp: Timestamp): Date {
  return timestamp.toDate()
}

// User operations
export async function createUser(db: Firestore, user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const id = nanoid(12)
  const newUser: User = {
    ...user,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.users).doc(id).set(newUser)
  return newUser
}

export async function getUserById(db: Firestore, id: string): Promise<User | null> {
  const doc = await db.collection(COLLECTIONS.users).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    lastHeartbeat: data.lastHeartbeat?.toDate(),
    lastHandleChangeAt: data.lastHandleChangeAt?.toDate(),
  } as User
}

export async function getUserByHandle(db: Firestore, handle: string): Promise<User | null> {
  const snapshot = await db.collection(COLLECTIONS.users).where('handle', '==', handle).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    lastHeartbeat: data.lastHeartbeat?.toDate(),
    lastHandleChangeAt: data.lastHandleChangeAt?.toDate(),
  } as User
}

export async function getUserByEmail(db: Firestore, email: string): Promise<User | null> {
  const snapshot = await db.collection(COLLECTIONS.users).where('email', '==', email).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    lastHeartbeat: data.lastHeartbeat?.toDate(),
    lastHandleChangeAt: data.lastHandleChangeAt?.toDate(),
  } as User
}

export async function updateUser(db: Firestore, id: string, updates: Partial<User>): Promise<void> {
  await db.collection(COLLECTIONS.users).doc(id).update(updates)
}

export async function deleteUser(db: Firestore, id: string): Promise<void> {
  await db.collection(COLLECTIONS.users).doc(id).delete()
}

// Timelapse operations
export async function createTimelapse(db: Firestore, timelapse: Omit<Timelapse, 'id' | 'createdAt'>): Promise<Timelapse> {
  const id = nanoid(12)
  const newTimelapse: Timelapse = {
    ...timelapse,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.timelapses).doc(id).set(newTimelapse)
  return newTimelapse
}

export async function getTimelapseById(db: Firestore, id: string): Promise<Timelapse | null> {
  const doc = await db.collection(COLLECTIONS.timelapses).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    snapshots: data.snapshots?.map((s: Timestamp) => s.toDate()) || [],
  } as Timelapse
}

export async function getTimelapsesByOwner(db: Firestore, ownerId: string): Promise<Timelapse[]> {
  const snapshot = await db.collection(COLLECTIONS.timelapses).where('ownerId', '==', ownerId).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      snapshots: data.snapshots?.map((s: Timestamp) => s.toDate()) || [],
    } as Timelapse
  })
}

export async function updateTimelapse(db: Firestore, id: string, updates: Partial<Timelapse>): Promise<void> {
  await db.collection(COLLECTIONS.timelapses).doc(id).update(updates)
}

export async function deleteTimelapse(db: Firestore, id: string): Promise<void> {
  await db.collection(COLLECTIONS.timelapses).doc(id).delete()
}

// Draft Timelapse operations
export async function createDraftTimelapse(db: Firestore, draft: Omit<DraftTimelapse, 'id' | 'createdAt'>): Promise<DraftTimelapse> {
  const id = nanoid(12)
  const newDraft: DraftTimelapse = {
    ...draft,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.draftTimelapses).doc(id).set(newDraft)
  return newDraft
}

export async function getDraftTimelapseById(db: Firestore, id: string): Promise<DraftTimelapse | null> {
  const doc = await db.collection(COLLECTIONS.draftTimelapses).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    snapshots: data.snapshots?.map((s: Timestamp) => s.toDate()) || [],
  } as DraftTimelapse
}

export async function updateDraftTimelapse(db: Firestore, id: string, updates: Partial<DraftTimelapse>): Promise<void> {
  await db.collection(COLLECTIONS.draftTimelapses).doc(id).update(updates)
}

export async function deleteDraftTimelapse(db: Firestore, id: string): Promise<void> {
  await db.collection(COLLECTIONS.draftTimelapses).doc(id).delete()
}

// Comment operations
export async function createComment(db: Firestore, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
  const id = nanoid(12)
  const newComment: Comment = {
    ...comment,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.comments).doc(id).set(newComment)
  return newComment
}

export async function getCommentsByTimelapse(db: Firestore, timelapseId: string): Promise<Comment[]> {
  const snapshot = await db.collection(COLLECTIONS.comments).where('timelapseId', '==', timelapseId).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Comment
  })
}

export async function deleteComment(db: Firestore, id: string): Promise<void> {
  await db.collection(COLLECTIONS.comments).doc(id).delete()
}

// Device operations
export async function createDevice(db: Firestore, device: Omit<KnownDevice, 'draftTimelapses' | 'legacyTimelapses'>): Promise<KnownDevice> {
  const id = nanoid()
  const newDevice: KnownDevice = {
    ...device,
    id,
    draftTimelapses: [],
    legacyTimelapses: [],
  }
  await db.collection(COLLECTIONS.devices).doc(id).set(device)
  return newDevice
}

export async function getDeviceById(db: Firestore, id: string): Promise<KnownDevice | null> {
  const doc = await db.collection(COLLECTIONS.devices).doc(id).get()
  if (!doc.exists) return null
  return doc.data() as KnownDevice
}

export async function getDevicesByOwner(db: Firestore, ownerId: string): Promise<KnownDevice[]> {
  const snapshot = await db.collection(COLLECTIONS.devices).where('ownerId', '==', ownerId).get()
  return snapshot.docs.map((doc) => doc.data() as KnownDevice)
}

// Legacy Timelapse operations
export async function createLegacyTimelapse(db: Firestore, legacy: Omit<LegacyUnpublishedTimelapse, 'isMigrated'>): Promise<LegacyUnpublishedTimelapse> {
  const newLegacy: LegacyUnpublishedTimelapse = {
    ...legacy,
    isMigrated: false,
  }
  await db.collection(COLLECTIONS.legacyTimelapses).doc(legacy.id).set(newLegacy)
  return newLegacy
}

export async function getLegacyTimelapseById(db: Firestore, id: string): Promise<LegacyUnpublishedTimelapse | null> {
  const doc = await db.collection(COLLECTIONS.legacyTimelapses).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    ...data,
    snapshots: data.snapshots?.map((s: Timestamp) => s.toDate()) || [],
  } as LegacyUnpublishedTimelapse
}

export async function updateLegacyTimelapse(db: Firestore, id: string, updates: Partial<LegacyUnpublishedTimelapse>): Promise<void> {
  await db.collection(COLLECTIONS.legacyTimelapses).doc(id).update(updates)
}

// Service Client operations
export async function createServiceClient(db: Firestore, client: Omit<ServiceClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceClient> {
  const id = nanoid()
  const now = new Date()
  const newClient: ServiceClient = {
    ...client,
    id,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.serviceClients).doc(id).set(newClient)
  return newClient
}

export async function getServiceClientByClientId(db: Firestore, clientId: string): Promise<ServiceClient | null> {
  const snapshot = await db.collection(COLLECTIONS.serviceClients).where('clientId', '==', clientId).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    lastUsedAt: data.lastUsedAt?.toDate(),
    revokedAt: data.revokedAt?.toDate(),
  } as ServiceClient
}

export async function updateServiceClient(db: Firestore, id: string, updates: Partial<ServiceClient>): Promise<void> {
  await db.collection(COLLECTIONS.serviceClients).doc(id).update({
    ...updates,
    updatedAt: new Date(),
  })
}

// Service Grant operations
export async function createServiceGrant(db: Firestore, grant: Omit<ServiceGrant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceGrant> {
  const id = nanoid()
  const now = new Date()
  const newGrant: ServiceGrant = {
    ...grant,
    id,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection(COLLECTIONS.serviceGrants).doc(id).set(newGrant)
  return newGrant
}

export async function getServiceGrant(db: Firestore, serviceClientId: string, userId: string): Promise<ServiceGrant | null> {
  const snapshot = await db.collection(COLLECTIONS.serviceGrants)
    .where('serviceClientId', '==', serviceClientId)
    .where('userId', '==', userId)
    .limit(1)
    .get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    revokedAt: data.revokedAt?.toDate(),
    lastUsedAt: data.lastUsedAt?.toDate(),
  } as ServiceGrant
}

export async function updateServiceGrant(db: Firestore, id: string, updates: Partial<ServiceGrant>): Promise<void> {
  await db.collection(COLLECTIONS.serviceGrants).doc(id).update({
    ...updates,
    updatedAt: new Date(),
  })
}

// Program Key operations
export async function createProgramKey(db: Firestore, key: Omit<ProgramKey, 'id' | 'createdAt'>): Promise<ProgramKey> {
  const id = nanoid()
  const newKey: ProgramKey = {
    ...key,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.programKeys).doc(id).set(newKey)
  return newKey
}

export async function getProgramKeyByKeyPrefix(db: Firestore, keyPrefix: string): Promise<ProgramKey | null> {
  const snapshot = await db.collection(COLLECTIONS.programKeys).where('keyPrefix', '==', keyPrefix).limit(1).get()
  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    lastUsedAt: data.lastUsedAt?.toDate(),
    revokedAt: data.revokedAt?.toDate(),
    expiresAt: data.expiresAt?.toDate(),
  } as ProgramKey
}

export async function updateProgramKey(db: Firestore, id: string, updates: Partial<ProgramKey>): Promise<void> {
  await db.collection(COLLECTIONS.programKeys).doc(id).update(updates)
}

// Program Key Audit operations
export async function createProgramKeyAudit(db: Firestore, audit: Omit<ProgramKeyAudit, 'id' | 'createdAt'>): Promise<ProgramKeyAudit> {
  const id = nanoid()
  const newAudit: ProgramKeyAudit = {
    ...audit,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.programKeyAudits).doc(id).set(newAudit)
  return newAudit
}

// Service Token Audit operations
export async function createServiceTokenAudit(db: Firestore, audit: Omit<ServiceTokenAudit, 'id' | 'createdAt'>): Promise<ServiceTokenAudit> {
  const id = nanoid()
  const newAudit: ServiceTokenAudit = {
    ...audit,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.serviceTokenAudits).doc(id).set(newAudit)
  return newAudit
}

// Service Client Review operations
export async function createServiceClientReview(db: Firestore, review: Omit<ServiceClientReview, 'id' | 'createdAt'>): Promise<ServiceClientReview> {
  const id = nanoid()
  const newReview: ServiceClientReview = {
    ...review,
    id,
    createdAt: new Date(),
  }
  await db.collection(COLLECTIONS.serviceClientReviews).doc(id).set(newReview)
  return newReview
}
