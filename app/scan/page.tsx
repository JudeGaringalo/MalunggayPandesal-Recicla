"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function ScanPage() {
  // State to control what the user sees
  const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Hardware references
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Camera Logic ---
  const startCamera = async () => {
    setActiveMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Prioritize back camera
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      alert("Could not access the camera. Please check browser permissions.");
      setActiveMode('selection');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Turn off the camera if the user leaves the page or unmounts the component
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- Upload Logic ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCamera(); // Make sure camera is off
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setActiveMode('upload');
    }
  };

  // --- UI: Selection Screen ---
  if (activeMode === 'selection') {
    return (
      <main className="min-h-screen bg-black text-white relative flex flex-col font-sans">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#011a0d] to-black opacity-90 z-0"></div>

        <nav className="relative z-10 w-full p-6 flex justify-between items-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest">
            &#8592; Back
          </Link>
          <span className="text-emerald-500 font-serif italic text-lg">Recicla.</span>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 w-full max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif mb-4">Select Input Method</h2>
            <p className="text-gray-400 font-light tracking-wide">
              Choose how you would like the AI to analyze your item.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Live Camera Button */}
            <button 
              onClick={startCamera}
              className="group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-full border border-emerald-500/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium tracking-wide mb-2 text-white">Live Camera</h3>
              <p className="text-sm text-gray-500 font-light text-center">Real-time AR scanning.</p>
            </button>

            {/* Upload Photo Button */}
            <label className="group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 backdrop-blur-sm cursor-pointer">
              <div className="w-16 h-16 rounded-full border border-gray-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-gray-400 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-medium tracking-wide mb-2 text-white">Upload Photo</h3>
              <p className="text-sm text-gray-500 font-light text-center">Analyze from camera roll.</p>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </main>
    );
  }

  // --- UI: Active Scanner/Upload Viewer ---
  return (
    <div className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col font-sans">
      
      {/* Top Nav Overlay */}
      <div className="absolute top-0 inset-x-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pt-8 pb-12">
        <button 
          onClick={() => {
            stopCamera();
            setActiveMode('selection');
          }}
          className="text-white hover:text-emerald-400 transition-colors text-sm uppercase tracking-widest backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full border border-white/10"
        >
          &#8592; Cancel
        </button>
      </div>

      {/* The Viewport */}
      <div className="absolute inset-0 w-full h-full z-0">
        {activeMode === 'camera' && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
        )}

        {activeMode === 'upload' && previewImage && (
          <img 
            src={previewImage} 
            alt="Upload preview" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Targeting Reticle (Only in Camera Mode) */}
      {activeMode === 'camera' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 relative opacity-60">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>
          </div>
        </div>
      )}

      {/* Action Button (Ready for AI) */}
      <div className="absolute bottom-0 inset-x-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-10 flex justify-center">
        <button 
          className="w-full max-w-sm bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] text-lg transition-transform transform active:scale-95 border border-white/50"
          onClick={() => console.log("Run AI Inference here!")}
        >
          Analyze Item
        </button>
      </div>

    </div>
  );
}