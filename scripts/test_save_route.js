
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
// Using the anon key from the previous view_file (line 9)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSaveRoute() {
    console.log("Testing save_generated_route RPC...");

    const testRoute = {
        name: "Test Route JS Save",
        city: "Test City",
        description: "A test route created by script to verify RPC functionality.",
        durationMinutes: 60,
        preferences: { theme: 'history', language: 'en' },
        is_public: false,
        shareTeaser: "This is a teaser for the test route.",
        historical_reconstruction_prompt: "A vintage photo of a test street",
        reconstruction_image_url: "https://example.com/image.jpg",
        pois: [
            {
                name: "Test POI 1",
                lat: 48.8566,
                lng: 2.3522,
                description: "Description for POI 1",
                historicalContext: "Context 1",
                historicalAnalysis: "Analysis 1",
                architecturalAnalysis: "Architecture 1",
                narrative: "Story 1",
                imageUrl: "https://example.com/poi1.jpg",
                isPremiumContent: false
            }
        ]
    };

    const payload = {
        p_user_id: 'a6664b77-6f16-46c1-bab7-41a3bc7dc805', // Using a valid-looking UUID or null for anon if RLS allows
        p_name: testRoute.name,
        p_city: testRoute.city,
        p_description: testRoute.description,
        p_duration_minutes: testRoute.durationMinutes,
        p_preferences: testRoute.preferences,
        p_is_public: testRoute.is_public,
        p_is_favorite: true,
        p_parent_route_id: null,
        p_reconstruction_image_url: testRoute.reconstruction_image_url,
        p_historical_reconstruction_prompt: testRoute.historical_reconstruction_prompt,
        p_share_teaser: testRoute.shareTeaser,
        p_pois: testRoute.pois.map((p, idx) => ({
            id: `test-poi-${idx}`,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            order_index: idx,
            travel_data: null,
            poi_data: {
                description: p.description,
                historicalContext: p.historicalContext,
                historicalAnalysis: p.historicalAnalysis,
                architecturalAnalysis: p.architecturalAnalysis,
                narrative: p.narrative,
                imageUrl: p.imageUrl,
                isPremiumContent: p.isPremiumContent
            }
        }))
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    const { data, error } = await supabase.rpc('save_generated_route', payload);

    if (error) {
        console.error("❌ RPC Failed:", error);
    } else {
        console.log("✅ RPC Success! Route ID:", data);
    }
}

testSaveRoute();
