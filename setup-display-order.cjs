const { createClient } = require('@supabase/supabase-js');

// Load environment variables from process.env (set by the environment)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Environment variables not found. Skipping display_order setup.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDisplayOrder() {
  try {
    console.log('Checking display_order column...');

    // Try to select display_order to see if it exists
    const { data, error } = await supabase
      .from('menu_items')
      .select('display_order')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('display_order column does not exist. Setting up default ordering...');

      // Get all items ordered by creation date
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, category_id')
        .order('created_at');

      if (items && items.length > 0) {
        // Group by category
        const categoryGroups = {};
        items.forEach(item => {
          if (!categoryGroups[item.category_id]) {
            categoryGroups[item.category_id] = [];
          }
          categoryGroups[item.category_id].push(item);
        });

        // Update display_order for each category
        for (const [categoryId, categoryItems] of Object.entries(categoryGroups)) {
          for (let i = 0; i < categoryItems.length; i++) {
            const item = categoryItems[i];
            await supabase
              .from('menu_items')
              .update({ display_order: i + 1 })
              .eq('id', item.id);
          }
        }

        console.log('Display order setup completed for existing items.');
      }
    } else {
      console.log('display_order column exists or is accessible.');
    }
  } catch (err) {
    console.log('Error setting up display_order:', err.message);
    console.log('The app will handle ordering dynamically.');
  }
}

setupDisplayOrder();