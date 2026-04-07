import { NextRequest, NextResponse } from "next/server";

import { HackatimeOAuthApi, exchangeOAuthCodeForTokens } from "@/lib/hackatime";
import { saveHackatimeTokens } from "@/lib/auth-store";

function appUrl() {
    return process.env.BABYLAPSE_APP_URL ?? "http://localhost:3000";
}

function callbackPath() {
    return process.env.HACKATIME_REDIRECT_URI ?? `${appUrl()}/auth/callback`;
}

function stateToOwnerId(state: string | null): string {
    if (!state)
        return "default";

    const safe = state.replace(/[^a-zA-Z0-9_-]/g, "");
    if (safe.length === 0)
        return "default";

    return safe;
}

function redirectWithError(request: NextRequest, message: string) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error)
        return redirectWithError(request, `oauth_${error}`);

    if (!code)
        return redirectWithError(request, "oauth_code_missing");

    const codeVerifier = request.cookies.get("hkt_code_verifier")?.value ?? undefined;

    try {
        const tokenData = await exchangeOAuthCodeForTokens({
            code,
            redirectUri: callbackPath(),
            codeVerifier
        });

        const oauthApi = new HackatimeOAuthApi(tokenData.access_token);
        const me = await oauthApi.me();

        await saveHackatimeTokens({
            ownerId: stateToOwnerId(state),
            hackatimeUserId: me.id.toString(),
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token ?? null,
            expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null
        });
    }
    catch {
        return redirectWithError(request, "oauth_token_exchange_failed");
    }

    const successUrl = new URL("/", request.url);
    successUrl.searchParams.set("connected", "hackatime");
    return NextResponse.redirect(successUrl);
}
