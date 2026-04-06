// frontend/app/components/ProgressBar.tsx
"use client";

import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="h-[2px] rounded-full bg-[#1f2937] overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-[80ms] linear"
        style={{
          width: `${progress}%`,
          background: progress >= 100
            ? 'linear-gradient(90deg, #00ffaa, #00d2ff)'
            : 'linear-gradient(90deg, #2e6fff, #00d2ff)'
        }} 
      />
    </div>
  );
};

export default ProgressBar;
