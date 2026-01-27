import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRpcFallback() {
    console.log('🧪 Testing save_generated_route RPC with NULL user_id (System Fallback)...');

    // MOCK DATA for a route
    const mockRoute = {
        name: "TEST SYSTEM FALLBACK",
        description: "This route should be saved as the System User because I am sending p_user_id = NULL",
        city: "System City",
        duration: 10,
        preferences: {},
        pois: [], // empty pois for simplicity
        user_id: null, // explicit null
        is_public: true,
        parent_route_id: null
    };

    const { data: routeId, error } = await supabase.rpc('save_generated_route', {
        p_city: mockRoute.city,
        p_name: mockRoute.name,
        p_description: mockRoute.description,
        p_duration: mockRoute.duration,
        p_preferences: mockRoute.preferences,
        p_pois: mockRoute.pois,
        p_user_id: null, // <--- CRITICAL: Sending NULL to trigger fallback
        p_is_public: true,
        p_parent_route_id: null
    });

    if (error) {
        console.error('❌ RPC Failed:', error);
    } else {
        console.log('✅ RPC Success! Route saved with ID:', routeId);

        // Verify who owns it
        const { data: route } = await supabase.from('routes').select('user_id').eq('id', routeId).single();
        if (route) {
            console.log('📍 Route Owner ID:', route.user_id);
            if (route.user_id === '63a80fa9-b66d-42e6-af0e-26c10a2b3b40') {
                console.log('✅ CONFIRMED: Route was assigned to System User!');
            } else {
                console.error('❌ BUG: Route assigned to wrong user:', route.user_id);
            }

            // Cleanup
            await supabase.from('routes').delete().eq('id', routeId);
            console.log('🧹 Cleaned up test route');
        }
    }
}

testRpcFallback();
