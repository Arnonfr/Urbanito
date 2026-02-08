const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  try {
    console.log('Attempting anonymous sign-in...');
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    console.log('anonError:', anonError ? anonError.message : null);
    console.log('anonData.user.id:', anonData?.user?.id);

    const userId = anonData?.user?.id || null;

    console.log('Attempting insert into routes (test row)...');
    const { data, error } = await supabase.from('routes').insert([{
      name: 'DEBUG TEST INSERT',
      city: 'DebugCity',
      description: 'Inserted by local debug script',
      duration_minutes: 10,
      user_id: userId
    }]);

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert success:', data);
      // Try cleanup
      try {
        await supabase.from('routes').delete().eq('name', 'DEBUG TEST INSERT').eq('city', 'DebugCity');
        console.log('Cleanup done');
      } catch (e) { }
    }
  } catch (e) {
    console.error('Debug script failed:', e);
  }
})();
