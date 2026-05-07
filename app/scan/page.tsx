"use client";

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as tmImage from '@teachablemachine/image';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { useRouter } from 'next/navigation';

export default function ARScannerApp() {
    const router = useRouter();
    const [activeMode, setActiveMode] = useState<'selection' | 'camera' | 'upload'>('selection');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [zoomValue, setZoomValue] = useState<number>(1);
    const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
    const [zoomType, setZoomType] = useState<'hardware' | 'software'>('software');
    const [isZooming, setIsZooming] = useState(false);
    const zoomValueRef = useRef<number>(1);
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef<boolean>(false);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [flashActive, setFlashActive] = useState(false);
    const [flyAnim, setFlyAnim] = useState<{ src: string, active: boolean } | null>(null);
    const [thumbPulse, setThumbPulse] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    const renderRef = useRef<number | null>(null);
    const isDetecting = useRef<boolean>(false);
    const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
    const [objectDetector, setObjectDetector] = useState<cocoSsd.ObjectDetection | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const lastHardwareUpdateTime = useRef<number>(0);
    const trackedObjectsRef = useRef<Array<{ bbox: number[], match: any, mapped: any }>>([]);

   
    useEffect(() => {
        localStorage.removeItem('lastCapturedImage');
        localStorage.removeItem('lastScanResults');
        localStorage.removeItem('lastAnalyzedItem');
        document.cookie = "scan_in_progress=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }, []);

    const mapReciclaCategory = (className: string) => {
        const categories: Record<string, { category: string; value: string; hazard: boolean; minConfidence: number }> = {
            "Electronics": { category: 'E-Waste', value: '₱50 - ₱500/unit', hazard: true, minConfidence: 0.70 },
            "Battery": { category: 'Hazardous E-Waste', value: '₱100 - ₱300/kg (Lead)', hazard: true, minConfidence: 0.80 },
            "Wire": { category: 'High-Value Metal', value: '₱350/kg', hazard: false, minConfidence: 0.75 },
            "Can": { category: 'Metal (Tin/Alu)', value: '₱40 - ₱60/kg', hazard: false, minConfidence: 0.75 },
            "Copperwire": { category: 'High-Value Metal', value: '₱350/kg', hazard: false, minConfidence: 0.75 },
            "Bottle": { category: 'Plastic/Glass', value: '₱12/kg', hazard: false, minConfidence: 0.65 },
            "Plastic Cup": { category: 'Recyclable Plastic', value: '₱6 - ₱10/kg', hazard: false, minConfidence: 0.70 },
            "Plastic": { category: 'Mixed Plastic', value: '₱8 - ₱12/kg', hazard: false, minConfidence: 0.90 },
            "Tupperware": { category: 'High-Grade Plastic', value: '₱15 - ₱20/kg', hazard: false, minConfidence: 0.75 },
            "Bucket": { category: 'Hard Plastic', value: '₱10 - ₱15/kg', hazard: false, minConfidence: 0.75 },
            "Plastic Spoon": { category: 'Residual Plastic', value: '₱2 - ₱5/kg', hazard: false, minConfidence: 0.70 },
            "Plastic Fork": { category: 'Residual Plastic', value: '₱2 - ₱5/kg', hazard: false, minConfidence: 0.70 },
            "Cardboard": { category: 'Paper', value: '₱4 - ₱6/kg', hazard: false, minConfidence: 0.80 },
            "Newspaper": { category: 'Paper', value: '₱5 - ₱8/kg', hazard: false, minConfidence: 0.80 },
            "Paper Plate": { category: 'Paper / Compostable', value: 'No value (if soiled)', hazard: false, minConfidence: 0.75 },
            "Paper Cup": { category: 'Mixed Waste', value: 'No value (wax-lined)', hazard: false, minConfidence: 0.75 },
            "Sachet": { category: 'Residual Waste', value: 'No value', hazard: false, minConfidence: 0.70 },
            "Styrofoam": { category: 'Residual Waste', value: 'No local scrap value', hazard: false, minConfidence: 0.80 },
            "Tire": { category: 'Special Waste', value: '₱10 - ₱50/unit', hazard: false, minConfidence: 0.85 },
            "Cigarette": { category: 'Residual Waste', value: 'No value', hazard: false, minConfidence: 0.80 },
            "Bulb": { category: 'Hazardous Waste', value: 'No value', hazard: true, minConfidence: 0.85 },
            "Cloth": { category: 'Textile', value: '₱0 - ₱5/kg (rags)', hazard: false, minConfidence: 0.85 },
            "Shoe": { category: 'Textile/Rubber', value: 'No local scrap value', hazard: false, minConfidence: 0.75 },
            "Bag": { category: 'Textile/Plastic', value: 'No value', hazard: false, minConfidence: 0.75 },
            "Hanger": { category: 'Mixed Plastic/Metal', value: '₱5 - ₱10/kg', hazard: false, minConfidence: 0.80 },
            "Flipflops": { category: 'Rubber', value: 'No value', hazard: false, minConfidence: 0.80 },
            "Chair": { category: 'Bulky Waste', value: '₱20 - ₱100/unit', hazard: false, minConfidence: 0.85 },
            "Cabinet": { category: 'Bulky Waste', value: '₱50 - ₱200/unit', hazard: false, minConfidence: 0.85 },
            "Sofa": { category: 'Bulky Waste', value: '₱50 - ₱150/unit', hazard: false, minConfidence: 0.85 },
            "Pan": { category: 'Scrap Metal', value: '₱30 - ₱50/kg', hazard: false, minConfidence: 0.80 },
            "Knife": { category: 'Sharp Metal', value: 'No scrap value', hazard: true, minConfidence: 0.85 },
            "Plate": { category: 'Ceramic/Glass', value: 'No scrap value', hazard: false, minConfidence: 0.80 },
            "Glass": { category: 'Ceramic/Glass', value: 'No scrap value', hazard: false, minConfidence: 0.70 },
            "Clock": { category: 'Small Electronics', value: '₱10 - ₱30/unit', hazard: false, minConfidence: 0.80 },
            "Watch": { category: 'Small Electronics', value: '₱10 - ₱50/unit', hazard: false, minConfidence: 0.80 },
            "Accessories": { category: 'Mixed Material', value: 'No value', hazard: false, minConfidence: 0.75 },
            "Food": { category: 'Organic', value: 'Compostable', hazard: false, minConfidence: 0.85 },
            "Background": { category: 'none', value: 'no value', hazard: false, minConfidence: 0.0 },
            "Paper": { category: 'Paper', value: '₱4 - ₱8/kg', hazard: false, minConfidence: 0.90 },
        };
        return categories[className] || { category: 'Unknown', value: 'Analyzing...', hazard: false, minConfidence: 0.70 };
    };

    useEffect(() => {
        const loadModels = async () => {
            try {
                await tf.ready();
                const URL = "/model/";
                const loadedTM = await tmImage.load(URL + "model.json", URL + "metadata.json");
                const loadedCoco = await cocoSsd.load();
                setModel(loadedTM);
                setObjectDetector(loadedCoco);
                setIsModelLoading(false);
            } catch (e) {
                console.error("Failed to load models", e);
            }
        };
        loadModels();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const rawBase64 = event.target?.result as string;

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            
            if (scaleSize < 1) {
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            try {
                localStorage.setItem('lastCapturedImage', compressedBase64);
                localStorage.removeItem('lastScanResults');
                document.cookie = "scan_in_progress=true; max-age=600; path=/";
                router.push('/information');
            } catch (err) {
                console.error("Storage quota still exceeded after compression:", err);
                alert("This image is still too large to process. Please try a smaller photo.");
            }
        };
        img.src = rawBase64;
    };
    reader.readAsDataURL(file);
};

    const startCamera = async () => {
        setActiveMode('camera');
        try {
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            const isDesktop = window.innerWidth > window.innerHeight;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    ...(isDesktop ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : {})
                }
            });

            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;

            const [track] = stream.getVideoTracks();
            const capabilities = track.getCapabilities() as any;

            if (capabilities.zoom) {
                setZoomType('hardware');
                setZoomRange({ min: capabilities.zoom.min || 1, max: capabilities.zoom.max || 3, step: capabilities.zoom.step || 0.1 });
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
        if (activeMode === 'camera') startCamera();
    }, [facingMode]);

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (renderRef.current) cancelAnimationFrame(renderRef.current);
    };

    const toggleCameraFacing = () => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');

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
            try { await track.applyConstraints({ advanced: [{ zoom: zoomValueRef.current }] } as any); } catch (err) { }
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            setFlashActive(true);
            setTimeout(() => setFlashActive(false), 150);
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoRef.current.videoWidth;
            tempCanvas.height = videoRef.current.videoHeight;
            const ctx = tempCanvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
            }

            const imgData = tempCanvas.toDataURL('image/jpeg', 0.8);

            localStorage.removeItem('lastScanResults');
            localStorage.setItem('lastCapturedImage', imgData);

            document.cookie = "scan_in_progress=true; max-age=600; path=/";

            if (trackedObjectsRef.current.length > 0) {
                localStorage.setItem('lastAnalyzedItem', JSON.stringify(trackedObjectsRef.current[0]));
            } else {
                localStorage.removeItem('lastAnalyzedItem');
            }

            setFlyAnim({ src: imgData, active: false });
            setTimeout(() => setFlyAnim(prev => prev ? { ...prev, active: true } : null), 50);
            setTimeout(() => {
                setCapturedImages(prev => [...prev, imgData]);
                setFlyAnim(null);
                setThumbPulse(true);
                setTimeout(() => setThumbPulse(false), 300);
            }, 600);
        }
    };

    useEffect(() => {
        let lastFrameTime = 0;
        const fpsInterval = 1000 / 5;

        const classifyFrame = async (timestamp: number) => {
            if (activeMode === 'camera' && videoRef.current && model && objectDetector) {
                const video = videoRef.current;

                if (video.readyState === 4 && !isDetecting.current) {
                    if (timestamp - lastFrameTime < fpsInterval) {
                        requestRef.current = requestAnimationFrame(classifyFrame);
                        return;
                    }
                    lastFrameTime = timestamp;
                    isDetecting.current = true;

                    try {
                        const detections = await objectDetector.detect(video, 20, 0.6);
                        const validTargets = detections.filter(d => d.class !== 'person').slice(0, 3);
                        const activeTrackers = [];

                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = 224;
                        cropCanvas.height = 224;
                        const cropCtx = cropCanvas.getContext('2d');

                        if (cropCtx) {
                            for (const target of validTargets) {
                                const [rawX, rawY, rawWidth, rawHeight] = target.bbox;
                                const baseSize = Math.max(rawWidth, rawHeight);
                                const size = baseSize * 1.8;
                                const centerX = rawX + rawWidth / 2;
                                const centerY = rawY + rawHeight / 2;

                                let squareX = centerX - size / 2;
                                let squareY = centerY - size / 2;

                                squareX = Math.max(0, squareX);
                                squareY = Math.max(0, squareY);
                                const safeSize = Math.min(
                                    size,
                                    video.videoWidth - squareX,
                                    video.videoHeight - squareY
                                );

                                if (safeSize <= 0) continue;

                                cropCtx.drawImage(
                                    video,
                                    squareX, squareY, safeSize, safeSize,
                                    0, 0, 224, 224
                                );

                                const predictions = await model.predict(cropCanvas);
                                predictions.sort((a, b) => b.probability - a.probability);
                                const bestMatch = predictions[0];

                                const mappedData = mapReciclaCategory(bestMatch.className);
                                const threshold = mappedData.minConfidence;

                                if (bestMatch.probability > threshold && bestMatch.className !== "Background") {
                                    activeTrackers.push({
                                        bbox: target.bbox,
                                        match: bestMatch,
                                        mapped: mappedData
                                    });
                                }
                            }
                        }

                        if (validTargets.length === 0) {
                            const fallbackSize = Math.min(video.videoWidth, video.videoHeight) * 0.6;
                            const fallbackX = (video.videoWidth - fallbackSize) / 2;
                            const fallbackY = (video.videoHeight - fallbackSize) / 2;

                            if (cropCtx) {
                                cropCtx.drawImage(
                                    video,
                                    fallbackX, fallbackY, fallbackSize, fallbackSize,
                                    0, 0, 224, 224
                                );

                                const predictions = await model.predict(cropCanvas);
                                predictions.sort((a, b) => b.probability - a.probability);
                                const bestMatch = predictions[0];

                                const mappedData = mapReciclaCategory(bestMatch.className);
                                const threshold = mappedData.minConfidence;

                                if (bestMatch.probability > threshold && bestMatch.className !== "Background") {
                                    activeTrackers.push({
                                        bbox: [fallbackX, fallbackY, fallbackSize, fallbackSize],
                                        match: bestMatch,
                                        mapped: mappedData
                                    });
                                }
                            }
                        }

                        trackedObjectsRef.current = activeTrackers;

                    } catch (error) {
                        console.error("AI Multi-Detection Error:", error);
                    } finally {
                        isDetecting.current = false;
                    }
                }
            }

            if (activeMode === 'camera') {
                requestRef.current = requestAnimationFrame(classifyFrame);
            }
        };

        if (model && objectDetector && activeMode === 'camera') {
            requestRef.current = requestAnimationFrame(classifyFrame);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [model, objectDetector, activeMode]);

    useEffect(() => {
        const drawFrame = () => {
            if (activeMode === 'camera' && videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                if (ctx && video.videoWidth > 0) {
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    trackedObjectsRef.current.forEach(item => {
                        drawMultiTargetHUD(ctx, canvas, item.bbox, item.match, item.mapped);
                    });
                }
            }
            if (activeMode === 'camera') {
                renderRef.current = requestAnimationFrame(drawFrame);
            }
        };

        if (activeMode === 'camera') {
            renderRef.current = requestAnimationFrame(drawFrame);
        }
        return () => { if (renderRef.current) cancelAnimationFrame(renderRef.current); };
    }, [activeMode]);

    const drawMultiTargetHUD = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, bbox: number[], match: any, mapped: any) => {
        const [x, y, width, height] = bbox;
        const primaryColor = mapped.hazard ? '#ef4444' : '#10b981';

        ctx.save();

        ctx.fillStyle = mapped.hazard ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 4;
        const cornerLength = Math.min(width, height) * 0.2;

        ctx.beginPath(); ctx.moveTo(x, y + cornerLength); ctx.lineTo(x, y); ctx.lineTo(x + cornerLength, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + width - cornerLength, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + cornerLength); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + height - cornerLength); ctx.lineTo(x, y + height); ctx.lineTo(x + cornerLength, y + height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + width - cornerLength, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - cornerLength); ctx.stroke();

        const boxW = 240;
        const boxH = 75;

        let boxX = x + width + 15;
        let boxY = y + (height / 2) - (boxH / 2);

        if (boxX + boxW > canvas.width) {
            boxX = x + (width / 2) - (boxW / 2);
            boxY = y + height + 15;
        }

        boxX = Math.max(10, Math.min(canvas.width - boxW - 10, boxX));
        boxY = Math.max(10, Math.min(canvas.height - boxH - 10, boxY));

        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = primaryColor;
        ctx.fillRect(boxX, boxY, 4, boxH);

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

    if (activeMode === 'selection') {
        return (
            <main className="min-h-screen bg-white text-[#484848] relative flex flex-col font-sans overflow-hidden">
                <div
                    className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md transition-all duration-1000 ease-in-out ${isModelLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <p className="text-sm md:text-base text-gray-600 font-medium tracking-wide mb-6">
                        We are getting it ready for you...
                    </p>
                    <div className="w-16 h-16 border-4 border-[#7E8C54] border-t-transparent rounded-full animate-spin mb-6"></div>
                </div>

                <nav className="relative z-10 w-full p-6 flex justify-between items-center">
                    <Link href="/" className="text-black hover:text-gray-400 transition-colors text-sm uppercase tracking-widest">&#8592; Back</Link>
                </nav>
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 w-full max-w-4xl mx-auto pb-32">

                    <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
                        <button
                            onClick={startCamera}
                            disabled={isModelLoading}
                            className="w-full h-full py-6 md:py-12 px-3 md:px-6 text-center flex flex-col items-center justify-center bg-[#7E8C54] border-[#6b7747] border-b-8 text-white hover:bg-[#6b7747] hover:border-[#7E8C54] rounded-2xl transition-all"
                        >
                            <img src="/images/camera_icon.png" alt="Camera Icon" className="w-10 h-10 md:w-18 md:h-18 mb-2 md:mb-6 mx-auto" />
                            <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2">Live Camera</h3>
                            <p className="text-xs md:text-sm">Real-time AR HUD scanning.</p>
                        </button>

                        <label
                            className="w-full h-full py-6 md:py-12 px-3 md:px-6 flex flex-col items-center justify-center bg-[#7E8C54] border-[#6b7747] border-b-8 text-white hover:bg-[#6b7747] hover:border-[#7E8C54] rounded-2xl transition-all text-center cursor-pointer"
                        >
                            <img src="/images/photos_icon.png" alt="Photos Icon" className="w-10 h-10 md:w-18 md:h-18 mb-2 md:mb-6 mx-auto" />
                            <h3 className="text-base md:text-xl font-bold mb-1 md:mb-2">Upload Photo</h3>
                            <p className="text-xs md:text-sm">Analyze from camera roll.</p>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isModelLoading}
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                </div>
                <footer className="absolute bottom-0 left-0 w-full z-0 leading-[0] overflow-hidden">
                    <img alt="Tropical Leaves" className="w-full h-[40vh] md:h-[53vh] object-cover object-top pointer-events-none drop-shadow-2xl" src="/images/footer.png" />
                </footer>
            </main>
        );
    }

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
                        <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></span>
                    </div>
                )}
            </div>

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
                        <div className="absolute top-4 right-4 md:top-24 md:right-6 z-[110] flex flex-col items-end pointer-events-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHelp(!showHelp);
                                }}
                                className="text-white bg-black/50 hover:bg-black/80 backdrop-blur-md px-3 py-2 md:px-5 md:py-2.5 rounded-full border border-white/20 transition-all hover:border-emerald-500 active:scale-95 text-[10px] md:text-[11px] font-bold uppercase tracking-wider shadow-2xl"
                            >
                                Not accurate?
                            </button>

                            {showHelp && (
                                <div className="mt-2 w-52 md:w-64 bg-black/95 backdrop-blur-2xl p-4 md:p-5 rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
                                    <p className="text-[11px] md:text-[12px] leading-relaxed text-gray-100 font-medium">
                                        Noticing issues?
                                    </p>
                                    <p className="mt-1.5 text-[11px] md:text-[12px] leading-relaxed text-gray-400">
                                        Try <span className="text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-500/30">capturing the image</span> and click the <span className="text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-500/30">album feature</span> for higher accuracy and details information.
                                    </p>
                                </div>
                            )}
                        </div>

                        {zoomRange && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center pointer-events-auto w-12">
                                <span className={`text-white text-[12px] font-medium mb-3 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-opacity duration-300 ${isZooming ? 'opacity-100' : 'opacity-50'}`}>
                                    {zoomValue.toFixed(1)}x
                                </span>

                                <div
                                    ref={sliderRef}
                                    className="relative w-8 h-32 md:h-48 flex justify-center cursor-pointer touch-none group select-none"
                                    draggable={false}
                                    onPointerDown={(e) => {
                                        isDraggingRef.current = true; setIsZooming(true);
                                        sliderRef.current?.setPointerCapture(e.pointerId); handlePointerMove(e);
                                    }}
                                    onPointerMove={(e) => { if (isDraggingRef.current) handlePointerMove(e); }}
                                    onPointerUp={(e) => {
                                        isDraggingRef.current = false; setIsZooming(false);
                                        sliderRef.current?.releasePointerCapture(e.pointerId); applyHardwareZoom();
                                    }}
                                    onPointerCancel={(e) => {
                                        isDraggingRef.current = false; setIsZooming(false);
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

            <div className="h-40 w-full flex flex-col items-center justify-end pb-8 z-20 bg-black text-white md:absolute md:bottom-0 md:bg-transparent md:h-auto md:pb-12 md:bg-gradient-to-t md:from-black/60 md:to-transparent md:pt-20">

                <div className="flex space-x-6 text-xs font-medium text-gray-400 mb-6 drop-shadow-md">
                    <span className="text-emerald-500">Capture</span>
                </div>

                <div className="w-full flex justify-between items-center px-10 max-w-2xl mx-auto">
                    {capturedImages.length > 0 ? (
                        <Link
                            href="/information"
                            className={`block w-12 h-12 rounded-lg bg-white/10 md:bg-white/20 md:backdrop-blur-md overflow-hidden relative border border-white/20 transition-all duration-200 cursor-pointer hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] ${thumbPulse ? 'scale-125' : 'scale-100'}`}
                        >
                            <img src={capturedImages[capturedImages.length - 1]} alt="Gallery latest" className="w-full h-full object-cover" />
                        </Link>
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 md:bg-white/20 md:backdrop-blur-md border border-white/20 transition-transform duration-200" />
                    )}

                    {activeMode === 'camera' ? (
                        <button
                            onClick={handleCapture}
                            className={`w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-lg`}
                        >
                            <div className={`w-14 h-14 rounded-full bg-white transition-all duration-300`}></div>
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