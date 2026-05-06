"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export default function ARScannerApp() {
    // --- App States ---
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // --- Camera Features States ---
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [isPaused, setIsPaused] = useState(false);

    // --- Zoom States ---
    const [zoomValue, setZoomValue] = useState<number>(1);
    const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
    const [zoomType, setZoomType] = useState<'hardware' | 'software'>('software');
    const [isZooming, setIsZooming] = useState(false);

    const zoomValueRef = useRef<number>(1);
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef<boolean>(false);

    // --- Gallery & Screenshot States ---
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [flashActive, setFlashActive] = useState(false);
    const [flyAnim, setFlyAnim] = useState<{ src: string, active: boolean } | null>(null);
    const [thumbPulse, setThumbPulse] = useState(false);

    // --- Refs ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    const isMounted = useRef<boolean>(true); // PREVENTION 2: Memory Leak flag

    // --- AI States & Buffers ---
    const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
    const [objectDetector, setObjectDetector] = useState<cocoSsd.ObjectDetection | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(true); // PREVENTION 4: Loading State
    const [topPrediction, setTopPrediction] = useState<{ label: string, confidence: number } | null>(null);
    
    const lastHardwareUpdateTime = useRef<number>(0);
    const predictionBuffer = useRef<string[]>([]);
    const BUFFER_SIZE = 8; 
    const REQUIRED_HITS = 5; 

    const mapReciclaCategory = (className: string) => {
        const categories: Record<string, { category: string; value: string; hazard: boolean, minConfidence: number }> = {
            "Electronics": { category: 'E-Waste', value: '₱50 - ₱500/unit', hazard: true, minConfidence: 0.70 },
            "Bottle": { category: 'Plastic/Glass', value: '₱12/kg', hazard: false, minConfidence: 0.75 },
            "Copperwire": { category: 'High-Value Metal', value: '₱350/kg', hazard: false, minConfidence: 0.80 },
            "Battery": { category: 'Hazardous E-Waste', value: '₱100 - ₱300/kg (Lead)', hazard: true, minConfidence: 0.85 },
            "Background": { category: 'none', value: 'no value', hazard: false, minConfidence: 0.0 },
        };
        return categories[className] || { category: 'Unknown', value: 'Analyzing...', hazard: false, minConfidence: 0.70 };
    };

    // --- 1. Boot up Both AI Models safely ---
    useEffect(() => {
        isMounted.current = true;
        const loadModels = async () => {
            try {
                await tf.ready();
                const URL = "https://teachablemachine.withgoogle.com/models/PvwXcyo1l/";
                const loadedTM = await tmImage.load(URL + "model.json", URL + "metadata.json");
                const loadedCoco = await cocoSsd.load();
                
                if (isMounted.current) {
                    setModel(loadedTM);
                    setObjectDetector(loadedCoco);
                    setIsModelLoading(false);
                }
            } catch (error) {
                console.error("Failed to load AI Models:", error);
                alert("Please check your internet connection to load the AI.");
            }
        };
        loadModels();

        return () => { isMounted.current = false; };
    }, []);

    // --- 2. Live Camera Logic (with Hardware Constraints) ---
    const startCamera = async () => {
        setActiveMode('camera');
        setIsPaused(false);
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // PREVENTION: Force highest possible resolution from the hardware
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 4096, min: 1280 },
                    height: { ideal: 2160, min: 720 },
                    frameRate: { ideal: 30, max: 30 }
                }
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const [track] = stream.getVideoTracks();
            const capabilities = track.getCapabilities() as any;

            if (capabilities.zoom) {
                setZoomType('hardware');
                setZoomRange({
                    min: capabilities.zoom.min || 1,
                    max: capabilities.zoom.max || 3,
                    step: capabilities.zoom.step || 0.1
                });
                const settings = track.getSettings() as any;
                const initialZoom = settings.zoom || capabilities.zoom.min || 1;
                setZoomValue(initialZoom);
                zoomValueRef.current = initialZoom;
            } else {
                setZoomType('software');
                setZoomRange({ min: 1, max: 3, step: 0.1 });
                setZoomValue(1);
                zoomValueRef.current = 1;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Please allow camera access to use Live Scan.");
            setActiveMode('selection');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
    };

    // PREVENTION 1: Handle Backgrounding / Tab Switching
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopCamera();
                setIsPaused(true);
            } else if (activeMode === 'camera' && !document.hidden) {
                startCamera();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [activeMode, facingMode]);

    // Handle full cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const toggleCameraFacing = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    // --- Minimalist Zoom Logic ---
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!sliderRef.current || !zoomRange) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const y = rect.bottom - e.clientY;
        const percentage = Math.max(0, Math.min(1, y / rect.height));
        const newValue = zoomRange.min + percentage * (zoomRange.max - zoomRange.min);
        
        setZoomValue(newValue);
        zoomValueRef.current = newValue;

        const now = Date.now();
        if (now - lastHardwareUpdateTime.current > 200) {
            applyHardwareZoom();
            lastHardwareUpdateTime.current = now;
        }
    };

    const applyHardwareZoom = async () => {
        if (zoomType === 'hardware' && streamRef.current) {
            const track = streamRef.current.getVideoTracks()[0];
            try {
                await track.applyConstraints({ advanced: [{ zoom: zoomValueRef.current }] } as any);
            } catch (err) {
                console.error("Zoom apply failed", err);
            }
        }
    };

    // --- Screenshot Logic ---
    const toggleCaptureFreeze = () => {
        if (videoRef.current) {
            if (isPaused) {
                videoRef.current.play();
                setIsPaused(false);
            } else {
                videoRef.current.pause();
                setIsPaused(true);
                setFlashActive(true);
                setTimeout(() => setFlashActive(false), 150);

                if (canvasRef.current) {
                    const imgData = canvasRef.current.toDataURL('image/jpeg', 0.9);
                    setFlyAnim({ src: imgData, active: false });
                    setTimeout(() => setFlyAnim(prev => prev ? { ...prev, active: true } : null), 50);
                    setTimeout(() => {
                        setCapturedImages(prev => [...prev, imgData]);
                        setFlyAnim(null);
                        setThumbPulse(true);
                        setTimeout(() => setThumbPulse(false), 300);
                    }, 600);
                }
            }
        }
    };

    // --- 3. The Supercharged Dual-Scanning Loop ---
    useEffect(() => {
        let lastFrameTime = 0;
        const fpsInterval = 1000 / 10; // Throttle to 10fps for thermal management

        const classifyFrame = async (timestamp: number) => {
            if (!isMounted.current) return; // Exit if unmounted

            if (activeMode === 'camera' && videoRef.current && canvasRef.current && model && objectDetector && !isPaused) {
                
                if (timestamp - lastFrameTime < fpsInterval) {
                    requestRef.current = requestAnimationFrame(classifyFrame);
                    return;
                }
                lastFrameTime = timestamp;

                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                // Ensure video has fully loaded its metadata
                if (video.readyState === 4 && ctx && video.videoWidth > 0) {
                    
                    // PREVENTION 3: Sync internal resolution perfectly 1:1
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }

                    // --- STAGE 1: THE FINDER (COCO-SSD) ---
                    const detections = await objectDetector.detect(video);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const validDetections = detections.filter(d => d.class !== 'person');

                    if (validDetections.length > 0) {
                        const target = validDetections[0];
                        // Because canvas width === videoWidth, we use the bbox directly!
                        const [vidX, vidY, vidWidth, vidHeight] = target.bbox; 

                        // --- STAGE 2: THE EXPERT (TEACHABLE MACHINE) ---
                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = 224;
                        cropCanvas.height = 224;
                        const cropCtx = cropCanvas.getContext('2d');

                        if (cropCtx) {
                            // Apply contrast filter for blurry webcams
                            cropCtx.filter = 'contrast(1.2) saturate(1.3) brightness(1.1)';
                            
                            cropCtx.drawImage(
                                video,
                                vidX, vidY, vidWidth, vidHeight, 
                                0, 0, 224, 224                   
                            );
                            
                            cropCtx.filter = 'none';

                            const predictions = await model.predict(cropCanvas);
                            predictions.sort((a, b) => b.probability - a.probability);
                            const bestMatch = predictions[0];
                            const mappedData = mapReciclaCategory(bestMatch.className);
                            const threshold = mappedData.minConfidence;

                            if (bestMatch.probability > threshold && bestMatch.className !== "Background") {
                                predictionBuffer.current.push(bestMatch.className);
                            } else {
                                predictionBuffer.current.push("Background");
                            }

                            if (predictionBuffer.current.length > BUFFER_SIZE) {
                                predictionBuffer.current.shift();
                            }

                            const counts = predictionBuffer.current.reduce((acc, curr) => {
                                acc[curr] = (acc[curr] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);

                            let dominantClass = "Background";
                            let highestCount = 0;
                            for (const [className, count] of Object.entries(counts)) {
                                if (count > highestCount) {
                                    highestCount = count;
                                    dominantClass = className;
                                }
                            }

                            if (dominantClass !== "Background" && highestCount >= REQUIRED_HITS) {
                                const actualMatch = predictions.find(p => p.className === dominantClass) || bestMatch;
                                
                                if (!topPrediction || topPrediction.label !== dominantClass) {
                                    setTopPrediction({ label: dominantClass, confidence: actualMatch.probability });
                                }
                                
                                const primaryColor = mappedData.hazard ? '#ef4444' : '#10b981';
                                ctx.strokeStyle = primaryColor;
                                ctx.lineWidth = 6; // Thicker line since we are in intrinsic video resolution
                                ctx.strokeRect(vidX, vidY, vidWidth, vidHeight);

                                drawHUD(ctx, actualMatch, mappedData, vidX, vidY, vidWidth, vidHeight);
                            }
                        }
                    } else {
                        predictionBuffer.current.push("Background");
                        if (predictionBuffer.current.length > BUFFER_SIZE) predictionBuffer.current.shift();
                    }
                }
            }
            if (activeMode === 'camera' && !isPaused) {
                requestRef.current = requestAnimationFrame(classifyFrame);
            }
        };

        if (model && objectDetector && activeMode === 'camera' && !isPaused) {
            requestRef.current = requestAnimationFrame(classifyFrame);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [model, objectDetector, activeMode, isPaused]);

    // --- Dynamic HUD Renderer ---
    const drawHUD = (ctx: CanvasRenderingContext2D, match: any, mapped: any, x: number, y: number, width: number, height: number) => {
        const primaryColor = mapped.hazard ? '#ef4444' : '#10b981';
        ctx.save();

        // Scale HUD elements up slightly since we are drawing on native video resolution
        const scaleFactor = 1.5; 
        const boxW = 240 * scaleFactor;
        const boxH = 85 * scaleFactor;
        
        const boxX = x + (width / 2) - (boxW / 2);
        const boxY = y + height + (20 * scaleFactor);

        // Background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();

        // Accent Line
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, 8, boxH, [8, 0, 0, 8]);
        ctx.fill();

        // Text Labels
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${18 * scaleFactor}px sans-serif`;
        ctx.fillText(match.className.toUpperCase().substring(0, 18), boxX + (20 * scaleFactor), boxY + (30 * scaleFactor));

        ctx.fillStyle = '#d4d4d8';
        ctx.font = `${14 * scaleFactor}px sans-serif`;
        ctx.fillText(mapped.category, boxX + (20 * scaleFactor), boxY + (52 * scaleFactor));

        ctx.fillStyle = primaryColor;
        ctx.font = `bold ${15 * scaleFactor}px sans-serif`;
        ctx.fillText(mapped.value, boxX + (20 * scaleFactor), boxY + (72 * scaleFactor));

        ctx.restore();
    };

    // ==========================================
    // RENDER: SELECTION SCREEN
    // ==========================================
    if (activeMode === 'selection') {
        return (
            <main className="min-h-screen bg-white text-484848 relative flex flex-col font-sans">
                <nav className="relative z-10 w-full p-6 flex justify-between items-center">
                    <Link href="/" className="text-black hover:text-gray-400 transition-colors text-sm uppercase tracking-widest">&#8592; Back</Link>
                </nav>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 w-full max-w-4xl mx-auto pb-32">
                    
                    {isModelLoading && (
                        <div className="mb-8 flex flex-col items-center text-[#7E8C54]">
                            <div className="w-8 h-8 border-4 border-[#7E8C54] border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-bold uppercase tracking-widest">Waking up AI...</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full ">
                        <button onClick={startCamera} disabled={isModelLoading} className="w-full aspect-[1.2/1] flex flex-col items-center justify-center bg-[#7E8C54] border-[#6b7747] border-b-8 text-white hover:bg-[#6b7747] hover:border-[#7E8C54] rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <h3 className="text-xl font-bold mb-2">Live Camera</h3>
                            <p className="text-sm">Real-time AR HUD scanning.</p>
                        </button>
                        <label className={`w-full aspect-[1.2/1] flex flex-col items-center justify-center bg-[#7E8C54] border-[#6b7747] border-b-8 text-white hover:bg-[#6b7747] hover:border-[#7E8C54] rounded-2xl transition-all text-center ${isModelLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <h3 className="text-xl font-bold mb-2">Upload Photo</h3>
                            <p className="text-sm">Analyze from camera roll.</p>
                            <input type="file" accept="image/*" className="hidden" disabled={isModelLoading} />
                        </label>
                    </div>
                </div>
            </main>
        );
    }

    // ==========================================
    // RENDER: SCANNER VIEW
    // ==========================================
    return (
        <main className="fixed inset-0 w-[100vw] h-[100dvh] bg-black flex flex-col font-sans overflow-hidden overscroll-none">
            {/* Top Navigation */}
            <div className="h-16 w-full flex items-center justify-between px-6 z-20 bg-black md:absolute md:top-0 md:bg-transparent md:h-auto md:pt-8 md:bg-gradient-to-b md:from-black/60 md:to-transparent md:pb-12">
                <button
                    onClick={() => { stopCamera(); setActiveMode('selection'); }}
                    className="text-white hover:text-emerald-400 transition-colors text-xs uppercase tracking-widest bg-black/40 md:backdrop-blur-md px-4 py-2 rounded-full border border-transparent md:border-white/20"
                >
                    &#8592; Close
                </button>
                {activeMode === 'camera' && (
                    <div className="rounded-full text-xs font-bold flex items-center bg-black/40 md:backdrop-blur-md px-4 py-2 border border-transparent md:border-white/20">
                        <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    </div>
                )}
            </div>

            {/* Video & AR Canvas Viewfinder */}
            <div className="relative flex-1 w-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden md:absolute md:inset-0 md:z-0">
                {activeMode === 'camera' && (
                    <>
                        <div
                            className="absolute inset-0 w-full h-full flex items-center justify-center"
                            style={{
                                transform: zoomType === 'software' ? `scale(${zoomValue})` : 'scale(1)',
                                transition: 'transform 0.1s linear',
                                transformOrigin: 'center center'
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay playsInline muted
                                className="absolute w-full h-full object-cover"
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute w-full h-full object-cover pointer-events-none z-10"
                            />
                        </div>

                        {/* Minimalist Zoom Slider */}
                        {zoomRange && !isPaused && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto w-12">
                                <span className={`text-white text-[12px] font-medium mb-3 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-opacity duration-300 ${isZooming ? 'opacity-100' : 'opacity-50'}`}>
                                    {zoomValue.toFixed(1)}x
                                </span>
                                <div
                                    ref={sliderRef}
                                    className="relative w-8 h-32 md:h-48 flex justify-center cursor-pointer touch-none group select-none"
                                    draggable={false}
                                    onPointerDown={(e) => {
                                        isDraggingRef.current = true;
                                        setIsZooming(true);
                                        sliderRef.current?.setPointerCapture(e.pointerId);
                                        handlePointerMove(e);
                                    }}
                                    onPointerMove={(e) => { if (isDraggingRef.current) handlePointerMove(e); }}
                                    onPointerUp={(e) => {
                                        isDraggingRef.current = false;
                                        setIsZooming(false);
                                        sliderRef.current?.releasePointerCapture(e.pointerId);
                                        applyHardwareZoom();
                                    }}
                                    onPointerCancel={(e) => {
                                        isDraggingRef.current = false;
                                        setIsZooming(false);
                                        sliderRef.current?.releasePointerCapture(e.pointerId);
                                    }}
                                >
                                    <div className="absolute top-0 bottom-0 w-[1px] bg-white/20 rounded-full" />
                                    <div
                                        className="absolute bottom-0 w-[2px] bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                                        style={{ height: `${((zoomValue - zoomRange.min) / (zoomRange.max - zoomRange.min)) * 100}%` }}
                                    />
                                    <div
                                        className={`absolute left-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.4)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ease-out ${isZooming ? 'scale-100 opacity-100' : 'scale-50 opacity-60'}`}
                                        style={{ bottom: `calc(${((zoomValue - zoomRange.min) / (zoomRange.max - zoomRange.min)) * 100}% - 8px)` }}
                                    />
                                </div>
                            </div>
                        )}

                        {flashActive && <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 opacity-80"></div>}

                        {flyAnim && (
                            <img
                                src={flyAnim.src}
                                alt="Captured frame"
                                className={`fixed z-50 object-cover border-2 border-white/50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${flyAnim.active
                                    ? 'w-12 h-12 bottom-12 md:bottom-20 left-10 opacity-0 rounded-lg scale-50'
                                    : 'w-[80vw] h-[60vh] top-[20vh] left-[10vw] opacity-100 rounded-3xl scale-100'
                                    }`}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="h-40 w-full flex flex-col items-center justify-end pb-8 z-20 bg-black text-white md:absolute md:bottom-0 md:bg-transparent md:h-auto md:pb-12 md:bg-gradient-to-t md:from-black/60 md:to-transparent md:pt-20">
                <div className="flex space-x-6 text-xs font-medium text-gray-400 mb-6 drop-shadow-md">
                    <span className="text-emerald-500">Recicla AR Scan</span>
                </div>

                <div className="w-full flex justify-between items-center px-10 max-w-2xl mx-auto">
                    <div className={`w-12 h-12 rounded-lg bg-white/10 md:bg-white/20 md:backdrop-blur-md overflow-hidden relative border border-white/20 transition-transform duration-200 ${thumbPulse ? 'scale-125' : 'scale-100'}`}>
                        {capturedImages.length > 0 && (
                            <img src={capturedImages[capturedImages.length - 1]} alt="Gallery latest" className="w-full h-full object-cover" />
                        )}
                    </div>

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