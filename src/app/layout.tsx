import type { Metadata } from "next";
import { SidebarProvider } from "@/components/civic/SidebarProvider";
import "./globals.css";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        style={{ background: "#10141a", color: "#dfe2eb", minHeight: "100vh" }}
        suppressHydrationWarning
        data-new-gr-c-s-check-loaded="14.1292.0"
        data-gr-ext-installed=""
      >
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
