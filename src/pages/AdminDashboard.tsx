import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Utensils,
    ListTree,
    QrCode,
    Settings,
    ExternalLink,
    PlusCircle,
    Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
    categoriesCount: number;
    itemsCount: number;
    restaurantName: string;
    slug: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchDashboardData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('restaurant_id')
            .eq('id', user.id)
            .single();

        if (profile?.restaurant_id) {
            const [res, cats, items] = await Promise.all([
                supabase.from('restaurants').select('name, slug').eq('id', profile.restaurant_id).single(),
                supabase.from('categories').select('id', { count: 'exact' }).eq('restaurant_id', profile.restaurant_id),
                supabase.from('menu_items').select('id', { count: 'exact' }).eq('restaurant_id', profile.restaurant_id)
            ]);

            setStats({
                restaurantName: res.data?.name || 'Seu Restaurante',
                slug: res.data?.slug || '',
                categoriesCount: cats.count || 0,
                itemsCount: items.count || 0
            });
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse font-medium">Carregando seus dados...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#FE5F55] to-orange-400 p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl shadow-red-200/50 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight" translate="no">
                        Olá, {stats?.restaurantName.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-orange-50 font-medium opacity-90 max-w-md">
                        Seu cardápio digital está pronto para crescer. O que vamos fazer hoje?
                    </p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <Link
                        to={`/${stats?.slug}`}
                        target="_blank"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition active:scale-95 text-sm"
                    >
                        <Eye className="w-4 h-4" /> Ver Online
                    </Link>
                    <Link
                        to="/admin/preview"
                        className="bg-white text-[#FE5F55] px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition hover:bg-orange-50 active:scale-95 text-sm shadow-lg"
                    >
                        <ExternalLink className="w-4 h-4" /> Abrir Preview
                    </Link>
                </div>
                <Utensils className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12 pointer-events-none" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<ListTree className="w-6 h-6 text-blue-500" />}
                    label="Categorias Criadas"
                    value={stats?.categoriesCount || 0}
                    color="bg-blue-50"
                />
                <StatCard
                    icon={<Utensils className="w-6 h-6 text-orange-500" />}
                    label="Produtos Ativos"
                    value={stats?.itemsCount || 0}
                    color="bg-orange-50"
                />
                <StatCard
                    icon={<Users className="w-6 h-6 text-green-500" />}
                    label="Visualizações"
                    value="Em breve"
                    color="bg-green-50"
                />
                <StatCard
                    icon={<Settings className="w-6 h-6 text-purple-500" />}
                    label="Status do Perfil"
                    value="100%"
                    color="bg-purple-50"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 px-1">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QuickActionCard
                            to="/admin/itens"
                            icon={<PlusCircle className="w-6 h-6 text-white" />}
                            title="Novo Produto"
                            desc="Adicione um novo prato ou bebida"
                            color="bg-[#FE5F55]"
                        />
                        <QuickActionCard
                            to="/admin/qrcode"
                            icon={<QrCode className="w-6 h-6 text-white" />}
                            title="Gerar QR Code"
                            desc="Baixe o código para suas mesas"
                            color="bg-gray-900"
                        />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-[#FE5F55]" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Configurações</h3>
                    <p className="text-sm text-gray-500 mb-6">Mude o nome, foto de capa e link do seu restaurante.</p>
                    <Link to="/admin/configuracoes" className="text-[#FE5F55] font-bold text-sm hover:underline">Acessar perfil →</Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
    return (
        <div className={`p-6 rounded-3xl ${color} border border-transparent hover:border-white transition-all`}>
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                {icon}
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
        </div>
    );
}

function QuickActionCard({ to, icon, title, desc, color }: { to: string, icon: React.ReactNode, title: string, desc: string, color: string }) {
    return (
        <Link to={to} className="group flex items-center gap-5 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all active:scale-95">
            <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
        </Link>
    );
}
