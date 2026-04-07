import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Babylapse",
    description: "Single-instance Vercel deployment for Lapse-compatible APIs"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
