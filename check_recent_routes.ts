import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRecentRoutes() {
    console.log('Checking recent routes...\n');

    // Get the 35 most recent public routes
    const { data: routes, error } = await supabase
        .from('routes')
        .select('id, name, city, created_at, is_public')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(35);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${routes?.length || 0} public routes:\n`);
    routes?.forEach((r, i) => {
        const date = new Date(r.created_at);
        console.log(`${i + 1}. ${r.name} (${r.city}) - ${date.toLocaleString('he-IL')}`);
    });

    // Check for routes with "בית" or "אחוזת" in the name
    console.log('\n\nSearching for routes with "בית" or "אחוזת":');
    const matching = routes?.filter(r =>
        r.name.includes('בית') || r.name.includes('אחוזת')
    );

    matching?.forEach((r, i) => {
        const date = new Date(r.created_at);
        const position = routes?.findIndex(route => route.id === r.id) + 1;
        console.log(`  Position #${position}: ${r.name} - ${date.toLocaleString('he-IL')}`);
    });
}

checkRecentRoutes().catch(console.error);
