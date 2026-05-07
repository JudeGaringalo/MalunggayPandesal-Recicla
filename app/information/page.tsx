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
    upcyclingSuggestion: string;
    description: string;
    scrapValuePH: string;
    recyclingUses: string;
    isHazardous: boolean;
    hazardDetails: string;
    isBiodegradable: boolean;
    isRecyclable: boolean;
}

const VERIFIED_LOCAL_SHOPS = [
    { name: "RTC Junkshop", lat: 14.580908135114187, lng: 121.02906286784032, type: "general" },
    { name: "Bubot's Junkshop", lat: 14.578748087923936, lng: 121.02833400832058, type: "general" },
    { name: "VGM Junkshop", lat: 14.5650, lng: 121.0400, type: "general" },
    { name: "SM Megamall E-Waste Drop-off", lat: 14.582978880149252, lng: 121.05666829907726, type: "hazard" }
];

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
}

const ScanResultCard = ({
    itemData,
    onNewScan,
    distanceKM,
    onGetDirections,
    destName
}: {
    itemData: DetailedAIResponse,
    onNewScan: () => void,
    distanceKM: string | null,
    onGetDirections: () => void,
    destName: string
}) => {

    if (!itemData || itemData.objectName === "Invalid") return null;

    const isHazard = itemData.isHazardous;
    const isBio = itemData.isBiodegradable;
    const isRecyclable = itemData.isRecyclable;

    const themeColor = isHazard ? 'bg-red-500' : 'bg-[#8b9c64]';
    const badgeColor = isHazard ? 'bg-red-100 text-red-900' : 'bg-[#a8b884] text-gray-900';
    const textColor = isHazard ? 'text-red-600' : 'text-[#6b7a4a]';

    return (
        <div className="w-full h-full flex-1 bg-white flex flex-col h-full">
            <div className={`${themeColor} p-6 md:p-8 text-white transition-colors duration-300`}>
                <p className="text-[10px] tracking-wider uppercase font-semibold mb-1 text-white/80">
                    Scanned Item - {itemData.category}
                </p>

                <h2 className="text-3xl font-bold mb-4 capitalize">
                    {itemData.objectName}
                </h2>

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
                    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 mb-6 gap-2 sm:gap-0">
                        <span className="text-sm font-semibold text-gray-500">
                            Estimated Scrap Value
                        </span>

                        <span className={`text-xl font-bold ${textColor}`}>
                            {itemData.scrapValuePH}
                        </span>
                    </div>

                    {itemData.upcyclingSuggestion && (
                        <div className="mb-6 p-4 bg-[#f9faf7] rounded-xl border border-[#edf1e5]">
                            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center ${textColor}`}>
                                <span className="mr-2">💡</span> Household Reuse Suggestion
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                "{itemData.upcyclingSuggestion}"
                            </p>
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className={`text-sm font-bold mb-2 ${isHazard ? 'text-red-500' : 'text-gray-400'}`}>
                            {isHazard ? '⚠️ Safety Warning' : 'Handling Instructions'}
                        </h3>

                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {itemData.hazardDetails}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 mb-2">
                            Material Description
                        </h3>

                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {itemData.description}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-400 mb-2">
                            Recycling & Processing
                        </h3>

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
                                    {distanceKM ? `${distanceKM} KM (Driving Distance)` : 'Calculating distance...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">

                    <button
                        onClick={onGetDirections}
                        className={`flex-1 transition-colors text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm ${isHazard ? 'bg-red-500 hover:bg-red-600' : 'bg-[#8b9c64] hover:bg-[#788856]'}`}
                    >
                        Get Directions
                    </button>

                    <button
                        onClick={onNewScan}
                        className="flex-1 text-center bg-[#E8E8E8] hover:bg-[#D8D8D8] transition-colors text-gray-700 font-semibold py-3 px-4 rounded-xl text-sm shadow-sm"
                    >
                        Capture or Upload New Photo
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

   
    const [isMapLoading, setIsMapLoading] = useState(false);

    const analysisStarted = useRef(false);

    const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
    const [destLoc, setDestLoc] = useState<[number, number] | null>(null);
    const [destName, setDestName] = useState<string>('Locating nearest facility...');
    const [distance, setDistance] = useState<string | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][] | null>(null);

    const [isManualOverride, setIsManualOverride] = useState(false);
    
    const [addressInput, setAddressInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const isHazard = aiData?.isHazardous ?? false;

    const findNearestRealFacility = async (lat: number, lng: number, hazard: boolean): Promise<{lat: number, lng: number, name: string} | null> => {
        try {
            const targetType = hazard ? "hazard" : "general";
            let closestLocal = null;
            let minLocalDistance = Infinity;

            for (const shop of VERIFIED_LOCAL_SHOPS) {
                if (shop.type === targetType || !hazard) { 
                    const dist = parseFloat(calculateDistanceKM(lat, lng, shop.lat, shop.lng));
                    if (dist < 5.0 && dist < minLocalDistance) { 
                        minLocalDistance = dist;
                        closestLocal = shop;
                    }
                }
            }

            if (closestLocal) {
                return { lat: closestLocal.lat, lng: closestLocal.lng, name: closestLocal.name };
            }

            const query = `
                [out:json][timeout:3];
                (
                  node["amenity"="recycling"](around:5000, ${lat}, ${lng});
                  way["amenity"="recycling"](around:5000, ${lat}, ${lng});
                  node["amenity"="waste_disposal"](around:5000, ${lat}, ${lng});
                  node["shop"="scrap"](around:5000, ${lat}, ${lng});
                  node["industrial"="scrap_yard"](around:5000, ${lat}, ${lng});
                );
                out center;
            `;
            
            const response = await fetch(`https://overpass-api.de/api/interpreter`, {
                method: 'POST',
                body: "data=" + encodeURIComponent(query),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

           
            if (!response.ok) {
                console.warn(`Overpass API error: ${response.status} ${response.statusText}`);
                return null; 
            }

          
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error("Failed to parse Overpass response. Received XML instead of JSON.");
                return null; 
            }

           
            if (data && data.elements && data.elements.length > 0) {
                let closestFacility = null;
                let minDistance = Infinity;

                for (const element of data.elements) {
                    const destLat = element.lat || element.center?.lat;
                    const destLng = element.lon || element.center?.lon;
                    
                    if (destLat && destLng) {
                        const dist = parseFloat(calculateDistanceKM(lat, lng, destLat, destLng));
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestFacility = element;
                        }
                    }
                }

                if (closestFacility) {
                    const destLat = closestFacility.lat || closestFacility.center?.lat;
                    const destLng = closestFacility.lon || closestFacility.center?.lon;
                    let name = closestFacility.tags?.name;
                    if (!name) name = hazard ? 'Registered E-Waste Drop-off' : 'Accredited Recycling Center';
                    return { lat: destLat, lng: destLng, name };
                }
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch real facility:", error);
            return null;
        }
    };

    const generateNearbyDest = (lat: number, lng: number, hazard: boolean): [number, number] => {
        const latDir = Math.random() > 0.5 ? 1 : -1;
        const lngDir = Math.random() > 0.5 ? 1 : -1;
        const baseOffset = hazard ? 0.002 : 0.001;
        const randomAdd = Math.random() * 0.001;
        return [lat + (latDir * (baseOffset + randomAdd)), lng + (lngDir * (baseOffset + randomAdd))];
    };

    const handleNewScan = () => {
        document.cookie = "scan_in_progress=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('lastCapturedImage');
        localStorage.removeItem('lastScanResults');
        router.push('/scan');
    };

    const openGoogleMapsDirections = () => {
        if (!userLoc || !destLoc) return;
        const [userLat, userLng] = userLoc;
        const [destLat, destLng] = destLoc;
        
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;
        window.open(mapsUrl, "_blank");
    };

    const handleAddressSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addressInput.trim()) return;

        setIsSearching(true);
        setIsMapLoading(true);
        setSearchError(null);

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                setIsManualOverride(true);
                setUserLoc([lat, lon]);
                setDestName('Locating legitimate facility...');
                
                const realFacility = await findNearestRealFacility(lat, lon, isHazard);
                if (realFacility) {
                    setDestLoc([realFacility.lat, realFacility.lng]);
                    setDestName(realFacility.name);
                } else {
                    setDestLoc(generateNearbyDest(lat, lon, isHazard));
                    setDestName(isHazard ? 'Local SM Cyberzone E-Waste Bin' : 'Nearby Accredited Junk Shop');
                }

            } else {
                setSearchError("Address not found. Try adding the city name (e.g., Mandaluyong).");
            }
        } catch (error) {
            setSearchError("Error searching for address. Please try again.");
        } finally {
            setIsSearching(false);
            setIsMapLoading(false); 
        }
    };

    useEffect(() => {
        if (userLoc && destLoc) {
            const fetchRoute = async () => {
                try {
                    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${destLoc[1]},${destLoc[0]}?overview=full&geometries=geojson`);
                    const data = await response.json();
                    
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
                        
                        setRoutePath(coordinates);
                        setDistance((route.distance / 1000).toFixed(2));
                    }
                } catch (error) {
                    console.error("Routing failed, falling back to straight line:", error);
                    setRoutePath(null); 
                    setDistance(calculateDistanceKM(userLoc[0], userLoc[1], destLoc[0], destLoc[1]));
                }
            };

            fetchRoute();
        }
    }, [userLoc, destLoc]);

    useEffect(() => {
        setMounted(true);

        const savedImage = localStorage.getItem('lastCapturedImage');
        const savedResults = localStorage.getItem('lastScanResults');
        
        let watchId: number;
        let fixedDestLoc: [number, number] | null = null; 

        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (isManualOverride) return; 

                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    setUserLoc([lat, lng]);

                    if (!fixedDestLoc) {
                        const isHazardousItem = savedResults ? JSON.parse(savedResults).aiData?.isHazardous : false;
                        
                        (async () => {
                            const realFacility = await findNearestRealFacility(lat, lng, isHazardousItem);
                            if (realFacility) {
                                fixedDestLoc = [realFacility.lat, realFacility.lng];
                                setDestName(realFacility.name);
                            } else {
                                fixedDestLoc = generateNearbyDest(lat, lng, isHazardousItem);
                                setDestName(isHazardousItem ? 'Local SM Cyberzone E-Waste Bin' : 'Nearby Accredited Junk Shop');
                            }
                            setDestLoc(fixedDestLoc);
                        })();
                    }
                    setIsLocating(false);
                },
                (error) => {
                    console.warn("Location access denied or unavailable. Falling back to Mandaluyong.");
                    const fallbackUserLat = 14.5776;
                    const fallbackUserLng = 121.0345;
                    setUserLoc([fallbackUserLat, fallbackUserLng]);

                    const isHazardousItem = savedResults ? JSON.parse(savedResults).aiData?.isHazardous : false;
                    
                    (async () => {
                        const realFacility = await findNearestRealFacility(fallbackUserLat, fallbackUserLng, isHazardousItem);
                        if (realFacility) {
                            setDestLoc([realFacility.lat, realFacility.lng]);
                            setDestName(realFacility.name);
                        } else {
                            setDestLoc(generateNearbyDest(fallbackUserLat, fallbackUserLng, isHazardousItem));
                            setDestName(isHazardousItem ? 'Local SM Cyberzone E-Waste Bin' : 'Nearby Accredited Junk Shop');
                        }
                    })();
                    
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };

    }, [router, isManualOverride]);

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

            <div className={`min-h-screen bg-[#E8EBE4] flex flex-col transition-opacity duration-700 ${isLoadingEverything ? 'opacity-0' : 'opacity-100'}`}>

                <main className="flex-grow flex flex-col">

                    <div className="absolute top-0 left-0 w-full z-20">
                        <nav className="w-full p-6 flex justify-between items-center">
                            <Link href="/scan" className="text-black hover:text-gray-400 transition-colors text-sm uppercase tracking-widest">
                                ← Back
                            </Link>
                        </nav>
                    </div>

                    <section className="relative pt-24 pb-16 px-4 md:px-8">
                        <div className="w-[90%] lg:w-[85%] mx-auto flex flex-col gap-8">
                            <div className="flex flex-col lg:flex-row shadow-sm rounded-2xl overflow-hidden bg-white border border-gray-100">

                                <div className="w-full lg:w-[45%] flex flex-col items-center justify-center relative min-h-[40vh] lg:min-h-[60vh] bg-black">
                                    {scannedImage ? (
                                        <img src={scannedImage} alt="Scanned Item" className="w-full h-full object-contain transition-opacity duration-500" />
                                    ) : (
                                        <p className="text-white/50 text-sm">No image captured.</p>
                                    )}
                                </div>

                                <div className="w-full lg:w-[55%] flex flex-col">
                                    {aiData && aiData.objectName !== "Invalid" ? (
                                        <ScanResultCard
                                            itemData={aiData}
                                            onNewScan={handleNewScan}
                                            distanceKM={distance}
                                            onGetDirections={openGoogleMapsDirections}
                                            destName={destName}
                                        />
                                    ) : aiData && aiData.objectName === "Invalid" ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                                            <div className="text-red-500 font-bold bg-red-50 p-6 rounded-lg border border-red-200">
                                                <p className="mb-2 uppercase tracking-wider text-xs text-red-400">Invalid Subject Detected</p>
                                                <p>Faces and live animals cannot be processed for waste analysis.</p>
                                                <button onClick={handleNewScan} className="mt-4 px-6 py-2 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition-colors">
                                                    Scan Again
                                                </button>
                                            </div>
                                        </div>
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

                            <div className="w-full h-[60vh] lg:h-[75vh] rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-[#E8EBE4] relative">
                                
                                <div className="absolute top-4 left-4 z-[1000] w-full max-w-xs sm:max-w-md pointer-events-auto">
                                    <form onSubmit={handleAddressSearch} className="flex flex-col sm:flex-row gap-2 w-full bg-white/95 backdrop-blur p-2 rounded-xl shadow-lg border border-gray-200">
                                        <input
                                            type="text"
                                            value={addressInput}
                                            onChange={(e) => setAddressInput(e.target.value)}
                                            placeholder="Enter address"
                                            className="flex-grow px-3 py-2 text-sm text-black outline-none bg-white rounded-lg border border-gray-200 focus:border-[#8b9c64] focus:ring-1 focus:ring-[#8b9c64] transition-all"
                                            disabled={isSearching}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSearching}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors ${isHazard ? 'bg-red-500 hover:bg-red-600' : 'bg-[#8b9c64] hover:bg-[#788856]'} disabled:opacity-50 whitespace-nowrap`}
                                        >
                                            {isSearching ? '...' : 'Search'}
                                        </button>
                                    </form>
                                    {searchError && (
                                        <div className="mt-2 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-red-200 inline-block">
                                            <p className="text-red-500 text-xs font-semibold">{searchError}</p>
                                        </div>
                                    )}
                                </div>

                                
                                {isMapLoading && (
                                    <div className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
                                        <div className="w-12 h-12 border-4 border-[#7C8D58] border-t-transparent rounded-full animate-spin mb-4 shadow-sm"></div>
                                        <p className="text-[#6b7a4a] font-bold text-sm uppercase tracking-widest animate-pulse">Routing to facility...</p>
                                    </div>
                                )}

                                {userLoc ? (
                                    <LiveMap
                                        userLocation={userLoc}
                                        destinationLocation={destLoc}
                                        isHazardous={isHazard}
                                        destinationName={destName}
                                        routePath={routePath} 
                                        onUserLocationChange={(newLoc) => {
                                            setIsManualOverride(true);
                                            setUserLoc(newLoc);
                                            
                                            
                                            if (destLoc && parseFloat(calculateDistanceKM(newLoc[0], newLoc[1], destLoc[0], destLoc[1])) > 0.5) {
                                                setIsMapLoading(true); 
                                                (async () => {
                                                    setDestName('Relocating facility...');
                                                    const realFacility = await findNearestRealFacility(newLoc[0], newLoc[1], isHazard);
                                                    if (realFacility) {
                                                        setDestLoc([realFacility.lat, realFacility.lng]);
                                                        setDestName(realFacility.name);
                                                    } else {
                                                        setDestLoc(generateNearbyDest(newLoc[0], newLoc[1], isHazard));
                                                        setDestName(isHazard ? 'Local SM Cyberzone E-Waste Bin' : 'Nearby Accredited Junk Shop');
                                                    }
                                                    setIsMapLoading(false); 
                                                })();
                                            }
                                        }}
                                    />
                                ) : (
                                    
                                    <div className="absolute inset-0 bg-[#E8EBE4] flex flex-col items-center justify-center z-0">
                                        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 font-medium text-sm">Initializing Map Component...</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </section>

                    <footer className="relative w-full h-[40vh] md:h-screen bg-[#E8EBE4] flex items-end justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center z-0 px-4 md:px-6 w-full">
                            <svg className="w-full max-w-[1600px] h-auto drop-shadow-sm unzoomable" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <filter id="innerShadow">
                                        <feOffset dx="8" dy="12" />
                                        <feGaussianBlur stdDeviation="8" result="offset-blur" />
                                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                                        <feFlood floodColor="black" floodOpacity="0.35" result="color" />
                                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                                    </filter>
                                </defs>
                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#E8EBE4" className="font-inter font-bold uppercase" style={{ fontSize: '250px', letterSpacing: '14px' }} filter="url(#innerShadow)">
                                    RECICLA
                                </text>
                            </svg>
                        </div>
                        <img src="/images/footer.png" alt="Tropical Leaves" className="relative z-10 w-full h-[40vh] md:h-[85vh] object-cover object-bottom pointer-events-none unzoomable drop-shadow-2xl" />
                    </footer>

                </main>
            </div>
        </ReactLenis>
    );
}