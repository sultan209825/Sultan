import React from 'react';

interface SultanLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const SultanLogo: React.FC<SultanLogoProps> = ({
  className = '',
  size = 64,
  glow = true
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(124,92,255,0.4) 60%, transparent 80%)'
          }}
        />
      )}

      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]"
      >
        <defs>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <filter id="neonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Outer Shield / Shield Silhouette */}
        <path
          d="M80 14L136 40V96C136 128 80 152 80 152C80 152 24 128 24 96V40L80 14Z"
          fill="#110d14"
          stroke="url(#crownGrad)"
          strokeWidth="3.5"
          filter="url(#neonShadow)"
        />

        {/* Crown Peaks */}
        <path
          d="M48 92L42 54L62 66L80 44L98 66L118 54L112 92H48Z"
          fill="url(#crownGrad)"
          stroke="#fee2e2"
          strokeWidth="1.5"
        />

        {/* Crown Diamond Jewels */}
        <polygon points="80,50 83,56 80,62 77,56" fill="#ffffff" />
        <polygon points="56,66 58,70 56,74 54,70" fill="url(#goldGrad)" />
        <polygon points="104,66 106,70 104,74 102,70" fill="url(#goldGrad)" />

        {/* Crown Base Ribbons */}
        <path
          d="M42 96C54 99 106 99 118 96L114 103C104 106 56 106 46 103L42 96Z"
          fill="url(#goldGrad)"
        />

        {/* Arabic / Latin Calligraphy Accent: "S" Monogram */}
        <text
          x="80"
          y="134"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="24"
          fontWeight="900"
          fontFamily="'Space Grotesk', sans-serif"
          letterSpacing="2"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
        >
          SULTAN
        </text>
      </svg>
    </div>
  );
};
