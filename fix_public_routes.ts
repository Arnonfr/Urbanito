import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixPublicRoutes() {
    console.log('Fixing public routes...');

    const SYSTEM_USER_ID = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40';

    // Update all system routes to be public
    const { data, error } = await supabase
        .from('routes')
        .update({ is_public: true })
        .eq('user_id', SYSTEM_USER_ID)
        .eq('is_public', false)
        .select('id, name');

    if (error) {
        console.error('Error updating routes:', error);
    } else {
        console.log(`Updated ${data?.length || 0} routes to public:`);
        data?.forEach(r => console.log(`  - ${r.name} (${r.id})`));
    }

    // Verify
    const { count } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', SYSTEM_USER_ID)
        .eq('is_public', true);

    console.log(`\nTotal public routes for system user: ${count}`);
}

fixPublicRoutes().catch(console.error);
