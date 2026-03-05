import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Image as ImageIcon, Globe, Building2, Camera, Upload, AlertCircle } from 'lucide-react';

export default function Configuracoes() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');

    // Upload states
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    useEffect(() => {
        fetchRestaurant();
    }, []);

    async function fetchRestaurant() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Primeiro buscar o profile para obter o restaurant_id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('restaurant_id')
                .eq('id', user.id)
                .single();

            if (profile?.restaurant_id) {
                const { data } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', profile.restaurant_id)
                    .single();

                if (data) {
                    setName(data.name || '');
                    setSlug(data.slug || '');
                    setLogoUrl(data.logo_url || '');
                    setCoverUrl(data.cover_url || '');
                }
            }
        }
        setLoading(false);
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        try {
            if (type === 'logo') setUploadingLogo(true);
            else setUploadingCover(true);

            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `restaurants/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error('Erro ao subir imagem: ' + uploadError.message);
            }

            const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);

            if (data && data.publicUrl) {
                if (type === 'logo') setLogoUrl(data.publicUrl);
                else setCoverUrl(data.publicUrl);
            } else {
                throw new Error('Não foi possível gerar a URL pública da imagem.');
            }

        } catch (error: unknown) {
            const err = error as Error;
            console.error('Handled upload error:', err);
            setMessage({ type: 'error', text: err.message || 'Erro inesperado no upload' });
        } finally {
            setUploadingLogo(false);
            setUploadingCover(false);
        }
    };

    async function handleSave() {
        setSaving(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado.');

            // Buscar o restaurant_id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('restaurant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.restaurant_id) throw new Error('Restaurante não encontrado no seu perfil.');

            const { error } = await supabase
                .from('restaurants')
                .update({
                    name,
                    slug: slug.toLowerCase().replace(/\s+/g, '-'),
                    logo_url: logoUrl,
                    cover_url: coverUrl
                })
                .eq('id', profile.restaurant_id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' });
        } catch (error: unknown) {
            const err = error as Error;
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Carregando dados do restaurante...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8" translate="no">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-[#FE5F55]" />
                    Dados do Restaurante
                </h1>
                <p className="text-gray-500 text-sm">Gerencie a identidade visual e o link do seu cardápio digital.</p>
            </div>

            {message && (
                <div
                    key={`message-${message.type}`}
                    className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                    {message.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-sm font-semibold">{message.text}</span>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 space-y-10">

                    {/* Identidade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-50 pb-10">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Nome do Restaurante
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Burguer & Cia"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE5F55] transition-all bg-gray-50/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-[#FE5F55]" /> Link do Cardápio (Slug)
                            </label>
                            <div className="flex items-center">
                                <span className="text-gray-400 bg-gray-50 px-3 py-3 rounded-l-xl border border-r-0 border-gray-200 text-sm font-medium">
                                    /{window.location.host}/
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full px-4 py-3 rounded-r-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE5F55] transition-all bg-gray-50/30 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visuais */}
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* Logo */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-[#FE5F55]" /> Logo da Empresa
                                </label>

                                <div className="relative group cursor-pointer">
                                    <div className={`w-32 h-32 rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-gray-50 ${uploadingLogo ? 'border-orange-200' : 'border-gray-200 hover:border-[#FE5F55]/50 group-hover:bg-white'
                                        }`}>
                                        <div className="w-full h-full relative">
                                            {logoUrl ? (
                                                <img
                                                    key={logoUrl}
                                                    src={logoUrl}
                                                    alt="Logo"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <Upload className="w-8 h-8" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Subir Logo</span>
                                                </div>
                                            )}
                                            {logoUrl && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Camera className="text-white w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        {uploadingLogo && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'logo')}
                                        disabled={uploadingLogo}
                                        className="absolute inset-0 w-32 h-32 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed">Formato recomendado: Quadrado (500x500px). JPG, PNG ou SVG.</p>
                            </div>

                            {/* Foto de Capa */}
                            <div className="space-y-4 flex-1">
                                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-[#FE5F55]" /> Foto de Capa do Cardápio
                                </label>

                                <div className="relative group cursor-pointer w-full">
                                    <div className={`w-full h-32 md:h-40 rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-gray-50 ${uploadingCover ? 'border-orange-200' : 'border-gray-200 hover:border-[#FE5F55]/50 group-hover:bg-white'
                                        }`}>
                                        <div className="w-full h-full relative">
                                            {coverUrl ? (
                                                <img
                                                    key={coverUrl}
                                                    src={coverUrl}
                                                    alt="Capa"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <Upload className="w-8 h-8" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Subir Capa</span>
                                                </div>
                                            )}
                                            {coverUrl && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Camera className="text-white w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        {uploadingCover && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'cover')}
                                        disabled={uploadingCover}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed">Dica: Use imagens de paisagem (ex: 1200x600px) para exibir seus pratos de forma chamativa.</p>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || uploadingLogo || uploadingCover}
                        className="bg-[#FE5F55] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#E85147] transition shadow-xl shadow-red-200/50 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
