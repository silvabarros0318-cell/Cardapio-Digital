
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlug() {
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('name, slug')
        .limit(1);

    if (error) {
        console.error('Erro:', error.message);
        return;
    }

    if (restaurants && restaurants.length > 0) {
        console.log('---RESTAURANTE_INFO---');
        console.log(`Nome: ${restaurants[0].name}`);
        console.log(`Slug: ${restaurants[0].slug}`);
        console.log('---END---');
    } else {
        console.log('Nenhum restaurante encontrado.');
    }
}

checkSlug();
