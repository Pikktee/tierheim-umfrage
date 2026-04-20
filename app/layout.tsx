import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Umfrage Tierheim Hanau",
  description: "Barrierearme visuelle Auswertung einer Tierheim-Umfrage.",
  icons: {
    icon: "/logo-icon-sm.png",
    shortcut: "/logo-icon-sm.png",
    apple: "/logo-icon-sm.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
