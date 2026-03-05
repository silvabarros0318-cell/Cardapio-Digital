import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ConfirmEmail() {
    const location = useLocation();
    const email = location.state?.email || 'seu e-mail';
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResend = async () => {
        if (!email || email === 'seu e-mail') return;
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });
            if (error) throw error;
            setSent(true);
            setTimeout(() => setSent(false), 5000);
        } catch (err: any) {
            setError(err.message || 'Erro ao reenviar e-mail.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EBF1FF] p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100 text-center">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-[#FE5F55] p-4 rounded-full mb-6 animate-bounce">
                        <Mail className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Verifique seu E-mail</h1>
                    <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                        Enviamos um link de confirmação para: <br />
                        <span className="font-bold text-gray-800">{email}</span>
                    </p>
                </div>

                {sent && (
                    <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2 text-sm border border-green-100">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>E-mail reenviado com sucesso!</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-center justify-center gap-2 text-sm border border-red-100">
                        <span>{error}</span>
                    </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg mb-8 text-left border border-blue-100">
                    <h3 className="text-blue-800 font-semibold text-sm mb-1">O que fazer agora?</h3>
                    <ul className="text-blue-700 text-xs space-y-2">
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Acesse sua caixa de entrada.
                        </li>
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Clique no botão "Confirmar E-mail".
                        </li>
                        <li className="flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Você será redirecionado para o painel.
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <p className="text-xs text-gray-400">
                        Não recebeu? Verifique a pasta de spam ou <br />
                        <button
                            onClick={handleResend}
                            disabled={loading || sent}
                            className="text-[#FE5F55] font-bold hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            re-enviar e-mail
                        </button>
                    </p>

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-[#FE5F55] font-bold hover:gap-3 transition-all"
                    >
                        Voltar para o login <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
