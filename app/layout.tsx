import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Sheet · RK9 viewer",
  description: "Find public Pokémon VGC teamsheets by tournament and player.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Team Sheet", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" data-team-sheet-app="true">{children}</body>
    </html>
  );
}
