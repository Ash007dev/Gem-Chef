'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ChefHat,
    Sparkles,
    Flame,
    Clock,
    Utensils,
    Info,
    ArrowRight,
    ShoppingBag
} from 'lucide-react';
import { generateGourmetTransformations, Recipe } from '../../utils/gemini';

const CATEGORIES = [
    { id: 'Instant Noodles', label: 'Instant Noodles', icon: '🍜', placeholder: 'e.g. 2 packets of spicy ramen' },
    { id: 'Bread & Eggs', label: 'Bread & Eggs', icon: '🍞', placeholder: 'e.g. 4 slices of bread and 2 eggs' },
    { id: 'Rice', label: 'Leftover Rice', icon: '🍚', placeholder: 'e.g. A bowl of plain cooked rice' },
    { id: 'Pasta', label: 'Pasta', icon: '🍝', placeholder: 'e.g. Half a packet of spaghetti' },
    { id: 'General', label: 'Something Else', icon: '🥘', placeholder: 'e.g. Potatoes and frozen peas' }
];

export default function GourmetPage() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1]);
    const [ingredients, setIngredients] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTransform = async () => {
        if (!ingredients.trim()) return;

        setIsLoading(true);
        setError(null);
        setRecipes([]);

        try {
            const results = await generateGourmetTransformations(ingredients, selectedCategory.id);
            setRecipes(results);
        } catch (err) {
            console.error(err);
            setError('Failed to generate transformations. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white px-5 pt-6 pb-24">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-dark-card border border-dark-border active:scale-95 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                        Basic to Gourmet
                    </h1>
                    <p className="text-xs text-gray-500">Elevate your everyday ingredients</p>
                </div>
            </header>

            <div className="max-w-2xl mx-auto space-y-8">
                {/* Introduction */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                            <ChefHat className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-2">
                            Turn "Lazy" into "Luxury"
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Got boring instant noodles or just bread? Let AI transform them into creative, gourmet-style meals using what you have.
                        </p>
                    </div>
                </div>

                {/* Main Input Section */}
                <div className="space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                            What are you starting with?
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setIngredients('');
                                        setRecipes([]);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap transition-all ${selectedCategory.id === cat.id
                                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                        : 'bg-dark-card border-dark-border text-gray-400 hover:bg-dark-elevated'
                                        }`}
                                >
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ingredient Input */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            Describe exactly what you have
                        </label>
                        <div className="relative">
                            <textarea
                                value={ingredients}
                                onChange={(e) => setIngredients(e.target.value)}
                                placeholder={selectedCategory.placeholder}
                                className="w-full h-32 bg-dark-card border border-dark-border rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                            />
                            {ingredients && (
                                <button
                                    onClick={handleTransform}
                                    disabled={isLoading}
                                    className="absolute bottom-4 right-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg text-white text-sm font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>Generating...</>
                                    ) : (
                                        <>
                                            Transform <Sparkles className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-fade-in">
                        {error}
                    </div>
                )}

                {/* Results Section */}
                {recipes.length > 0 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Sparkles className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Gourmet Transformations</h3>
                        </div>

                        <div className="grid gap-6">
                            {recipes.map((recipe, index) => (
                                <div
                                    key={index}
                                    className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden group hover:border-yellow-500/30 transition-all"
                                >
                                    {/* Recipe Header */}
                                    <div className="p-6 pb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                                                {recipe.title}
                                            </h4>
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${recipe.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                recipe.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {recipe.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm italic mb-4">
                                            "{recipe.description}"
                                        </p>

                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                {recipe.totalTime}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Flame className="w-4 h-4" />
                                                {recipe.calories}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-dark-border mx-6" />

                                    {/* Instructions Preview */}
                                    <div className="p-6 pt-4 space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                                                What you need
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {recipe.ingredients.provided.map((ing, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-300">
                                                        {ing}
                                                    </span>
                                                ))}
                                                {recipe.ingredients.shoppingList.map((ing, i) => (
                                                    <span key={i} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-xs text-yellow-400">
                                                        + {ing}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            {recipe.steps.slice(0, 3).map((step, i) => (
                                                <div key={i} className="flex gap-3 text-sm text-gray-400">
                                                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-dark-elevated flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {i + 1}
                                                    </span>
                                                    <p>{step}</p>
                                                </div>
                                            ))}
                                            {recipe.steps.length > 3 && (
                                                <p className="text-xs text-gray-600 pl-8">
                                                    + {recipe.steps.length - 3} more steps...
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => {
                                                sessionStorage.setItem('currentRecipe', JSON.stringify(recipe));
                                                router.push('/cook');
                                            }}
                                            className="w-full py-3 bg-dark-elevated hover:bg-dark-elevated/80 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            View Full Recipe <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
