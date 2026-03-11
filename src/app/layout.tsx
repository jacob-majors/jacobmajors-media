import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: {
    default: "Jacob Majors — Photographer & Engineer",
    template: "%s | Jacob Majors",
  },
  description: "Photography, engineering projects, and writing by Jacob Majors.",
  openGraph: {
    title: "Jacob Majors",
    description: "Photography, engineering projects, and writing.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Nav />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
