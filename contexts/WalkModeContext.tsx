import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { POI } from '../types';
import { getDistanceFromLatLonInMeters, getBearing } from '../utils/geocoding';
import { findNearbyPois } from '../services/supabaseRoutes';
import { useAudio } from './AudioContext';

const SCAN_RADIUS = 200; // Look ahead distance
const TRIGGER_DISTANCE = 40; // Detection trigger
const HEADING_TOLERANCE = 45; // Degrees field of view

export interface RadarPOI extends POI {
    distance: number; // meters
    bearing: number; // absolute bearing from user to POI
    relativeBearing: number; // relative to user heading (-180 to 180)
}

interface WalkModeContextType {
    isWalkModeActive: boolean;
    toggleWalkMode: () => void;
    detectedPois: POI[];
    radarPois: RadarPOI[];
    heading: number;
    nearestPoi: RadarPOI | null;
    isScanning: boolean;
}

const WalkModeContext = createContext<WalkModeContextType | undefined>(undefined);

export const useWalkMode = () => {
    const context = useContext(WalkModeContext);
    if (!context) {
        throw new Error('useWalkMode must be used within a WalkModeProvider');
    }
    return context;
};

export const WalkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isWalkModeActive, setIsWalkModeActive] = useState(false);
    const [heading, setHeading] = useState(0);
    const [detectedPois, setDetectedPois] = useState<POI[]>([]);
    const [radarPois, setRadarPois] = useState<RadarPOI[]>([]);
    const [nearestPoi, setNearestPoi] = useState<RadarPOI | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // Use high accuracy location
    const { location } = useLiveLocation(isWalkModeActive);
    const { playText, isPlaying, audioMode } = useAudio();

    // Ref to prevent re-triggering same POI too often
    const triggeredPoisRef = useRef<Set<string>>(new Set());
    const lastScanLocationRef = useRef<{ lat: number, lng: number } | null>(null);

    // Compass / Device Orientation Handler
    useEffect(() => {
        if (!isWalkModeActive) return;

        const handleOrientation = (event: DeviceOrientationEvent) => {
            // iOS specific property
            const ev = event as any;
            if (ev.webkitCompassHeading) {
                setHeading(ev.webkitCompassHeading);
            } else if (event.alpha) {
                // Android (approximate, usually needs absolute fallback)
                // standard alpha is 0 at north? not always. 
                // For MVP we accept alpha or fallback to GPS heading.
                setHeading(360 - event.alpha);
            }
        };

        // Fallback to GPS heading if moving
        if (location?.heading && location.speed && location.speed > 1) {
            setHeading(location.heading);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [isWalkModeActive, location?.heading, location?.speed]);

    const toggleWalkMode = () => {
        setIsWalkModeActive(prev => {
            if (!prev) {
                // Starting
                triggeredPoisRef.current.clear();
                lastScanLocationRef.current = null;
            }
            return !prev;
        });
    };

    // 1. Scanning Loop (fetch from DB) using simple distance diff or time interval
    useEffect(() => {
        if (!isWalkModeActive || !location) return;

        const shouldScan = !lastScanLocationRef.current ||
            getDistanceFromLatLonInMeters(
                location.lat,
                location.lng,
                lastScanLocationRef.current.lat,
                lastScanLocationRef.current.lng
            ) > 50; // Scan every 50m of movement

        if (shouldScan) {
            setIsScanning(true);
            findNearbyPois(location.lat, location.lng, SCAN_RADIUS)
                .then(pois => {
                    setDetectedPois(pois);
                    lastScanLocationRef.current = { lat: location.lat, lng: location.lng };
                })
                .finally(() => setIsScanning(false));
        }
    }, [isWalkModeActive, location]);

    // 2. Radar Calculation Loop (Fast, Local)
    useEffect(() => {
        if (!isWalkModeActive || !location || detectedPois.length === 0) {
            setRadarPois([]);
            return;
        }

        const calculated = detectedPois.map(poi => {
            const distance = getDistanceFromLatLonInMeters(location.lat, location.lng, poi.lat, poi.lng);
            const bearing = getBearing(location.lat, location.lng, poi.lat, poi.lng);

            // Relative bearing (shortest angle)
            let relative = bearing - heading;
            while (relative < -180) relative += 360;
            while (relative > 180) relative -= 360;

            return { ...poi, distance, bearing, relativeBearing: relative };
        }).sort((a, b) => a.distance - b.distance);

        setRadarPois(calculated);

        // Filter for "In Front" and "Close"
        const candidates = calculated.filter(p =>
            p.distance < TRIGGER_DISTANCE &&
            Math.abs(p.relativeBearing) < HEADING_TOLERANCE
        );

        if (candidates.length > 0) {
            const potentialTarget = candidates[0];

            // Trigger logic
            if (potentialTarget.id !== nearestPoi?.id) {
                setNearestPoi(potentialTarget);

                // Audio Trigger
                if (!triggeredPoisRef.current.has(potentialTarget.id) && !isPlaying) {
                    triggeredPoisRef.current.add(potentialTarget.id);
                    // Decide what text to read (Short vs Long)
                    const text = potentialTarget.summary || potentialTarget.description || potentialTarget.name;
                    playText(text, 'en', potentialTarget.id, 'normal'); // Default to EN for now or pass lang prop
                }
            }
        } else {
            setNearestPoi(null);
        }

    }, [isWalkModeActive, location, heading, detectedPois, isPlaying]); // Removed 'nearestPoi' from deps to avoid loop, handled logically

    return (
        <WalkModeContext.Provider value={{
            isWalkModeActive,
            toggleWalkMode,
            detectedPois,
            radarPois,
            heading,
            nearestPoi,
            isScanning
        }}>
            {children}
        </WalkModeContext.Provider>
    );
};
