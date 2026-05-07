"use client";

import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import { ReactLenis } from '@studio-freight/react-lenis';
import VineScrollbar from '@/app/components/VineScrollbar';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/app/components/MapComponent'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-200 animate-pulse"></div>
});

interface DetailedAIResponse {
    objectName: string;
    category: string;
    description: string;
    scrapValuePH: string;
    recyclingUses: string;
    isHazardous: boolean;
    hazardDetails: string;
    isBiodegradable: boolean;
    isRecyclable: boolean;
}

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
}

const ScanResultCard = ({ 
    itemData, 
    onNewScan,
    distanceKM 
}: { 
    itemData: DetailedAIResponse, 
    onNewScan: () => void,
    distanceKM: string | null 
}) => {
    if (!itemData) return null;

    const isHazard = itemData.isHazardous;
    const isBio = itemData.isBiodegradable;
    const isRecyclable = itemData.isRecyclable;

    const themeColor = isHazard ? 'bg-red-500' : 'bg-[#8b9c64]';
    const badgeColor = isHazard ? 'bg-red-100 text-red-900' : 'bg-[#a8b884] text-gray-900';
    const textColor = isHazard ? 'text-red-600' : 'text-[#6b7a4a]';
    const destName = isHazard ? 'SM Cyberzone E-Waste Bin' : 'M. Santos Junk Shop';

    return (
        <div className="w-full h-full flex-1 bg-white flex flex-col h-full">
            <div className={`${themeColor} p-6 md:p-8 text-white transition-colors duration-300`}>
                <p className="text-[10px] tracking-wider uppercase font-semibold mb-1 text-white/80">
                    Scanned Item - {itemData.category}
                </p>
                <h2 className="text-3xl font-bold mb-4 capitalize">{itemData.objectName}</h2>
                <div className="flex flex-wrap gap-3">
                    <div className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${badgeColor}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 shadow-sm animate-pulse ${isHazard ? 'bg-red-600' : 'bg-[#00FF00]'}`}></span>
                        {isHazard ? 'Hazardous Material' : 'Low / Non-Toxic'}
                    </div>

                    <div className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${isBio ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        <span className="mr-1.5">{isBio ? '🌱' : '♻️'}</span>
                        {isBio ? 'Biodegradable' : 'Non-Biodegradable'}
                    </div>

                    <div className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${isRecyclable ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-700'}`}>
                        {isRecyclable ? 'Recyclable' : 'Dispose'}
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col flex-grow bg-white justify-between">
                <div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-6">
                        <span className="text-sm font-semibold text-gray-500">Estimated Scrap Value</span>
                        <span className={`text-xl font-bold ${textColor}`}>{itemData.scrapValuePH}</span>
                    </div>

                    <div className="mb-6">
                        <h3 className={`text-sm font-bold mb-2 ${isHazard ? 'text-red-500' : 'text-gray-400'}`}>
                            {isHazard ? '⚠️ Safety Warning' : 'Handling Instructions'}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {itemData.hazardDetails}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 mb-2">Material Description</h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {itemData.description}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 mb-2">Recycling & Processing</h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {itemData.recyclingUses}
                        </p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">
                            Nearest {isHazard ? 'E-Waste Drop-off' : 'Disposal / Junk Shop'}
                        </h3>
                        <div className="flex items-start">
                            <div className={`mt-1 mr-3 ${textColor}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">
                                    {destName}
                                </p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    {distanceKM ? `${distanceKM} KM Away` : 'Calculating distance...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button className={`flex-1 transition-colors text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm ${isHazard ? 'bg-red-500 hover:bg-red-600' : 'bg-[#8b9c64] hover:bg-[#788856]'}`}>
                        Get Directions
                    </button>
                    <button onClick={onNewScan} className="flex-1 text-center bg-[#E8E8E8] hover:bg-[#D8D8D8] transition-colors text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm shadow-sm">
                        Capture New Photo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ResultsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const [aiData, setAiData] = useState<DetailedAIResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isLocating, setIsLocating] = useState(true);
    const analysisStarted = useRef(false);
    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
    const [destLoc, setDestLoc] = useState<[number, number] | null>(null);
    const [distance, setDistance] = useState<string | null>(null);

    const handleNewScan = () => {
        document.cookie = "scan_in_progress=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('lastCapturedImage');
        localStorage.removeItem('lastScanResults');
        router.push('/scan');
    };

    useEffect(() => {
        setMounted(true);
        const savedImage = localStorage.getItem('lastCapturedImage');
        const savedResults = localStorage.getItem('lastScanResults');
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setUserLoc([lat, lng]);

                    const targetLat = lat + ((Math.random() - 0.5) * 0.008);
                    const targetLng = lng + ((Math.random() - 0.5) * 0.008);
                    setDestLoc([targetLat, targetLng]);
                    setDistance(calculateDistanceKM(lat, lng, targetLat, targetLng));
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Location access denied.");
                    setUserLoc([14.6760, 121.0437]);
                    setDestLoc([14.6810, 121.0450]);
                    setDistance("0.65");
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setIsLocating(false); 
        }

        if (savedResults) {
            const parsed = JSON.parse(savedResults);
            setAiData(parsed.aiData);
            setScannedImage(parsed.imageUrl);
            setIsAnalyzing(false);
        } else if (savedImage && !analysisStarted.current) {
            analysisStarted.current = true;
            setScannedImage(savedImage);
            analyzeImageWithVisionAI(savedImage);
        } else if (!savedImage) {
            router.push('/scan');
        }
    }, [router]);

    const analyzeImageWithVisionAI = async (base64Image: string) => {
        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });

            const result = await response.json();

            if (result.success) {
                setAiData(result.aiData);
                setScannedImage(result.imageUrl || base64Image);

                localStorage.setItem('lastScanResults', JSON.stringify({
                    aiData: result.aiData,
                    imageUrl: result.imageUrl || base64Image
                }));
            } else {
                setErrorMessage(result.error);
            }
        } catch (error) {
            setErrorMessage("Connection failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!mounted) return null;
    const isLoadingEverything = isAnalyzing || isLocating;
    const isHazard = aiData?.isHazardous ?? false;
    const destName = isHazard ? 'SM Cyberzone E-Waste Bin' : 'M. Santos Junk Shop';

    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
            <VineScrollbar />

            {isLoadingEverything && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
                    <div className="w-16 h-16 border-4 border-[#7C8D58] border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Analyzing Item & Mapping Location</h2>
                    <p className="text-sm text-gray-500 max-w-md text-center px-4">
                        Please allow location access in your browser prompt so we can route you to the nearest verified disposal facility.
                    </p>
                </div>
            )}

            <div className={`min-h-screen bg-[#f8f9fa] flex flex-col transition-opacity duration-700 ${isLoadingEverything ? 'opacity-0' : 'opacity-100'}`}>
                <main className="flex-grow flex flex-col">
                    <div className="absolute top-0 left-0 w-full z-20">
                        <nav className="w-full p-6 flex justify-between items-center">
                            <Link href="/scan" className="text-black hover:text-gray-400 transition-colors text-sm uppercase tracking-widest">&#8592; Back</Link>
                        </nav>
                    </div>

                    <section className="relative pt-24 pb-16 px-4 md:px-8">
                        <div className="w-[90%] lg:w-[85%] mx-auto flex flex-col gap-8">
                            
                            <div className="flex flex-col lg:flex-row shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100">
                                <div className="w-full lg:w-[45%] flex flex-col items-center justify-center relative min-h-[40vh] lg:min-h-[60vh] bg-black">
                                    {scannedImage ? (
                                        <img src={scannedImage} alt="Scanned Item" className="w-full h-full object-contain transition-opacity duration-500" style={{ opacity: 1 }}/>
                                    ) : (
                                        <p className="text-white/50 text-sm">No image captured.</p>
                                    )}
                                </div>

                                <div className="w-full lg:w-[55%] flex flex-col">
                                    {aiData ? (
                                        <ScanResultCard 
                                            itemData={aiData} 
                                            onNewScan={handleNewScan} 
                                            distanceKM={distance}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 p-6 text-center">
                                            <div className="text-red-500 font-bold bg-red-50 p-4 rounded-lg border border-red-200">
                                                <p className="mb-2 uppercase tracking-wider text-xs text-red-400">Analysis Failed</p>
                                                <p>{errorMessage}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
 
                            <div className="w-full h-[60vh] lg:h-[75vh] rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-gray-200 relative">
                                {userLoc && destLoc ? (
                                    <LiveMap 
                                        userLocation={userLoc} 
                                        destinationLocation={destLoc} 
                                        isHazardous={isHazard} 
                                        destinationName={destName} 
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-blue-50/50 flex items-center justify-center">
                                        <img src="/api/placeholder/1200/800" alt="Map View Placeholder" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                        </div>
                    </section>
                    
                    <footer className="relative w-full h-[20vh] md:h-[30vh] bg-white flex items-end justify-center overflow-hidden">
                        <img src="/images/footer.png" alt="Tropical Leaves" className="relative z-10 w-full h-full object-cover object-bottom pointer-events-none drop-shadow-2xl" />
                    </footer>
                </main>
            </div>
        </ReactLenis>
    );
}