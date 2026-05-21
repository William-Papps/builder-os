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
        <nav className="border-b border-neutral-800 bg-neutral-900">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
            <a href="/" className="text-sm font-bold text-emerald-400">
              Builder OS
            </a>
            <a href="/projects" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Projects
            </a>
            <a href="/tasks" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Tasks
            </a>
            <a href="/prompts" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Prompts
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
