import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/civic/SidebarProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "CivicTrust — London Mesh",
  description: "Rebuild trust when records are gone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="antialiased dark"
      suppressHydrationWarning
    >
      <body style={{ background: "#10141a", color: "#dfe2eb", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
