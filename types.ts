
export interface UserPreferences {
  hiddenGemsLevel: number; // 0 (famous) to 100 (hidden)
  interests: string[]; // ['History', 'Architecture', 'Music', 'Food', 'Culture']
  walkingDistance: number; // in km
  desiredPoiCount?: number; // New: Manually control number of stops
  religiousFriendly?: boolean; // Avoid Christian/Islamic sites and non-kosher food
  veganFriendly?: boolean;
  accessibleOnly?: boolean;
  language: 'he' | 'en';
  routeStyle?: 'classic' | 'street'; // New: Choose between specific stops or a linear street walk
}

export interface ExtendedSection {
  title: string;
  content: string;
  category: 'fact' | 'anecdote' | 'architecture' | 'culture';
  audioScript?: string;
}

export type POICategory = 'history' | 'food' | 'architecture' | 'nature' | 'shopping' | 'sailing' | 'culture' | 'religion' | 'art';

export interface RouteConcept {
  id: string;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  difficulty: 'easy' | 'moderate' | 'hard';
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: POICategory;
  description: string;
  historicalContext: string;
  architecturalStyle: string;
  imageUrl?: string; 
  reconstructionPrompt?: string;
  tourScript?: string;
  extendedSections?: ExtendedSection[];
  sources?: { title: string; uri: string }[];
  travelFromPrevious?: {
    distance: string;
    duration: string;
  };
}

export interface Route {
  id: string;
  name: string;
  city: string;
  pois: POI[];
  description: string;
  durationMinutes: number;
  creator: string;
}

export interface TourState {
  isActive: boolean;
  currentPoiIndex: number;
  isAudioPlaying: boolean;
}
