import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Sora } from "next/font/google";
import { AntdProvider } from "@/components/antd-provider";
import { AppShell } from "@/components/app-shell";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const hindi = Noto_Sans_Devanagari({
  variable: "--font-hindi",
  subsets: ["latin", "devanagari"],
});

export const metadata: Metadata = {
  title: "JanSetu | Constituency Grievance Redressal Portal",
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
