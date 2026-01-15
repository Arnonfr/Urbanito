
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { UserPreferences, Route, POI } from "../types";
import { 
  findCuratedRoute, 
  cacheCuratedRoute, 
  getCachedPoiDetails,
  cachePoiDetails,
  checkUsageLimit,
  logUsage,
  supabase
} from "./supabase";

const cleanJson = (text: string) => {
  if (!text) return "{}";
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');

  let start = -1;
  let end = -1;

  if (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) {
    start = jsonStart;
    end = jsonEnd;
  } else if (arrayStart !== -1) {
    start = arrayStart;
  }

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
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
  ${depthInstruction}`;
};

async function callGemini(params: any, useSearch = true): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = { ...params.config };
  if (useSearch) config.tools = [{ googleSearch: {} }];
  try {
    const response = await ai.models.generateContent({
      model: params.model || "gemini-3-flash-preview",
      contents: params.contents,
      config
    });
    return response;
  } catch (e: any) {
    if (e.message?.includes('429') && useSearch) return callGemini(params, false);
    throw e;
  }
}

export const fetchExtendedPoiDetails = async (poiName: string, city: string, preferences: UserPreferences) => {
  // First check Supabase cache
  const cached = await getCachedPoiDetails(poiName, city);
  if (cached) return cached;
  
  const langName = preferences.language === 'he' ? "Hebrew" : "English";
  const response = await callGemini({
    model: "gemini-3-pro-preview",
    contents: `As an expert historian, provide a deep, fascinating and extremely detailed exploration of "${poiName}" in ${city}.
    The content MUST be long (at least 4-5 paragraphs) and include historical secrets, architectural significance, and cultural context.
    Text in ${langName}. 
    JSON: { "historicalAnalysis": "Extensive text here...", "architecturalAnalysis": "Detailed architectural breakdown...", "narrative": "A compelling story for a guide..." }`,
    config: { 
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  
  const data = JSON.parse(cleanJson(response.text || '{}'));
  if (data.historicalAnalysis) {
    // Immediately save to Supabase cache
    await cachePoiDetails(poiName, city, data);
  }
  return data;
};

export const generateWalkingRoute = async (city: string, location: any, preferences: UserPreferences, specificTheme?: string, userId?: string | null): Promise<Route> => {
  const quota = await checkUsageLimit(userId || null);
  if (!quota.allowed) throw new Error("QUOTA_EXCEEDED");
  
  const cacheKey = (specificTheme || "General") + "-" + preferences.language + "-" + preferences.explanationStyle;
  const existing = await findCuratedRoute(city, cacheKey);
  if (existing) return existing;

  const response = await callGemini({
    model: "gemini-3-pro-preview", 
    contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, city)} Design a comprehensive walking tour for ${city}. 
    Return JSON: { 
      "name": "Title", 
      "description": "Overview", 
      "pois": [ 
        { 
          "name": "Site Name", 
          "lat": 0.0, 
          "lng": 0.0, 
          "narrative": "A short intro narrative", 
          "category": "history"
        } 
      ] 
    }`,
    config: { responseMimeType: "application/json" }
  });

  const data = JSON.parse(cleanJson(response.text || "{}"));
  const route: Route = {
    id: `route-${Date.now()}`,
    city,
    name: data.name || city,
    description: data.description || "",
    durationMinutes: 120,
    creator: "Urbanito AI",
    style: 'area',
    pois: (data.pois || []).map((p: any, i: number) => ({ 
      ...p, 
      id: `p-${i}-${Date.now()}`, 
      tourScript: p.narrative, 
      description: p.narrative,
      // Removed unsplash hardcoding - frontend uses GoogleImage component now
      imageUrl: "" 
    }))
  };
  
  await logUsage(userId || null, city);
  await cacheCuratedRoute(city, cacheKey, route);
  return route;
};

export const generateStreetWalkRoute = async (streetName: string, location: any, preferences: UserPreferences, userId?: string | null): Promise<Route> => {
  const quota = await checkUsageLimit(userId || null);
  if (!quota.allowed) throw new Error("QUOTA_EXCEEDED");
  
  const cacheKey = "Street-" + preferences.language + "-" + preferences.explanationStyle + "-" + streetName;
  const existing = await findCuratedRoute(streetName, cacheKey);
  if (existing) return existing;

  const response = await callGemini({
    model: "gemini-3-pro-preview",
    contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, streetName)} 
    Design a deep "Street Walk" for "${streetName}".
    Return JSON: { 
      "name": "Title", 
      "description": "Overview", 
      "pois": [ 
        { 
          "name": "Spot", 
          "lat": 0.0, 
          "lng": 0.0, 
          "narrative": "Initial story", 
          "category": "architecture"
        } 
      ] 
    }`,
    config: { responseMimeType: "application/json" }
  });

  const data = JSON.parse(cleanJson(response.text || "{}"));
  const route: Route = {
    id: `st-${Date.now()}`,
    city: streetName,
    name: data.name || streetName,
    description: data.description || "",
    durationMinutes: 45,
    creator: "Street Guide",
    style: 'street',
    pois: (data.pois || []).map((p: any, i: number) => ({ 
      ...p, 
      id: `sp-${i}-${Date.now()}`, 
      tourScript: p.narrative, 
      description: p.narrative,
      imageUrl: "" 
    }))
  };

  await cacheCuratedRoute(streetName, cacheKey, route);
  return route;
};

export const suggestNearbyGems = async (center: { city: string, lat: number, lng: number }, language: string) => {
  const cityKey = center.city.toLowerCase().trim();
  const { data: cached } = await supabase.from('curated_routes').select('route_data').eq('city', cityKey).eq('theme', 'gems-cache').maybeSingle();
  if (cached) return (cached.route_data as any).gems || [];

  const langName = language === 'he' ? "Hebrew" : "English";
  const response = await callGemini({
    contents: `Identify 3 unique hidden urban gems within 500m of coordinates (${center.lat}, ${center.lng}) in ${center.city}. 
    MANDATORY: Return accurate GPS coordinates for each.
    Text in ${langName}. 
    JSON array only: [{ "name": "...", "lat": 0.0, "lng": 0.0, "description": "..." }]`,
    config: { responseMimeType: "application/json" }
  });
  const gems = JSON.parse(cleanJson(response.text || "[]"));
  
  await supabase.from('curated_routes').upsert({
    city: cityKey,
    theme: 'gems-cache',
    route_data: { gems }
  });
  
  return gems;
};

export const generateSpeech = async (text: string, language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: language === 'he' ? 'Kore' : 'Puck' } } } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: string | Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const bytes = typeof data === 'string' ? decode(data) : data;
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
