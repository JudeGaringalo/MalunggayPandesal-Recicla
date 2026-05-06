"use client";

import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ReactLenis } from '@studio-freight/react-lenis';
import VineScrollbar from '@/app/components/VineScrollbar'; 

// --- THE RESULT CARD COMPONENT ---
// Fixed the 'any' type error by explicitly defining the parameter type
const ScanResultCard = ({ itemData }: { itemData: any }) => {
  if (!itemData) return null;

  const { match, mapped } = itemData;
  const isHazard = mapped.hazard;

  const isBio = mapped.biodegradable;
  const recommendedAction = mapped.action;

  // Dynamic styles based on hazard status as defined in project requirements
  const themeColor = isHazard ? 'bg-red-500' : 'bg-[#8b9c64]';
  const badgeColor = isHazard ? 'bg-red-100 text-red-900' : 'bg-[#a8b884] text-gray-900';
  const textColor = isHazard ? 'text-red-600' : 'text-[#6b7a4a]';

  return (
    <div className="w-full h-full flex-1 bg-white shadow-sm flex flex-col overflow-hidden">
      
     {/* Scanned Photo Header */}
      <div className={`${themeColor} p-6 text-white rounded-tr-2xl transition-colors duration-300`}>
        <p className="text-[10px] tracking-wider uppercase font-semibold mb-1 text-white/80">
          Scanned Item
        </p>
        <h2 className="text-3xl font-bold mb-4 capitalize">{match.className}</h2>
        
        {/* Badges for Classification and Accuracy */}
        <div className="flex flex-wrap gap-3">
          <div className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${badgeColor}`}>
            <span className={`w-2 h-2 rounded-full mr-2 shadow-sm animate-pulse ${isHazard ? 'bg-red-600' : 'bg-[#00FF00]'}`}></span>
            {isHazard ? 'Hazardous Material' : 'Low / Non-Toxic'}
          </div>
          
          <div className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${badgeColor}`}>
             <span className="font-bold mr-1.5">{Math.round(match.probability * 100)}%</span> Match
          </div>

          <div className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${isBio ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            <span className="mr-1.5">{isBio ? '🌱' : '♻️'}</span>
            {isBio ? 'Biodegradable' : 'Non-Biodegradable'}
          </div>

          <div className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-900 uppercase tracking-widest">
            {recommendedAction || 'Dispose'}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col pb-6 bg-white">
        
        
        <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-6">
          <span className="text-sm font-semibold text-gray-500">Estimated Scrap Value</span>
          <span className={`text-xl font-bold ${textColor}`}>{mapped.value}</span>
        </div>

        
        <div className="mb-6">
          <h3 className={`text-sm font-bold mb-2 ${isHazard ? 'text-red-500' : 'text-gray-400'}`}>
            {isHazard ? '⚠️ Safety Warning' : 'Handling Instructions'}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {isHazard 
              ? "Toxic/Flammable: Do not puncture or expose to heat. Route to specialized e-waste drop-off bins immediately." 
              : `Please ensure the ${match.className.toLowerCase()} is clean and sorted properly before recycling.`}
          </p>
        </div>

        
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 mb-3">
            Nearest {isHazard ? 'E-Waste Drop-off' : 'Disposal / Junk Shop'}
          </h3>
          <div className="flex items-start">
            <div className={`mt-1 mr-3 ${textColor}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">
                {isHazard ? 'SM Cyberzone E-Waste Bin' : 'M. Santos Junk Shop'}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">0.4 KM Away</p>
            </div>
          </div>
        </div>

        
        <div className="flex flex-col sm:flex-row gap-3">
          <button className={`flex-1 transition-colors text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm ${isHazard ? 'bg-red-500 hover:bg-red-600' : 'bg-[#8b9c64] hover:bg-[#788856]'}`}>
            Get Directions
          </button>
          <Link href="/scan" className="flex-1 text-center bg-[#E8E8E8] hover:bg-[#D8D8D8] transition-colors text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm shadow-sm">
            Capture New Photo
          </Link>
        </div>
      </div>

      
      <div className="w-full flex-1 min-h-[200px] bg-gray-200 relative overflow-hidden rounded-br-2xl"> 
        <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
          <img src="/api/placeholder/600/800" alt="Map View" className="w-full h-full object-cover" />
        </div>
      </div>

    </div>
  );
};

// --- THE MAIN RESULTS PAGE ASSEMBLY ---
export default function ResultsPage() {
  const [mounted, setMounted] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ref to prevent double execution during React Strict Mode development
  const analysisStarted = useRef(false);

  useEffect(() => {
    setMounted(true);
    const savedImage = localStorage.getItem('lastCapturedImage');
    const savedResults = localStorage.getItem('lastScanResults'); // 1. Check for cached results

    if (savedResults) {
      // 2. If results exist, load them instantly. No API call needed!
      const parsed = JSON.parse(savedResults);
      setAiData(parsed.aiData);
      setScannedImage(parsed.imageUrl);
      setIsAnalyzing(false);
    } else if (savedImage && !analysisStarted.current) {
      // 3. Only run analysis if we have an image AND no cached results
      analysisStarted.current = true;
      setScannedImage(savedImage); 
      analyzeImageWithVisionAI(savedImage);
    } else if (!savedImage) {
      setIsAnalyzing(false);
      setErrorMessage("No image was found in memory.");
    }
  }, []);

  const analyzeImageWithVisionAI = async (base64Image: string) => {
    try {
      const response = await fetch('/api', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const result = await response.json();
      
      if (result.success) {
        setAiData(result.aiData);
        setScannedImage(result.imageUrl); 
        
        // 4. Save the successful result to localStorage
        localStorage.setItem('lastScanResults', JSON.stringify({
          aiData: result.aiData,
          imageUrl: result.imageUrl
        }));
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage("Connection failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!mounted) return null;

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <VineScrollbar />
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex flex-col">
          <section className="relative min-h-screen pt-24 pb-8 px-4 md:px-8 flex flex-col justify-center">
            <div className="w-[90%] lg:w-[85%] max-w-none h-auto lg:h-full lg:max-h-[85vh] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
              
              {/* --- LEFT SIDE: Captured Photo --- */}
              <div className="w-full lg:w-[45%] flex flex-col items-center justify-center relative border-gray-200 rounded-tl-2xl rounded-bl-2xl shadow-sm overflow-hidden min-h-[40vh] bg-black">
                {scannedImage ? (
                  <img src={scannedImage} alt="Scanned Item" className="w-full h-full object-contain transition-opacity duration-500" style={{ opacity: isAnalyzing ? 0.5 : 1 }}/>
                ) : (
                  <p className="text-white/50 text-sm">No image captured.</p>
                )}
                
                {/* Analysis State Overlay */}
                {isAnalyzing && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white">
                      <div className="w-12 h-12 border-4 border-[#7E8C54] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-semibold tracking-widest uppercase text-xs animate-pulse text-center px-4">Gemini is Analyzing Object...</p>
                   </div>
                )}
              </div>

              {/* --- RIGHT SIDE: Details Card --- */}
              <div className="w-full lg:w-[55%] h-auto lg:h-full flex flex-col pt-2 lg:pt-0 rounded-tr-2xl rounded-br-2xl">
                {isAnalyzing ? (
                   <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-r-2xl p-6 text-center">
                      <div className="w-full max-w-md space-y-4 animate-pulse">
                         <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
                         <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      </div>
                   </div>
                ) : aiData ? (
                   <ScanResultCard itemData={aiData} />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-100 rounded-r-2xl p-6 text-center">
                      <div className="text-red-500 font-bold bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="mb-2 uppercase tracking-wider text-xs text-red-400">Analysis Failed</p>
                        <p>{errorMessage}</p>
                      </div>
                   </div>
                )}
              </div>
            </div>
            
            {/* Back Navigation */}
            <div className="absolute top-0 left-0 w-full">
              <nav className="relative z-10 w-full p-6 flex justify-between items-center">
                <Link href="/scan" className="text-black hover:text-gray-400 transition-colors text-sm uppercase tracking-widest">&#8592; Back</Link>
              </nav>
            </div>
          </section>
          
          <footer className="relative w-full h-[40vh] md:h-screen bg-white flex items-end justify-center overflow-hidden">
            <img src="/images/footer.png" alt="Tropical Leaves" className="relative z-10 w-full h-[40vh] md:h-[85vh] object-cover object-bottom pointer-events-none drop-shadow-2xl" />
          </footer>
        </main>
      </div>
    </ReactLenis>
  );
}