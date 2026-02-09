'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Clock,
    Users,
    ChevronDown,
    ChevronUp,
    Trash2,
    Utensils,
    Search,
    BookOpen,
    X
} from 'lucide-react';
import { UserRecipe } from '@/utils/gemini';

export default function MyRecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<UserRecipe[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('smartchef_my_recipes');
        if (saved) {
            const parsed: UserRecipe[] = JSON.parse(saved);
            // Sort newest first
            parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecipes(parsed);
        }
    }, []);

    const handleDelete = (id: string) => {
        const updated = recipes.filter(r => r.id !== id);
        setRecipes(updated);
        localStorage.setItem('smartchef_my_recipes', JSON.stringify(updated));
        setDeleteConfirm(null);
        setExpandedId(null);
    };

    const handleCook = (recipe: UserRecipe) => {
        // Convert UserRecipe to the Recipe format the cook page expects
        const cookRecipe = {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            totalTime: `${recipe.prepTime} + ${recipe.cookTime}`,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            calories: 'N/A',
            type: 'simple' as const,
            ingredients: {
                provided: recipe.ingredients,
                shoppingList: [],
            },
            steps: recipe.steps,
            mealPrep: [],
        };
        sessionStorage.setItem('currentRecipe', JSON.stringify(cookRecipe));
        router.push(`/cook?id=${recipe.id}`);
    };

    const filtered = recipes.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.ingredients.some(i => i.toLowerCase().includes(search.toLowerCase()))
    );

    const sourceLabel = (source: string) => {
        switch (source) {
            case 'voice': return 'Voice input';
            case 'text-import': return 'Imported from text';
            default: return 'Manual entry';
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <button onClick={() => router.back()} className="text-gray-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    My Recipes
                </h1>
                <button
                    onClick={() => router.push('/my-recipes/add')}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {/* Search */}
            {recipes.length > 0 && (
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search recipes or ingredients..."
                        className="w-full pl-10 pr-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Empty State */}
            {recipes.length === 0 && (
                <div className="text-center py-20">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-white text-lg font-medium mb-2">No recipes yet</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Add your family recipes, personal favorites, or import from text.
                    </p>
                    <button
                        onClick={() => router.push('/my-recipes/add')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Your First Recipe
                    </button>
                </div>
            )}

            {/* Recipe count */}
            {filtered.length > 0 && (
                <p className="text-gray-500 text-xs mb-4">
                    {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
                    {search ? ` matching "${search}"` : ''}
                </p>
            )}

            {/* Recipe Cards */}
            <div className="space-y-3">
                {filtered.map(recipe => {
                    const isExpanded = expandedId === recipe.id;

                    return (
                        <div
                            key={recipe.id}
                            className={`rounded-2xl overflow-hidden transition-all ${
                                isExpanded ? 'bg-gray-100' : 'bg-dark-card border border-dark-border'
                            }`}
                        >
                            {/* Card Header */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                                className={`w-full p-4 text-left flex items-start justify-between ${
                                    isExpanded ? 'text-black' : 'text-white'
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold mb-1 truncate">{recipe.title}</h3>
                                    <p className={`text-sm ${isExpanded ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {recipe.description}
                                    </p>
                                    {!isExpanded && (
                                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                            <span>{recipe.difficulty}</span>
                                            <span>-</span>
                                            <span>{recipe.servings}</span>
                                            <span>-</span>
                                            <span>{sourceLabel(recipe.source)}</span>
                                        </div>
                                    )}
                                </div>
                                {recipe.photo && !isExpanded && (
                                    <img
                                        src={recipe.photo}
                                        alt={recipe.title}
                                        className="w-14 h-14 rounded-lg object-cover ml-3 flex-shrink-0"
                                    />
                                )}
                                {isExpanded
                                    ? <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1 ml-2" />
                                    : <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1 ml-2" />
                                }
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="px-4 pb-4 text-black animate-fade-in">
                                    {/* Photo */}
                                    {recipe.photo && (
                                        <img
                                            src={recipe.photo}
                                            alt={recipe.title}
                                            className="w-full h-48 object-cover rounded-xl mb-4"
                                        />
                                    )}

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {recipe.prepTime} prep + {recipe.cookTime} cook
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {recipe.servings}
                                        </span>
                                    </div>

                                    {/* Source badge */}
                                    <div className="mb-4">
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                                            {sourceLabel(recipe.source)}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            {new Date(recipe.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Ingredients */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients</h4>
                                        <ul className="space-y-1">
                                            {recipe.ingredients.map((ing, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                                                    {ing}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Steps */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Steps</h4>
                                        <div className="space-y-3">
                                            {recipe.steps.map((step, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-semibold text-gray-600">{idx + 1}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleCook(recipe)}
                                            className="flex-1 py-3 bg-black text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                                        >
                                            <Utensils className="w-4 h-4" />
                                            Cook This
                                        </button>
                                        {deleteConfirm === recipe.id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(recipe.id)}
                                                    className="px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(recipe.id)}
                                                className="w-12 py-3 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* FAB */}
            {recipes.length > 0 && (
                <button
                    onClick={() => router.push('/my-recipes/add')}
                    className="fixed bottom-24 right-5 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg shadow-white/10 active:scale-95 transition-transform z-30"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}
