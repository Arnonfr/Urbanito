
export interface UserPreferences {
  hiddenGemsLevel: number;
  interests: string[];
  walkingDistance: number;
  desiredPoiCount?: number;
  religiousFriendly?: boolean;
  veganFriendly?: boolean;
  accessibleOnly?: boolean;
  language: 'he' | 'en';
  routeStyle?: 'classic' | 'street';
  explanationStyle: 'simple' | 'standard' | 'deep';
  fontSize?: number;
  customPrompt?: string;
  jewishHistory?: boolean;
  audioMode?: 'free' | 'premium';
  isPremium?: boolean;
  is_favorite?: boolean;
  names?: { he?: string; en?: string };
  descriptions?: { he?: string; en?: string };
}

export interface POICategory {
  id: string;
  label: string;
}

export type POICategoryType = 'history' | 'food' | 'architecture' | 'nature' | 'shopping' | 'sailing' | 'culture' | 'religion' | 'art';

export interface RouteConcept {
  id: string;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}

export interface POISection {
  title: string;
  content: string;
  icon?: string;
}

export interface POISource {
  title: string;
  url: string;
}

/**
 * Premium-only content for POIs.
 * This content is generated for all routes but only displayed to Premium users.
 */
export interface PremiumPOIContent {
  /** 5+ paragraph deep historical narrative */
  deepNarrative?: string;
  /** AI-generated historical reconstruction image URL */
  historicalImageUrl?: string;
  /** Prompt used to generate the historical image (for regeneration) */
  historicalImagePrompt?: string;
  /** Hidden story or little-known anecdote */
  hiddenStory?: string;
  /** Extended architectural analysis */
  architecturalDeepDive?: string;
  /** Richer, longer audio script for premium TTS */
  audioScriptPremium?: string;
  /** Academic-style source citations */
  sources?: POISource[];
}


export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: POICategoryType;
  summary?: string;
  description: string;
  historicalContext?: string;
  architecturalStyle?: string;
  historicalAnalysis?: string;
  architecturalAnalysis?: string;
  tourScript?: string;
  narrative?: string;
  imageUrl?: string;
  additionalImages?: string[];
  sections?: POISection[];
  sources?: POISource[];
  travelFromPrevious?: {
    distance: string;
    duration: string;
  };
  externalUrl?: string;
  isFullyLoaded?: boolean;
  isLoading?: boolean;
  googlePlaceId?: string;
  content?: any;
  /** Premium-only content (generated for all, but displayed only to Premium users) */
  premium?: PremiumPOIContent;
  isPremiumContent?: boolean;
}

export interface Route {
  id: string;
  name: string;
  city: string;
  pois: POI[];
  description: string;
  durationMinutes: number;
  creator: string;
  shareTeaser?: string; // Engaging anecdote for sharing
  isOffline?: boolean;
  isAlternative?: boolean;
  style?: 'street' | 'area';
  dist?: number; // Distance from center, used for nearby discovery
  parent_route_id?: string; // ID of the route this was forked from
  directionsData?: any; // Cached directions result
  suggested_detours?: POI[]; // Optional nearby gems
  originalPoiCount?: number; // Track original count to detect content changes for public saving logic
  preferences?: any; // For localized names/descriptions and other metadata
  is_public?: boolean;
  isPremiumRoute?: boolean;
  user_id?: string | null; // ID of the user who created this route
  reconstruction_image_url?: string;
  historical_reconstruction_prompt?: string;
  highlights?: string[]; // Engaging facts or trivia highlights
  created_at?: string;
}

export interface AudioState {
  isPlaying: boolean;
  currentPoiId: string | null;
  currentChapterIndex: number;
  playbackRate: number;
  chapters: Array<{ title: string, script: string, id: string }>;
}

export interface AudioItem {
  id: string;
  text: string;
  language: 'he' | 'en';
  priority: 'high' | 'normal'; // 'high' avoids queue and plays immediately (or after current phrase)
  poiId?: string; // If associated with a POI
  audioBuffer?: AudioBuffer; // Pre-loaded buffer
  status: 'pending' | 'loading' | 'ready' | 'playing' | 'completed' | 'failed';
}

export interface FeatureFeedback {
  rating: number;
  comment: string;
  isSelected: boolean;
}

export interface FeedbackData {
  sentiment: number | null;
  features: {
    planning: FeatureFeedback;
    editing: FeatureFeedback;
    saving: FeatureFeedback;
    content: FeatureFeedback;
    audio: FeatureFeedback;
  };
  additionalComments: string;
}

export interface LocalGuide {
  id: string;
  name: string;
  handle: string;
  platform: 'x' | 'instagram' | 'tiktok' | 'youtube' | 'facebook';
  profile_image_url: string;
  bio?: string;
  is_verified?: boolean;
}

export interface GuidePost {
  id: string;
  guide_id: string;
  guide?: LocalGuide;
  city: string;
  content_text: string;
  media_url: string;
  media_type: 'image' | 'video';
  original_link: string;
  linked_route_id?: string;
  poi_data?: Partial<POI>;
  tags?: string[];
  created_at: string;
}
