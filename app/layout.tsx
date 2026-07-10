// import { Geist, Geist_Mono } from "next/font/google";

import { LanguageProvider } from "@/components/provider/language_provider";
import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Sora } from "next/font/google";
import "./globals.css";
import { AntdProvider } from "@/components/provider/antd_provider";
import { AppShell } from "@/components/provider/app_shell";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const hindi = Noto_Sans_Devanagari({
  variable: "--font-hindi",
  subsets: ["latin", "devanagari"],
});

export const metadata: Metadata = {
  title: "Seva me Sirsa | Constituency Grievance Redressal Portal",
  description:
    "Digital platform for citizens to file and track complaints with their MLA constituency. A Government of India initiative for transparent grievance redressal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${hindi.variable}`}>
      <body style={{ margin: 0 }}>
        <AntdProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
