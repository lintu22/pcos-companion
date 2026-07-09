import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

// Inter is the app's sans font. The CSS variable name (--font-sans) matches
// what globals.css's @theme block expects, so no further wiring is needed.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vera: make sense of your PMOS symptoms",
  description:
    "Vera turns your PMOS (formerly known as PCOS) symptoms into an evidence-based profile, backed by research and community data.",
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
