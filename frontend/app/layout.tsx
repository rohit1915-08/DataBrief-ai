import type { Metadata, Viewport } from "next";
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

// 1. Updated Metadata for App Title & Icons
export const metadata: Metadata = {
  title: "DataBrief AI",
  description: "Your AI Business Consultant",
  icons: {
    icon: "/icon.png", // For Browser Tabs & Android
    apple: "/apple-icon.png", // For iOS Home Screen
  },
  manifest: "/manifest.json", // Links to the auto-generated manifest
};

// 2. Added Viewport for Mobile App Look & Feel
export const viewport: Viewport = {
  themeColor: "#4f46e5", // Matches your Indigo branding
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents awkward zooming on inputs
  userScalable: false, // Makes it feel like a native app
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
