import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { Download, QrCode as QrCodeIcon, ExternalLink, Camera, Upload, Image as ImageIcon, Save } from 'lucide-react';

export default function QRCodeGenerator() {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mesa, setMesa] = useState('');
    const [customLogo, setCustomLogo] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `qr-logos/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);
            setCustomLogo(data.publicUrl);

        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        async function fetchRestaurant() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('restaurant_id')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const { data: res } = await supabase
                        .from('restaurants')
                        .select('*')
                        .eq('id', profile.restaurant_id)
                        .single();
                    if (res) {
                        setRestaurant(res);
                        setCustomLogo(res.qr_logo_url || '');
                    }
                }
            }
            setLoading(false);
        }
        fetchRestaurant();
    }, []);

    const downloadQRCode = () => {
        const svg = document.getElementById('restaurant-qrcode');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 40;
            canvas.height = img.height + 100;
            if (ctx) {
                // Fundo Branco
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 20, 20);

                // Texto
                ctx.fillStyle = '#111827';
                ctx.font = 'bold 20px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(restaurant?.name || 'Seu Cardápio', canvas.width / 2, img.height + 50);

                if (mesa) {
                    ctx.font = '16px Inter, sans-serif';
                    ctx.fillText(`Mesa: ${mesa}`, canvas.width / 2, img.height + 80);
                }
            }

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `qrcode-${restaurant?.slug}${mesa ? '-mesa-' + mesa : ''}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const handleSaveQR = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ qr_logo_url: customLogo })
                .eq('id', restaurant.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Logo do QR Code salvo com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Carregando dados...</div>;
    if (!restaurant) return <div className="p-8">Restaurante não encontrado.</div>;

    const publicUrl = `${window.location.origin}/${restaurant.slug}${mesa ? '?mesa=' + mesa : ''}`;
    const logoToUse = customLogo || restaurant.logo_url || '/vite.svg';

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8" translate="no">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <QrCodeIcon className="w-8 h-8 text-[#FE5F55]" />
                    Gerador de QR Code
                </h1>
                <p className="text-gray-500">Gere códigos QR para suas mesas e facilite o acesso dos seus clientes.</p>
            </div>

            {message && (
                <div
                    key={`qr-message-${message.type}-${Date.now()}`}
                    className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                        }`}
                >
                    <span className="text-sm font-semibold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Configurações */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 font-sans">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Identificação da Mesa (Opcional)</label>
                        <input
                            type="text"
                            value={mesa}
                            onChange={(e) => setMesa(e.target.value)}
                            placeholder="Ex: 01, VIP, Varanda..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE5F55]"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-[#FE5F55]" /> Logo Personalizado (Opcional)
                        </label>

                        <div className="relative group cursor-pointer">
                            <div className={`w-full h-24 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-gray-50 ${uploading ? 'border-orange-200' : 'border-gray-200 hover:border-[#FE5F55]/50 group-hover:bg-white'
                                }`}>
                                {customLogo ? (
                                    <div className="w-full h-full relative">
                                        <img src={customLogo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="text-white w-6 h-6" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-gray-400 text-center">
                                        <Upload className="w-6 h-6" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Subir Logo p/ QR Code</span>
                                        <span className="text-[9px]">Usa o logo da empresa por padrão</span>
                                    </div>
                                )}

                                {uploading && (
                                    <div key="qr-upload-spinner" className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>

                        <button
                            onClick={handleSaveQR}
                            disabled={saving || uploading}
                            className="w-full mt-2 bg-gray-900 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition disabled:opacity-50 text-sm"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Salvar Logotipo no QR
                        </button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" /> Link do Cardápio:
                        </h3>
                        <p className="text-xs text-gray-500 break-all bg-white p-2 rounded border border-gray-200 font-mono">
                            {publicUrl}
                        </p>
                    </div>

                    <button
                        onClick={downloadQRCode}
                        className="mt-auto bg-[#FE5F55] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E85147] transition shadow-lg shadow-[#FE5F55]/20"
                    >
                        <Download className="w-5 h-5" />
                        Download QR Code (PNG)
                    </button>
                </div>

                {/* Visualização */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-6 text-center">
                    <div className="p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <QRCodeSVG
                                id="restaurant-qrcode"
                                value={publicUrl}
                                size={220}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                    src: logoToUse,
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{restaurant.name}</h2>
                        {mesa && <p className="text-[#FE5F55] font-semibold">Mesa: {mesa}</p>}
                    </div>

                    <p className="text-xs text-gray-400">Posicione este QR Code nas mesas para que os clientes possam ler e abrir seu cardápio instantaneamente.</p>
                </div>

            </div>
        </div>
    );
}
