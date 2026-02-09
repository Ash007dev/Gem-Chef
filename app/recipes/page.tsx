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
    Play,
    CalendarClock,
    Bell,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import { generateRecipes, Recipe } from '@/utils/gemini';
import {
    addReminder,
    requestNotificationPermission,
    formatDuration,
    getPrepTypeColor
} from '@/utils/reminders';

// Plan Cook Modal
function PlanCookModal({
    recipe,
    onClose
}: {
    recipe: Recipe;
    onClose: () => void;
}) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [remindersSet, setRemindersSet] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        // Set default date/time to today + 2 hours
        const now = new Date();
        now.setHours(now.getHours() + 2);
        setSelectedDate(now.toISOString().split('T')[0]);
        setSelectedTime(now.toTimeString().slice(0, 5));

        // Request notification permission
        requestNotificationPermission().then(setPermissionGranted);
    }, []);

    const hasPrep = recipe.prepRequirements && recipe.prepRequirements.length > 0;

    const handleSetReminders = () => {
        if (!selectedDate || !selectedTime) return;

        const plannedTime = new Date(`${selectedDate}T${selectedTime}`);

        if (hasPrep && recipe.prepRequirements) {
            recipe.prepRequirements.forEach(prep => {
                addReminder(recipe, prep, plannedTime);
            });
        }

        setRemindersSet(true);
        setTimeout(() => onClose(), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
            <div className="bg-dark-card rounded-2xl w-full max-w-md border border-dark-border animate-slide-up">
                {/* Header */}
                <div className="p-4 border-b border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-white">Plan to Cook</span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-dark-elevated rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {remindersSet ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Reminders Set!</h3>
                            <p className="text-gray-400 text-sm">We'll remind you when it's time to start preparing.</p>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-semibold text-white mb-1">{recipe.title}</h3>
                            <p className="text-gray-500 text-sm mb-4">When do you want to start cooking?</p>

                            {/* Date/Time Picker */}
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full p-3 bg-dark-elevated border border-dark-border rounded-xl text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Time</label>
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full p-3 bg-dark-elevated border border-dark-border rounded-xl text-white"
                                    />
                                </div>
                            </div>

                            {/* Prep Requirements */}
                            {hasPrep && recipe.prepRequirements && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-medium text-amber-400">Advance Prep Required</span>
                                    </div>
                                    <div className="space-y-2">
                                        {recipe.prepRequirements.map((prep, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-300">{prep.description}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${getPrepTypeColor(prep.type)}`}>
                                                    {formatDuration(prep.durationMinutes)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        We'll remind you in advance based on prep times.
                                    </p>
                                </div>
                            )}

                            {/* Notification Warning */}
                            {!permissionGranted && (
                                <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-400">
                                            Enable notifications to receive prep reminders
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* No Prep Message */}
                            {!hasPrep && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-green-400">No advance prep needed!</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This recipe can be started immediately when you're ready.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!remindersSet && (
                    <div className="p-4 border-t border-dark-border flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSetReminders}
                            disabled={!selectedDate || !selectedTime}
                            className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Bell className="w-4 h-4" />
                            {hasPrep ? 'Set Reminders' : 'Schedule'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

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
    const [showPlanModal, setShowPlanModal] = useState(false);

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

                    {/* Prep Requirements Badge */}
                    {recipe.prepRequirements && recipe.prepRequirements.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-amber-50 rounded-lg">
                            <CalendarClock className="w-4 h-4 text-amber-600" />
                            <span className="text-xs text-amber-700">
                                Requires advance prep ({recipe.prepRequirements.map(p => formatDuration(p.durationMinutes)).join(', ')})
                            </span>
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
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSteps(true)}
                            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl text-black font-medium text-sm transition-colors"
                        >
                            Read
                        </button>
                        <button
                            onClick={() => setShowPlanModal(true)}
                            className="py-3 px-4 bg-purple-100 hover:bg-purple-200 rounded-xl text-purple-700 font-medium text-sm transition-colors flex items-center gap-1"
                        >
                            <CalendarClock className="w-4 h-4" />
                            Plan
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

            {/* Plan Cook Modal */}
            {showPlanModal && (
                <PlanCookModal
                    recipe={recipe}
                    onClose={() => setShowPlanModal(false)}
                />
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
