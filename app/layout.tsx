import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tierheim-Umfrage Dashboard",
  description: "Barrierearme visuelle Auswertung einer Tierheim-Umfrage.",
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
