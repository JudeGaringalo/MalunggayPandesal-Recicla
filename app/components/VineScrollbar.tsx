"use client";

import React, { useState } from 'react';
import { useLenis } from '@studio-freight/react-lenis';

export default function VineScrollbar(): React.JSX.Element {
  const [progress, setProgress] = useState(0);
  useLenis(({ progress: p }) => {
    setProgress(p);
  });

  const vinePattern = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='150' viewBox='0 0 60 150'><path d='M30,0 C45,50 15,100 30,150' fill='none' stroke='%237C8D58' stroke-width='4' stroke-linecap='round'/><path d='M33,40 C50,30 55,10 50,5 C48,25 40,35 33,40 Z' fill='%23455130'/><path d='M27,110 C10,100 5,80 10,75 C12,95 20,105 27,110 Z' fill='%2381915A'/></svg>";

  return (
    <div className="fixed right-0 md:right-2 top-0 h-screen w-4 md:w-12 z-[100] pointer-events-none drop-shadow-xl">
      <div className="absolute inset-y-0 right-1/2 translate-x-1/2 w-[1px] md:w-[2px] bg-black/10 md:bg-black/5 rounded-full" />
      <div 
        className="absolute top-0 right-0 w-full overflow-hidden"
        style={{ height: `${progress * 100}%` }}
      >
        <div 
          className="absolute top-0 right-0 w-full h-[100vh]"
          style={{
            backgroundImage: `url("${vinePattern}")`,
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'top center',
            backgroundSize: '100% auto', 
          }}
        />
      </div>

      <div 
        className="absolute right-1/2 w-2 h-2 md:w-5 md:h-5 bg-[#7C8D58] rounded-full shadow-[0_0_8px_rgba(124,141,88,0.8)] border-[1px] md:border-2 border-white flex items-center justify-center transition-opacity duration-200"
        style={{ 
          top: `calc(${progress * 100}% - 6px)`,
          transform: `translate(50%, 0)`,
          opacity: progress > 0.01 ? 1 : 0, 
        }}
      >
        <div className="w-[3px] h-[3px] md:w-1.5 md:h-1.5 bg-white rounded-full" />
      </div>
    </div>
  );
}