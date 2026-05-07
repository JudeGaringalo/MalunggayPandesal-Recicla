"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const hazardIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const safeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

function MapBounds({ userLoc, destLoc }: { userLoc: [number, number], destLoc: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (userLoc && destLoc) {
            // Both locations available: fit bounds to show both
            const bounds = L.latLngBounds(userLoc, destLoc);
            map.fitBounds(bounds, { padding: [60, 60] });
        } else if (userLoc) {
            // Only user location available: center on user immediately
            map.setView(userLoc, 15);
        }
    }, [map, userLoc, destLoc]);
    return null;
}

interface MapProps {
    userLocation: [number, number];
    destinationLocation: [number, number] | null; 
    isHazardous: boolean;
    destinationName: string;
    routePath: [number, number][] | null; 
    onUserLocationChange?: (newLoc: [number, number]) => void;
}

export default function MapComponent({ userLocation, destinationLocation, isHazardous, destinationName, routePath, onUserLocationChange }: MapProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const destIcon = isHazardous ? hazardIcon : safeIcon;
    const lineColor = isHazardous ? "#EF4444" : "#4A7c59"; 
    
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker && onUserLocationChange) {
                    const newPos = marker.getLatLng();
                    onUserLocationChange([newPos.lat, newPos.lng]);
                }
            },
        }),
        [onUserLocationChange]
    );

    const lightMapURL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const darkMapURL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    return (
        <div className="relative w-full h-full">

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    setIsDarkMode(!isDarkMode);
                }}
                className={`absolute bottom-6 right-4 z-[1000] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all active:scale-95 ${
                    isDarkMode 
                        ? 'bg-black/50 border-white/20 text-white hover:bg-black/70' 
                        : 'bg-white/80 border-gray-200 text-gray-800 hover:bg-white'
                }`}
            >
                <span className="text-lg">{isDarkMode}</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                    {isDarkMode ? 'Dark' : 'Light'}
                </span>
            </button>

            <MapContainer
                center={userLocation}
                zoom={15}
                style={{ height: '100%', width: '100%', zIndex: 10 }}
                zoomControl={false}
                attributionControl={false} 
            >
                <TileLayer
                    url={isDarkMode ? darkMapURL : lightMapURL}
                    attribution="" 
                />

                <MapBounds userLoc={userLocation} destLoc={destinationLocation} />

                {routePath && routePath.length > 0 && (
                    <Polyline 
                        positions={routePath} 
                        color={lineColor} 
                        weight={6} 
                        opacity={0.8}
                    />
                )}
                <Marker 
                    position={userLocation} 
                    icon={userIcon}
                    draggable={true}
                    eventHandlers={eventHandlers}
                    ref={markerRef}
                >
                    <Popup className="font-sans">
                        <strong>Your Location</strong><br/>
                        <span className="text-xs text-gray-500">(Drag to adjust)</span>
                    </Popup>
                </Marker>

                {destinationLocation && (
                    <Marker position={destinationLocation} icon={destIcon}>
                        <Popup className="font-sans">
                            <strong>{destinationName}</strong><br />
                            Verified Drop-off
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}