"use client";

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { ReactLenis } from '@studio-freight/react-lenis';
import VineScrollbar from '@/app/components/VineScrollbar'; // Adjust path if needed

export default function LandingPage(): React.JSX.Element {

  const techLogos = [
    { name: "Next.js", src: "/images/next.png" },
    { name: "Tailwind CSS", src: "/images/tailwind.png" },
    { name: "Supabase", src: "/images/supabase.png" },
    { name: "TensorFlow", src: "/images/tensorflow.png" },
    { name: "Teachable Machine", src: "/images/teachable.png" },
    { name: "Vercel", src: "/images/vercel.png" },
    { name: "Node.js", src: "/images/node.png" },
    { name: "React", src: "/images/react.png" },
    { name: "Figma", src: "/images/figma.png" },
  ];

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      
      {/* Our Custom Animated Vine Scrollbar */}
      <VineScrollbar />

      <div className="bg-white">
        {/* Added 'no-scrollbar' class here */}
        <main className="relative bg-white text-[#4A4A4A] font-sans no-scrollbar">

          <style>{`
            @keyframes spin {
              from { transform: translate(-50%, -50%) rotate(0deg); }
              to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            @keyframes spin-reverse {
              from { transform: translate(-50%, -50%) rotate(360deg); }
              to { transform: translate(-50%, -50%) rotate(0deg); }
            }

            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }

            .spin-inner { animation: spin 100s linear infinite; }
            .spin-outer { animation: spin-reverse 140s linear infinite; }
            .animate-marquee { animation: marquee 30s linear infinite; }

            .unzoomable {
              user-select: none;
              -webkit-user-drag: none;
              touch-action: none;
              pointer-events: none;
            }
          `}</style>

          {/* --- FOOTER SECTION --- */}
          <footer className="relative w-full h-[40vh] md:h-screen bg-white flex items-end justify-center overflow-hidden">
            
            {/* CUT-OUT TEXT (Background) */}
            <div className="absolute inset-0 flex items-center justify-center z-0 px-4 md:px-6 w-full">
              <svg 
                className="w-full max-w-[1600px] h-auto drop-shadow-sm unzoomable" 
                viewBox="0 0 1600 500" 
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="innerShadow">
                    <feOffset dx="8" dy="12" />
                    <feGaussianBlur stdDeviation="8" result="offset-blur" />
                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                    <feFlood floodColor="black" floodOpacity="0.35" result="color" />
                    <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                    <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                  </filter>
                </defs>
                
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="#E8EBE4"
                  className="font-inter font-bold uppercase"
                  style={{ fontSize: '250px', letterSpacing: '14px' }}
                  filter="url(#innerShadow)"
                >
                  RECICLA
                </text>
              </svg>
            </div>

            {/* LEAVES IMAGE (Foreground) */}
            <img
              src="/images/footer.png" 
              alt="Tropical Leaves"
              className="relative z-10 w-full h-[40vh] md:h-[85vh] object-cover object-bottom pointer-events-none unzoomable drop-shadow-2xl"
            />
            
          </footer>
        </main>
      </div>
    </ReactLenis>
  );
}