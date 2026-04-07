export interface WakaTimeProject {
    name: string;
    total_seconds: number;
    most_recent_heartbeat: string | null;
    languages: string[];
    archived: boolean;
}

interface ProjectsResponse {
    projects: WakaTimeProject[];
}

export interface HackatimeProjectSummary {
    name: string;
    totalSeconds: number;
}

export interface HackatimeTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}

export interface WakaTimeHeartbeat {
    entity: string;
    type: string;
    category?: string;
    time: number;
    project?: string;
    language?: string;
    user_agent: string;
}

export interface CreatedWakaTimeHeartbeat {
    time: number | null;
}

class HackatimeBase {
    private readonly token: string;

    constructor(token: string) {
        this.token = token;
    }

    protected async query<T>(method: "GET" | "POST", endpoint: string, params?: object) {
        const response = await fetch(`${hackatimeBaseUrl()}/api/${endpoint}`, {
            method,
            body: method === "GET" ? undefined : JSON.stringify(params ?? {}),
            headers: {
                Authorization: `Bearer ${this.token}`,
                "User-Agent": "lapse/2.0.0",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok)
            throw new Error(`Hackatime API request failed with HTTP ${response.status}`);

        return await response.json() as T;
    }
}

function hackatimeBaseUrl() {
    return process.env.HACKATIME_URL ?? "https://hackatime.hackclub.com";
}

export class HackatimeOAuthApi extends HackatimeBase {
    constructor(accessToken: string) {
        super(accessToken);
    }

    async getProjects() {
        const data = await this.query<ProjectsResponse>("GET", "v1/authenticated/projects");
        return data.projects;
    }

    async apiKey() {
        const data = await this.query<{ token: string }>("GET", "v1/authenticated/api_keys");
        return data.token;
    }

    async me() {
        return await this.query<{ id: number }>("GET", "v1/authenticated/me");
    }
}

export class HackatimeUserApi extends HackatimeBase {
    constructor(apiKey: string) {
        super(apiKey);
    }

    async pushHeartbeats(heartbeats: WakaTimeHeartbeat[]) {
        return await this.query<{ responses: [CreatedWakaTimeHeartbeat, number][] }>(
            "POST",
            "hackatime/v1/users/current/heartbeats.bulk",
            { heartbeats }
        );
    }
}

export async function exchangeOAuthCodeForTokens(params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
}) {
    const clientId = process.env.HACKATIME_CLIENT_ID;

    if (!clientId)
        throw new Error("Missing HACKATIME_CLIENT_ID");

    const body = new URLSearchParams({
        client_id: clientId,
        code: params.code,
        grant_type: "authorization_code",
        redirect_uri: params.redirectUri
    });

    if (params.codeVerifier)
        body.set("code_verifier", params.codeVerifier);

    const clientSecret = process.env.HACKATIME_CLIENT_SECRET;
    if (clientSecret)
        body.set("client_secret", clientSecret);

    const response = await fetch(`${hackatimeBaseUrl()}/oauth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body
    });

    if (!response.ok)
        throw new Error(`Hackatime OAuth token exchange failed with HTTP ${response.status}`);

    const data = await response.json() as HackatimeTokenResponse;

    if (!data.access_token)
        throw new Error("Hackatime token response missing access_token");

    return data;
}

export function sortAndMapProjects(projects: WakaTimeProject[]): HackatimeProjectSummary[] {
    return projects
        .filter(project => project.name.trim().length > 0)
        .sort((a, b) => {
            const aTime = a.most_recent_heartbeat ? new Date(a.most_recent_heartbeat).getTime() : 0;
            const bTime = b.most_recent_heartbeat ? new Date(b.most_recent_heartbeat).getTime() : 0;
            return bTime - aTime;
        })
        .map(project => ({
            name: project.name,
            totalSeconds: project.total_seconds
        }));
}

export async function syncTimelapseSnapshotsWithHackatime(params: {
    timelapseId: string;
    timelapseName: string;
    hackatimeProject: string;
    snapshots: number[];
    hackatimeAccessToken: string;
}) {
    const oauthApi = new HackatimeOAuthApi(params.hackatimeAccessToken);
    const userApiKey = await oauthApi.apiKey();
    const userApi = new HackatimeUserApi(userApiKey);

    const heartbeats: WakaTimeHeartbeat[] = params.snapshots.map(snapshot => ({
        entity: `${params.timelapseName} (${params.timelapseId})`,
        time: snapshot / 1000,
        category: "timelapsing",
        type: "timelapse",
        language: "Lapse",
        user_agent: "wakatime/lapse (lapse) lapse/2.0.0 lapse/2.0.0",
        project: params.hackatimeProject
    }));

    const assignedHeartbeats = await userApi.pushHeartbeats(heartbeats);
    const failedHeartbeat = assignedHeartbeats.responses.find(response => response[1] < 200 || response[1] > 299);

    if (failedHeartbeat)
        throw new Error(`Hackatime returned HTTP ${failedHeartbeat[1]} for heartbeat at ${failedHeartbeat[0]?.time}`);

    return {
        totalHeartbeats: heartbeats.length
    };
}
