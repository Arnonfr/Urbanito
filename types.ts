
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
  url?: string;
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: POICategoryType;
  description: string;
  historicalContext: string;
  architecturalStyle: string;
  tourScript?: string;
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
}

export interface Route {
  id: string;
  name: string;
  city: string;
  pois: POI[];
  description: string;
  durationMinutes: number;
  creator: string;
  isOffline?: boolean;
}

export interface AudioState {
  isPlaying: boolean;
  currentPoiId: string | null;
  currentChapterIndex: number;
  playbackRate: number;
  chapters: Array<{title: string, script: string, id: string}>;
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
