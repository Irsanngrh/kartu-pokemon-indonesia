"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, LibrarySquare, Layers } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (pathname === '/collection') {
      router.push('/');
    }
  };

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link 
          href="/" 
          onClick={() => {
            sessionStorage.removeItem('libraryFilters');
            if (pathname === '/') window.location.reload();
          }}
          className="flex items-center gap-2  text-[15px] sm:text-lg tracking-tight hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6 text-foreground shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h7" />
            <path d="M15 12h7" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="truncate font-bold">Kartu Pokémon Indonesia</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="p-2 rounded-full bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60 transition-colors shrink-0">
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-[1px] h-6 bg-border/60 hidden sm:block"></div>
          <Link href="/decks" className="flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap shrink-0">
            <Layers size={18} />
            <span className="hidden sm:inline">Deck Saya</span>
          </Link>
          <Link href="/collection" className="flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground transition-colors whitespace-nowrap shrink-0 ml-2 sm:ml-0">
            <LibrarySquare size={18} />
            <span className="hidden sm:inline">Koleksi Saya</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="hidden sm:flex items-center justify-center bg-muted/30 p-1 rounded-full border border-border/50 shrink-0" title={user.user_metadata?.full_name || user.email || "User"}>
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0">
                    {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="p-2 rounded-full bg-muted/50 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-colors shrink-0" >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 w-[34px] h-[34px] sm:w-auto sm:h-[34px] sm:px-3.5 rounded-full sm:rounded-xl text-[13px] font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0">
              <svg viewBox="0 0 24 24" width="15" height="15" className="shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
