"use client";

import React, { useState } from 'react';
import { useLenis } from '@studio-freight/react-lenis';

export default function VineScrollbar(): React.JSX.Element {
  const [progress, setProgress] = useState(0);

  // Hook into Lenis to get real-time scroll progress (0.0 to 1.0)
  useLenis(({ progress: p }) => {
    setProgress(p);
  });

  // A completely organic, custom SVG vine that repeats seamlessly
  // URL-encoded so it can be used directly as a CSS background-image
  const vinePattern = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='150' viewBox='0 0 60 150'><path d='M30,0 C45,50 15,100 30,150' fill='none' stroke='%237C8D58' stroke-width='4' stroke-linecap='round'/><path d='M33,40 C50,30 55,10 50,5 C48,25 40,35 33,40 Z' fill='%23455130'/><path d='M27,110 C10,100 5,80 10,75 C12,95 20,105 27,110 Z' fill='%2381915A'/></svg>";

  return (
    <div className="fixed right-1 md:right-2 top-0 h-screen w-12 md:w-12 z-[100] pointer-events-none drop-shadow-xl">
      
      {/* 1. FAINT BACKGROUND TRACK */}
      {/* Gives the user a visual cue of where the scrollbar travels */}
      <div className="absolute inset-y-0 right-1/2 translate-x-1/2 w-[2px] bg-black/5 rounded-full" />

      {/* 2. THE GROWING MASK CONTAINER */}
      <div 
        className="absolute top-0 right-0 w-full overflow-hidden"
        // The Magic: As progress goes from 0 to 1, the height goes from 0% to 100%
        // This clips the background image, revealing it smoothly as you scroll.
        style={{ height: `${progress * 100}%` }}
      >
        {/* 3. THE REPEATING VINE TEXTURE */}
        <div 
          className="absolute top-0 right-0 w-full h-[100vh]"
          style={{
            backgroundImage: `url("${vinePattern}")`,
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'top center',
          }}
        />
      </div>

      {/* 4. THE LEADING SPROUT / HEAD */}
      {/* Follows the bottom edge of the drawn vine to look like it's growing it */}
      <div 
        className="absolute right-1/2 w-4 h-4 md:w-5 md:h-5 bg-[#7C8D58] rounded-full shadow-[0_0_15px_rgba(124,141,88,0.8)] border-2 border-white flex items-center justify-center transition-opacity duration-200"
        style={{ 
          top: `calc(${progress * 100}% - 10px)`,
          transform: `translate(50%, 0)`,
          // Hide the bud if we are at the very absolute top so it doesn't look weird
          opacity: progress > 0.01 ? 1 : 0, 
        }}
      >
        {/* Inner dot */}
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
      </div>

    </div>
  );
}