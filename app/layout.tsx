import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={notoSans.className}>{children}</body>
    </html>
  );
}
