import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "IDmission FluentVerify — AI-Powered Language Assessment",
  description:
    "Assess your English and German language proficiency with AI. Get instant CEFR scores across Speaking, Writing, Listening, and Reading skills.",
  keywords: ["language assessment", "English test", "German test", "CEFR", "AI language", "English proficiency"],
  openGraph: {
    title: "IDmission FluentVerify — AI-Powered Language Assessment",
    description: "Fast, accurate AI-driven language assessments for English and German.",
    type: "website",
  },
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-50 dark:bg-surface-darkest text-gray-900 dark:text-white antialiased selection:bg-brand-500/30`}>
        <SessionProviderWrapper session={session}>
          <Navbar />
          <main>{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
