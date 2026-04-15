import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import Navbar from "@/components/ui/Navbar";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kartu Pokémon Indonesia",
  description: "Database lengkap kartu Pokémon TCG Indonesia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://asia.pokemon-card.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://asia.pokemon-card.com" />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Navbar />
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
