
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
