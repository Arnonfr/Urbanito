
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { UserPreferences, Route, POI } from "../types";
import {
  getCachedPoiDetails,
  cachePoiDetails,
  logUsage,
  generateStableId,
  supabase
} from "./supabase";

/**
 * Robustly retrieves the Gemini API Key from multiple possible environment sources.
 * Checks import.meta.env (Vite standard) and process.env (Legacy/Fallback).
 */
const getApiKey = () => {
  // @ts-ignore - import.meta is a Vite feature
  const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;

  // Fallback to process.env for legacy/other setups
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  }

  return "";
};

/**
 * Helper to clean JSON from model response if it contains markdown markers
 */
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
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const getGuidePrompt = (style: string, language: string, city: string, prefs: UserPreferences) => {
  const isHe = language === 'he';
  const langName = isHe ? "Hebrew" : "English";

  const qualityRule = `CRITICAL ACCURACY & LANGUAGE RULE: 
  1. LANGUAGE: ALL TEXT (Titles, descriptions, narratives, sections) MUST be exclusively in ${langName}. 
  2. STRICT: Do not use English headers or terms if the target language is Hebrew.
  3. LOCATION: Every point of interest MUST be physically located in or immediately adjacent to ${city}.
  4. NO HALLUCINATIONS: Do not invent names of buildings or fictional events. 
  5. STORYTELLING: Use professional historian style.`;

  return `You are a world-class urban historian for the city of ${city}. 
  MANDATORY: ALL output must be in ${langName}.
  ${qualityRule}
  NAME FORMATTING: ${isHe ? '"שם בעברית (Original Name)"' : '"Name"'}.
  Return valid JSON only.`;
};

/**
 * aiCall with retry mechanism for 503 errors.
 * Using gemini-3-flash-preview for optimal performance in text tasks.
 */
async function aiCall(params: any, retries = 3): Promise<any> {
  const apiKey = getApiKey();
  console.log('🔑 API Key check:', {
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 10) || 'none'
  });

  if (!apiKey) {
    console.error("CRITICAL ERROR: Gemini API Key is missing. Please check your environment variables (VITE_GEMINI_API_KEY).");
    throw new Error("An API Key must be set for Urbanito to function.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  console.log('🚀 Making Gemini API call:', {
    model,
    hasContents: !!params.contents,
    contentsLength: params.contents?.length || 0,
    retries
  });

  try {
    const response = await ai.models.generateContent({ ...params, model });
    console.log('✅ Gemini API success:', {
      hasText: !!response.text,
      textLength: response.text?.length || 0
    });
    return response;
  } catch (error: any) {
    console.error('❌ Gemini API error:', {
      status: error.status,
      message: error.message,
      errorType: error.constructor.name,
      fullError: error
    });

    if (retries > 0 && (error.status === 503 || error.message?.includes('503'))) {
      console.warn(`Gemini 503 error, retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1500 * (4 - retries)));
      return aiCall(params, retries - 1);
    }
    throw error;
  }
}

export async function fetchExtendedPoiDetails(poiName: string, city: string, preferences: UserPreferences, lat?: number, lng?: number) {
  try {
    const cached = await getCachedPoiDetails(poiName, city, lat, lng);
    if (cached && cached.historicalAnalysis && cached.historicalAnalysis.length > 300) return { ...cached, isFullyLoaded: true };

    const isHe = preferences.language === 'he';
    const langName = isHe ? "Hebrew" : "English";
    const response = await aiCall({
      contents: `Provide rich, engaging, and reliable historical context for "${poiName}" in ${city} (Location: ${lat}, ${lng}).
      
      CRITICAL INSTRUCTIONS:
      1. LANGUAGE: ALL content (titles, text, analysis) MUST be in ${langName} only.
      2. DEPTH: Write 2-5 detailed paragraphs. Do not force information if it doesn't exist, but find 2-3 fascinating facts or historical anecdotes.
      3. TONE: Professional yet engaging urban historian.
      4. ACCURACY: STRICTLY NO HALLUCINATIONS. If specific details aren't known, focus on the general architectural/historical context of the area/street.
      
      JSON SCHEMA: { 
        "historicalAnalysis": "2-5 comprehensive paragraphs in ${langName} covering history, significance, and interesting anecdotes...", 
        "architecturalAnalysis": "Detailed architectural style and features analysis in ${langName}...", 
        "narrative": "A cohesive story of the place in ${langName}...", 
        "sections": [{"title": "Meaningful Title in ${langName}", "content": "Specific detail/fact in ${langName}..."}], 
        "sources": [{"title": "Reference Name", "url": "..."}],
        "shareTeaser": "A very short (1 sentence) intriguing fact about this specific place for sharing."
      }`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(cleanJson(response.text || '{}'));
    if (data.historicalAnalysis) {
      await cachePoiDetails(poiName, city, { ...data, lat, lng });
    }
    return { ...data, isFullyLoaded: true };
  } catch (e) { return null; }
}

export const generateWalkingRoute = async (city: string, location: any, preferences: UserPreferences, theme?: string, userId?: string | null): Promise<Route | null> => {
  try {
    const isHe = preferences.language === 'he';
    const langName = isHe ? "Hebrew" : "English";

    // Extract user preferences with defaults
    const poiCount = preferences.desiredPoiCount || 5;
    const walkingDistanceKm = preferences.walkingDistance || 3;
    const interests = preferences.interests?.length > 0 ? preferences.interests.join(', ') : 'general history and culture';
    const explanationDepth = preferences.explanationStyle || 'standard';

    // Build constraints based on preferences
    const constraints: string[] = [];
    if (preferences.religiousFriendly) constraints.push('suitable for religious visitors');
    if (preferences.veganFriendly) constraints.push('include vegan-friendly locations');
    if (preferences.accessibleOnly) constraints.push('wheelchair accessible');

    const constraintsText = constraints.length > 0 ? `\nADDITIONAL CONSTRAINTS: ${constraints.join(', ')}.` : '';

    // Bilingual naming instruction - CRITICAL: First line = target language, Second line = original language
    const namingFormat = isHe
      ? 'CRITICAL POI NAME FORMAT: "Hebrew Translation (Original Name)" - Example: "כיכר הקפיטול (Place du Capitole)". The Hebrew name comes FIRST, then the original name in parentheses.'
      : 'POI names in English with original local name in parentheses if different (e.g., "Capitol Square (Place du Capitole)")';

    const response = await aiCall({
      contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, city, preferences)}
      
TASK: Create a verified walking tour for ${city} starting at coordinates ${location.lat}, ${location.lng}.

ROUTE PARAMETERS:
- Number of stops: EXACTLY ${poiCount} POIs
- Maximum walking distance: ${walkingDistanceKm} km total
- User interests: ${interests}
- Explanation depth: ${explanationDepth}${constraintsText}

CRITICAL NAMING FORMAT (MUST FOLLOW EXACTLY):
${namingFormat}
REMINDER: For Hebrew - format is "תרגום עברי (Original Name)" NOT "Original Name (תרגום עברי)"

QUALITY REQUIREMENTS:
1. ALL POIs must be REAL, verified locations in ${city}
2. POIs should be within ${walkingDistanceKm}km walking distance from the starting point
3. Create a logical walking route (each POI close to the previous one)
4. Each narrative must be 3-4 accurate, engaging paragraphs in ${langName}
5. Include diverse categories: history, architecture, culture, etc.
6. NO HALLUCINATIONS - only real places with accurate information

JSON SCHEMA:
{
  "name": "Engaging tour title in ${langName}",
  "description": "2-3 sentence introduction in ${langName}",
  "shareTeaser": "A fascinating, TRUE anecdote or surprising fact about one of the tour's locations (1-2 sentences max, in ${langName}). Make it curiosity-inducing and shareable. Example: 'Did you know that beneath the main square lies a 2000-year-old Roman bath that was only discovered in 1952?'",
  "pois": [
    {
      "name": ${isHe ? '"שם בעברית (Original Name)"' : '"English Name (Original Name if different)"'},
      "lat": <latitude>,
      "lng": <longitude>,
      "narrative": "3-4 detailed paragraphs in ${langName}",
      "category": "history|architecture|culture|food|nature|art|religion"
    }
  ]
}

Return ONLY valid JSON.`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(cleanJson(response.text || "{}"));
    const pois = (data.pois || []).map((p: any) => ({
      ...p,
      id: generateStableId(p.name, p.lat, p.lng),
      isFullyLoaded: false
    }));

    // Calculate estimated duration based on POI count and walking distance
    const estimatedDuration = Math.round((poiCount * 15) + (walkingDistanceKm * 20)); // 15 min per POI + 20 min per km

    return {
      id: `r-${Date.now()}`,
      city,
      name: data.name || city,
      description: data.description || "",
      shareTeaser: data.shareTeaser || "",
      durationMinutes: estimatedDuration,
      creator: "Urbanito AI",
      pois
    };
  } catch (err) { throw err; }
};

export const generateStreetWalkRoute = async (streetName: string, location: any, preferences: UserPreferences, userId?: string | null): Promise<Route | null> => {
  try {
    const isHe = preferences.language === 'he';
    const langName = isHe ? "Hebrew" : "English";

    // Extract user preferences with defaults (street walks are typically shorter)
    const poiCount = preferences.desiredPoiCount || 4; // Fewer stops for street walks
    const interests = preferences.interests?.length > 0 ? preferences.interests.join(', ') : 'architecture and local history';

    // Bilingual naming instruction - CRITICAL: First line = target language, Second line = original language
    const namingFormat = isHe
      ? 'CRITICAL POI NAME FORMAT: "Hebrew Translation (Original Name)" - Example: "בית הראשונים (First Settlers House)". The Hebrew name comes FIRST, then the original name in parentheses.'
      : 'POI names in English with original local name in parentheses if different (e.g., "First Settlers House (בית הראשונים)")';

    const response = await aiCall({
      contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, streetName, preferences)}
      
TASK: Create a focused street walking tour along "${streetName}".

ROUTE PARAMETERS:
- Number of stops: EXACTLY ${poiCount} POIs
- ALL POIs must be located ON or IMMEDIATELY ADJACENT to ${streetName}
- Focus: ${interests}
- Language: ${langName}

CRITICAL NAMING FORMAT (MUST FOLLOW EXACTLY):
${namingFormat}
REMINDER: For Hebrew - format is "תרגום עברי (Original Name)" NOT "Original Name (תרגום עברי)"

QUALITY REQUIREMENTS:
1. ALL POIs must be REAL locations on ${streetName}
2. Focus on architectural details, historical buildings, and street-specific stories
3. Each narrative must be 3-4 accurate paragraphs in ${langName}
4. Maintain geographical order along the street
5. NO HALLUCINATIONS - only verified locations

JSON SCHEMA:
{
  "name": "Engaging street tour title in ${langName}",
  "description": "2-3 sentence introduction about ${streetName} in ${langName}",
  "shareTeaser": "A fascinating, TRUE anecdote or surprising fact about ${streetName} or one of its buildings (1-2 sentences max, in ${langName}). Make it curiosity-inducing and shareable. Example: 'This street was once the secret meeting place of revolutionaries in 1848, and you can still see their coded symbols on building #12.'",
  "pois": [
    {
      "name": ${isHe ? '"שם בעברית (Original Name)"' : '"English Name (Original Name if different)"'},
      "lat": <latitude>,
      "lng": <longitude>,
      "narrative": "3-4 detailed paragraphs in ${langName}",
      "category": "architecture|history|culture|art"
    }
  ]
}

Return ONLY valid JSON.`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(cleanJson(response.text || "{}"));
    const pois = (data.pois || []).map((p: any) => ({
      ...p,
      id: generateStableId(p.name, p.lat, p.lng),
      isFullyLoaded: false
    }));

    // Calculate duration: 10 min per POI for street walks
    const estimatedDuration = poiCount * 10;

    return {
      id: `st-${Date.now()}`,
      city: streetName,
      name: data.name || streetName,
      description: data.description || "",
      shareTeaser: data.shareTeaser || "",
      durationMinutes: estimatedDuration,
      creator: "Street Guide",
      pois
    };
  } catch (err) { throw err; }
};

export const generateSpeech = async (text: string, language: string) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("Speech generation skipped: API Key missing");
      return "";
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: language === 'he' ? 'Kore' : 'Puck'
            }
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};
