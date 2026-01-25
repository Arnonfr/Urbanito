
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
  if (!apiKey) {
    console.error("CRITICAL ERROR: Gemini API Key is missing. Please check your environment variables (VITE_GEMINI_API_KEY).");
    throw new Error("An API Key must be set for Urbanito to function.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';

  try {
    return await ai.models.generateContent({ ...params, model });
  } catch (error: any) {
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
      contents: `Provide reliable historical context for "${poiName}" in ${city} (Location: ${lat}, ${lng}).
      STRICT REQUIREMENT: ALL text including section titles MUST be in ${langName}. No English headers.
      MANDATORY: NO HALLUCINATIONS.
      
      JSON SCHEMA: { 
        "historicalAnalysis": "Detailed paragraphs in ${langName}...", 
        "architecturalAnalysis": "Contextual style info in ${langName}...", 
        "narrative": "Accurate storytelling in ${langName}...", 
        "sections": [{"title": "Localized Title in ${langName}", "content": "Content in ${langName}..."}], 
        "sources": [{"title": "Reference Name", "url": "..."}] 
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
    const response = await aiCall({
      contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, city, preferences)} 
      Create a verified walking tour for ${city} starting at ${location.lat}, ${location.lng}. 
      Ensure all POIs are real. Everything in ${langName}.
      JSON: { "name": "Localized Tour Title", "description": "Intro in ${langName}", "pois": [{ "name": "שם (Original)", "lat": 0, "lng": 0, "narrative": "3-4 accurate paragraphs in ${langName}", "category": "history" }] }`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(cleanJson(response.text || "{}"));
    const pois = (data.pois || []).map((p: any) => ({ ...p, id: generateStableId(p.name, p.lat, p.lng), isFullyLoaded: false }));
    return { id: `r-${Date.now()}`, city, name: data.name || city, description: data.description || "", durationMinutes: 120, creator: "Urbanito AI", pois };
  } catch (err) { throw err; }
};

export const generateStreetWalkRoute = async (streetName: string, location: any, preferences: UserPreferences, userId?: string | null): Promise<Route | null> => {
  try {
    const isHe = preferences.language === 'he';
    const langName = isHe ? "Hebrew" : "English";
    const response = await aiCall({
      contents: `${getGuidePrompt(preferences.explanationStyle, preferences.language, streetName, preferences)} 
      Street Walk for "${streetName}". All points must be on this specific street. Everything in ${langName}.
      JSON: { "name": "Localized Street Tour Title", "description": "Intro in ${langName}", "pois": [{ "name": "שם (Original)", "lat": 0, "lng": 0, "narrative": "3-4 accurate paragraphs in ${langName}", "category": "architecture" }] }`,
      config: { responseMimeType: "application/json" }
    });
    const data = JSON.parse(cleanJson(response.text || "{}"));
    const pois = (data.pois || []).map((p: any) => ({ ...p, id: generateStableId(p.name, p.lat, p.lng), isFullyLoaded: false }));
    return { id: `st-${Date.now()}`, city: streetName, name: data.name || streetName, description: data.description || "", durationMinutes: 45, creator: "Street Guide", pois };
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
