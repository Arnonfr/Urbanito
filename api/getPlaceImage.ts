
import { getPlacesApiKey } from '../services/secretManager';

const SIZES = {
  small: { maxWidthPx: 400, maxHeightPx: 300 },
  medium: { maxWidthPx: 800, maxHeightPx: 600 },
  large: { maxWidthPx: 1200, maxHeightPx: 900 }
};

export async function POST(request: Request) {
  try {
    const { query, lat, lng, size = 'medium' } = await request.json();
    const API_KEY = await getPlacesApiKey();
    
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.photos,places.displayName'
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
        locationBias: lat && lng ? {
          circle: { center: { latitude: lat, longitude: lng }, radius: 500 }
        } : undefined,
        languageCode: 'en'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }
    
    const data = await response.json();
    const photo = data.places?.[0]?.photos?.[0];

    // הזרקת ה-URL המלא לתוך האובייקט כדי שה-Client לא יצטרך לבנות אותו עם המפתח
    if (photo) {
      const selectedSize = SIZES[size as keyof typeof SIZES] || SIZES.medium;
      photo.name = `https://places.googleapis.com/v1/${photo.name}/media?key=${API_KEY}&maxWidthPx=${selectedSize.maxWidthPx}&maxHeightPx=${selectedSize.maxHeightPx}`;
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
