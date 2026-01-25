
import { useState, useCallback } from 'react';

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

    const locateUser = useCallback((onSuccess?: (pos: Location) => void, onError?: () => void) => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            onError?.();
            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                setLocation(pos);
                setIsLocating(false);
                onSuccess?.(pos);
            },
            () => {
                setIsLocating(false);
                setError("Unable to access location");
                onError?.();
            },
            { timeout: 5000 }
        );
    }, []);

    return { location, isLocating, error, locateUser, setLocation };
};
