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
      <body style={{ background: "#10141a", color: "#dfe2eb", minHeight: "100vh" }}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
