"use client";

import { useEffect, useMemo, useRef } from 'react';
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

function MapBounds({ userLoc, destLoc }: { userLoc: [number, number], destLoc: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (userLoc && destLoc) {
            const bounds = L.latLngBounds(userLoc, destLoc);
            // Added slightly more padding so the route fits nicely
            map.fitBounds(bounds, { padding: [60, 60] });
        }
    }, [map, userLoc, destLoc]);
    return null;
}

interface MapProps {
    userLocation: [number, number];
    destinationLocation: [number, number];
    isHazardous: boolean;
    destinationName: string;
    routePath: [number, number][] | null; 
    onUserLocationChange?: (newLoc: [number, number]) => void;
}

export default function MapComponent({ userLocation, destinationLocation, isHazardous, destinationName, routePath, onUserLocationChange }: MapProps) {
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

    const positionsToDraw = routePath && routePath.length > 0 
        ? routePath 
        : [userLocation, destinationLocation];

    return (
        <MapContainer
            center={userLocation}
            zoom={15}
            style={{ height: '100%', width: '100%', zIndex: 10 }}
            zoomControl={false}
            attributionControl={false} 
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution="" 
            />

            <MapBounds userLoc={userLocation} destLoc={destinationLocation} />

            <Polyline 
                positions={positionsToDraw} 
                color={lineColor} 
                weight={6} 
                opacity={0.8}
            />

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

            <Marker position={destinationLocation} icon={destIcon}>
                <Popup className="font-sans">
                    <strong>{destinationName}</strong><br />
                    Verified Drop-off
                </Popup>
            </Marker>
        </MapContainer>
    );
}