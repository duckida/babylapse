import { NextRequest, NextResponse } from "next/server";

import { HackatimeOAuthApi, sortAndMapProjects } from "@/lib/hackatime";

function accessTokenFromRequest(req: NextRequest): string | null {
    const auth = req.headers.get("authorization");
    if (!auth)
        return null;

    const [scheme, token] = auth.split(" ");
    if (scheme !== "Bearer" || !token)
        return null;

    return token;
}

export async function GET(req: NextRequest) {
    const token = accessTokenFromRequest(req);

    if (!token)
        return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });

    const oauthApi = new HackatimeOAuthApi(token);

    try {
        const projects = await oauthApi.getProjects();
        return NextResponse.json({ projects: sortAndMapProjects(projects) });
    }
    catch {
        return NextResponse.json({ projects: [] });
    }
}
