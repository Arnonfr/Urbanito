
import { GoogleGenAI, Modality } from "@google/genai";
import { UserPreferences, Route, POI, RouteConcept } from "../types";
import { 
  findCuratedRoute, 
  cacheCuratedRoute, 
  getCachedLibrary, 
  saveLibraryToDb,
  getCachedPoiDetails,
  cachePoiDetails,
  checkUsageLimit,
  logUsage
} from "./supabase";

const cleanJson = (text: string) => {
  if (!text) return "{}";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return cleaned;
};

const getGuidePrompt = (style: 'simple' | 'standard' | 'deep' = 'standard', language: 'he' | 'en' = 'he') => {
  const langName = language === 'he' ? "Hebrew" : "English";
  let depthInstruction = "";
  if (style === 'simple') {
    depthInstruction = "Keep explanations SIMPLE, short and atmosphere-focused. 2-3 paragraphs max.";
  } else if (style === 'deep') {
    depthInstruction = "Provide EXTREMELY DEEP and EXTENSIVE historical and architectural context. Write LONG, multi-paragraph analysis for each section. Dive into social context, hidden inscriptions, and evolution of the site.";
  } else {
    depthInstruction = "Provide a BALANCED, informative overview with at least 3 detailed sections.";
  }

  return `
You are a WORLD-CLASS LOCAL EXPERT and Professional Tour Guide. 
STRICT RULES:
1. NO HALLUCINATIONS: Do not invent history.
2. NEUTRAL & RESPECTFUL TONE.
3. DEPTH INSTRUCTION: ${depthInstruction}
4. MANDATORY JSON: Always return valid JSON.
5. LANGUAGE: STRICTLY and ONLY use ${langName} for ALL text content (titles, descriptions, narratives, names).
6. SOURCES: Always provide real, credible references for the information.
7. IMAGE KEYWORDS: Provide scenic, vibrant, and attractive travel photography keywords. Avoid industrial or mundane keywords.
`;
};

async function callGemini(params: any, useSearch = true): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config = { ...params.config };
  
  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  } else {
    delete config.tools;
  }

  try {
    const response = await ai.models.generateContent({
      model: params.model || "gemini-3-flash-preview",
      contents: params.contents,
      config
    });
    return response;
  } catch (e: any) {
    if (e.message?.includes('429') && useSearch) {
      console.warn("Search grounding quota exceeded, falling back to standard generation.");
      return callGemini(params, false);
    }
    throw e;
  }
}

export const fetchExtendedPoiDetails = async (poiName: string, city: string, preferences: UserPreferences) => {
  const cached = await getCachedPoiDetails(poiName, city);
  if (cached && cached.isFullyLoaded) return cached;

  const langName = preferences.language === 'he' ? "Hebrew" : "English";
  try {
    const response = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language)}
      Provide an EXTENSIVE analysis for "${poiName}" in ${city}. 
      Return the content STRICTLY in ${langName}.
      Required Sections:
      - historicalAnalysis: A narrative summary.
      - architecturalAnalysis: Detailed style breakdown.
      - sections: At least 3 detailed sub-sections (e.g., Legends, Inside secrets, Modern usage).
      - sources: Array of real books, journals, or credible museum/tourism websites used.
      
      Return JSON: { 
        "historicalAnalysis": "...", 
        "architecturalAnalysis": "...",
        "sections": [{ "title": "...", "content": "..." }],
        "sources": [{ "title": "...", "url": "..." }],
        "imageKeywords": ["scenic travel photography"],
        "officialImageUrl": ""
      }.`,
      config: { responseMimeType: "application/json" }
    });
    const details = JSON.parse(cleanJson(response.text || '{}'));
    const enriched = { ...details, isFullyLoaded: true };
    cachePoiDetails(poiName, city, enriched);
    return enriched;
  } catch (e) { 
    return null; 
  }
};

export const fetchCityRouteConcepts = async (city: string, language: 'he' | 'en'): Promise<RouteConcept[]> => {
  const cached = await getCachedLibrary(city);
  if (cached) return cached;

  const langName = language === 'he' ? "Hebrew" : "English";
  try {
    const response = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `${getGuidePrompt('standard', language)}
      Generate 15 unique walking tour concepts for ${city} strictly in ${langName}. 
      Return JSON array: [{ "title": "...", "description": "...", "tags": [], "duration": "...", "difficulty": "..." }].`,
      config: { responseMimeType: "application/json" }
    });
    const concepts = JSON.parse(cleanJson(response.text || "[]")).map((c: any) => ({...c, id: Math.random().toString()}));
    if (concepts.length > 0) await saveLibraryToDb(city, concepts);
    return concepts;
  } catch (e) { return []; }
};

export const suggestNearbyGems = async (currentRoute: Route, language: 'he' | 'en'): Promise<POI[]> => {
  const langName = language === 'he' ? "Hebrew" : "English";
  const context = currentRoute.pois.map(p => p.name).join(", ");
  try {
    const response = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Find 2 hidden gems near: ${context} in ${currentRoute.city} strictly in ${langName}. 
      Return JSON array: [{ "name": "...", "lat": 0.0, "lng": 0.0, "description": "...", "category": "history" }].`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(cleanJson(response.text || "[]"));
    return data.map((p: any, idx: number) => ({
      ...p,
      id: `gem-${Date.now()}-${idx}`,
      imageUrl: `https://images.unsplash.com/featured/?${encodeURIComponent(p.name + " vibrant architecture")}`
    }));
  } catch (e) { return []; }
};

export const generateWalkingRoute = async (
  city: string,
  location: { lat: number, lng: number } | null,
  preferences: UserPreferences,
  specificTheme?: string,
  userId?: string | null
): Promise<Route> => {
  const quota = await checkUsageLimit(userId || null);
  if (!quota.allowed) throw new Error("QUOTA_EXCEEDED");

  const bypassCache = !!location || city === "Current View" || !!specificTheme;
  if (!bypassCache) {
    const existing = await findCuratedRoute(city, "General Exploration");
    if (existing) return existing;
  }

  const langName = preferences.language === 'he' ? "Hebrew" : "English";

  const response = await callGemini({
    model: "gemini-3-pro-preview", 
    contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language)}
    Design a definitive walking route for ${city} strictly in ${langName}. Theme: "${specificTheme || 'Urban Exploration'}".
    Return JSON: { "name": "...", "description": "...", "pois": [{"name": "...", "lat": 0.0, "lng": 0.0, "narrative": "...", "category": "history", "imageSearchKeyword": "scenic travel landmark photography", "travelFromPrevious": {"distance": "...", "duration": "..."}}] }`,
    config: { responseMimeType: "application/json" }
  });

  const data = JSON.parse(cleanJson(response.text || "{}"));
  const finalRoute: Route = {
    id: Math.random().toString(36).substr(2, 9),
    city: city,
    name: data.name || (preferences.language === 'he' ? `${city}: חקר עירוני` : `${city}: Urban Exploration`),
    description: data.description || "",
    durationMinutes: 120,
    creator: "Urbanito AI",
    pois: (data.pois || []).map((p: any, index: number) => ({
      ...p,
      id: `poi-${index}-${Date.now()}`,
      lat: parseFloat(p.lat) || 0,
      lng: parseFloat(p.lng) || 0,
      tourScript: p.narrative || p.description,
      description: p.narrative || p.description,
      category: p.category || 'history',
      imageUrl: `https://images.unsplash.com/featured/?${encodeURIComponent(p.imageSearchKeyword + " scenic " + city)}`,
      isFullyLoaded: false
    }))
  };

  await logUsage(userId || null, city);
  if (!bypassCache) await cacheCuratedRoute(city, "General Exploration", finalRoute);
  return finalRoute;
};

export const fetchNearbySuggestions = async (poi: POI, city: string, language: 'he' | 'en'): Promise<POI[]> => {
  const langName = language === 'he' ? "Hebrew" : "English";
  try {
    const response = await callGemini({
      model: "gemini-3-flash-preview",
      contents: `Find 3 interesting places near "${poi.name}" in ${city} strictly in ${langName}. 
      Return JSON array: [{ "name": "...", "description": "...", "approxDistance": "...", "category": "history" }].`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(cleanJson(response.text || "[]"));
    return data.map((p: any, idx: number) => ({
      ...p,
      id: `nearby-${Date.now()}-${idx}`,
      imageUrl: `https://images.unsplash.com/featured/?${encodeURIComponent(p.name + " aesthetic travel")}`
    }));
  } catch (e) { return []; }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  base64: string,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const data = decodeBase64(base64);
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
}

export const generateSpeech = async (text: string, language: 'he' | 'en'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voiceName = language === 'he' ? 'Kore' : 'Puck'; 
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};
