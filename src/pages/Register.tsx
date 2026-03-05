import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Rocket } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Criar Usuário
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/admin`,
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Falha ao criar usuário.');

            // 2. Criar Restaurante
            const slug = restaurantName.toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-');

            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .insert({
                    name: restaurantName,
                    slug: `${slug}-${Math.floor(Math.random() * 1000)}`, // Garantir slug único
                })
                .select()
                .single();

            if (restaurantError) throw restaurantError;

            // 3. Criar Perfil de Usuário vinculado ao Restaurante
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: authData.user.id,
                    restaurant_id: restaurantData.id,
                    role: 'admin'
                });

            if (profileError) throw profileError;

            navigate('/confirm-email', { state: { email } });
        } catch (err: any) {
            if (err.message === 'Email rate limit exceeded') {
                setError('Limite de envio de e-mails atingido. Por favor, tente novamente em uma hora ou use outro e-mail.');
            } else {
                setError(err.message || 'Erro ao realizar cadastro.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EBF1FF] p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-[#FE5F55] p-3 rounded-full mb-4">
                        <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Criar sua Conta</h1>
                    <p className="text-gray-500 mt-2 text-sm text-center">
                        Comece agora mesmo a criar o seu cardápio digital profissional.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Restaurante</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none transition"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Ex: Astro Burger"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FE5F55] hover:bg-[#E85147] text-white font-bold py-3 rounded-md transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Criando conta...' : 'Criar minha Organização'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-[#FE5F55] font-bold hover:underline">
                        Entrar agora
                    </Link>
                </div>
            </div>
        </div>
    );
}
