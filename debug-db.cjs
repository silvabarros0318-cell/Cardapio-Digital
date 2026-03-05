
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

async function debugData() {
    process.stdout.write('--- DEBUG START ---\n');

    // 1. Check Restaurants
    const { data: res, error: re } = await supabase.from('restaurants').select('*');
    process.stdout.write('RESTAURANTS IN DB:\n');
    process.stdout.write(JSON.stringify(res, null, 2) + '\n');

    // 2. Check Categories
    const { data: cat, error: ce } = await supabase.from('categories').select('*');
    process.stdout.write('CATEGORIES IN DB:\n');
    process.stdout.write(JSON.stringify(cat, null, 2) + '\n');

    process.stdout.write('--- DEBUG END ---\n');
}

debugData();
