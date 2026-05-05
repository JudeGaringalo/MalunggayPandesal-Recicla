"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function ScanPage() {
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- AI State & Configuration ---
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [aiResult, setAiResult] = useState<{ className: string; category: string; value: string; probability: number } | null>(null);
    const requestRef = useRef<number | null>(null);

    // COCO-SSD is a bit less confident than custom models, so 60% is a good threshold
    // Change this from 0.60 to 0.75 or 0.80
    const CONFIDENCE_THRESHOLD = 0.75;

    // Maps generic AI terms to your hackathon's specific e-waste & recycling categories
    const mapWasteCategory = (detectedClass: string) => {
        // High-value electronics
        const eWasteHigh = ['laptop', 'tv', 'cell phone', 'refrigerator'];
        // Peripherals and small appliances
        const eWasteLow = ['mouse', 'keyboard', 'remote', 'microwave', 'toaster', 'oven'];
        // Recyclables
        const plasticsGlass = ['bottle', 'cup', 'bowl', 'vase'];
        const metals = ['fork', 'knife', 'spoon'];
        const paper = ['book'];

        if (eWasteHigh.includes(detectedClass)) {
            return { category: 'High-Value E-Waste', value: 'Est. Scrap: ₱150 - ₱500/unit' };
        }
        if (eWasteLow.includes(detectedClass)) {
            return { category: 'Peripherals / Small Tech', value: 'Est. Scrap: ₱20 - ₱50/unit' };
        }
        if (plasticsGlass.includes(detectedClass)) {
            return { category: 'Recyclables (Plastic/Glass)', value: 'Est. Scrap: ₱12 - ₱20/kg' };
        }
        if (metals.includes(detectedClass)) {
            return { category: 'Scrap Metal', value: 'Est. Scrap: ₱100 - ₱150/kg' };
        }
        if (paper.includes(detectedClass)) {
            return { category: 'Paper / Cardboard', value: 'Est. Scrap: ₱4 - ₱8/kg' };
        }

        // Fallback for anything else it sees (like 'chair', 'person', 'car')
        return { category: 'General / Non-Scrap', value: 'No significant local scrap value' };
    };
    // --- Load AI Model ---
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready(); // Ensure the TensorFlow engine is booted up first
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                console.log("Open-Source AI Model Loaded Successfully!");
            } catch (error) {
                console.error("Failed to load AI model.", error);
            }
        };
        loadModel();
    }, []);

    // --- Continuous Live Scanning Logic ---
    const detectFrame = async () => {
        if (activeMode === 'camera' && videoRef.current && model) {
            try {
                const predictions = await model.detect(videoRef.current);

                if (predictions.length > 0) {
                    // Find the prediction with the highest confidence score
                    const bestMatch = predictions.reduce((prev, current) =>
                        (prev.score > current.score) ? prev : current
                    );

                    if (bestMatch.score > CONFIDENCE_THRESHOLD && bestMatch.class !== 'person') {
                        const mappedData = mapWasteCategory(bestMatch.class);
                        setAiResult({
                            className: bestMatch.class,
                            category: mappedData.category,
                            value: mappedData.value,
                            probability: bestMatch.score
                        });
                    } else {
                        setAiResult(null);
                    }
                } else {
                    setAiResult(null); // Look at nothing, show nothing
                }
            } catch (err) {
                console.error("Inference error:", err);
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
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
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
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
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
        <div className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col font-sans">

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
                <div className="absolute bottom-10 inset-x-0 p-6 z-30 flex justify-center transition-all duration-300 ease-in-out">
                    <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-t-8 border-emerald-500">
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