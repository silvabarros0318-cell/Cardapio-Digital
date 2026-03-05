import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ListTree, LayoutList, Eye, LogOut, ChefHat, QrCode, Settings } from 'lucide-react';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState<{ name: string, logo_url: string | null } | null>(null);

    useEffect(() => {
        fetchRestaurant();
    }, []);

    async function fetchRestaurant() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('restaurant_id')
                .eq('id', user.id)
                .single();

            if (profile?.restaurant_id) {
                const { data } = await supabase
                    .from('restaurants')
                    .select('name, logo_url')
                    .eq('id', profile.restaurant_id)
                    .single();
                if (data) setRestaurant(data);
            }
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Categorias', path: '/admin/categorias', icon: ListTree },
        { name: 'Itens do Cardápio', path: '/admin/itens', icon: LayoutList },
        { name: 'QR Code', path: '/admin/qrcode', icon: QrCode },
        { name: 'Configurações', path: '/admin/configuracoes', icon: Settings },
        { name: 'Visualizar Cardápio (Preview)', path: '/admin/preview', icon: Eye },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col md:min-h-screen">
                <Link to="/admin" className="p-6 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {restaurant?.logo_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                            <img src={restaurant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="bg-[#FE5F55] p-2 rounded-lg shrink-0">
                            <ChefHat className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <span className="font-bold text-lg text-gray-900 truncate" translate="no">
                        {restaurant?.name || 'Admin'}
                    </span>
                </Link>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                    ? 'bg-[#EBF1FF] text-[#FE5F55]'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-[#FE5F55]' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                        Sair da Conta
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
