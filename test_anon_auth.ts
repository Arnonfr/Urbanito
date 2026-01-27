import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAnonymousWrite() {
    console.log('🧪 Testing Anonymous Write Permissions...');

    // 1. Try to sign in anonymously
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
        console.error('❌ Sign In Failed:', authError.message);
        console.log('Make sure "Enable Anonymous Sign-ins" is turned ON in Supabase Authentication settings.');
        return;
    }

    console.log('✅ Signed in anonymously with ID:', authData.user?.id);
    const userId = authData.user?.id;

    // 2. Try to insert a route
    const { data, error } = await supabase
        .from('routes')
        .insert([{
            user_id: userId, // Writing as MYSELF
            name: 'TEST ANON INSERT',
            city: 'test-city',
            is_public: true,
            description: 'Test description',
            duration_minutes: 10
        }])
        .select();

    if (error) {
        console.error('❌ Insert Failed despite being logged in:', error.message);
        console.log('This means RLS policies block even authenticated users from inserting rows.');
    } else {
        console.log('✅ Insert SUCCESS! Adding signInAnonymously() to App.tsx will fix the bug.');
        // Cleanup
        await supabase.from('routes').delete().eq('id', data[0].id);
    }
}

testAnonymousWrite();
