import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createTimelapse, myTimelapsesForProject, timelapsesForProject, updateTimelapse } from "@/lib/timelapse-store";
import { syncTimelapseSnapshotsWithHackatime } from "@/lib/hackatime";

const myTimelapsesSchema = z.object({
    ownerId: z.string().min(1),
    projectKey: z.string().min(1)
});

const userTimelapsesSchema = z.object({
    hackatimeUserId: z.string().min(1),
    projectKey: z.string().min(1),
    privileged: z.coerce.boolean().default(false)
});

const createTimelapseSchema = z.object({
    ownerId: z.string().min(1),
    hackatimeUserId: z.string().min(1),
    hackatimeProject: z.string().min(1),
    visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
    title: z.string().min(1),
    createdAt: z.string().min(1),
    snapshots: z.array(z.number()).default([]),
    hackatimeAccessToken: z.string().min(1).optional(),
    videoUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional()
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    if (mode === "mine") {
        const parsed = myTimelapsesSchema.safeParse({
            ownerId: searchParams.get("ownerId"),
            projectKey: searchParams.get("projectKey")
        });

        if (!parsed.success)
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

        const timelapses = await myTimelapsesForProject(parsed.data.ownerId, parsed.data.projectKey);
        return NextResponse.json({ count: timelapses.length, timelapses });
    }

    const parsed = userTimelapsesSchema.safeParse({
        hackatimeUserId: searchParams.get("hackatimeUserId"),
        projectKey: searchParams.get("projectKey"),
        privileged: searchParams.get("privileged")
    });

    if (!parsed.success)
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const timelapses = await timelapsesForProject(parsed.data.hackatimeUserId, parsed.data.projectKey, parsed.data.privileged);
    return NextResponse.json({ count: timelapses.length, timelapses });
}

export async function POST(req: NextRequest) {
    const parsed = createTimelapseSchema.safeParse(await req.json());

    if (!parsed.success)
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { hackatimeAccessToken, ...timelapseData } = parsed.data;

    const created = await createTimelapse({
        ...timelapseData,
        hackatimeSyncStatus: hackatimeAccessToken ? "PENDING" : undefined
    });

    if (!hackatimeAccessToken)
        return NextResponse.json({ timelapse: created, hackatimeSync: null }, { status: 201 });

    try {
        const syncResult = await syncTimelapseSnapshotsWithHackatime({
            timelapseId: created.id,
            timelapseName: created.title,
            hackatimeProject: created.hackatimeProject,
            snapshots: created.snapshots ?? [],
            hackatimeAccessToken
        });

        const updated = await updateTimelapse(created.id, {
            hackatimeSyncStatus: "SYNCED",
            hackatimeSyncError: undefined
        });

        return NextResponse.json({ timelapse: updated, hackatimeSync: syncResult }, { status: 201 });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Hackatime sync error";
        const updated = await updateTimelapse(created.id, {
            hackatimeSyncStatus: "FAILED",
            hackatimeSyncError: message
        });

        return NextResponse.json({
            timelapse: updated,
            hackatimeSync: {
                error: message
            }
        }, { status: 202 });
    }
}
