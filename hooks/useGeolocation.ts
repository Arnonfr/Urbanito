
import { useState, useCallback, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const PARIS_COORDS = { lat: 48.8566, lng: 2.3522 };

interface Location {
    lat: number;
    lng: number;
}

interface UseGeolocationReturn {
    location: Location;
    isLocating: boolean;
    error: string | null;
    locateUser: (onSuccess?: (pos: Location) => void, onError?: () => void) => void;
    setLocation: (pos: Location) => void;
}

export const useGeolocation = (defaultLocation: Location = PARIS_COORDS): UseGeolocationReturn => {
    const [location, setLocation] = useState<Location>(defaultLocation);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isNative = Capacitor.isNativePlatform();

    const locateUser = useCallback(async (onSuccess?: (pos: Location) => void, onError?: () => void) => {
        setIsLocating(true);
        setError(null);

        try {
            if (isNative) {
                // Native Capacitor Geolocation
                const permission = await Geolocation.checkPermissions();
                if (permission.location !== 'granted') {
                    const req = await Geolocation.requestPermissions();
                    if (req.location !== 'granted') {
                        throw new Error("Permission denied");
                    }
                }

                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000
                });

                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setLocation(pos);
                onSuccess?.(pos);
            } else {
                // Standard Web Geolocation
                if (!navigator.geolocation) {
                    throw new Error("Geolocation not supported");
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                        setLocation(pos);
                        onSuccess?.(pos);
                    },
                    (err) => {
                        console.error("Web Geolocation Error:", err);
                        setError("Unable to access location");
                        onError?.();
                    },
                    { timeout: 10000, enableHighAccuracy: true }
                );
            }
        } catch (err: any) {
            console.error("Locate User Error:", err);
            setError(err.message || "Unable to access location");
            onError?.();
        } finally {
            setIsLocating(false);
        }
    }, [isNative]);

    return { location, isLocating, error, locateUser, setLocation };
};
