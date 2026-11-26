import React from 'react';

export default function NexPathraLogo({ size = 'md', showTagline = false, className = '' }) {
  const sizeMap = {
    sm: { icon: 24, text: 'text-base', tag: 'text-[9px]' },
    md: { icon: 30, text: 'text-xl', tag: 'text-[10px]' },
    lg: { icon: 40, text: 'text-2xl', tag: 'text-xs' },
    xl: { icon: 52, text: 'text-3xl', tag: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Geometric Gradient Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]"
        >
          <defs>
            <linearGradient id="nex_grad_primary" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="nex_grad_glow" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Hexagonal Tech Node Container */}
          <rect
            x="2"
            y="2"
            width="40"
            height="40"
            rx="12"
            fill="#111A2E"
            stroke="url(#nex_grad_primary)"
            strokeWidth="1.5"
          />

          {/* Connected Path Lines / Neural Career Nodes */}
          <path
            d="M12 32L22 12L32 32"
            stroke="url(#nex_grad_primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 24H28"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="22" cy="12" r="3" fill="#38BDF8" />
          <circle cx="12" cy="32" r="3" fill="#8B5CF6" />
          <circle cx="32" cy="32" r="3" fill="#3B82F6" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight text-white ${currentSize.text}`}>
            Nex<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">Pathra</span>
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>
        {showTagline && (
          <span className={`font-medium tracking-wide text-slate-400 mt-1 uppercase ${currentSize.tag}`}>
            Where Skills Meet Opportunity
          </span>
        )}
      </div>
    </div>
  );
}
