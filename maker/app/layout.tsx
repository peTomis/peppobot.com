import type { Metadata } from "next";
import { fontVariables } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = { title: "Peppobot Maker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex flex-col min-h-full">{children}</body>
    </html>
  );
}
