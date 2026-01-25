/**
 * Utility functions for geocoding and address parsing
 */

/**
 * Extracts a standard city name from Google Maps Geocoding results
 * Prioritizes locality, administrative areas, then political entities
 * @param results - The array of geocoding results from Google Maps API
 * @returns The extracted city name or null if not found
 */
export const extractStandardCity = (results: any[]): string | null => {
    if (!results || results.length === 0) return null;

    // First try to find a locality (city) or admin area level 2/3
    const locality = results.find(r =>
        r.types.includes('locality') ||
        r.types.includes('administrative_area_level_2') ||
        r.types.includes('administrative_area_level_3')
    );

    if (locality) {
        // Inside that result, find the specific component that is the locality
        const comp = locality.address_components.find((c: any) =>
            c.types.includes('locality') ||
            c.types.includes('political') ||
            c.types.includes('administrative_area_level_1')
        );
        if (comp) return comp.long_name;
    }

    // Fallback to the first result if specific types weren't found clearly
    return results[0]?.address_components.find((c: any) =>
        c.types.includes('locality') ||
        c.types.includes('political')
    )?.long_name || null;
};

export function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}
