import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Saira_Condensed } from "next/font/google";
import { getLang } from "@/lib/i18n";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const cond = Saira_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cond" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Fristen-Hub — Fuhrpark & EU-AI-Act Compliance",
  description: "Fuhrpark-, Fahrer-Fristen- und EU-AI-Act-Konformitätsmanagement",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${sans.variable} ${cond.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
