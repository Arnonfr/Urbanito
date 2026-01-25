import { useState, useEffect, useRef } from 'react';

interface Location {
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number;
    timestamp?: number;
}

export const useLiveLocation = (enabled: boolean = false) => {
    const [location, setLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || !navigator.geolocation) {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
            }
            return;
        }

        const success = (pos: GeolocationPosition) => {
            setLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                heading: pos.coords.heading,
                speed: pos.coords.speed,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp
            });
            setError(null);
        };

        const fail = (err: GeolocationPositionError) => {
            setError(err.message);
        };

        const options = {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
        };

        watchId.current = navigator.geolocation.watchPosition(success, fail, options);

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [enabled]);

    return { location, error };
};
