// app/scan/page.tsx
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

    // --- AI State & Configuration ---
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

        if (eWasteHigh.includes(detectedClass)) return { category: 'High-Value E-Waste', value: 'Est. Scrap: ₱150 - ₱500/unit' };
        if (eWasteLow.includes(detectedClass)) return { category: 'Peripherals / Small Tech', value: 'Est. Scrap: ₱20 - ₱50/unit' };
        if (plasticsGlass.includes(detectedClass)) return { category: 'Recyclables (Plastic/Glass)', value: 'Est. Scrap: ₱12 - ₱20/kg' };
        if (metals.includes(detectedClass)) return { category: 'Scrap Metal', value: 'Est. Scrap: ₱100 - ₱150/kg' };
        if (paper.includes(detectedClass)) return { category: 'Paper / Cardboard', value: 'Est. Scrap: ₱4 - ₱8/kg' };

        return { category: 'General / Non-Scrap', value: 'No significant local scrap value' };
    };

    // --- Load AI Model ---
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                console.log("Open-Source AI Model Loaded Successfully!");
            } catch (error) {
                console.error("Failed to load AI model.", error);
            }
        };
        loadModel();
    }, []);

    // --- Continuous Live Scanning Logic with Math-Corrected Overlay ---
    const detectFrame = async () => {
        if (activeMode === 'camera' && videoRef.current && canvasRef.current && model) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // 1. Sync Canvas rendered resolution to the screen size (Full Screen)
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

                        // 2. THE MAGIC MATH: Calculate how 'object-cover' is scaling and centering the video
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
                                // 3. Grab the raw AI coordinates
                                const [rawX, rawY, rawW, rawH] = prediction.bbox;
                                const isBestMatch = prediction === bestMatch;

                                // 4. TRANSLATE the raw coordinates to match the screen's object-cover cropping
                                const x = rawX * scale + offsetX;
                                const y = rawY * scale + offsetY;
                                const width = rawW * scale;
                                const height = rawH * scale;

                                const color = isBestMatch ? '#10b981' : 'rgba(255, 255, 255, 0.4)';
                                ctx.strokeStyle = color;
                                ctx.lineWidth = isBestMatch ? 4 : 2;
                                const cornerLength = 20;

                                // Draw the box using the translated x, y, width, height
                                ctx.beginPath();
                                ctx.moveTo(x, y + cornerLength);
                                ctx.lineTo(x, y);
                                ctx.lineTo(x + cornerLength, y);
                                ctx.moveTo(x + width - cornerLength, y);
                                ctx.lineTo(x + width, y);
                                ctx.lineTo(x + width, y + cornerLength);
                                ctx.moveTo(x, y + height - cornerLength);
                                ctx.lineTo(x, y + height);
                                ctx.lineTo(x + cornerLength, y + height);
                                ctx.moveTo(x + width - cornerLength, y + height);
                                ctx.lineTo(x + width, y + height);
                                ctx.lineTo(x + width, y + height - cornerLength);
                                ctx.stroke();

                                ctx.fillStyle = color;
                                ctx.font = isBestMatch ? 'bold 18px sans-serif' : '14px sans-serif';
                                ctx.fillText(
                                    `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
                                    x,
                                    y > 20 ? y - 8 : y + 20
                                );
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

    // --- Camera Logic ---
    const startCamera = async () => {
        setActiveMode('camera');
        setAiResult(null);
        try {
            const isPortrait = window.innerHeight > window.innerWidth;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: "environment", 
                    width: { ideal: isPortrait ? 720 : 1280 }, 
                    height: { ideal: isPortrait ? 1280 : 720 } 
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Could not access the camera. Please check browser permissions.");
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

    useEffect(() => {
        return () => stopCamera();
    }, []);

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
                            {model ? "AI Core Ready. Choose an input." : "Booting AI Core... Please wait."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <button
                            onClick={startCamera}
                            disabled={!model}
                            className={`group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 transition-all duration-500 backdrop-blur-sm ${model ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
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

                        <label className={`group relative flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 transition-all duration-500 backdrop-blur-sm ${model ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
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
                                disabled={!model}
                            />
                        </label>
                    </div>
                </div>
            </main>
        );
    }

    // --- UI: Active Scanner/Upload Viewer ---
    return (
        <div className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col font-sans overflow-hidden">

            <div className="absolute top-0 inset-x-0 p-6 z-40 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pt-8 pb-12 pointer-events-none">
                <button
                    onClick={() => {
                        stopCamera();
                        setActiveMode('selection');
                    }}
                    className="pointer-events-auto text-white hover:text-emerald-400 transition-colors text-sm uppercase tracking-widest backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full border border-white/10"
                >
                    &#8592; Cancel
                </button>
            </div>

            {/* Viewport for Video and AR Canvas overlays */}
            <div className="absolute inset-0 w-full h-full z-0 bg-black flex items-center justify-center">
                {activeMode === 'camera' && (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                        />
                    </>
                )}

                {activeMode === 'upload' && previewImage && (
                    <img
                        src={previewImage}
                        alt="Upload preview"
                        className="w-full h-full object-contain" 
                    />
                )}
            </div>

            {/* Upload Mode: Manual Analyze Button */}
            {activeMode === 'upload' && !aiResult && (
                <div className="absolute bottom-0 inset-x-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-10 flex justify-center">
                    <button
                        className="w-full max-w-sm bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] text-lg transition-transform transform active:scale-95"
                        onClick={async () => {
                            if (!model || !previewImage) return;
                            const img = document.createElement('img');
                            img.src = previewImage;
                            await new Promise((resolve) => (img.onload = resolve));
                            const predictions = await model.detect(img);

                            if (predictions.length > 0) {
                                const best = predictions.reduce((p, c) => (p.score > c.score) ? p : c);
                                const mappedData = mapWasteCategory(best.class);
                                setAiResult({
                                    className: best.class,
                                    category: mappedData.category,
                                    value: mappedData.value,
                                    probability: best.score
                                });
                            } else {
                                alert("Could not identify any clear objects in this image.");
                            }
                        }}
                    >
                        Analyze Uploaded Image
                    </button>
                </div>
            )}

            {/* The Results Card with Hackathon Data */}
            {aiResult && (
                <div className="absolute bottom-10 inset-x-0 p-6 z-30 flex justify-center transition-all duration-300 ease-in-out pointer-events-none">
                    <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-t-8 border-emerald-500 pointer-events-auto">
                        {activeMode === 'camera' && (
                            <p className="text-gray-500 text-sm uppercase tracking-widest mb-1 animate-pulse text-center">Live Scan Active</p>
                        )}

                        <div className="mt-2">
                            <h2 className="text-3xl font-extrabold text-gray-900 capitalize text-center">{aiResult.className}</h2>
                            <div className="mt-4 bg-gray-100 rounded-xl p-4">
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Classification</p>
                                <p className="text-gray-900 font-bold">{aiResult.category}</p>

                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-3 mb-1">Market Data</p>
                                <p className="text-emerald-600 font-bold">{aiResult.value}</p>
                            </div>
                        </div>

                        <p className="text-gray-400 text-xs font-medium text-center mt-4">
                            AI Confidence: {(aiResult.probability * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}