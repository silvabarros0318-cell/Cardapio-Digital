
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupRestaurant() {
    console.log('Iniciando setup...');

    // 1. Obter o restaurant_id do perfil atual
    const { data: profiles, error: pError } = await supabase
        .from('user_profiles')
        .select('restaurant_id')
        .limit(1);

    if (pError || !profiles || profiles.length === 0) {
        console.error('Perfil não encontrado:', pError?.message);
        return;
    }

    const restaurantId = profiles[0].restaurant_id;
    console.log('Restaurant ID:', restaurantId);

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
        console.error('Erro ao atualizar restaurante:', rError.message);
    } else {
        console.log('Restaurante atualizado.');
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
        console.error('Erro nas categorias:', cError.message);
    } else {
        console.log('Categorias configuradas.');
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
            console.log('Item criado: Super Nova Burger');
        }
    }

    console.log('Setup concluído!');
    console.log('LINK: http://localhost:5173/astro-burger');
}

setupRestaurant();
