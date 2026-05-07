"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, userLoc, destLoc]);
    return null;
}

interface MapProps {
    userLocation: [number, number];
    destinationLocation: [number, number];
    isHazardous: boolean;
    destinationName: string;
}

export default function MapComponent({ userLocation, destinationLocation, isHazardous, destinationName }: MapProps) {
    const destIcon = isHazardous ? hazardIcon : safeIcon;

    return (
        <MapContainer
            center={userLocation}
            zoom={15}
            style={{ height: '100%', width: '100%', zIndex: 10 }}
            zoomControl={false}
            attributionControl={false} // Absolutely no attribution box
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution="" 
            />

            <MapBounds userLoc={userLocation} destLoc={destinationLocation} />

            <Marker position={userLocation} icon={userIcon}>
                <Popup className="font-sans"><strong>Your Location</strong></Popup>
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