import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SYSTEM_USER_ID = '63a80fa9-b66d-42e6-af0e-26c10a2b3b40';

async function testInsert() {
    console.log('Test: Attempting to insert a dummy route as System User...');

    const { data, error } = await supabase
        .from('routes')
        .insert([{
            user_id: SYSTEM_USER_ID,
            name: 'TEST RLS INSERT',
            city: 'test-city',
            is_public: true,
            description: 'Test description',
            duration_minutes: 10
        }])
        .select();

    if (error) {
        console.error('❌ Insert failed! This confirms RLS (Security) issue.');
        console.error('Error details:', error);
    } else {
        console.log('✅ Insert successful! RLS is NOT the issue.');
        console.log('Inserted:', data);

        // Cleanup
        await supabase.from('routes').delete().eq('id', data[0].id);
    }
}

testInsert();
