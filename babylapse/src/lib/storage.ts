import { put, del, list, head } from '@vercel/blob'

export interface UploadResult {
  url: string
  pathname: string
  contentType: string
  size: number
}

export async function uploadFile(
  pathname: string,
  body: Blob | Buffer | ArrayBuffer | string,
  options?: {
    contentType?: string
    addRandomSuffix?: boolean
  }
): Promise<UploadResult> {
  const result = await put(pathname, body, {
    access: 'public',
    addRandomSuffix: options?.addRandomSuffix ?? false,
    contentType: options?.contentType,
  })

  return {
    url: result.url,
    pathname: result.pathname,
    contentType: result.contentType,
    size: result.size,
  }
}

export async function deleteFile(urlOrPathname: string): Promise<void> {
  await del(urlOrPathname)
}

export async function getFileMetadata(urlOrPathname: string): Promise<{
  url: string
  pathname: string
  contentType: string
  size: number
  uploadedAt: Date
} | null> {
  try {
    const metadata = await head(urlOrPathname)
    if (!metadata) {
      return null
    }
    return {
      url: metadata.url,
      pathname: metadata.pathname,
      contentType: metadata.contentType,
      size: metadata.size,
      uploadedAt: metadata.uploadedAt,
    }
  } catch {
    return null
  }
}

export async function listFiles(prefix?: string): Promise<
  Array<{
    url: string
    pathname: string
    contentType: string
    size: number
    uploadedAt: Date
  }>
> {
  const result = await list({ prefix })
  return result.blobs.map((blob) => ({
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  }))
}
