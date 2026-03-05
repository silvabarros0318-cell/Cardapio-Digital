
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

async function checkAnyRestaurant() {
    const { data, error } = await supabase
        .from('restaurants')
        .select('name, slug');

    if (error) {
        process.stdout.write('Erro: ' + error.message + '\n');
        return;
    }

    if (data && data.length > 0) {
        process.stdout.write('RESTAURANTES_ENCONTRADOS:\n');
        data.forEach(r => {
            process.stdout.write(`- ${r.name} (${r.slug})\n`);
        });
    } else {
        process.stdout.write('Nenhum restaurante encontrado.\n');
    }
}

checkAnyRestaurant();
