
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

async function forceSetup() {
    process.stdout.write('Iniciando setup forcado...\n');

    // 1. Obter o primeiro restaurante
    const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1);

    if (rError || !restaurants || restaurants.length === 0) {
        process.stdout.write('Erro ao buscar restaurante: ' + (rError?.message || 'vazio') + '\n');
        return;
    }

    const restaurantId = restaurants[0].id;
    process.stdout.write('Restaurant ID: ' + restaurantId + '\n');

    // 2. Atualizar Restaurante
    await supabase
        .from('restaurants')
        .update({
            name: 'Astro Burger Artesanal',
            slug: 'astro-burger',
            logo_url: 'https://pndayivwueexjltosobf.supabase.co/storage/v1/object/public/menu-images/demo-logo.png',
            cover_url: 'https://pndayivwueexjltosobf.supabase.co/storage/v1/object/public/menu-images/demo-cover.jpg'
        })
        .eq('id', restaurantId);

    // 3. Criar uma categoria se não houver
    const { data: cat } = await supabase
        .from('categories')
        .insert({
            restaurant_id: restaurantId,
            name: 'Hambúrgueres Artesanais',
            description: 'Nossos carros-chefes suculentos.',
            display_order: 1
        })
        .select()
        .single();

    if (cat) {
        await supabase.from('menu_items').insert({
            restaurant_id: restaurantId,
            category_id: cat.id,
            name: 'Super Nova Burger',
            description: 'Pão brioche, blend bovino 180g, queijo cheddar, cebola caramelizada e bacon.',
            price: 4500,
            is_active: true
        });
    }

    process.stdout.write('Setup concluído!\n');
    process.stdout.write('LINK: http://localhost:5173/astro-burger\n');
}

forceSetup();
