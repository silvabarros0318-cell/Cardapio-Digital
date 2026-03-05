
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessionAndProfile() {
    process.stdout.write('Checking profiles and restaurants...\n');

    const { data: profiles, error: pe } = await supabase.from('user_profiles').select('*');
    process.stdout.write('PROFILES: ' + JSON.stringify(profiles, null, 2) + '\n');

    const { data: res, error: re } = await supabase.from('restaurants').select('*');
    process.stdout.write('RESTAURANTS: ' + JSON.stringify(res, null, 2) + '\n');
}

checkSessionAndProfile();
