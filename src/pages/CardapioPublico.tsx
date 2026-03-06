import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Category {
    id: string;
    name: string;
}

interface MenuItem {
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
}

interface Restaurant {
    id: string;
    name: string;
    logo_url: string;
    cover_url: string;
    slug: string;
}

export default function CardapioPublico({ isPreview = false }: { isPreview?: boolean }) {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const mesa = searchParams.get('mesa');

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('all');


    const coverImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000";

    useEffect(() => {
        if (slug || isPreview) {
            fetchRestaurantData();
        }
    }, [slug, isPreview]);

    async function fetchRestaurantData() {
        setLoading(true);
        let resData = null;

        if (isPreview) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('restaurant_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.restaurant_id) {
                    const { data: res } = await supabase
                        .from('restaurants')
                        .select('*')
                        .eq('id', profile.restaurant_id)
                        .single();
                    resData = res;
                } else {
                    // Fallback case
                    const { data: res } = await supabase
                        .from('restaurants')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    resData = res;
                }
            }
        } else {
            const { data } = await supabase
                .from('restaurants')
                .select('*')
                .eq('slug', slug)
                .single();
            resData = data;
        }

        if (resData) {
            setRestaurant(resData);

            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('restaurant_id', resData.id)
                .order('display_order');

            const { data: itemData } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', resData.id)
                .eq('is_active', true);

            if (catData) setCategories(catData);
            if (itemData) setItems(itemData);
        }
        setLoading(false);
    }

    const scrollToCategory = (id: string) => {
        setActiveCategory(id);
        if (id === 'all') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const element = document.getElementById(`category-${id}`);
            if (element) {
                const offset = 140;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen font-bold text-[#FE5F55] animate-pulse">Carregando cardápio...</div>;
    if (!restaurant) return <div className="flex items-center justify-center min-h-screen font-bold">Restaurante não encontrado.</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50/20 dark:bg-slate-950 pb-20">
            {/* 1. Top Banner Bar (Brand Color) */}
            <div className="bg-[#FE5F55] py-3 px-4 text-center shadow-sm">
                <h1 className="text-white font-bold text-base" translate="no">
                    {restaurant.name}
                </h1>
            </div>

            {/* 2. Main Cover Image (Glued to banner) */}
            <section className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72 bg-slate-200 overflow-hidden">
                {restaurant.cover_url || restaurant.logo_url || coverImage ? (
                    <img
                        src={restaurant.cover_url || restaurant.logo_url || coverImage}
                        alt={`Capa do ${restaurant.name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = coverImage;
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <div className="text-slate-400 text-center">
                            <div className="text-4xl mb-2">🏪</div>
                            <div className="text-sm font-medium">Sem imagem de capa</div>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </section>

            {/* 3. Restaurant Info Section (Logo Overlapping) */}
            <section className="bg-gradient-to-br from-white/80 to-amber-50/60 dark:bg-slate-900 px-4 pt-0 pb-6 relative shadow-sm backdrop-blur-sm">
                <div className="max-w-3xl mx-auto flex items-end gap-4 relative">
                    {/* Overlapping Logo */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-1 shadow-xl -mt-12 relative z-20 overflow-hidden border border-slate-100">
                        {restaurant.logo_url ? (
                            <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-orange-50 text-[#FE5F55] font-black text-3xl rounded-xl">
                                {restaurant.name[0]}
                            </div>
                        )}
                    </div>

                    {/* Restaurant Name & Mesa */}
                    <div className="flex-1 pb-1">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight" translate="no">
                            {restaurant.name}
                        </h2>
                        {mesa && (
                            <div className="mt-1 inline-flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md text-[10px] font-bold text-[#FE5F55] uppercase tracking-wider">
                                Mesa {mesa}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 4. Category Navigation (Sticky) */}
            <nav className="sticky top-0 z-50 bg-amber-50/90 dark:bg-slate-900/95 backdrop-blur-md border-y border-amber-100/50 dark:border-slate-800 py-4 shadow-sm">
                <div className="max-w-3xl mx-auto flex gap-3 px-4 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap">
                    <button
                        onClick={() => scrollToCategory('all')}
                        className={`flex h-10 shrink-0 items-center justify-center rounded-xl px-6 transition-all text-sm font-bold tracking-wide ${activeCategory === 'all'
                            ? 'bg-[#FE5F55] text-white shadow-lg shadow-red-200'
                            : 'bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-amber-200/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
                            }`}
                    >
                        Tudo
                    </button>

                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => scrollToCategory(cat.id)}
                            className={`flex h-10 shrink-0 items-center justify-center rounded-xl px-6 transition-all text-sm font-bold tracking-wide ${activeCategory === cat.id
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                : 'bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-amber-200/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
                                }`}
                            translate="no"
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </nav>
            {/* 5. Main Content Area */}
            <main className="pb-10 mx-auto max-w-3xl">
                {/* Categories Sections */}
                <section className="px-4 space-y-8">
                    {categories.map((category) => {
                        const catItems = items.filter(i => i.category_id === category.id);
                        if (catItems.length === 0) return null;

                        return (
                            <div key={category.id} id={`category-${category.id}`} className="scroll-m-32">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-br from-[#FE5F55] to-orange-400 w-2.5 h-8 rounded-full shadow-sm"></div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" translate="no">
                                        {category.name}
                                    </h2>
                                    <div className="flex-1 h-[2px] bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {catItems.map((item) => (
                                        <div key={item.id} className="bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-slate-900/50 p-4 rounded-3xl shadow-sm flex gap-4 border border-orange-100/50 dark:border-slate-700 transition-all active:scale-[0.98] cursor-pointer hover:shadow-md hover:border-orange-200/50 h-fit relative overflow-hidden group">
                                            <div className="flex-1 min-w-0 flex flex-col justify-between relative z-10">
                                                <div>
                                                    <h3 className="font-bold text-[17px] mb-1 leading-tight text-slate-900 dark:text-white truncate">{item.name}</h3>
                                                    {item.description && (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-snug">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-[#FE5F55] font-bold text-lg inline-block">
                                                    {Number(item.price).toFixed(2).replace('.', ',')} KZ
                                                </span>
                                            </div>

                                            {item.image_url ? (
                                                <div
                                                    className="w-[100px] h-[100px] rounded-xl bg-center bg-cover shrink-0 border border-gray-100 shadow-sm overflow-hidden"
                                                    style={{ backgroundImage: `url('${item.image_url}')` }}
                                                />
                                            ) : (
                                                <div className="w-[100px] h-[100px] rounded-xl bg-gray-50 dark:bg-slate-700 flex flex-col items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600 text-gray-400">
                                                    <span className="text-[10px] font-medium">Sem foto</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </section>

            </main>

            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

        </div>
    );
}
