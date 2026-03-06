import React, { useEffect, useState } from 'react';
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
    display_order?: number;
    category: { name: string };
}

export default function ItensCardapio() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);

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

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('restaurant_id')
            .eq('id', userData.user.id)
            .single();

        if (!profile) return;

        // Buscar categorias
        const { data: catData } = await supabase
            .from('categories')
            .select('id, name')
            .eq('restaurant_id', profile.restaurant_id)
            .order('name');
        if (catData) setCategories(catData);

        // Buscar items
        const { data: itemData } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', profile.restaurant_id)
            .order('created_at', { ascending: false });

        if (itemData) {
            // Map category names to items
            const itemsWithCategories = itemData.map(item => {
                const category = catData?.find(cat => cat.id === item.category_id);
                return {
                    ...item,
                    category: { name: category?.name || 'Categoria não encontrada' }
                };
            });
            setItems(itemsWithCategories);
        }

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

        console.log('Dados sendo enviados:', itemData);

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

    const toggleCategoryExpansion = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleItemDragStart = (item: MenuItem) => {
        setDraggedItem(item);
    };

    const handleItemDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleItemDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem) return;

        // For now, just refresh the data to ensure consistency
        fetchData();
        setDraggedItem(null);
    };

    const handleItemDragEnd = () => {
        setDraggedItem(null);
    };

    // Group items by category
    const itemsByCategory = React.useMemo(() => {
        return categories.reduce((acc, category) => {
            acc[category.id] = items.filter(item => item.category_id === category.id);
            return acc;
        }, {} as Record<string, MenuItem[]>);
    }, [categories, items]);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Itens do Cardápio</h1>
                <p className="text-gray-500 text-sm">Gerencie os pratos, bebidas e combos oferecidos.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">

                {/* Form Column */}
                <div className="xl:col-span-1 order-2 xl:order-1">
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
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
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    autoComplete="off"
                                    spellCheck="false"
                                    data-form-type="other"
                                    inputMode="text"
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
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    autoComplete="off"
                                    spellCheck="false"
                                    data-form-type="other"
                                    inputMode="text"
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
                <div className="xl:col-span-2 order-1 xl:order-2">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Buscando cardápio...</div>
                        ) : categories.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <Tag className="w-12 h-12 text-gray-300 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">Nenhuma categoria cadastrada</h3>
                                <p className="text-gray-500 mt-1">Crie categorias primeiro para adicionar produtos.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {categories.map((category) => {
                                    const categoryItems = itemsByCategory[category.id] || [];
                                    const isExpanded = expandedCategories.has(category.id);

                                    return (
                                        <div key={category.id} className="p-4">
                                            <div
                                                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                                                onClick={() => toggleCategoryExpansion(category.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                        {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-4 space-y-2">
                                                    {categoryItems.length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500">
                                                            <Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                            <p className="text-sm">Nenhum produto nesta categoria</p>
                                                        </div>
                                                    ) : (
                                                        categoryItems.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                draggable
                                                                onDragStart={() => handleItemDragStart(item)}
                                                                onDragOver={handleItemDragOver}
                                                                onDrop={handleItemDrop}
                                                                onDragEnd={handleItemDragEnd}
                                                                className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-move ${
                                                                    draggedItem?.id === item.id ? 'opacity-50' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                                                    <div className="cursor-grab text-gray-400 flex-shrink-0">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                                                        </svg>
                                                                    </div>

                                                                    {item.image_url ? (
                                                                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-300 flex-shrink-0">
                                                                            <Camera className="w-6 h-6" />
                                                                        </div>
                                                                    )}

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-900">{item.name}</div>
                                                                        {item.description && <div className="text-sm text-gray-500 truncate">{item.description}</div>}
                                                                        {!item.is_active && <span className="inline-block mt-1 text-xs uppercase font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Inativo</span>}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                                                                    <div className="font-semibold text-gray-900">
                                                                        {Number(item.price).toFixed(2)} KZ
                                                                    </div>

                                                                    <div className="flex gap-2 flex-shrink-0">
                                                                        <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Editar">
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Excluir">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
