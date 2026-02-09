'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    Shuffle,
    ArrowLeft,
    Clock,
    Users,
    Flame,
    Utensils,
    ExternalLink,
    Play
} from 'lucide-react';
import { generateRecipes, Recipe } from '@/utils/gemini';

function RecipesContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const hasFetched = useRef(false);

    // Get params
    const ingredients = searchParams.get('ingredients')?.split(',') || [];
    const meal = searchParams.get('meal') || 'Lunch';
    const dietary = searchParams.get('dietary') || 'Both';
    const location = searchParams.get('location') || '';
    const style = searchParams.get('style') || 'Quick & Easy';
    const cuisine = searchParams.get('cuisine') || 'Same as Location';
    const ageGroup = searchParams.get('ageGroup') || 'Adult (20-59)';
    const healthConditions = searchParams.get('healthConditions')?.split(',').filter(Boolean) || [];
    const allergies = searchParams.get('allergies')?.split(',').filter(Boolean) || [];
    const maxTime = searchParams.get('maxTime') ? parseInt(searchParams.get('maxTime')!, 10) : null;

    // Build a full cache key from all params to detect changes
    const cacheKey = [ingredients.join(','), meal, dietary, location, style, cuisine, ageGroup, healthConditions.join(','), allergies.join(','), maxTime?.toString() || ''].join('|');

    const fetchRecipes = async () => {
        if (ingredients.length === 0) {
            setError('No ingredients provided');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await generateRecipes(ingredients, {
                meal, dietary, location, style, cuisine, ageGroup,
                healthConditions, allergies, maxTime
            });
            setRecipes(result);
            // Cache recipes so back navigation doesn't regenerate
            sessionStorage.setItem('cachedRecipes', JSON.stringify(result));
            sessionStorage.setItem('cachedRecipesKey', cacheKey);
            // Auto-expand first recipe
            if (result.length > 0) {
                setExpandedId(result[0].id);
            }
        } catch (err) {
            setError('Failed to generate recipes. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Prevent double-fetch from React strict mode or re-renders
        if (hasFetched.current) return;
        hasFetched.current = true;

        // Check if we have cached recipes for the same params
        const cachedKey = sessionStorage.getItem('cachedRecipesKey');
        const cached = sessionStorage.getItem('cachedRecipes');
        if (cached && cachedKey === cacheKey) {
            const parsed = JSON.parse(cached) as Recipe[];
            setRecipes(parsed);
            if (parsed.length > 0) {
                setExpandedId(parsed[0].id);
            }
            setLoading(false);
            return;
        }
        fetchRecipes();
    }, []);

    const handleRethink = () => {
        // Clear cache so new recipes are generated
        sessionStorage.removeItem('cachedRecipes');
        sessionStorage.removeItem('cachedRecipesKey');
        hasFetched.current = false;
        fetchRecipes();
    };

    const handleCook = (recipe: Recipe) => {
        // Store recipe in sessionStorage and navigate
        sessionStorage.setItem('currentRecipe', JSON.stringify(recipe));
        router.push(`/cook?id=${recipe.id}`);
    };

    const getYouTubeSearchUrl = (title: string) => {
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' recipe')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">Generating recipes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black px-5 pt-12 pb-24">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 mb-8">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <div className="text-center py-20">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={handleRethink} className="px-6 py-3 bg-white text-black rounded-xl font-medium">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={handleRethink}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-full text-sm text-white"
                >
                    <Shuffle className="w-4 h-4" />
                    <span>Again</span>
                </button>
            </header>

            {/* Context Info */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Recipes</h1>
                <p className="text-gray-500 text-sm">
                    {recipes.length} recipes for {meal.toLowerCase()}
                </p>
            </div>

            {/* Context Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 bg-dark-card rounded-full text-xs text-gray-300">
                    {meal}
                </span>
                <span className="px-3 py-1.5 bg-dark-card rounded-full text-xs text-gray-300">
                    {dietary}
                </span>
                {location && (
                    <span className="px-3 py-1.5 bg-dark-card rounded-full text-xs text-gray-300">
                        {location}
                    </span>
                )}
            </div>

            {/* Regional Signature Dishes */}
            {recipes.filter(r => r.isRegional).length > 0 && (
                <section className="mb-8">
                    <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">🍽️</span>
                        Signature Dishes from {cuisine === 'Same as Location' ? location : cuisine}
                    </h2>
                    <div className="space-y-3">
                        {recipes.filter(r => r.isRegional).map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                isExpanded={expandedId === recipe.id}
                                onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                                onCook={() => handleCook(recipe)}
                                youtubeUrl={getYouTubeSearchUrl(recipe.title)}
                                meal={meal}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Regular Recipe Cards */}
            <section>
                <h2 className="text-white font-semibold mb-3">
                    {style} Recipes
                </h2>
                <div className="space-y-3">
                    {recipes.filter(r => !r.isRegional).map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            isExpanded={expandedId === recipe.id}
                            onToggle={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                            onCook={() => handleCook(recipe)}
                            youtubeUrl={getYouTubeSearchUrl(recipe.title)}
                            meal={meal}
                        />
                    ))}
                </div>
            </section>

            {/* Rethink Button */}
            <button
                onClick={handleRethink}
                className="w-full mt-6 py-4 bg-dark-card border border-dark-border rounded-xl text-white font-medium flex items-center justify-center gap-2"
            >
                <Shuffle className="w-4 h-4" />
                Let's Cook
            </button>
        </div>
    );
}

function RecipeCard({
    recipe,
    isExpanded,
    onToggle,
    onCook,
    youtubeUrl,
    meal
}: {
    recipe: Recipe;
    isExpanded: boolean;
    onToggle: () => void;
    onCook: () => void;
    youtubeUrl: string;
    meal: string;
}) {
    const [showSteps, setShowSteps] = useState(false);

    return (
        <div
            className={`rounded-2xl overflow-hidden transition-all ${isExpanded ? 'bg-gray-100' : 'bg-dark-card border border-dark-border'
                }`}
        >
            {/* Header - Always visible */}
            <button
                onClick={onToggle}
                className={`w-full p-4 text-left flex items-start justify-between ${isExpanded ? 'text-black' : 'text-white'
                    }`}
            >
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{recipe.title}</h3>
                    <p className={`text-sm ${isExpanded ? 'text-gray-600' : 'text-gray-400'}`}>
                        {recipe.description}
                    </p>
                    {/* Quick meta when collapsed */}
                    {!isExpanded && (
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span>{recipe.totalTime}</span>
                            <span>•</span>
                            <span>{recipe.difficulty}</span>
                            <span>•</span>
                            <span>{recipe.calories}</span>
                        </div>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 text-black animate-fade-in">
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {recipe.totalTime}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {recipe.servings}
                        </span>
                        <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {recipe.calories}
                        </span>
                    </div>

                    {/* Pairing Suggestion */}
                    {recipe.pairingsuggestion && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">🍽️ {recipe.pairingsuggestion}</span>
                            </p>
                        </div>
                    )}

                    {/* Ingredients Section */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients</h4>
                        <ul className="space-y-1">
                            {recipe.ingredients.provided.map((ing, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-green-600">✓</span>
                                    {ing}
                                </li>
                            ))}
                        </ul>
                        {recipe.ingredients.shoppingList.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-200 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-1">Shopping Needed:</p>
                                <ul className="space-y-1">
                                    {recipe.ingredients.shoppingList.map((ing, idx) => (
                                        <li key={idx} className="text-sm text-gray-600">
                                            • {ing}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Steps Toggle */}
                    <button
                        onClick={() => setShowSteps(!showSteps)}
                        className="w-full flex items-center justify-between p-3 bg-gray-200 rounded-lg mb-4"
                    >
                        <span className="text-sm font-medium text-gray-700">
                            {recipe.steps.length} Steps
                        </span>
                        {showSteps ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                    </button>

                    {/* Steps List */}
                    {showSteps && (
                        <div className="mb-4 space-y-3 animate-fade-in">
                            {recipe.steps.map((step, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold text-gray-600">{idx + 1}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* YouTube Link */}
                    <a
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mb-4"
                    >
                        <Play className="w-5 h-5 text-red-500 fill-red-500" />
                        <span className="text-sm font-medium text-red-600">Watch on YouTube</span>
                    </a>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSteps(true)}
                            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl text-black font-medium text-sm transition-colors"
                        >
                            Read Recipe
                        </button>
                        <button
                            onClick={onCook}
                            className="flex-1 py-3 bg-black text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                        >
                            <Utensils className="w-4 h-4" />
                            Cook
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RecipesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <RecipesContent />
        </Suspense>
    );
}
