"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogIn, LogOut, LibrarySquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
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
  };

  if (!mounted) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-foreground">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h7" />
            <path d="M15 12h7" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Kartu Pokémon Indonesia
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="w-[1px] h-6 bg-border/60 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/collection" className="flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground transition-colors mr-2">
                <LibrarySquare size={18} />
                <span className="hidden sm:inline">Koleksi Saya</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 bg-muted/30 py-1.5 px-3 rounded-full border border-border/50">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-foreground/80 truncate max-w-[100px]">
                  {user.user_metadata?.full_name?.split(" ")[0] || "User"}
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2 rounded-full bg-muted/50 hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20 transition-colors" 
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Login Google</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}