'use client';

import React, { useEffect, useState } from 'react';

// Using CSS to achieve 3D rendering for lighter performance per request.
export function NetworkThroughputChart() {
  const [data, setData] = useState(Array.from({ length: 24 }, () => Math.random() * 80 + 20));

  useEffect(() => {
    const int = setInterval(() => {
      setData(prev => [...prev.slice(1), Math.random() * 80 + 20]);
    }, 2000);
    return () => clearInterval(int);
  }, []);

  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '20px 0' }}>
      {data.map((val, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${val}%`,
          background: `var(--blue)`,
          borderRadius: '4px 4px 0 0',
          transition: 'height 1s cubic-bezier(0.1, 0.7, 0.1, 1)',
          opacity: 0.3 + (i / 50)
        }} />
      ))}
    </div>
  );
}

export function SystemLoadDonut() {
  const [val, setVal] = useState(65);

  useEffect(() => {
    const int = setInterval(() => {
      setVal(v => Math.min(100, Math.max(0, v + (Math.random() * 20 - 10))));
    }, 3000);
    return () => clearInterval(int);
  }, []);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (val / 100) * circumference;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, position: 'relative' }}>
      <div style={{ position: 'relative' }}>
         <svg width="160" height="160" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
           <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border2)" strokeWidth="8" />
           <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#donutGrad)" strokeWidth="8"
             strokeDasharray={circumference}
             strokeDashoffset={strokeDashoffset}
             strokeLinecap="round"
             style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
           />
           <defs>
             <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="var(--blue)" />
               <stop offset="100%" stopColor="var(--cyan)" />
             </linearGradient>
           </defs>
         </svg>
         
         <div style={{
           position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
           display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
         }}>
           <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{Math.round(val)}%</span>
           <span style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>Core Load</span>
         </div>
      </div>
    </div>
  );
}

export function ErrorRateChart() {
  const [data, setData] = useState(Array.from({ length: 15 }, () => Math.random() * 5));

  useEffect(() => {
    const int = setInterval(() => {
      setData(prev => [...prev.slice(1), Math.random() * 5 > 4 ? Math.random() * 15 : Math.random() * 3]);
    }, 2500);
    return () => clearInterval(int);
  }, []);

  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '20px 0' }}>
      {data.map((val, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(2, val)}%`,
          background: val > 10 ? 'var(--red)' : val > 5 ? 'var(--orange)' : 'var(--t3)',
          borderRadius: 2,
          transition: 'height 0.5s ease',
          boxShadow: val > 10 ? '0 0 15px var(--red)' : 'none'
        }} />
      ))}
    </div>
  );
}
