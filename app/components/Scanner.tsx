"use client";

import { useState, useRef, useEffect } from 'react';

export default function Scanner() {
  const [activeMode, setActiveMode] = useState<'idle' | 'camera' | 'upload'>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Camera Logic ---
  const startCamera = async () => {
    setActiveMode('camera');
    setPreviewImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      alert("Could not access the camera. Please check permissions.");
      setActiveMode('idle');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- Upload Logic ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCamera(); 
      setActiveMode('upload');
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  return (
    // 'fixed inset-0' locks this container to the exact size of the browser window
    <div className="fixed inset-0 w-full h-full bg-black z-0 flex flex-col font-sans">

      {/* --- The Viewport (Background Layer) --- */}
      <div className="absolute inset-0 w-full h-full z-0">
        
        {activeMode === 'idle' && (
           <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gray-900">
              <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Recicla</h2>
              <p className="text-gray-400 mb-10 text-lg">Waste segregation meets AI.</p>
              <button 
                onClick={startCamera}
                className="bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-12 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.3)] text-xl transition-transform transform active:scale-95"
              >
                Tap to Scan
              </button>
           </div>
        )}

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

      {/* --- UI Layer: Targeting Reticle (Only in Camera Mode) --- */}
      {activeMode === 'camera' && (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 relative opacity-50">
            {/* Corner brackets for that "scanning" look */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
          </div>
        </div>
      )}

      {/* --- UI Layer: Top Controls (Floating) --- */}
      {activeMode !== 'idle' && (
        <div className="absolute top-0 inset-x-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent pt-8 pb-12">
          <div className="flex space-x-3 w-full max-w-md mx-auto">
            <button 
              onClick={startCamera}
              className={`flex-1 py-3 rounded-2xl font-semibold backdrop-blur-md transition-all ${
                activeMode === 'camera' 
                  ? 'bg-white/90 text-black shadow-lg scale-100' 
                  : 'bg-black/40 text-white border border-white/20 hover:bg-white/20 scale-95'
              }`}
            >
              Camera
            </button>
            
            <label className={`flex-1 py-3 text-center rounded-2xl font-semibold cursor-pointer backdrop-blur-md transition-all ${
                activeMode === 'upload' 
                  ? 'bg-white/90 text-black shadow-lg scale-100' 
                  : 'bg-black/40 text-white border border-white/20 hover:bg-white/20 scale-95'
              }`}>
              Upload
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {/* --- UI Layer: Bottom Action (Floating) --- */}
      {activeMode !== 'idle' && (
        <div className="absolute bottom-0 inset-x-0 p-6 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-10 flex justify-center">
          <button 
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-3xl shadow-[0_0_20px_rgba(37,99,235,0.5)] text-xl transition-transform transform active:scale-95 border border-blue-400/30"
            onClick={() => console.log("Run AI Inference here!")}
          >
            Analyze Item
          </button>
        </div>
      )}

    </div>
  );
}