"use client";

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { ReactLenis } from '@studio-freight/react-lenis';
import VineScrollbar from '@/app/components/VineScrollbar'; // Adjust path if needed 

// --- THE RESULT CARD COMPONENT ---
const ScanResultCard = () => {
  return (

    <div className="w-full h-full flex-1 bg-white shadow-sm flex flex-col overflow-hidden">
      
      {/* Scanned Photo */}
      <div className="bg-[#8b9c64] p-6 text-white rounded-tr-2xl ">
        <p className="text-[10px] tracking-wider uppercase font-semibold mb-1 text-gray-100">
          Scanned Item
        </p>
        <h2 className="text-3xl font-bold mb-4">Plastic Bottle</h2>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center bg-[#a8b884] text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-[#00FF00] rounded-full mr-2 shadow-sm"></span>
            Low / Non-Toxic
          </div>
          <div className="inline-flex items-center bg-[#a8b884] text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full">
            {/* Simple Recycle SVG Icon */}
            <img src="/images/recycle-icon.png" alt="Recyclable Icon" className="w-4 h-4 mr-1.5 object-contain" />
            Recyclable
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 md:p-8 flex flex-col pb-6 bg-white">
        
        {/* Scrap Value Row */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-6">
          <span className="text-sm font-semibold text-gray-500">Estimated Scrap Value</span>
          <span className="text-xl font-bold text-[#6b7a4a]">P12.00 / KG</span>
        </div>

        {/* Handling Instructions */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 mb-2">Handling Instructions</h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Empty All Liquid Content And Compress The Bottle To Save Space Before Disposal.
          </p>
        </div>

        {/* Nearest Disposal */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 mb-3">Nearest Disposal / Junk Shop</h3>
          <div className="flex items-start">
            <div className="mt-1 mr-3 text-[#8b9c64]">
              <img src="/images/location-icon.png" alt="Location Pin" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">M. Santos Junk Shop</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">0.4 KM Away</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 bg-[#8b9c64] hover:bg-[#788856] transition-colors text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm">
            Get Directions
          </button>
          <button className="flex-1 bg-[#E8E8E8] hover:bg-[#D8D8D8] transition-colors text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm shadow-sm">
            Capture New Photo
          </button>
        </div>
      </div>

      {/* Map  */}
      <div className="w-full flex-1 min-h-[200px] bg-gray-200 relative overflow-hidden rounded-br-2xl"> 
        <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
          <img src="/api/placeholder/600/800" alt="Map View" className="w-full h-full object-cover"
          />
        </div>
      </div>

    </div>
  );
};

// --- THE MAIN RESULTS PAGE ASSEMBLY ---
export default function ResultsPage() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
          
      {/* Our Custom Animated Vine Scrollbar */}
      <VineScrollbar />

      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex flex-col">
          
          {/* --- CONTENT SECTION --- */}
          <section className="relative min-h-screen pt-24 pb-8 px-4 md:px-8 flex flex-col justify-center">
            <div className="w-[90%] lg:w-[85%] max-w-none h-auto lg:h-full lg:max-h-[85vh] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
              
              {/* --- LEFT SIDE: Captured Photo --- */}
              <div className="w-full lg:w-[45%] flex flex-col items-start relative border-gray-200 rounded-tl-2xl rounded-bl-2xl shadow-sm overflow-hidden min-h-[40vh] lg:min-h-0">
                
                {/* The Captured Image */}
                <img src="/images/scanned-image.jpg" alt="Scanned Item" className="w-full h-full object-cover"/>

              </div>

              {/* --- RIGHT SIDE: Details Card  --- */}
              <div className="w-full lg:w-[55%] h-auto lg:h-full flex flex-col pt-2 lg:pt-0 rounded-tr-2xl rounded-br-2xl">
                <ScanResultCard />
              </div>

            </div>

            <div className="absolute top-0 left-0 w-full">
              <nav className="relative z-10 w-full p-6 flex justify-between items-center">
                <Link href="/" className="text-black hover:text-gray-400 transition-colors text-sm uppercase tracking-widest">&#8592; Back</Link>
              </nav>
            </div>
          </section>

          {/* --- FOOTER SECTION (From context) --- */}
          <footer className="relative w-full h-[40vh] md:h-screen bg-white flex items-end justify-center overflow-hidden">
            
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