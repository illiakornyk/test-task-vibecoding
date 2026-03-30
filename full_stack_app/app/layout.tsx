import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice to Text AI",
  description: "Convert voice to text and get AI-powered responses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  let isPro = false;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    isPro = !!user?.hasActiveSubscription;
  }

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn(
          "h-full",
          "antialiased",
          geistSans.variable,
          geistMono.variable,
          "font-sans",
          figtree.variable
        )}
      >
        <body className="min-h-full flex flex-col">
          <header className="fixed top-0 inset-x-0 z-50 flex h-16 items-center justify-between px-6 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/50 dark:border-zinc-800/50">
            <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              🎙️ VoiceAI
            </span>
            <div className="flex items-center gap-3">
              {isPro && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold tracking-wider mr-2">
                  Plus
                </span>
              )}
              <Show when="signed-out">
                <SignInButton>
                  <button className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          <div className="pt-16 flex flex-col flex-1">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}

