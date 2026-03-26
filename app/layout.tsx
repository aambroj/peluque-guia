import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peluque-Guía",
  description: "Software web para peluquerías",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-100 text-black">{children}</body>
    </html>
  );
}