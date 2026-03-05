
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

async function checkApi() {
    process.stdout.write('--- API CHECK ---\n');
    const res = supabase.storage.from('menu-images').getPublicUrl('test.jpg');
    process.stdout.write('getPublicUrl return: ' + JSON.stringify(res, null, 2) + '\n');
    process.stdout.write('--- END API CHECK ---\n');
}

checkApi();
