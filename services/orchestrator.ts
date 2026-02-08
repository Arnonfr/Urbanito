
import { Route, UserPreferences } from '../types';
import { generateWalkingRoute, generateStreetWalkRoute } from './geminiService';

export type AgentType = 'atlas' | 'scribe' | 'builder';

export interface OrchestratorResponse {
    agent: AgentType;
    action: 'create_route' | 'find_nearby' | 'identify_location' | 'chat';
    parameters: any;
    message: string;
}

const INTENT_PATTERNS = {
    create_route: [
        /create|build|generate|make|plan/i,
        /tour|route|trip|walk/i,
        /in|at|for/i
    ],
    find_nearby: [
        /find|search|look|show/i,
        /nearby|close|around|here/i
    ],
    identify_location: [
        /where|what/i,
        /am i|is this/i
    ]
};

export const simulateOrchestrator = async (
    input: string,
    userLocation: { lat: number, lng: number },
    preferences: UserPreferences
): Promise<OrchestratorResponse> => {
    // 1. Analyze Intent
    const lowerInput = input.toLowerCase();

    const isPremium = preferences.isPremium || false;

    // Check for "Create Route" intent
    if (INTENT_PATTERNS.create_route.some(p => p.test(lowerInput)) && !input.includes('?')) {
        // Extract parameters (naive extraction)
        const cityMatch = input.match(/in\s+([a-zA-Z\u0590-\u05FF\s]+)/);
        const city = cityMatch ? cityMatch[1].trim() : 'Current Location';

        return {
            agent: 'builder',
            action: 'create_route',
            parameters: { city, theme: 'general', isPremium },
            message: isPremium
                ? `Certainly. As a Premium member, I'll have Builder construct an exclusive, deep-dive tour for you in ${city}.`
                : `I'll have Builder construct a tour for you in ${city}.`
        };
    }

    // Check for "Find Nearby" intent
    if (INTENT_PATTERNS.find_nearby.every(p => p.test(lowerInput))) {
        return {
            agent: 'atlas',
            action: 'find_nearby',
            parameters: { location: userLocation, radius: 2000 },
            message: "Atlas is scanning the area for interesting routes..."
        };
    }

    // Default to chat/scribe
    return {
        agent: 'scribe',
        action: 'chat',
        parameters: {},
        message: "I can help you explore. Try asking me to 'Create a tour in Paris' or 'Find routes nearby'."
    };
};
