'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isLight) {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [isLight]);

  return (
    <button 
      onClick={() => setIsLight(!isLight)}
      className="ac-header-btn"
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
