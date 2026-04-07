"use client";

import { FormEvent, useMemo, useState } from "react";

type Json = Record<string, unknown>;

async function asJson(res: Response): Promise<Json> {
    try {
        return await res.json() as Json;
    }
    catch {
        return {};
    }
}

export default function HomePage() {
    const [uploadResult, setUploadResult] = useState<Json | null>(null);
    const [timelapseResult, setTimelapseResult] = useState<Json | null>(null);
    const [projectsResult, setProjectsResult] = useState<Json | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    const oauthStartUrl = useMemo(() => {
        const state = `local-user-${Date.now()}`;
        return `/auth/start?state=${encodeURIComponent(state)}`;
    }, []);

    async function handleUpload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading("upload");

        const form = new FormData(event.currentTarget);
        const file = form.get("file");

        if (!(file instanceof File)) {
            setUploadResult({ error: "Choose a file first." });
            setLoading(null);
            return;
        }

        const response = await fetch("/api/v1/storage/upload", {
            method: "POST",
            headers: {
                "x-file-name": file.name,
                "content-type": file.type || "application/octet-stream"
            },
            body: file
        });

        setUploadResult(await asJson(response));
        setLoading(null);
    }

    async function handleCreateTimelapse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading("timelapse");

        const form = new FormData(event.currentTarget);
        const payload = {
            ownerId: String(form.get("ownerId") || "local-user"),
            hackatimeUserId: String(form.get("hackatimeUserId") || "0"),
            hackatimeProject: String(form.get("project") || "Babylapse"),
            visibility: String(form.get("visibility") || "PUBLIC"),
            title: String(form.get("title") || "Untitled Timelapse"),
            createdAt: new Date().toISOString(),
            snapshots: [Date.now() - 5000, Date.now()],
            hackatimeAccessToken: String(form.get("hackatimeAccessToken") || "") || undefined
        };

        const response = await fetch("/api/v1/hackatime/timelapses", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        setTimelapseResult(await asJson(response));
        setLoading(null);
    }

    async function handleFetchProjects(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading("projects");

        const token = String(new FormData(event.currentTarget).get("accessToken") || "");
        const response = await fetch("/api/v1/hackatime/projects", {
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        setProjectsResult(await asJson(response));
        setLoading(null);
    }

    return (
        <main style={{ fontFamily: "sans-serif", margin: "2rem", display: "grid", gap: "1rem", maxWidth: "720px" }}>
            <h1>Babylapse UI</h1>
            <p>Local single-instance dashboard for OAuth linking, uploads, timelapse creation, and Hackatime checks.</p>

            <section style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
                <h2>1) Connect Hackatime</h2>
                <a href={oauthStartUrl}>Connect with Hackatime OAuth</a>
            </section>

            <section style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
                <h2>2) Upload media</h2>
                <form onSubmit={handleUpload}>
                    <input type="file" name="file" required />
                    <button type="submit" disabled={loading === "upload"}>Upload</button>
                </form>
                {uploadResult ? <pre>{JSON.stringify(uploadResult, null, 2)}</pre> : null}
            </section>

            <section style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
                <h2>3) Create timelapse</h2>
                <form onSubmit={handleCreateTimelapse} style={{ display: "grid", gap: "0.5rem" }}>
                    <input name="ownerId" placeholder="ownerId" defaultValue="local-user" />
                    <input name="hackatimeUserId" placeholder="hackatimeUserId" defaultValue="0" />
                    <input name="project" placeholder="hackatime project" defaultValue="Babylapse" />
                    <input name="title" placeholder="title" defaultValue="My Timelapse" />
                    <select name="visibility" defaultValue="PUBLIC">
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="UNLISTED">UNLISTED</option>
                        <option value="PRIVATE">PRIVATE</option>
                    </select>
                    <input name="hackatimeAccessToken" placeholder="Hackatime access token (optional for sync)" />
                    <button type="submit" disabled={loading === "timelapse"}>Create</button>
                </form>
                {timelapseResult ? <pre>{JSON.stringify(timelapseResult, null, 2)}</pre> : null}
            </section>

            <section style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "8px" }}>
                <h2>4) Fetch Hackatime projects</h2>
                <form onSubmit={handleFetchProjects}>
                    <input name="accessToken" placeholder="Hackatime access token" required style={{ width: "100%" }} />
                    <button type="submit" disabled={loading === "projects"}>Fetch</button>
                </form>
                {projectsResult ? <pre>{JSON.stringify(projectsResult, null, 2)}</pre> : null}
            </section>
        </main>
    );
}
