"use client";
import { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', newTheme);
  };

  if (!mounted) return <div className="w-10 h-10 rounded-xl bg-tertiary/10 animate-pulse" />;

  return (
    <button 
      onClick={toggleTheme}
      className={`group relative ac-header-btn glass-card !w-10 !h-10 !flex !items-center !justify-center overflow-hidden transition-all duration-500 ${
        theme === 'dark' ? 'shadow-[0_0_15px_rgba(129,140,248,0.2)]' : ''
      }`}
      aria-label={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
      
      <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
        {theme === 'dark' ? (
          <div className="flex items-center justify-center animate-slide-in">
             <Sun size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          </div>
        ) : (
          <div className="flex items-center justify-center animate-slide-in">
             <Moon size={18} className="text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
          </div>
        )}
      </div>
      
      {/* Subtle pulse for the current mode indicator */}
      <div className={`absolute bottom-1 right-1 w-1 h-1 rounded-full transition-all duration-500 ${
        theme === 'dark' ? 'bg-amber-400 opacity-100' : 'bg-indigo-600 opacity-0 group-hover:opacity-100'
      }`} />
    </button>
  );
}
