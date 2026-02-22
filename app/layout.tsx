import type { Metadata, Viewport } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-cinzel" });

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
      <body className={`${inter.variable} ${cinzel.variable} font-sans bg-slate-950 text-slate-50 antialiased min-h-screen overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
