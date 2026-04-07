import { createHash, randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

function appUrl() {
    return process.env.BABYLAPSE_APP_URL ?? "http://localhost:3000";
}

function callbackPath() {
    return process.env.HACKATIME_REDIRECT_URI ?? `${appUrl()}/auth/callback`;
}

function hackatimeBaseUrl() {
    return process.env.HACKATIME_URL ?? "https://hackatime.hackclub.com";
}

function toBase64Url(value: Buffer) {
    return value.toString("base64url");
}

export async function GET(request: NextRequest) {
    const clientId = process.env.HACKATIME_CLIENT_ID;
    if (!clientId)
        return NextResponse.json({ error: "Missing HACKATIME_CLIENT_ID" }, { status: 500 });

    const state = request.nextUrl.searchParams.get("state") ?? randomBytes(16).toString("hex");
    const codeVerifier = toBase64Url(randomBytes(32));
    const codeChallenge = toBase64Url(createHash("sha256").update(codeVerifier).digest());

    const authorizeUrl = new URL(`${hackatimeBaseUrl()}/oauth/authorize`);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "profile");
    authorizeUrl.searchParams.set("redirect_uri", callbackPath());
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set("hkt_code_verifier", codeVerifier, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env["NODE_ENV"] === "production",
        path: "/",
        maxAge: 600
    });

    return response;
}
