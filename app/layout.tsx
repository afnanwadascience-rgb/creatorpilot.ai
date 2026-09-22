import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorPilot AI",
  description:
    "AI-powered YouTube script analysis — hooks, retention, structure, and clarity, scored and explained.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
