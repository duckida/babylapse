import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "babylapse",
  description: "A lightweight Lapse clone with Hackatime integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
