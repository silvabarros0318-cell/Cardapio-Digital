
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

async function forceUpdate() {
    process.stdout.write('Tentando atualizar restaurant id: bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb\n');

    const { data, error } = await supabase
        .from('restaurants')
        .update({
            name: 'Astro Burger Artesanal',
            slug: 'astro-burger'
        })
        .eq('id', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb')
        .select();

    if (error) {
        process.stdout.write('ERRO NA ATUALIZACAO: ' + JSON.stringify(error, null, 2) + '\n');
    } else {
        process.stdout.write('SUCESSO: ' + JSON.stringify(data, null, 2) + '\n');
    }
}

forceUpdate();
