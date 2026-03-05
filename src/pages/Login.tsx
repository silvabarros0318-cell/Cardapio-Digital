import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Utensils, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/admin');
        } catch (err: any) {
            setError('Email ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EBF1FF]">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-[#FE5F55] p-3 rounded-full mb-4">
                        <Utensils className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                    <p className="text-gray-500 mt-2 text-sm text-center">
                        Acesse o painel para gerenciar categorias e produtos do seu cardápio.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@gmail.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FE5F55] hover:bg-[#E85147] text-white font-medium py-2.5 rounded-md transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'Entrar no Painel'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Ainda não tem conta?{' '}
                    <Link to="/register" className="text-[#FE5F55] font-bold hover:underline">
                        Criar agora
                    </Link>
                </div>
            </div>
        </div>
    );
}
