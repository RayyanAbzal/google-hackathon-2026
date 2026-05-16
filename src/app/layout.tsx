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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        {/* Pre-hydration: read sidebar preference before React mounts to prevent layout flicker */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('sidebar_collapsed')==='true')document.documentElement.setAttribute('data-sidebar','collapsed')}catch(e){}` }} />
      </head>
      <body
        className={`${inter.variable} ${mono.variable}`}
        style={{ background: "#10141a", color: "#dfe2eb", minHeight: "100vh" }}
        suppressHydrationWarning
      >
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
