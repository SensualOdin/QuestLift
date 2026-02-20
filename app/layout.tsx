import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "QuestLift",
  description: "The Gamified Fitness RPG",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuestLift",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased min-h-screen overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
