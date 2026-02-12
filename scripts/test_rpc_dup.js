
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSave() {
    console.log("Testing RPC save with duplicate POI...");
    const { data, error } = await supabase.rpc('save_generated_route', {
        p_user_id: null,
        p_name: "Duplicate POI Test " + Date.now(),
        p_city: "Paris",
        p_description: "A test route with duplicates",
        p_duration_minutes: 60,
        p_preferences: { language: 'he' },
        p_is_public: true,
        p_is_favorite: false,
        p_parent_route_id: null,
        p_pois: [
            {
                id: "test-poi-dup",
                name: "Duplicate POI",
                lat: 48.1111,
                lng: 2.1111,
                order_index: 0,
                poi_data: { description: "First instance" }
            },
            {
                id: "test-poi-dup", // SAME ID
                name: "Duplicate POI",
                lat: 48.1111,
                lng: 2.1111,
                order_index: 1,
                poi_data: { description: "Second instance" }
            }
        ]
    });

    if (error) {
        console.error("RPC Error (EXPECETED FAIL IF BUG PRESENT):", error);
    } else {
        console.log("RPC Success! Route ID:", data);
    }
}

testSave();
