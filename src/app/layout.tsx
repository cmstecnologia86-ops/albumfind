import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@/data/sticker-image-overrides";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ALBUMFIND · Mundial 2026",
  description:
    "Inventario digital del álbum del Mundial 2026: láminas obtenidas, faltantes y repetidas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
