import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xrawvyvcyewjmlzypnqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXd2eXZjeWV3am1senlwbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjA3NjYsImV4cCI6MjA4MzY5Njc2Nn0.KhIPGCR76vDgCvOH8vanrc_V4lQoP1-Ulsi9uR5RX-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testGuestFlow() {
    console.log('🧪 Testing Guest Registration Flow...');

    const guestEmail = `test-guest-${Date.now()}@example.com`;
    const guestPassword = `TestPass${Date.now()}!`;

    console.log(`Trying to Sign Up as ${guestEmail}...`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
    });

    if (signUpError) {
        console.error('❌ SignUp Failed:', signUpError.message);
        return;
    }

    console.log('✅ SignUp returned user:', signUpData.user?.id);

    if (!signUpData.session) {
        console.error('❌ No Session returned! This means "Double Opt-in" (Email Verify) is ON.');
        console.log('   The user cannot write to DB until they click the email link (which doesnt exist).');

        // Try to login immediately (will likely fail if verify needed)
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: guestEmail,
            password: guestPassword
        });

        if (loginError) {
            console.error('❌ Immediate Login Failed:', loginError.message);
        } else {
            console.log('✅ Immediate Login Success! (Surprising)');
        }
    } else {
        console.log('✅ Session active! We can write to DB.');
        // Try Insert
        const { error: insertError } = await supabase.from('routes').insert([{
            user_id: signUpData.user?.id,
            name: 'TEST GUEST WRITE',
            city: 'test',
            is_public: true
        }]);

        if (insertError) console.error('❌ Insert Error:', insertError);
        else console.log('✅ Write Success!');
    }
}

testGuestFlow();
