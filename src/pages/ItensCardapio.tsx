import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Trash2, Camera, Tag, DollarSign, ListTree } from 'lucide-react';

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
    is_active: boolean;
    category: { name: string };
}

export default function ItensCardapio() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Image Upload State
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const fetchData = async () => {
        setLoading(true);

        // Buscar categorias
        const { data: catData } = await supabase
            .from('categories')
            .select('id, name')
            .order('display_order');
        if (catData) setCategories(catData);

        // Buscar items
        const { data: itemData } = await supabase
            .from('menu_items')
            .select('*, category:categories(name)')
            .order('created_at', { ascending: false });

        if (itemData) setItems(itemData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingImage(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath);
            setImageUrl(data.publicUrl);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId) return alert('Selecione uma categoria');

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('restaurant_id')
            .eq('id', userData.user.id)
            .single();

        if (!profile) return alert('Erro de perfil');

        const itemData = {
            restaurant_id: profile.restaurant_id,
            category_id: categoryId,
            name,
            description,
            price: parseFloat(price.replace(',', '.')),
            image_url: imageUrl || null,
            is_active: isActive
        };

        if (isEditing && currentId) {
            const { error } = await supabase
                .from('menu_items')
                .update(itemData)
                .eq('id', currentId);

            if (error) alert(error.message);
        } else {
            const { error } = await supabase
                .from('menu_items')
                .insert([itemData]);

            if (error) alert(error.message);
        }

        resetForm();
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir o produto?')) return;
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleEdit = (item: MenuItem) => {
        setIsEditing(true);
        setCurrentId(item.id);
        setName(item.name);
        setDescription(item.description || '');
        setPrice(item.price.toString());
        setCategoryId(item.category_id);
        setImageUrl(item.image_url || '');
        setIsActive(item.is_active);
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId('');
        setImageUrl('');
        setIsActive(true);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Itens do Cardápio</h1>
                <p className="text-gray-500 text-sm">Gerencie os pratos, bebidas e combos oferecidos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Form Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {isEditing ? 'Editar Produto' : 'Novo Produto'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Imagem Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Produto</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition w-full relative overflow-hidden group">
                                    {imageUrl ? (
                                        <>
                                            <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                                            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition">
                                                <span className="text-white text-sm font-medium">Trocar foto</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-1 justify-center flex flex-col items-center">
                                            <Camera className="mx-auto h-8 w-8 text-gray-400" />
                                            <div className="flex text-sm text-gray-600">
                                                <span className="font-medium text-[#FE5F55]">Faça upload de um arquivo</span>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                </div>
                                {uploadingImage && <p className="text-xs text-[#FE5F55] mt-1">Carregando imagem...</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                                <input
                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5F55] outline-none"
                                    placeholder="Ex: X-Bacon Burger"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (KZ)</label>
                                    <div className="relative">
                                        <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                        <input
                                            type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5F55] outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}
                                    >
                                        {isActive ? 'Ativo no Cardápio' : 'Inativo (Oculto)'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <div className="relative">
                                    <ListTree className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <select
                                        required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5F55] outline-none appearance-none"
                                    >
                                        <option value="" disabled>Selecione uma categoria...</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                    <span className={`text-xs font-medium ${description.length > 20 ? 'text-[#FE5F55]' : 'text-gray-400'}`}>
                                        {description.length}/24
                                    </span>
                                </div>
                                <textarea
                                    value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ingredientes e detalhes do produto..."
                                    maxLength={24} rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5F55] outline-none resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Limite calibrado para caber no card do celular.</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={uploadingImage} className="flex-1 bg-[#FE5F55] py-2 text-white font-medium rounded-lg hover:bg-[#E85147] transition">
                                    {isEditing ? 'Salvar' : 'Adicionar'}
                                </button>
                                {isEditing && (
                                    <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Buscando cardápio...</div>
                        ) : items.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <Tag className="w-12 h-12 text-gray-300 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">Nenhum produto cadastrado</h3>
                                <p className="text-gray-500 mt-1">Crie seus pratos e bebidas no formulário ao lado.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                                        <tr>
                                            <th className="py-3 px-4 w-16">Foto</th>
                                            <th className="py-3 px-4">Nome do Item</th>
                                            <th className="py-3 px-4">Categoria</th>
                                            <th className="py-3 px-4">Preço</th>
                                            <th className="py-3 px-4">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item) => (
                                            <tr key={item.id} className={`hover:bg-gray-50 group transition ${!item.is_active ? 'opacity-60 bg-gray-50/50' : ''}`}>

                                                <td className="py-3 px-4">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-300">
                                                            <Camera className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">{item.name}</div>
                                                    {item.description && <div className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">{item.description}</div>}
                                                    {!item.is_active && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Inativo</span>}
                                                </td>

                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#EBF1FF] text-[#FE5F55] text-xs font-medium">
                                                        {item.category?.name || 'Sem Categoria'}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-4 font-medium text-gray-900">
                                                    {Number(item.price).toFixed(2)} KZ
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Editar">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Excluir">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
