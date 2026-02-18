
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSave() {
    console.log("Testing backward compatible RPC save (p_duration)...");
    const { data, error } = await supabase.rpc('save_generated_route', {
        p_user_id: null,
        p_name: "Legacy Test Route " + Date.now(),
        p_city: "Paris",
        p_description: "A test route for backward compatibility",
        p_duration: 120, // Legacy parameter
        p_preferences: { language: 'en' },
        p_is_public: true,
        p_pois: []
    });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Success! Route ID:", data);
    }
}

testSave();
