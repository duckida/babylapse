import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 512 * 1024 * 1024;

function toSafeFilename(input: string): string {
    return input.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

function uploadRoot() {
    return process.env.BABYLAPSE_UPLOAD_DIR ?? path.resolve(process.cwd(), "data/uploads");
}

export async function POST(req: NextRequest) {
    const fileName = req.headers.get("x-file-name");
    if (!fileName)
        return NextResponse.json({ error: "Missing x-file-name header" }, { status: 400 });

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BYTES)
        return NextResponse.json({ error: "File too large" }, { status: 413 });

    const bytes = await req.arrayBuffer();
    if (bytes.byteLength === 0)
        return NextResponse.json({ error: "Missing request body" }, { status: 400 });

    const storageRoot = uploadRoot();
    await mkdir(storageRoot, { recursive: true });

    const storedName = `${Date.now()}-${toSafeFilename(fileName)}`;
    const fullPath = path.join(storageRoot, storedName);
    await writeFile(fullPath, Buffer.from(bytes));

    return NextResponse.json({
        fileName: storedName,
        originalFileName: fileName,
        bytes: bytes.byteLength,
        localPath: fullPath
    });
}
