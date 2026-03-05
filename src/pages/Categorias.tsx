import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, GripVertical, ListTree } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    description: string;
    display_order: number;
}

export default function Categorias() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (!error && data) {
            setCategories(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Get the admin's restaurant_id
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('restaurant_id')
            .eq('id', userData.user.id)
            .single();

        if (!profile) return alert('Restaurante não encontrado para este usuário.');

        if (isEditing && currentId) {
            const { error } = await supabase
                .from('categories')
                .update({ name, description })
                .eq('id', currentId);

            if (error) alert(error.message);
        } else {
            const newOrder = categories.length > 0
                ? Math.max(...categories.map(c => c.display_order)) + 1
                : 1;

            const { error } = await supabase
                .from('categories')
                .insert([{
                    restaurant_id: profile.restaurant_id,
                    name,
                    description,
                    display_order: newOrder
                }]);

            if (error) alert(error.message);
        }

        resetForm();
        fetchCategories();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta categoria? Os produtos nela ficarão sem categoria.')) return;

        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) fetchCategories();
    };

    const handleEdit = (cat: Category) => {
        setIsEditing(true);
        setCurrentId(cat.id);
        setName(cat.name);
        setDescription(cat.description || '');
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setName('');
        setDescription('');
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
                    <p className="text-gray-500 text-sm">Gerencie as seções do seu cardápio</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Form Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Entradas, Bebidas..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detalhes curtos..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE5F55] focus:border-transparent outline-none resize-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#FE5F55] hover:bg-[#E85147] text-white font-medium py-2 rounded-lg transition duration-200 flex justify-center items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {isEditing ? 'Salvar' : 'Adicionar'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition duration-200"
                                    >
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
                            <div className="p-8 text-center text-gray-500">Carregando categorias...</div>
                        ) : categories.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <ListTree className="w-12 h-12 text-gray-300 mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">Nenhuma categoria</h3>
                                <p className="text-gray-500 mt-1 max-w-sm">
                                    Comece adicionando a sua primeira categoria no formulário ao lado.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {categories.map((cat) => (
                                    <li key={cat.id} className="p-4 hover:bg-gray-50 flex items-center gap-4 group transition-colors">
                                        <div className="cursor-grab text-gray-400 opacity-50 hover:opacity-100">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-gray-900 font-medium truncate">{cat.name}</h4>
                                            {cat.description && (
                                                <p className="text-gray-500 text-sm truncate">{cat.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
