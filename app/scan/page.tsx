"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function ARScannerApp() {
    // UI State
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [staticAiResult, setStaticAiResult] = useState<any | null>(null);

    // Camera & Canvas Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

    const mapWasteCategory = (detectedClass: string) => {
        const eWasteHigh = ['laptop', 'tv', 'cell phone', 'refrigerator'];
        const eWasteLow = ['mouse', 'keyboard', 'remote', 'microwave', 'oven'];
        const plasticsGlass = ['bottle', 'cup', 'bowl', 'vase'];
        
        if (eWasteHigh.includes(detectedClass)) {
            return { category: 'High-Value E-Waste', value: '₱150 - ₱500/unit', hazard: true };
        }
        if (eWasteLow.includes(detectedClass)) {
            return { category: 'Peripherals / Tech', value: '₱20 - ₱50/unit', hazard: false };
        }
        if (plasticsGlass.includes(detectedClass)) {
            return { category: 'Recyclables (Plastic/Glass)', value: '₱12 - ₱20/kg', hazard: false };
        }
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

    // --- 2. Live Camera Logic (FIXED FOR STRETCHING) ---
    const startCamera = async () => {
        setActiveMode('camera');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                // We remove forced dimensions. This allows every phone to use its native 
                // aspect ratio, permanently preventing the funhouse mirror stretching effect.
                video: { facingMode: "environment" }
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

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

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

                            // --- NEW: OFF-SCREEN GHOST FILTER ---
                            // Check where the center of the object is. 
                            const centerX = x + width / 2;
                            const centerY = y + height / 2;
                            
                            // If the center of the object is outside the visible bounds of the screen,
                            // we immediately skip drawing it. No more detecting things outside the mobile screen!
                            if (centerX < 0 || centerX > canvas.width || centerY < 0 || centerY > canvas.height) {
                                return; 
                            }

                            const mapped = mapWasteCategory(prediction.class);
                            const primaryColor = mapped.hazard ? '#ef4444' : '#10b981';

                            // --- DRAW HUD BRACKETS ---
                            ctx.strokeStyle = primaryColor;
                            ctx.lineWidth = 3;
                            const cornerLength = 25;

                            ctx.beginPath();
                            ctx.moveTo(x, y + cornerLength); ctx.lineTo(x, y); ctx.lineTo(x + cornerLength, y);
                            ctx.moveTo(x + width - cornerLength, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cornerLength);
                            ctx.moveTo(x, y + height - cornerLength); ctx.lineTo(x, y + height); ctx.lineTo(x + cornerLength, y + height);
                            ctx.moveTo(x + width - cornerLength, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cornerLength);
                            ctx.stroke();

                            // --- DRAW HUD DATA PANEL ---
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

    // --- 3. Upload Photo Logic ---
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setStaticAiResult(null);
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
            setActiveMode('upload');
        }
    };

    const analyzeUploadedImage = async () => {
        if (!model || !previewImage) return;
        const img = document.createElement('img');
        img.src = previewImage;
        await new Promise((resolve) => (img.onload = resolve));
        const predictions = await model.detect(img);

        const validPredictions = predictions.filter(p => p.score > 0.5 && p.class !== 'person');
        
        if (validPredictions.length > 0) {
            const best = validPredictions.reduce((p, c) => (p.score > c.score) ? p : c);
            const mappedData = mapWasteCategory(best.class);
            setStaticAiResult({
                className: best.class,
                ...mappedData,
                probability: best.score
            });
        } else {
            alert("Could not identify any clear recyclable objects in this image.");
        }
    };

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
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-serif mb-4">Select Input Method</h2>
                        <p className="text-gray-400 font-light tracking-wide">
                            {model ? "AI Core Ready. Choose an input." : "Booting AI Core... Please wait."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <button onClick={startCamera} disabled={!model} className={`group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 transition-all duration-500 backdrop-blur-sm rounded-2xl ${model ? 'hover:bg-white/10 cursor-pointer hover:border-emerald-500/50' : 'opacity-50 cursor-not-allowed'}`}>
                            <div className="w-16 h-16 rounded-full border border-emerald-500/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold tracking-wide mb-2 text-white">Live Camera</h3>
                            <p className="text-sm text-gray-500 font-light text-center">Real-time AR HUD scanning.</p>
                        </button>

                        <label className={`group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 transition-all duration-500 backdrop-blur-sm rounded-2xl ${model ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                            <div className="w-16 h-16 rounded-full border border-gray-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold tracking-wide mb-2 text-white">Upload Photo</h3>
                            <p className="text-sm text-gray-500 font-light text-center">Analyze from camera roll.</p>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={!model} />
                        </label>
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // RENDER: CAMERA OR UPLOAD VIEW
    // ==========================================
    return (
        <main className="fixed inset-0 w-[100vw] h-[100dvh] bg-black overflow-hidden font-sans">
            
            <div className="absolute top-0 inset-x-0 p-6 z-40 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => { stopCamera(); setActiveMode('selection'); setPreviewImage(null); }}
                    className="pointer-events-auto bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-colors text-xs uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg"
                >
                    &#8592; Close
                </button>
            </div>

            {/* View: LIVE CAMERA */}
            {activeMode === 'camera' && (
                <>
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ objectFit: 'cover' }} />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" style={{ objectFit: 'cover' }} />
                </>
            )}

            {/* View: UPLOADED IMAGE */}
            {activeMode === 'upload' && previewImage && (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 bg-[#0a0a0a]">
                    <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8">
                        <img src={previewImage} alt="Upload preview" className="w-full h-full object-cover" />
                        
                        {staticAiResult && (
                            <div className="absolute bottom-4 inset-x-4 bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl p-5 animate-in slide-in-from-bottom-4">
                                <h3 className="text-2xl font-bold text-white capitalize mb-1">{staticAiResult.className}</h3>
                                <div className="text-emerald-400 text-sm font-bold mb-3">{(staticAiResult.probability * 100).toFixed(0)}% Confidence Match</div>
                                
                                <div className="space-y-1">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider">Classification</p>
                                    <p className="text-white text-sm">{staticAiResult.category}</p>
                                    
                                    <p className="text-gray-400 text-xs uppercase tracking-wider pt-2">Est. Scrap Value</p>
                                    <p className="text-emerald-400 text-sm font-semibold">{staticAiResult.value}</p>
                                </div>

                                {staticAiResult.hazard && (
                                    <div className="mt-4 bg-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg border border-red-500/30">
                                        ⚠️ Hazardous Material. Follow safe disposal protocols.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!staticAiResult && (
                        <button 
                            onClick={analyzeUploadedImage}
                            className="bg-white text-black font-bold text-lg px-12 py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
                        >
                            Analyze Object
                        </button>
                    )}
                </div>
            )}
        </main>
    );
}