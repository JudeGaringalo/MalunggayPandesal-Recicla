"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function ScanPage() {
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [aiResult, setAiResult] = useState<{ className: string; category: string; value: string; probability: number } | null>(null);
    const requestRef = useRef<number | null>(null);

    const CONFIDENCE_THRESHOLD = 0.65;

    const mapWasteCategory = (detectedClass: string) => {
        const eWasteHigh = ['laptop', 'tv', 'cell phone', 'refrigerator'];
        const eWasteLow = ['mouse', 'keyboard', 'remote', 'microwave', 'toaster', 'oven'];
        const plasticsGlass = ['bottle', 'cup', 'bowl', 'vase'];
        const metals = ['fork', 'knife', 'spoon'];
        const paper = ['book'];

        if (eWasteHigh.includes(detectedClass)) return { category: 'High-Value E-Waste', value: '₱150 - ₱500/unit' };
        if (eWasteLow.includes(detectedClass)) return { category: 'Peripherals / Tech', value: '₱20 - ₱50/unit' };
        if (plasticsGlass.includes(detectedClass)) return { category: 'Recyclables (Plastic/Glass)', value: '₱12 - ₱20/kg' };
        if (metals.includes(detectedClass)) return { category: 'Scrap Metal', value: '₱100 - ₱150/kg' };
        if (paper.includes(detectedClass)) return { category: 'Paper / Cardboard', value: '₱4 - ₱8/kg' };

        return { category: 'General / Non-Scrap', value: 'No local scrap value' };
    };

    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
            } catch (error) {
                console.error("Failed to load AI model.", error);
            }
        };
        loadModel();
    }, []);

    const detectFrame = async () => {
        if (activeMode === 'camera' && videoRef.current && canvasRef.current && model) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Sync Canvas to the visual screen size
            if (canvas.clientWidth !== canvas.width || canvas.clientHeight !== canvas.height) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            if (video.readyState === 4) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    try {
                        const predictions = await model.detect(video);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // --- THE MAGIC MATH FOR OBJECT-COVER ---
                        const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
                        const scaledWidth = video.videoWidth * scale;
                        const scaledHeight = video.videoHeight * scale;
                        const offsetX = (canvas.width - scaledWidth) / 2;
                        const offsetY = (canvas.height - scaledHeight) / 2;

                        const validPredictions = predictions.filter(
                            p => p.score > CONFIDENCE_THRESHOLD && p.class !== 'person'
                        );

                        if (validPredictions.length > 0) {
                            const bestMatch = validPredictions.reduce((prev, current) =>
                                (prev.score > current.score) ? prev : current
                            );

                            const mappedData = mapWasteCategory(bestMatch.class);
                            setAiResult({
                                className: bestMatch.class,
                                category: mappedData.category,
                                value: mappedData.value,
                                probability: bestMatch.score
                            });

                            validPredictions.forEach(prediction => {
                                const [rawX, rawY, rawW, rawH] = prediction.bbox;
                                const isBestMatch = prediction === bestMatch;

                                // Translate raw coordinates to screen coordinates
                                const x = rawX * scale + offsetX;
                                const y = rawY * scale + offsetY;
                                const width = rawW * scale;
                                const height = rawH * scale;

                                const mapped = mapWasteCategory(prediction.class);
                                const color = isBestMatch ? '#10b981' : 'rgba(255, 255, 255, 0.4)';
                                
                                // 1. Draw Bounding Box Corners
                                ctx.strokeStyle = color;
                                ctx.lineWidth = isBestMatch ? 4 : 2;
                                const cornerLength = 20;

                                ctx.beginPath();
                                ctx.moveTo(x, y + cornerLength); ctx.lineTo(x, y); ctx.lineTo(x + cornerLength, y);
                                ctx.moveTo(x + width - cornerLength, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cornerLength);
                                ctx.moveTo(x, y + height - cornerLength); ctx.lineTo(x, y + height); ctx.lineTo(x + cornerLength, y + height);
                                ctx.moveTo(x + width - cornerLength, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cornerLength);
                                ctx.stroke();

                                // 2. Draw the HUD Floating Overlay Panel
                                const panelW = Math.max(width, 240); // Ensure panel is wide enough
                                const panelH = 95;
                                const panelX = x;
                                // Place panel below the box, or above it if it hits the bottom of the screen
                                const panelY = (y + height + 10 + panelH > canvas.height) ? y - panelH - 10 : y + height + 10;

                                // Panel Background (Translucent Dark Gray)
                                ctx.fillStyle = 'rgba(15, 15, 15, 0.85)';
                                ctx.beginPath();
                                ctx.roundRect ? ctx.roundRect(panelX, panelY, panelW, panelH, 8) : ctx.rect(panelX, panelY, panelW, panelH);
                                ctx.fill();

                                // Panel Border
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                                ctx.lineWidth = 1;
                                ctx.stroke();

                                // Text: Classification
                                ctx.fillStyle = '#ffffff';
                                ctx.font = 'bold 16px sans-serif';
                                ctx.fillText(prediction.class.toUpperCase(), panelX + 15, panelY + 28);

                                // Text: Confidence Percentage (Right aligned)
                                ctx.fillStyle = '#10b981';
                                ctx.font = 'bold 14px sans-serif';
                                ctx.fillText(`${(prediction.score * 100).toFixed(0)}%`, panelX + panelW - 45, panelY + 28);

                                // Text: Category
                                ctx.fillStyle = '#a1a1aa';
                                ctx.font = '12px sans-serif';
                                ctx.fillText(`Type: ${mapped.category}`, panelX + 15, panelY + 52);

                                // Text: Value
                                ctx.fillStyle = '#d4d4d8';
                                ctx.font = '12px sans-serif';
                                ctx.fillText(`Market: ${mapped.value}`, panelX + 15, panelY + 70);

                                // Draw Progress Bar Background
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                                ctx.beginPath();
                                ctx.roundRect ? ctx.roundRect(panelX + 15, panelY + 80, panelW - 30, 4, 2) : ctx.rect(panelX + 15, panelY + 80, panelW - 30, 4);
                                ctx.fill();

                                // Draw Progress Bar Fill (Confidence Score)
                                ctx.fillStyle = '#10b981';
                                ctx.beginPath();
                                ctx.roundRect ? ctx.roundRect(panelX + 15, panelY + 80, (panelW - 30) * prediction.score, 4, 2) : ctx.rect(panelX + 15, panelY + 80, (panelW - 30) * prediction.score, 4);
                                ctx.fill();
                            });
                        } else {
                            setAiResult(null);
                        }
                    } catch (err) {
                        console.error("Inference error:", err);
                    }
                }
            }
        }
        requestRef.current = requestAnimationFrame(detectFrame);
    };

    useEffect(() => {
        if (activeMode === 'camera' && model) {
            requestRef.current = requestAnimationFrame(detectFrame);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [activeMode, model]);

    const startCamera = async () => {
        setActiveMode('camera');
        setAiResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Could not access the camera.");
            setActiveMode('selection');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };

    useEffect(() => { return () => stopCamera(); }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            stopCamera();
            setAiResult(null);
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
            setActiveMode('upload');
        }
    };

    if (activeMode === 'selection') {
        // (Selection Screen - unchanged)
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
                        <p className="text-gray-400 font-light tracking-wide">{model ? "AI Core Ready. Choose an input." : "Booting AI Core... Please wait."}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <button onClick={startCamera} disabled={!model} className={`group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 transition-all duration-500 backdrop-blur-sm ${model ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                            <div className="w-16 h-16 rounded-full border border-emerald-500/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium tracking-wide mb-2 text-white">Live Camera</h3>
                            <p className="text-sm text-gray-500 font-light text-center">Real-time AR scanning.</p>
                        </button>
                        <label className={`group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 transition-all duration-500 backdrop-blur-sm ${model ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                            <div className="w-16 h-16 rounded-full border border-gray-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-gray-400 transition-all duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium tracking-wide mb-2 text-white">Upload Photo</h3>
                            <p className="text-sm text-gray-500 font-light text-center">Analyze from camera roll.</p>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={!model} />
                        </label>
                    </div>
                </div>
            </main>
        );
    }

    return (
        // Wrapper now uses 100vw and 100dvh to absolutely guarantee full screen on all devices
        <div className="fixed inset-0 w-[100vw] h-[100dvh] bg-black flex flex-col font-sans overflow-hidden">
            
            {/* The Full Screen Camera View */}
            <div className="relative flex-1 bg-[#0a0a0a] overflow-hidden">
                
                <div className="absolute top-0 inset-x-0 p-6 z-40 flex justify-between items-center pointer-events-none">
                    <button
                        onClick={() => { stopCamera(); setActiveMode('selection'); }}
                        className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-colors text-xs uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg"
                    >
                        &#8592; Close
                    </button>
                    {activeMode === 'camera' && (
                        <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-full text-xs font-medium flex items-center shadow-lg">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                            AI Active
                        </div>
                    )}
                </div>

                {activeMode === 'camera' && (
                    <div className="absolute inset-0 w-full h-full">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            // object-cover ensures it fills the entire screen area perfectly
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas
                            ref={canvasRef}
                            // Canvas also gets object-cover to match the video's crop exactly
                            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                        />
                    </div>
                )}

                {activeMode === 'upload' && previewImage && (
                    <img src={previewImage} alt="Upload preview" className="absolute inset-0 w-full h-full object-contain p-4" />
                )}
            </div>

            {/* 
                MOBILE ONLY: iPhone Standard Bottom Sheet 
                Hidden on medium/desktop screens (md:hidden) so the web view is 100% immersive HUD.
            */}
            <div className="md:hidden relative w-full bg-[#f2f2f7] dark:bg-[#1c1c1e] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] rounded-t-[32px] flex flex-col flex-shrink-0 z-50 overflow-hidden transition-all duration-300 ease-in-out pb-8">
                
                <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-2xl z-0 pointer-events-none"></div>

                <div className="relative z-10 w-full px-6 pt-4 pb-6 flex flex-col items-center">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-6"></div>

                    {!aiResult && activeMode === 'camera' && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-12 h-12 border-4 border-gray-300 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                            <h3 className="text-xl font-semibold tracking-tight text-black dark:text-white">Scanning Environment</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Point your camera clearly at an object.</p>
                        </div>
                    )}

                    {!aiResult && activeMode === 'upload' && (
                        <div className="w-full py-4">
                            <button
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold tracking-wide py-4 rounded-2xl text-lg transition-transform transform active:scale-95 shadow-lg"
                                onClick={async () => {
                                    if (!model || !previewImage) return;
                                    const img = document.createElement('img');
                                    img.src = previewImage;
                                    await new Promise((resolve) => (img.onload = resolve));
                                    const predictions = await model.detect(img);
                                    if (predictions.length > 0) {
                                        const best = predictions.reduce((p, c) => (p.score > c.score) ? p : c);
                                        const mappedData = mapWasteCategory(best.class);
                                        setAiResult({ className: best.class, category: mappedData.category, value: mappedData.value, probability: best.score });
                                    } else {
                                        alert("Could not identify any clear objects in this image.");
                                    }
                                }}
                            >
                                Tap to Analyze
                            </button>
                        </div>
                    )}

                    {aiResult && (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-baseline mb-5">
                                <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white capitalize">
                                    {aiResult.className}
                                </h2>
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                                    {(aiResult.probability * 100).toFixed(0)}% Match
                                </span>
                            </div>

                            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 mb-4">
                                <div className="flex flex-col gap-1 border-b border-gray-100 dark:border-white/10 pb-4 mb-4">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classification</span>
                                    <span className="text-lg font-semibold text-black dark:text-white">{aiResult.category}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estimated Value</span>
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{aiResult.value}</span>
                                </div>
                            </div>
                            
                            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold tracking-wide py-4 rounded-2xl transition-all shadow-md active:scale-95">
                                Log to Segregation Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}