const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Parse JSON bodies for API endpoints
app.use(express.json({ limit: '1mb' }));

// Server-side route: save route using Supabase service role key
// WARNING: This endpoint requires setting SUPABASE_SERVICE_ROLE in the environment.
// In production you should protect this endpoint (auth, secret, rate-limit).
app.post('/api/save-route', async (req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
            return res.status(500).json({ error: 'Server not configured with SUPABASE_SERVICE_ROLE' });
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
            auth: { persistSession: false }
        });

        const { route, preferences, parentRouteId, isPublic } = req.body || {};

        if (!route) return res.status(400).json({ error: 'Missing route payload' });

        // Prepare POIs similar to client RPC contract
        const normalize = (s) => (s || '').toString().trim().toLowerCase();

        const poisForRpc = (route.pois || []).map((poi, index) => ({
            id: `srv-${index}-${Math.round((poi.lat||0)*10000)}-${Math.round((poi.lng||0)*10000)}`,
            name: poi.name,
            lat: poi.lat,
            lng: poi.lng,
            order_index: index,
            travel_data: poi.travelFromPrevious || null,
            data: {
                category: poi.category,
                description: poi.description,
                narrative: poi.narrative,
                imageUrl: poi.imageUrl,
                googlePlaceId: poi.googlePlaceId,
                isFullyLoaded: poi.isFullyLoaded || false
            }
        }));

        const { data: routeId, error } = await supabaseAdmin.rpc('save_generated_route', {
            p_city: normalize(route.city),
            p_name: route.name,
            p_description: route.description || '',
            p_duration: route.durationMinutes || 0,
            p_preferences: preferences || {},
            p_pois: poisForRpc,
            p_user_id: null,
            p_is_public: !!isPublic,
            p_parent_route_id: parentRouteId || null
        });

        if (error) {
            console.error('[server:/api/save-route] RPC error:', error);
            return res.status(500).json({ error: 'Save RPC failed', details: error });
        }

        return res.json({ routeId });
    } catch (e) {
        console.error('Unexpected error in /api/save-route', e);
        return res.status(500).json({ error: 'Unexpected server error' });
    }
});

// Serve index.html for all other routes (SPA support)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
