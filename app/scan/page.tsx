"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function ARScannerApp() {
    // --- App States ---
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [staticAiResult, setStaticAiResult] = useState<any | null>(null);

    // --- Camera Features States ---
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [isPaused, setIsPaused] = useState(false);
    
    // --- Refs ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

    const mapWasteCategory = (detectedClass: string) => {
        const eWasteHigh = ['laptop', 'tv', 'cell phone', 'refrigerator'];
        const eWasteLow = ['mouse', 'keyboard', 'remote', 'microwave', 'oven'];
        const plasticsGlass = ['bottle', 'cup', 'bowl', 'vase'];
        
        if (eWasteHigh.includes(detectedClass)) return { category: 'High-Value E-Waste', value: '₱150 - ₱500/unit', hazard: true };
        if (eWasteLow.includes(detectedClass)) return { category: 'Peripherals / Tech', value: '₱20 - ₱50/unit', hazard: false };
        if (plasticsGlass.includes(detectedClass)) return { category: 'Recyclables (Plastic/Glass)', value: '₱12 - ₱20/kg', hazard: false };
        
        return { category: 'General / Non-Scrap', value: 'No local scrap value', hazard: false };
    };

    // --- 1. Boot up the AI ---
    useEffect(() => {
        const loadModel = async () => {
            await tf.ready();
            const loadedModel = await cocoSsd.load();
            setModel(loadedModel);
        };
        loadModel();
    }, []);

    // --- 2. Live Camera Logic ---
    const startCamera = async () => {
        setActiveMode('camera');
        setIsPaused(false);
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // THE ZOOM FIX: Check if on desktop
            const isDesktop = window.innerWidth > window.innerHeight;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    // If on web/desktop, force 16:9 to prevent zooming. Mobile is left blank so it uses native.
                    ...(isDesktop ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : {})
                }
            });
            
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Please allow camera access to use Live Scan.");
            setActiveMode('selection');
        }
    };

    useEffect(() => {
        if (activeMode === 'camera') {
            startCamera();
        }
    }, [facingMode]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    // --- Native Camera Features ---
    const toggleCameraFacing = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const toggleCaptureFreeze = () => {
        if (videoRef.current) {
            if (isPaused) {
                videoRef.current.play();
                setIsPaused(false);
            } else {
                videoRef.current.pause();
                setIsPaused(true);
            }
        }
    };

    // --- 3. The HUD Detection Loop ---
    useEffect(() => {
        const detectFrame = async () => {
            if (activeMode === 'camera' && videoRef.current && canvasRef.current && model) {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (canvas.clientWidth !== canvas.width || canvas.clientHeight !== canvas.height) {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                }

                if (video.readyState === 4) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const predictions = await model.detect(video);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
                        const scaledWidth = video.videoWidth * scale;
                        const scaledHeight = video.videoHeight * scale;
                        const offsetX = (canvas.width - scaledWidth) / 2;
                        const offsetY = (canvas.height - scaledHeight) / 2;

                        predictions.forEach(prediction => {
                            if (prediction.score < 0.65 || prediction.class === 'person') return;

                            const [rawX, rawY, rawW, rawH] = prediction.bbox;
                            const x = rawX * scale + offsetX;
                            const y = rawY * scale + offsetY;
                            const width = rawW * scale;
                            const height = rawH * scale;

                            const centerX = x + width / 2;
                            const centerY = y + height / 2;
                            if (centerX < 0 || centerX > canvas.width || centerY < 0 || centerY > canvas.height) return; 

                            const mapped = mapWasteCategory(prediction.class);
                            const primaryColor = mapped.hazard ? '#ef4444' : '#10b981';

                            // Draw Brackets
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = 3;
                            const cornerLength = 25;

                            ctx.beginPath();
                            ctx.moveTo(x, y + cornerLength); ctx.lineTo(x, y); ctx.lineTo(x + cornerLength, y);
                            ctx.moveTo(x + width - cornerLength, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cornerLength);
                            ctx.moveTo(x, y + height - cornerLength); ctx.lineTo(x, y + height); ctx.lineTo(x + cornerLength, y + height);
                            ctx.moveTo(x + width - cornerLength, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cornerLength);
                            ctx.stroke();

                            // Draw Data Panel
                            const label = `${prediction.class.toUpperCase()} ${(prediction.score * 100).toFixed(0)}%`;
                            ctx.font = 'bold 14px sans-serif';
                            const textWidth = Math.max(ctx.measureText(label).width, 180);
                            
                            ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
                            ctx.beginPath();
                            ctx.roundRect ? ctx.roundRect(x, y - 65, textWidth + 20, 55, 6) : ctx.rect(x, y - 65, textWidth + 20, 55);
                            ctx.fill();
                            
                            ctx.fillStyle = primaryColor;
                            ctx.fillText(label, x + 10, y - 45);

                            ctx.fillStyle = '#d4d4d8';
                            ctx.font = '12px sans-serif';
                            ctx.fillText(`Value: ${mapped.value}`, x + 10, y - 25);

                            if (mapped.hazard) {
                                ctx.fillStyle = '#ef4444';
                                ctx.fillText(`! Hazard: Handle carefully`, x + 10, y - 8);
                            }
                        });
                    }
                }
            }
            if (activeMode === 'camera') {
                requestRef.current = requestAnimationFrame(detectFrame);
            }
        };

        if (model && activeMode === 'camera') {
            requestRef.current = requestAnimationFrame(detectFrame);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [model, activeMode]);

    // --- Upload Handlers ---
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setStaticAiResult(null);
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
            setActiveMode('upload');
        }
    };

    const analyzeUploadedImage = async () => { /* Upload logic */ };

    // ==========================================
    // RENDER: SELECTION SCREEN
    // ==========================================
    if (activeMode === 'selection') {
        return (
            <main className="min-h-screen bg-black text-white relative flex flex-col font-sans">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#011a0d] to-black opacity-90 z-0"></div>
                <nav className="relative z-10 w-full p-6 flex justify-between items-center">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-widest">&#8592; Back</Link>
                    <span className="text-emerald-500 font-serif italic text-lg">Recicla.</span>
                </nav>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 w-full max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-serif mb-12 text-center">Select Input Method</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <button onClick={startCamera} disabled={!model} className="p-12 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all">
                            <h3 className="text-xl font-bold mb-2">Live Camera</h3>
                            <p className="text-sm text-gray-500">Real-time AR HUD scanning.</p>
                        </button>
                        <label className="p-12 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all cursor-pointer text-center">
                            <h3 className="text-xl font-bold mb-2">Upload Photo</h3>
                            <p className="text-sm text-gray-500">Analyze from camera roll.</p>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={!model} />
                        </label>
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // RENDER: NATIVE CAMERA UI
    // ==========================================
    return (
        <main className="fixed inset-0 w-[100vw] h-[100dvh] bg-black flex flex-col font-sans overflow-hidden">
            
            {/* 
                TOP BAR 
            */}
            <div className="h-16 w-full flex items-center justify-between px-6 z-20 bg-black md:absolute md:top-0 md:bg-transparent md:h-auto md:pt-8 md:bg-gradient-to-b md:from-black/60 md:to-transparent md:pb-12">
                <button
                    onClick={() => { stopCamera(); setActiveMode('selection'); setPreviewImage(null); }}
                    className="text-white hover:text-emerald-400 transition-colors text-xs uppercase tracking-widest bg-black/40 md:backdrop-blur-md px-4 py-2 rounded-full border border-transparent md:border-white/20"
                >
                    &#8592; Close
                </button>
                {activeMode === 'camera' && (
                    <div className={`rounded-full text-xs font-bold flex items-center ${isPaused ? '' : ''}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${isPaused ? 'bg-yellow-500' : 'bg-emerald-500'}`}></span>
                        {isPaused ? '' : ''}
                    </div>

                )}
            </div>

            {/* 
                VIEWFINDER
            */}
            <div className="relative flex-1 w-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden md:absolute md:inset-0 md:z-0">
                {activeMode === 'camera' && (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="absolute inset-0 w-full h-full object-cover" 
                            style={{ objectFit: 'cover' }} 
                        />
                        <canvas 
                            ref={canvasRef} 
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" 
                            style={{ objectFit: 'cover' }} 
                        />
                    </>
                )}
                {activeMode === 'upload' && previewImage && (
                    <img src={previewImage} alt="Upload preview" className="w-full h-full object-contain p-4 md:object-cover" />
                )}
            </div>

            {/* 
                BOTTOM BAR
            */}
            <div className="h-40 w-full flex flex-col items-center justify-end pb-8 z-20 bg-black text-white md:absolute md:bottom-0 md:bg-transparent md:h-auto md:pb-12 md:bg-gradient-to-t md:from-black/60 md:to-transparent md:pt-20">
                
                <div className="flex space-x-6 text-xs font-medium text-gray-400 mb-6 drop-shadow-md">
                    <span className="text-yellow-500">Capture</span>
                </div>

                <div className="w-full flex justify-between items-center px-10 max-w-2xl mx-auto">
                    
                    <div className="w-12 h-12 rounded-lg bg-white/10 md:bg-white/20 md:backdrop-blur-md"></div>

                    {activeMode === 'camera' ? (
                        <button 
                            onClick={toggleCaptureFreeze}
                            className={`w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-lg ${isPaused ? 'border-yellow-500 bg-yellow-500/20 scale-95' : 'border-white bg-white/20 hover:bg-white/40 active:scale-95'}`}
                        >
                            <div className={`w-14 h-14 rounded-full transition-all duration-300 ${isPaused ? 'bg-yellow-500' : 'bg-white'}`}></div>
                        </button>
                    ) : (
                        <div className="w-20 h-20"></div> 
                    )}

                    <button 
                        onClick={toggleCameraFacing}
                        className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 md:bg-white/20 md:backdrop-blur-md flex items-center justify-center transition-colors active:scale-90 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                </div>
            </div>

        </main>
    );
}