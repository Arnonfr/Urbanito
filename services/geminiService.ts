
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserPreferences, Route, POI, ExtendedSection, RouteConcept } from "../types";
import { cacheRoute } from "./supabase";

const cleanJson = (text: string) => {
  if (!text) return "{}";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const fetchCityRouteConcepts = async (city: string, language: 'he' | 'en'): Promise<RouteConcept[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langPrompt = language === 'he' ? "Hebrew" : "English";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of 20 DISTINCT and UNIQUE walking tour concepts for ${city}. 
      Vary the themes widely: History, Food, Nightlife, Art, Architecture, Myths, Movies filmed there, Hidden Gems, Romantic paths.
      
      Strictly output JSON array:
      [
        {
          "title": "Creative Title (e.g. 'The Da Vinci Code Path')",
          "description": "Short alluring description (max 15 words)",
          "tags": ["Art", "Mystery"],
          "duration": "2h",
          "difficulty": "easy"
        }
      ]
      Language: Strictly ${langPrompt}.`,
      config: { responseMimeType: "application/json" }
    });
    
    const concepts = JSON.parse(cleanJson(response.text || "[]"));
    return Array.isArray(concepts) ? concepts.map((c: any) => ({...c, id: Math.random().toString()})) : [];
  } catch (e) {
    console.error("Error fetching concepts", e);
    return [];
  }
};

export const generateWalkingRoute = async (
  city: string,
  location: { lat: number, lng: number } | null,
  preferences: UserPreferences,
  specificTheme?: string
): Promise<Route> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langInstruction = preferences.language === 'he' ? "Hebrew" : "English";
  const interests = preferences.interests.join(", ");
  const hiddenGems = preferences.hiddenGemsLevel > 50 ? "Focus on hidden gems and non-touristy spots." : "Focus on famous landmarks.";
  const maxKm = preferences.walkingDistance || 3;
  
  // Logic for POI count: Use user preference if set, otherwise fallback to distance-based calc
  const poiCount = preferences.desiredPoiCount || Math.min(12, Math.max(5, Math.floor(maxKm * 2.5))); 

  // Strict filtering logic
  let restrictions = "";
  if (preferences.religiousFriendly) {
    restrictions += "STRICT CONSTRAINT: EXCLUDE all active churches, cathedrals, mosques, monasteries, and active places of worship. Focus on history, markets, nature, and secular architecture only. ";
  }
  if (preferences.accessibleOnly) {
    restrictions += "STRICT CONSTRAINT: Route must be wheelchair accessible. Avoid stairs and steep climbs. ";
  }

  // Street Walk vs Classic Tour Logic
  let stylePrompt = "";
  if (preferences.routeStyle === 'street' && !specificTheme) {
    stylePrompt = `STYLE: "Street Stroll". Choose ONE famous street, promenade, or boulevard in this area. The route should be a linear walk along this specific street. The POIs should be specific buildings, statues, or spots ALONG this street. The audio descriptions should focus on the atmosphere of the street itself.`;
  } else {
    stylePrompt = `STYLE: "Classic Walking Tour". A curated loop or path connecting distinct landmarks.`;
  }

  // If a specific theme comes from the library (e.g., "Harry Potter in London")
  if (specificTheme) {
    stylePrompt = `THEME: The user explicitly selected the route concept: "${specificTheme}". Ensure ALL stops and the narrative strictly follow this specific theme.`;
  }

  let locationPrompt = `Create a walking route for ${city}.`;
  if (location) {
    locationPrompt = `Create a walking route centered exactly around: Latitude ${location.lat}, Longitude ${location.lng}. 
    The total walking distance of the entire loop/path MUST NOT exceed ${maxKm} km.`;
  } else {
    locationPrompt += ` The total route length must be around ${maxKm} km.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: `${locationPrompt}
    User Interests: ${interests}.
    Vibe: ${hiddenGems}.
    ${stylePrompt}
    ${restrictions}
    Return exactly ${poiCount} POIs.
    For each POI, assign a category from: ['history', 'food', 'architecture', 'nature', 'shopping', 'sailing', 'culture', 'religion', 'art'].
    For each POI (except the first), provide "travelFromPrevious" with estimated "distance" (e.g. "400m") and "duration" (e.g. "5 min walk").
    Language: ALL fields (names, descriptions, distances, durations) MUST be in ${langInstruction}. Do not use English.
    
    REQUIRED JSON FORMAT:
    {
      "name": "Route Name",
      "description": "Short summary",
      "pois": [
        { 
          "name": "Place Name", 
          "lat": 0.0, 
          "lng": 0.0, 
          "category": "history",
          "description": "One short sentence.",
          "travelFromPrevious": { "distance": "...", "duration": "..." } 
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  const rawText = response.text || "{}";
  let data;
  try {
     data = JSON.parse(cleanJson(rawText));
  } catch (e) {
     console.error("JSON Parse Error", e);
     throw new Error("Failed to parse route data");
  }

  const rawPois = Array.isArray(data.pois) ? data.pois : [];
  const fullPois: POI[] = rawPois.map((p: any, index: number) => ({
    ...p,
    id: `poi-${index}-${Math.random()}`,
    lat: !isNaN(parseFloat(p.lat)) ? parseFloat(p.lat) : 0,
    lng: !isNaN(parseFloat(p.lng)) ? parseFloat(p.lng) : 0,
    name: p.name || `Station ${index + 1}`,
    category: p.category || 'history',
    description: p.description || "",
    architecturalStyle: p.architecturalStyle || (preferences.language === 'he' ? "לחץ לטעינת ניתוח אדריכלי..." : "Click to load architectural analysis..."),
    historicalContext: p.historicalContext || (preferences.language === 'he' ? "לחץ לטעינת הקשר היסטורי..." : "Click to load historical context..."),
    tourScript: p.tourScript || p.description || "",
    // Image Generation Disabled per user request to save credits/resources
    imageUrl: undefined, 
    travelFromPrevious: p.travelFromPrevious || undefined
  }));

  const finalRoute: Route = {
    id: Math.random().toString(36).substr(2, 9),
    city: location ? "Custom Location" : city,
    name: data.name || `${city} Discovery`,
    description: data.description || "A curated walking tour.",
    durationMinutes: 90,
    creator: "Urban AI",
    pois: fullPois
  };

  if (!location) { cacheRoute(finalRoute).catch(console.error); }
  return finalRoute;
};

export const fetchExtendedPoiDetails = async (poiName: string, city: string, preferences: UserPreferences) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langPrompt = preferences.language === 'he' ? "Hebrew" : "English";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze "${poiName}" in ${city}. Provide 3 detailed sections strictly in ${langPrompt}: 1. History, 2. Architecture, 3. Hidden Secrets. Output JSON: { "sections": [{ "title": "", "content": "", "category": "history|architecture|secret" }] }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || '{ "sections": [] }'));
  } catch (e) {
    return { sections: [] };
  }
};

export const fetchDeepDiveDetails = async (poiName: string, city: string, preferences: UserPreferences) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langPrompt = preferences.language === 'he' ? "Hebrew" : "English";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Historical analysis for "${poiName}" in ${city}. Generate 4 sections in ${langPrompt}: Timeline, Key Figures, Legends, Cultural Significance. Word count: 200+ per section. Output JSON: { "sections": [{ "title": "...", "content": "...", "category": "timeline|biography|legend|culture" }] }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || '{ "sections": [] }'));
  } catch (e) {
    return { sections: [] };
  }
};

export const fetchNearbyGems = async (lat: number, lng: number, city: string, preferences: UserPreferences) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langPrompt = preferences.language === 'he' ? "Hebrew" : "English";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 3 hidden gems near coordinates ${lat}, ${lng} in ${city}. IMPORTANT: ALL descriptions and names MUST be strictly in ${langPrompt}. Do not use English if lang is Hebrew. Return JSON array of objects with name, description, lat, lng.`,
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(cleanJson(response.text || "[]"));
    return Array.isArray(parsed) ? parsed : (parsed.gems || []);
  } catch (e) {
    return [];
  }
};

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const generateSpeech = async (text: string, language: 'he' | 'en'): Promise<Uint8Array> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (!text) throw new Error("No text to speak");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 300) }] }], 
      config: { 
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        }
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio error");
    return decodeBase64(base64Audio);
  } catch (e) {
    throw e;
  }
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};
