"use client";

import Link from 'next/link';
import React from 'react';

export default function LandingPage(): React.JSX.Element {
  return (
    <div className="bg-white">
      {/* 
        MAIN WRAPPER 
        overflow-hidden keeps the massive rings from breaking the screen width
      */}
      <main className="relative bg-white text-[#4A4A4A] font-sans overflow-hidden">

        <style>{`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          
          @keyframes spin-reverse {
            from { transform: translate(-50%, -50%) rotate(360deg); }
            to { transform: translate(-50%, -50%) rotate(0deg); }
          }

          .spin-inner { animation: spin 100s linear infinite; }
          .spin-outer { animation: spin-reverse 140s linear infinite; }
        `}</style>

        {/* --- BACKGROUND RINGS LAYER --- */}
        {/* Locked to top-[50vh] so they stay perfectly centered in the first screen */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <img
            src="/images/Group 8.png"
            alt="Outer floating items"
            className="absolute top-[50vh] left-1/2 w-[155vw] max-w-[1850px] object-contain spin-outer opacity-90"
          />
          <img
            src="/images/Group 7.png"
            alt="Inner floating items"
            className="absolute top-[50vh] left-1/2 w-[90vw] max-w-[1000px] object-contain spin-inner"
          />
          
          <div
            className="absolute top-[50vh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-[50%] pointer-events-none z-[5]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,1) 100%, rgba(255,255,255,0) 0%)',
              filter: 'blur(100px)'
            }}
          ></div>
        </div>

        {/* --- HERO CONTENT --- */}
        {/* min-h-screen guarantees this takes the first full view, sending the rest down */}
        <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center text-center gap-6 px-6">
          <span className="uppercase tracking-[2px] text-[#7C8D58] text-xl font-bold">
            RECICLA
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#4A4A4A] leading-[1.2] mb-4">
            Recycle from anywhere,<br />Value from anything
          </h1>

          <Link
            href="/scan"
            className="mt-2 bg-[#7C8D58] text-white font-semibold rounded-[30px] px-10 py-[15px] shadow-[inset_0px_-3px_0px_rgba(0,0,0,0.2),_0px_4px_10px_rgba(0,0,0,0.1)] transition-transform duration-200 transition-colors hover:bg-[#6a794b] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-[inset_0px_2px_5px_rgba(0,0,0,0.3)]"
          >
            Get Started
          </Link>
        </div>

        {/* --- ABOUT CONTENT --- */}
        {/* mt-48 creates a huge empty space before the About section starts */}
        <div className="relative z-10 w-full mt-48 pb-32">
          
          {/* Image Container for Rectangle 50.png */}
          <div className="relative w-full flex items-center justify-center">
            <img
              src="/images/Rectangle 50.png"
              alt="About Section Header"
              className="w-[110%] max-w-none h-auto drop-shadow-xl"
            />
            <h2 className="absolute inset-0 flex items-center justify-center text-white text-3xl md:text-5xl font-bold tracking-tight mb-4">
              About Recicla
            </h2>
          </div>

          {/* Description Text */}
          <div className="container mx-auto px-6 mt-16 max-w-4xl text-center">
            <p className="text-[#4A4A4A] text-lg md:text-xl leading-relaxed font-medium">
              Recicla is a real-time, AI-driven web application designed to bridge the gap between
              waste segregation and financial incentive. By leveraging high-speed, client-side
              object detection, Recicla empowers users to instantly identify the value and risks
              of their household waste. We focus specifically on the untapped potential of
              e-waste and precious metal recovery, transforming the act of "throwing things away"
              into a deliberate step toward environmental sustainability and personal profit.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}