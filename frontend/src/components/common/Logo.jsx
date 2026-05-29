import React from 'react';

const Logo = ({ className = 'w-12 h-12', glow = true }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full transition-transform duration-300 hover:scale-105"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15122c" />
            <stop offset="100%" stopColor="#080614" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Logo Letter Gradient */}
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />   {/* Pink-Purple */}
            <stop offset="50%" stopColor="#a855f7" />  {/* Purple */}
            <stop offset="100%" stopColor="#6366f1" /> {/* Indigo */}
          </linearGradient>

          {/* Border Glow Gradient */}
          <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8b4fe" />   {/* Light Purple */}
            <stop offset="50%" stopColor="#a855f7" />  {/* Purple */}
            <stop offset="100%" stopColor="#4f46e5" /> {/* Dark Indigo */}
          </linearGradient>
        </defs>

        {/* Outer Glowing Rounded Rectangle */}
        <rect
          x="30"
          y="30"
          width="440"
          height="440"
          rx="90"
          fill="url(#bgGrad)"
          stroke="url(#borderGrad)"
          strokeWidth="7"
          filter={glow ? "url(#neonGlow)" : undefined}
        />
        
        {/* Sleek Inner Metallic Ring */}
        <rect
          x="34"
          y="34"
          width="432"
          height="432"
          rx="86"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeOpacity="0.08"
        />

        {/* The Stylized Split "R" Letter */}
        <g fill="url(#logoGrad)">
          {/* Top Loop Segment */}
          <path d="
            M 142,150 
            L 310,150 
            C 355,150 385,180 385,220 
            C 385,260 355,290 310,290 
            L 248,290 
            L 272,248 
            L 310,248 
            C 325,248 335,236 335,220 
            C 335,204 325,192 310,192 
            L 174,192 
            Z" 
          />

          {/* Bottom Stem & Diagonal Leg Segment */}
          <path d="
            M 174,230 
            L 225,230 
            L 225,280 
            L 305,366 
            L 245,366 
            L 174,295 
            Z" 
          />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
