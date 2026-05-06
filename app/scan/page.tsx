"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';

export default function ARScannerApp() {
    // --- App States ---
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [staticAiResult, setStaticAiResult] = useState<any | null>(null);

    // --- Camera Features States ---
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [isPaused, setIsPaused] = useState(false);
    
    // --- Zoom States ---
    const [zoomValue, setZoomValue] = useState<number>(1);
    const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
    const [zoomType, setZoomType] = useState<'hardware' | 'software'>('software');
    const [isZooming, setIsZooming] = useState(false); // NEW: Tracks if the user is actively sliding
    
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
    
    const streakCount = useRef<number>(0);
    const lastGuess = useRef<string>("");

    const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
    const [topPrediction, setTopPrediction] = useState<{ label: string, confidence: number } | null>(null);
    const lastHardwareUpdateTime = useRef<number>(0);

    const mapReciclaCategory = (className: string) => {
        const categories: Record<string, { category: string; value: string; hazard: boolean }> = {
            "Electronics": { category: 'E-Waste', value: '₱50 - ₱500/unit', hazard: true },
            "Bottle": { category: 'Plastic/Glass', value: '₱12/kg', hazard: false },
            "Sachet": { category: 'Residual Waste', value: 'No value', hazard: false },
            "Copperwire": { category: 'High-Value Metal', value: '₱350/kg', hazard: false },
            "Styrofoam": { category: 'Residual Waste', value: 'No local scrap value', hazard: false },
            "Paper Plate": { category: 'Paper / Compostable', value: 'No value (if soiled)', hazard: false },
            "Plastic Cup": { category: 'Recyclable Plastic', value: '₱6 - ₱10/kg', hazard: false },
            "Plastic Spoon": { category: 'Residual Plastic', value: '₱2 - ₱5/kg', hazard: false },
            "Plastic Fork": { category: 'Residual Plastic', value: '₱2 - ₱5/kg', hazard: false },
            "Paper Cup": { category: 'Mixed Waste', value: 'No value (wax-lined)', hazard: false },
            "Newspaper": { category: 'Paper', value: '₱5 - ₱8/kg', hazard: false },
            "Cardboard": { category: 'Paper', value: '₱4 - ₱6/kg', hazard: false },
            "Tire": { category: 'Special Waste', value: '₱10 - ₱50/unit', hazard: false },
            "Tupperware": { category: 'High-Grade Plastic', value: '₱15 - ₱20/kg', hazard: false },
            "Hanger": { category: 'Mixed Plastic/Metal', value: '₱5 - ₱10/kg', hazard: false },
            "Cloth": { category: 'Textile', value: '₱0 - ₱5/kg (rags)', hazard: false },
            "Bucket": { category: 'Hard Plastic', value: '₱10 - ₱15/kg', hazard: false },
            "Shoe": { category: 'Textile/Rubber', value: 'No local scrap value', hazard: false },
            "Battery": { category: 'Hazardous E-Waste', value: '₱100 - ₱300/kg (Lead)', hazard: true },
            "Wires": { category: 'Metal', value: '₱150 - ₱250/kg (Copper)', hazard: false },
            "Can": { category: 'Metal (Tin/Alu)', value: '₱40 - ₱60/kg', hazard: false },
            "Cigarette": { category: 'Residual Waste', value: 'No value', hazard: false },
            "Plastic": { category: 'Mixed Plastic', value: '₱8 - ₱12/kg', hazard: false },
            "Bag": { category: 'Textile/Plastic', value: 'No value', hazard: false },
            "Chair": { category: 'Bulky Waste', value: '₱20 - ₱100/unit', hazard: false },
            "Plate": { category: 'Ceramic/Glass', value: 'No scrap value', hazard: false },
            "Bulb": { category: 'Hazardous Waste', value: 'No value', hazard: true },
            "Sofa": { category: 'Bulky Waste', value: '₱50 - ₱150/unit', hazard: false },
            "Cabinet": { category: 'Bulky Waste', value: '₱50 - ₱200/unit', hazard: false },
            "LPG Tank": { category: 'Pressurized Metal', value: '₱300 - ₱800/unit', hazard: true },
            "Pan": { category: 'Scrap Metal', value: '₱30 - ₱50/kg', hazard: false },
            "Knife": { category: 'Sharp Metal', value: 'No scrap value', hazard: true },
            "Food": { category: 'Organic', value: 'Compostable', hazard: false },
            "Flipflops": { category: 'Rubber', value: 'No value', hazard: false },
            "Clock": { category: 'Small Electronics', value: '₱10 - ₱30/unit', hazard: false },
            "Watch": { category: 'Small Electronics', value: '₱10 - ₱50/unit', hazard: false },
            "Accessories": { category: 'Mixed Material', value: 'No value', hazard: false },
            "Background": {category: 'none', value: 'no value', hazard: false},
        };
        return categories[className] || { category: 'Unknown', value: 'Analyzing...', hazard: false };
    };

    // --- 1. Boot up the AI ---
    useEffect(() => {
        const loadModel = async () => {
            await tf.ready();
            // Replace this with your actual shareable link from the Export popup
            const URL = "https://teachablemachine.withgoogle.com/models/PvwXcyo1l/"; 
            const modelURL = URL + "model.json";
            const metadataURL = URL + "metadata.json";
            
            const loadedModel = await tmImage.load(modelURL, metadataURL);
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

            const isDesktop = window.innerWidth > window.innerHeight;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    ...(isDesktop ? { width: { ideal: 4096 }, height: { ideal: 2160 } } : {})
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

    const toggleCameraFacing = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current || !zoomRange) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const y = rect.bottom - e.clientY; 
    const percentage = Math.max(0, Math.min(1, y / rect.height));
    
    const newValue = zoomRange.min + percentage * (zoomRange.max - zoomRange.min);
    setZoomValue(newValue);
    zoomValueRef.current = newValue; 

    // NEW: Throttled Hardware Update
    // Only ask the physical lens to move if 200ms have passed since the last request
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

    // --- Screenshot & Gallery Logic ---
    const extractScreenshot = () => {
        if (!videoRef.current || !canvasRef.current) return null;
        
        const video = videoRef.current;
        const arCanvas = canvasRef.current;
        
        const screenCanvas = document.createElement('canvas');
        screenCanvas.width = arCanvas.width;
        screenCanvas.height = arCanvas.height;
        const screenCtx = screenCanvas.getContext('2d');
        if(!screenCtx) return null;

        const scale = Math.max(screenCanvas.width / video.videoWidth, screenCanvas.height / video.videoHeight);
        const scaledWidth = video.videoWidth * scale;
        const scaledHeight = video.videoHeight * scale;
        const offsetX = (screenCanvas.width - scaledWidth) / 2;
        const offsetY = (screenCanvas.height - scaledHeight) / 2;
        
        screenCtx.drawImage(video, offsetX, offsetY, scaledWidth, scaledHeight);
        screenCtx.drawImage(arCanvas, 0, 0); 
        
        return screenCanvas.toDataURL('image/jpeg', 0.9);
    };

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

                const imgData = extractScreenshot();
                if (imgData) {
                    setFlyAnim({ src: imgData, active: false });
                    
                    setTimeout(() => {
                        setFlyAnim(prev => prev ? { ...prev, active: true } : null);
                    }, 50);

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

    // --- 3. The HUD Detection Loop ---
    // --- 3. The HUD Detection Loop (Updated in page_11.tsx) ---
    // --- 3. The HUD Detection Loop ---
    // --- 3. The HUD Detection Loop (Supercharged) ---
    useEffect(() => {
        const classifyFrame = async () => {
            if (activeMode === 'camera' && videoRef.current && canvasRef.current && model) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                if (video.readyState === 4 && ctx) {
                    // Sync internal resolution
                    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                        canvas.width = canvas.clientWidth;
                        canvas.height = canvas.clientHeight;
                    }

                    // --- UPGRADE 1: THE TARGET CROP ---
                    // Create an invisible 224x224 canvas in memory
                    const cropCanvas = document.createElement('canvas');
                    cropCanvas.width = 224; 
                    cropCanvas.height = 224;
                    const cropCtx = cropCanvas.getContext('2d');
                    
                    if (cropCtx) {
                        // Calculate center square of the camera feed
                        const size = Math.min(video.videoWidth, video.videoHeight);
                        const startX = (video.videoWidth - size) / 2;
                        const startY = (video.videoHeight - size) / 2;
                        
                        // Draw ONLY the center of the video onto our square canvas
                        cropCtx.drawImage(video, startX, startY, size, size, 0, 0, 224, 224);

                        // Predict using the cropped square instead of the whole room
                        const predictions = await model.predict(cropCanvas);
                        predictions.sort((a, b) => b.probability - a.probability);
                        const bestMatch = predictions[0];

                        // Clear the previous frame
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // --- UPGRADE 3: DYNAMIC THRESHOLDS ---
                        // We check your mapReciclaCategory, or default to 0.75 if minConfidence isn't set
                        const mappedData = mapReciclaCategory(bestMatch.className) as any;
                        const threshold = mappedData.minConfidence || 0.75; 

                        // --- UPGRADE 2: SUSTAINED BUFFER ---
                        // Ignore the "Background" class completely, and check threshold
                        if (bestMatch.probability > threshold && bestMatch.className !== "Background") {
                            
                            // Check if the AI is guessing the same item as the last frame
                            if (bestMatch.className === lastGuess.current) {
                                streakCount.current += 1;
                            } else {
                                streakCount.current = 1;
                                lastGuess.current = bestMatch.className;
                            }

                            // ONLY show the HUD if the AI guessed it 5 frames in a row
                            if (streakCount.current >= 5) {
                                if (!topPrediction || topPrediction.label !== bestMatch.className) {
                                    setTopPrediction({ 
                                        label: bestMatch.className, 
                                        confidence: bestMatch.probability 
                                    });
                                }
                                drawHUD(ctx, canvas, bestMatch);
                            }
                        } else {
                            // If confidence drops or it sees "Background", reset the streak
                            streakCount.current = 0;
                        }
                    }
                }
            }
            if (activeMode === 'camera') {
                requestRef.current = requestAnimationFrame(classifyFrame);
            }
        };

        if (model && activeMode === 'camera') {
            requestRef.current = requestAnimationFrame(classifyFrame);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [model, activeMode]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setStaticAiResult(null);
            const imageUrl = URL.createObjectURL(file);
            setPreviewImage(imageUrl);
            setActiveMode('upload');
        }
    };

    const drawHUD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, match: any) => {
    const mapped = mapReciclaCategory(match.className);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const primaryColor = mapped.hazard ? '#ef4444' : '#10b981';

    ctx.save(); 

    // --- NEW: Add a faint scanning area background ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    // Draw dark overlay over the whole screen...
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ...but cut out a clear hole in the middle for the "Target Area"
    ctx.clearRect(centerX - 120, centerY - 120, 240, 240);

    // 1. Draw Corner Reticle
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    const size = 120; // Slightly larger target area
    const corner = 30;
    
    // Corners
    ctx.beginPath(); ctx.moveTo(centerX - size, centerY - size + corner); ctx.lineTo(centerX - size, centerY - size); ctx.lineTo(centerX - size + corner, centerY - size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX + size - corner, centerY - size); ctx.lineTo(centerX + size, centerY - size); ctx.lineTo(centerX + size, centerY - size + corner); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX - size, centerY + size - corner); ctx.lineTo(centerX - size, centerY + size); ctx.lineTo(centerX - size + corner, centerY + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX + size - corner, centerY + size); ctx.lineTo(centerX + size, centerY + size); ctx.lineTo(centerX + size, centerY + size - corner); ctx.stroke();

    // 2. Info Box Background (Attached to the bottom of the reticle)
    const boxW = 240;
    const boxH = 75;
    const boxX = centerX - boxW / 2;
    const boxY = centerY + size + 10; // Placed right under the clear box

    ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    ctx.fillStyle = primaryColor;
    ctx.fillRect(boxX, boxY, 4, boxH);

    // 3. HUD Labels
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(match.className.toUpperCase(), boxX + 15, boxY + 28);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '12px sans-serif';
    ctx.fillText(mapped.category, boxX + 15, boxY + 48);

    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(mapped.value, boxX + 15, boxY + 65);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full ">
                        <button onClick={startCamera} disabled={!model} className="w-full aspect-[1.2/1] flex flex-col items-center justify-center bg-[#7E8C54] border-[#6b7747] border-b-8 text-white hover:bg-[#6b7747] hover:border-[#7E8C54] border-b-8 rounded-2xl transition-all">
                            <img src="/images/camera_icon.png" alt="Camera Icon" className="w-18 h-18 mb-6 mx-auto"/>
                            <h3 className="text-xl font-bold mb-2">Live Camera</h3>
                            <p className="text-sm">Real-time AR HUD scanning.</p>
                        </button>
                        <label className="w-full aspect-[1.2/1] flex flex-col items-center justify-center bg-[#7E8C54] border-[#6b7747] border-b-8 text-white hover:bg-[#6b7747] hover:border-[#7E8C54] border-b-8 rounded-2xl transition-all cursor-pointer text-center">
                            <img src="/images/photos_icon.png" alt="Photos Icon" className="w-18 h-18 mb-6 mx-auto"/>
                            <h3 className="text-xl font-bold mb-2">Upload Photo</h3>
                            <p className="text-sm">Analyze from camera roll.</p>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={!model} />
                        </label> 
                    </div>
                </div>
                <footer className="absolute bottom-0 left-0 w-full z-0 leading-[0] overflow-hidden">
                    <img alt="Tropical Leaves" className="w-full h-[40vh] md:h-[53vh] object-cover object-top pointer-events-none drop-shadow-2xl" src="/images/footer.png" />
                </footer>
            </main>
        );
    }

    // ==========================================
    // RENDER: NATIVE CAMERA UI
    // ==========================================
    return (
        <main className="fixed inset-0 w-[100vw] h-[100dvh] bg-black flex flex-col font-sans overflow-hidden overscroll-none">
            
            <div className="h-16 w-full flex items-center justify-between px-6 z-20 bg-black md:absolute md:top-0 md:bg-transparent md:h-auto md:pt-8 md:bg-gradient-to-b md:from-black/60 md:to-transparent md:pb-12">
                <button
                    onClick={() => { stopCamera(); setActiveMode('selection'); setPreviewImage(null); }}
                    className="text-white hover:text-emerald-400 transition-colors text-xs uppercase tracking-widest bg-black/40 md:backdrop-blur-md px-4 py-2 rounded-full border border-transparent md:border-white/20"
                >
                    &#8592; Close
                </button>
                {activeMode === 'camera' && (
                    <div className={`rounded-full text-xs font-bold flex items-center bg-black/40 md:backdrop-blur-md px-4 py-2 border border-transparent md:border-white/20`}>
                        <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                    </div>
                )}
            </div>

            <div className="relative flex-1 w-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden md:absolute md:inset-0 md:z-0">
                {activeMode === 'camera' && (
                    <>
                        <div 
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                                transform: zoomType === 'software' ? `scale(${zoomValue})` : 'scale(1)',
                                transition: 'transform 0.1s linear',
                                transformOrigin: 'center center'
                            }}
                        >
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
                        </div>

                        {/* MINIMALIST ZOOM CONTROL */}
                        {zoomRange && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto w-12">
                                {/* Fading Text */}
                                <span className={`text-white text-[12px] font-medium mb-3 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-opacity duration-300 ${isZooming ? 'opacity-100' : 'opacity-50'}`}>
                                    {zoomValue.toFixed(1)}x
                                </span>
                                
                                {/* Invisible touch area with ultra-thin visible track */}
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
    onPointerMove={(e) => {
        if (isDraggingRef.current) handlePointerMove(e);
    }}
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
    {/* The faint background line (1px) */}
    <div className="absolute top-0 bottom-0 w-[1px] bg-white/20 rounded-full" />
    
    {/* The active fill line (2px white) */}
    <div 
        className="absolute bottom-0 w-[2px] bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_5px_rgba(255,255,255,0.5)]"
        style={{ 
            height: `${((zoomValue - zoomRange.min) / (zoomRange.max - zoomRange.min)) * 100}%` 
        }}
    />
    
    {/* The Dot - Expands slightly when zooming */}
    <div 
        className={`absolute left-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.4)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 ease-out ${isZooming ? 'scale-100 opacity-100' : 'scale-50 opacity-60'}`}
        style={{ 
            bottom: `calc(${((zoomValue - zoomRange.min) / (zoomRange.max - zoomRange.min)) * 100}% - 8px)`
        }}
    />
</div>
                            </div>
                        )}

                        {flashActive && (
                            <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 opacity-80"></div>
                        )}

                        {flyAnim && (
                            <img 
                                src={flyAnim.src} 
                                alt="Captured frame"
                                className={`fixed z-50 object-cover border-2 border-white/50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                                    flyAnim.active 
                                        ? 'w-12 h-12 bottom-12 md:bottom-20 left-10 opacity-0 rounded-lg scale-50' 
                                        : 'w-[80vw] h-[60vh] top-[20vh] left-[10vw] opacity-100 rounded-3xl scale-100' 
                                }`}
                            />
                        )}
                    </>
                )}
                {activeMode === 'upload' && previewImage && (
                    <img src={previewImage} alt="Upload preview" className="w-full h-full object-contain p-4 md:object-cover" />
                )}
            </div>

            <div className="h-40 w-full flex flex-col items-center justify-end pb-8 z-20 bg-black text-white md:absolute md:bottom-0 md:bg-transparent md:h-auto md:pb-12 md:bg-gradient-to-t md:from-black/60 md:to-transparent md:pt-20">
                
                <div className="flex space-x-6 text-xs font-medium text-gray-400 mb-6 drop-shadow-md">
                    <span className="text-yellow-500">Capture</span>
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