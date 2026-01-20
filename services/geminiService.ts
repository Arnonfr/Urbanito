
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { UserPreferences, Route, POI } from "../types";
import { 
  findCuratedRoute, 
  cacheCuratedRoute, 
  getCachedPoiDetails,
  cachePoiDetails,
  checkUsageLimit,
  logUsage,
  generateStableId,
  supabase
} from "./supabase";

const cleanJson = (text: string) => {
  if (!text) return "{}";
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');
  let start = -1; let end = -1;
  if (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) { start = jsonStart; end = jsonEnd; }
  else if (arrayStart !== -1) { start = arrayStart; end = arrayEnd; }
  if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
  return text.trim();
};

const getGuidePrompt = (style: string, language: string, city: string) => {
  const langName = language === 'he' ? "Hebrew" : "English";
  let depthInstruction = "";
  if (style === 'simple') depthInstruction = "Keep descriptions brief and simple.";
  if (style === 'standard') depthInstruction = "Provide balanced descriptions with key historical facts.";
  if (style === 'deep') depthInstruction = "Act as a leading historian. Provide academic-level historical context with rich storytelling.";
  
  return `You are a world-class urban historian and professional tour guide in ${city}. 
  MANDATORY: All descriptive text fields must be exclusively in ${langName}.
  Return valid JSON only. 
  
  NARRATIVE GUIDELINES:
  1. Create a cohesive story. Each point of interest must feel like a chapter in a book, not an isolated fact sheet.
  2. Use "Narrative Bridges": Connect the current stop to the previous one using thematic links (e.g., architectural evolution, social changes, or historical consequences).
  3. AVOID REPETITION: Do not use phrases like "Next we go to...", "Our next stop is...", "Move on to...". 
  4. Write an "Introduction/Preface" (3-4 sentences) that sets the historical context and atmosphere of the entire area before starting the tour.
  ${depthInstruction}`;
};

async function callGemini(params: any, useSearch = true): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const config: any = { 
    maxOutputTokens: params.config?.maxOutputTokens || 1024,
    temperature: params.config?.temperature || 0.7,
    responseMimeType: params.config?.responseMimeType
  };
  
  if (useSearch) config.tools = [{ googleSearch: {} }];

  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: typeof params.contents === 'string' ? params.contents : JSON.stringify(params.contents) }] }], 
      config 
    });
    return response;
  } catch (e: any) {
    console.error("Gemini Call Error:", e);
    // If search tool fails or invalid request, retry without search or different parameters
    if (useSearch && (e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('400'))) {
       return callGemini(params, false);
    }
    throw e;
  }
}

export const fetchExtendedPoiDetails = async (poiName: string, city: string, preferences: UserPreferences, lat?: number, lng?: number) => {
  const cached = await getCachedPoiDetails(poiName, city, lat, lng);
  if (cached) return { ...cached, isFullyLoaded: true };
  
  const langName = preferences.language === 'he' ? "Hebrew" : "English";
  const response = await callGemini({
    contents: `As an expert historian, provide a deep exploration of "${poiName}" in ${city}.
    Content MUST be at least 4-5 paragraphs. Return JSON format. Text must be in ${langName}. 
    Focus on unique storytelling and connecting this site to the broader history of the city.
    JSON: { "historicalAnalysis": "...", "architecturalAnalysis": "...", "narrative": "...", "lat": ${lat || 0}, "lng": ${lng || 0}, "sections": [{"title": "...", "content": "..."}], "sources": [{"title": "...", "url": "..."}] }`,
    config: { 
      responseMimeType: "application/json"
    }
  });
  
  try {
    const data = JSON.parse(cleanJson(response.text || '{}'));
    if (data.historicalAnalysis) await cachePoiDetails(poiName, city, { ...data, lat, lng });
    return { ...data, isFullyLoaded: true };
  } catch (e) { return null; }
};

export const fetchDeepResearch = async (poiName: string, city: string, language: 'he' | 'en') => {
  const langName = language === 'he' ? "Hebrew" : "English";
  
  const response = await callGemini({
    contents: `Search for deep historical facts, local legends, and unique blog posts about "${poiName}" in ${city}. 
    Provide an "insider" view that isn't in standard guidebooks.
    Return JSON format in ${langName}: 
    { "deepAnalysis": "...", "localLegends": "...", "citations": [{"title": "...", "url": "...", "snippet": "..."}] }`,
    config: { 
      responseMimeType: "application/json"
    }
  });

  try {
    const data = JSON.parse(cleanJson(response.text || '{}'));
    return data;
  } catch (e) {
    return null;
  }
};

const autoEnrichPoi = async (p: any, city: string) => {
  const cached = await getCachedPoiDetails(p.name, city, p.lat, p.lng);
  const stableId = generateStableId(p.name, p.lat, p.lng);
  if (cached) return { ...p, ...cached, id: stableId, isFullyLoaded: true };
  return { ...p, id: stableId, isFullyLoaded: false };
};

const createCacheKey = (prefix: string, prefs: UserPreferences, streetName?: string) => {
  const parts = [
    prefix,
    prefs.language,
    prefs.explanationStyle,
    prefs.desiredPoiCount || 5,
    prefs.walkingDistance || 3,
    prefs.hiddenGemsLevel || 30,
    prefs.religiousFriendly ? 'nochr' : 'all',
    streetName || ''
  ];
  return parts.join('-');
};

export const generateWalkingRoute = async (city: string, location: any, preferences: UserPreferences, specificTheme?: string, userId?: string | null): Promise<Route> => {
  const quota = await checkUsageLimit(userId || null);
  const cacheKey = createCacheKey(specificTheme || "General", preferences);
  const existing = await findCuratedRoute(city, cacheKey);
  if (existing) return existing;

  const response = await callGemini({
    contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, city)} Design a comprehensive walking tour for ${city} with exactly ${preferences.desiredPoiCount || 5} stops. 
    
    The JSON structure MUST be:
    { 
      "name": "Tour Title", 
      "description": "Preface/Introductory text setting the scene", 
      "pois": [ 
        { 
          "name": "Site Name", 
          "lat": 0.0, 
          "lng": 0.0, 
          "narrative": "Cohesive story part with bridges to previous/next", 
          "category": "history" 
        } 
      ] 
    }
    
    Walking distance should be roughly ${preferences.walkingDistance}km.`,
    config: { 
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(cleanJson(response.text || "{}"));
  const enrichedPois = await Promise.all((data.pois || []).map((p: any) => autoEnrichPoi(p, city)));
  const route: Route = { id: `route-${Date.now()}`, city, name: data.name || city, description: data.description || "", durationMinutes: 120, creator: "Urbanito AI", style: 'area', pois: enrichedPois };
  await logUsage(userId || null, city);
  await cacheCuratedRoute(city, cacheKey, route);
  return route;
};

export const generateStreetWalkRoute = async (streetName: string, location: any, preferences: UserPreferences, userId?: string | null): Promise<Route> => {
  const cacheKey = createCacheKey("Street", preferences, streetName);
  const existing = await findCuratedRoute(streetName, cacheKey);
  if (existing) return existing;

  const response = await callGemini({
    contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, streetName)} Design a deep "Street Walk" for "${streetName}" with ${preferences.desiredPoiCount || 5} interesting points.
    
    The JSON structure MUST be:
    { 
      "name": "Title", 
      "description": "Preface/Introductory context for the street", 
      "pois": [ 
        { 
          "name": "Spot", 
          "lat": 0.0, 
          "lng": 0.0, 
          "narrative": "Story part with thematic flow", 
          "category": "architecture" 
        } 
      ] 
    }`,
    config: { 
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(cleanJson(response.text || "{}"));
  const enrichedPois = await Promise.all((data.pois || []).map((p: any) => autoEnrichPoi(p, streetName)));
  const route: Route = { id: `st-${Date.now()}`, city: streetName, name: data.name || streetName, description: data.description || "", durationMinutes: 45, creator: "Street Guide", style: 'street', pois: enrichedPois };
  await cacheCuratedRoute(streetName, cacheKey, route);
  return route;
};

export const suggestNearbyGems = async (center: { city: string, lat: number, lng: number }, language: string) => {
  const response = await callGemini({
    contents: `Identify 3 unique hidden urban gems within 500m of coordinates (${center.lat}, ${center.lng}) in ${center.city}. Return JSON array: [{ "name": "...", "lat": 0.0, "lng": 0.0, "description": "..." }]`,
    config: { 
      responseMimeType: "application/json"
    }
  });
  const gems = JSON.parse(cleanJson(response.text || "[]"));
  return gems;
};

export const generateSpeech = async (text: string, language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: language === 'he' ? 'Kore' : 'Puck' } 
          } 
        } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    return "";
  }
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: string | Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const bytes = typeof data === 'string' ? decode(data) : data;
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
