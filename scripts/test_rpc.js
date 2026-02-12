
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSave() {
    console.log("Testing RPC save...");
    const { data, error } = await supabase.rpc('save_generated_route', {
        p_user_id: null,
        p_name: "Test Route Paris " + Date.now(),
        p_city: "Paris",
        p_description: "A test route",
        p_duration_minutes: 60,
        p_preferences: { language: 'he' },
        p_is_public: true,
        p_is_favorite: false,
        p_parent_route_id: null,
        p_pois: [
            {
                id: "test-poi-1",
                name: "Test POI 1",
                lat: 48.8566,
                lng: 2.3522,
                order_index: 0,
                poi_data: { description: "Test description" }
            }
        ]
    });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Success! Route ID:", data);
    }
}

testSave();
