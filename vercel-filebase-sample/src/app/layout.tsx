import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel + Filebase Sample",
  description: "Direct browser upload to Filebase with Next.js on Vercel"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
