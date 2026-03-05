
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
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

async function setupRestaurant() {
    process.stdout.write('Iniciando setup...\n');

    // 1. Obter o restaurant_id do perfil atual
    const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('restaurant_id')
        .limit(1);

    if (pError || !profiles || profiles.length === 0) {
        process.stdout.write('Perfil não encontrado: ' + (pError?.message || 'vazio') + '\n');
        return;
    }

    const restaurantId = profiles[0].restaurant_id;
    process.stdout.write('Restaurant ID: ' + restaurantId + '\n');

    // 2. Atualizar Restaurante
    const { error: rError } = await supabase
        .from('restaurants')
        .update({
            name: 'Astro Burger Artesanal',
            slug: 'astro-burger',
            logo_url: 'https://pndayivwueexjltosobf.supabase.co/storage/v1/object/public/menu-images/demo-logo.png',
            cover_url: 'https://pndayivwueexjltosobf.supabase.co/storage/v1/object/public/menu-images/demo-cover.jpg'
        })
        .eq('id', restaurantId);

    if (rError) {
        process.stdout.write('Erro ao atualizar restaurante: ' + rError.message + '\n');
    } else {
        process.stdout.write('Restaurante atualizado.\n');
    }

    // 3. Criar Categorias
    const catData = [
        { restaurant_id: restaurantId, name: 'Hambúrgueres Artesanais', description: 'Nossos carros-chefes suculentos.', display_order: 1 },
        { restaurant_id: restaurantId, name: 'Acompanhamentos', description: 'O par perfeito.', display_order: 2 },
        { restaurant_id: restaurantId, name: 'Bebidas', description: 'Refresque sua experiência.', display_order: 3 }
    ];

    const { data: categories, error: cError } = await supabase
        .from('categories')
        .upsert(catData, { onConflict: 'name,restaurant_id' })
        .select();

    if (cError) {
        process.stdout.write('Erro nas categorias: ' + cError.message + '\n');
    } else {
        process.stdout.write('Categorias configuradas.\n');
    }

    // 4. Criar Itens
    if (categories) {
        const burgerCat = categories.find(c => c.name === 'Hambúrgueres Artesanais');
        if (burgerCat) {
            await supabase.from('menu_items').insert({
                restaurant_id: restaurantId,
                category_id: burgerCat.id,
                name: 'Super Nova Burger',
                description: 'Pão brioche, blend bovino 180g, queijo cheddar, cebola caramelizada e bacon.',
                price: 4500,
                is_active: true
            });
            process.stdout.write('Item criado: Super Nova Burger\n');
        }
    }

    process.stdout.write('Setup concluído!\n');
    process.stdout.write('LINK_FINAL: http://localhost:5173/astro-burger\n');
}

setupRestaurant();
