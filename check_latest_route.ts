import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkLatestRoute() {
    console.log('Checking the latest route...\n');

    // Get the most recent route
    const { data: routes, error } = await supabase
        .from('routes')
        .select('id, name, city, created_at, is_public')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !routes || routes.length === 0) {
        console.error('Error or no routes:', error);
        return;
    }

    const latestRoute = routes[0];
    console.log(`Latest route: ${latestRoute.name}`);
    console.log(`City: ${latestRoute.city}`);
    console.log(`Created: ${new Date(latestRoute.created_at).toLocaleString('he-IL')}`);
    console.log(`ID: ${latestRoute.id}\n`);

    // Check if it has POIs
    const { data: routePois, error: poisError } = await supabase
        .from('route_pois')
        .select(`
      order_index,
      pois (
        id,
        name,
        lat,
        lng
      )
    `)
        .eq('route_id', latestRoute.id)
        .order('order_index', { ascending: true });

    if (poisError) {
        console.error('Error fetching POIs:', poisError);
        return;
    }

    console.log(`Number of POIs: ${routePois?.length || 0}`);
    if (routePois && routePois.length > 0) {
        console.log('\nPOIs:');
        routePois.forEach((rp: any, i) => {
            console.log(`  ${i + 1}. ${rp.pois.name}`);
        });
    } else {
        console.log('\n⚠️  WARNING: This route has NO POIs!');
    }
}

checkLatestRoute().catch(console.error);
