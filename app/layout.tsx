import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Builder OS",
  description: "Private AI project command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-neutral-950 text-white">
        <nav className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-3">
            {/* Logo */}
            <a href="/" className="mr-3 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0">
              Builder OS
            </a>

            {/* Primary nav */}
            <a href="/projects" className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
              Projects
            </a>
            <a href="/task-packets" className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
              Task Packets
            </a>
            <a href="/sessions" className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
              Sessions
            </a>
            <a href="/projects/builder-hub" className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
              Builder Hub
            </a>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Secondary nav */}
            <a href="/execute" className="rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Execute
            </a>
            <a href="/sandbox-review" className="rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Patch Review
            </a>
            <a href="/planner-chat" className="rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Planner
            </a>
            <a href="/command" className="rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Command
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
