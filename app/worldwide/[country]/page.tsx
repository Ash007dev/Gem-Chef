'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, ChefHat, Sparkles, Calendar, TrendingUp, Star, Loader2, MapPin } from 'lucide-react';
import { getCountryByCode } from '@/utils/worldwide-data';
import { getCountryDishes } from '@/utils/gemini';
import { generateRecipes } from '@/utils/gemini';
import type { CountryDish } from '@/utils/worldwide-types';
import { getCacheKey, getCurrentMonthYear, isCacheValid } from '@/utils/worldwide-types';

// Helper to get region color
const getRegionColor = (region: string) => {
    switch (region) {
        case 'Asia': return 'text-red-400 bg-red-500/10';
        case 'Europe': return 'text-blue-400 bg-blue-500/10';
        case 'Americas': return 'text-green-400 bg-green-500/10';
        case 'Africa': return 'text-yellow-400 bg-yellow-500/10';
        case 'Oceania': return 'text-purple-400 bg-purple-500/10';
        default: return 'text-gray-400 bg-gray-500/10';
    }
};

export default function CountryDishesPage() {
    const router = useRouter();
    const params = useParams();
    const countryCode = (params.country as string).toUpperCase();

    const country = getCountryByCode(countryCode);
    const [dishes, setDishes] = useState<CountryDish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!country) {
            router.push('/worldwide');
            return;
        }

        loadDishes();
    }, [country]);

    const loadDishes = async () => {
        if (!country) return;

        setLoading(true);
        setError(null);

        try {
            // Check cache first
            const { month, year } = getCurrentMonthYear();
            const cacheKey = getCacheKey(countryCode, month, year);
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                const parsedCache = JSON.parse(cached);
                if (isCacheValid(parsedCache.timestamp)) {
                    setDishes(parsedCache.dishes);
                    setLoading(false);
                    return;
                }
            }

            // Generate new dishes
            const generatedDishes = await getCountryDishes(country.name, countryCode, {
                currentMonth: month
            });

            // Cache the results
            localStorage.setItem(cacheKey, JSON.stringify({
                countryCode,
                month,
                year,
                dishes: generatedDishes,
                timestamp: Date.now()
            }));

            setDishes(generatedDishes);
        } catch (err) {
            console.error('Failed to load dishes:', err);
            setError('Failed to load dishes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDishSelect = async (dish: CountryDish) => {
        try {
            // Generate full recipe for this dish
            const recipes = await generateRecipes(
                [], // No specific ingredients
                {
                    meal: 'Any',
                    dietary: 'both',
                    location: country?.name,
                    cuisine: country?.cuisine,
                    style: 'Traditional'
                }
            );

            // Find the recipe that matches the dish or use the first one
            const matchingRecipe = recipes.find(r =>
                r.title.toLowerCase().includes(dish.title.toLowerCase()) ||
                dish.title.toLowerCase().includes(r.title.toLowerCase())
            ) || recipes[0];

            if (matchingRecipe) {
                // Store in sessionStorage and navigate to cook page
                sessionStorage.setItem('currentRecipe', JSON.stringify(matchingRecipe));
                router.push('/cook');
            }
        } catch (err) {
            console.error('Failed to generate recipe:', err);
            alert('Failed to load recipe. Please try again.');
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'traditional': return <ChefHat className="w-4 h-4" />;
            case 'seasonal': return <Calendar className="w-4 h-4" />;
            case 'trending': return <TrendingUp className="w-4 h-4" />;
            case 'popular': return <Star className="w-4 h-4" />;
            default: return <Sparkles className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'traditional': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'seasonal': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'trending': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'popular': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'text-green-400';
            case 'Medium': return 'text-yellow-400';
            case 'Hard': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const groupedDishes = {
        traditional: dishes.filter(d => d.category === 'traditional'),
        seasonal: dishes.filter(d => d.category === 'seasonal'),
        trending: dishes.filter(d => d.category === 'trending'),
        popular: dishes.filter(d => d.category === 'popular'),
    };

    if (!country) return null;

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-6">
                <button onClick={() => router.back()} className="text-gray-400 mb-4">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-16 h-16 rounded-full ${getRegionColor(country.region)} flex items-center justify-center`}>
                        <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{country.cuisine} Cuisine</h1>
                        <p className="text-gray-500 text-sm">{country.description}</p>
                    </div>
                </div>
            </header>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    <p className="text-gray-400">Discovering {country.name} dishes...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={loadDishes}
                        className="px-6 py-2 bg-red-500/20 text-red-400 rounded-lg font-medium"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Dishes */}
            {!loading && !error && (
                <div className="space-y-8">
                    {/* Traditional Dishes */}
                    {groupedDishes.traditional.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <ChefHat className="w-5 h-5 text-amber-400" />
                                <h2 className="text-lg font-semibold text-white">Traditional Favorites</h2>
                            </div>
                            <div className="space-y-3">
                                {groupedDishes.traditional.map((dish) => (
                                    <DishCard
                                        key={dish.id}
                                        dish={dish}
                                        onSelect={handleDishSelect}
                                        getCategoryIcon={getCategoryIcon}
                                        getCategoryColor={getCategoryColor}
                                        getDifficultyColor={getDifficultyColor}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Seasonal Dishes */}
                    {groupedDishes.seasonal.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5 text-green-400" />
                                <h2 className="text-lg font-semibold text-white">Seasonal Specialties</h2>
                            </div>
                            <div className="space-y-3">
                                {groupedDishes.seasonal.map((dish) => (
                                    <DishCard
                                        key={dish.id}
                                        dish={dish}
                                        onSelect={handleDishSelect}
                                        getCategoryIcon={getCategoryIcon}
                                        getCategoryColor={getCategoryColor}
                                        getDifficultyColor={getDifficultyColor}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trending Dishes */}
                    {groupedDishes.trending.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Trending Now</h2>
                            </div>
                            <div className="space-y-3">
                                {groupedDishes.trending.map((dish) => (
                                    <DishCard
                                        key={dish.id}
                                        dish={dish}
                                        onSelect={handleDishSelect}
                                        getCategoryIcon={getCategoryIcon}
                                        getCategoryColor={getCategoryColor}
                                        getDifficultyColor={getDifficultyColor}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Popular Dishes */}
                    {groupedDishes.popular.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Popular Everyday Dishes</h2>
                            </div>
                            <div className="space-y-3">
                                {groupedDishes.popular.map((dish) => (
                                    <DishCard
                                        key={dish.id}
                                        dish={dish}
                                        onSelect={handleDishSelect}
                                        getCategoryIcon={getCategoryIcon}
                                        getCategoryColor={getCategoryColor}
                                        getDifficultyColor={getDifficultyColor}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

// Dish Card Component
function DishCard({
    dish,
    onSelect,
    getCategoryIcon,
    getCategoryColor,
    getDifficultyColor
}: {
    dish: CountryDish;
    onSelect: (dish: CountryDish) => void;
    getCategoryIcon: (category: string) => JSX.Element;
    getCategoryColor: (category: string) => string;
    getDifficultyColor: (difficulty: string) => string;
}) {
    return (
        <button
            onClick={() => onSelect(dish)}
            className="w-full bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:border-white transition-all group"
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white group-hover:text-white transition-colors flex-1 pr-2">
                    {dish.title}
                </h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(dish.category)}`}>
                    {getCategoryIcon(dish.category)}
                    <span className="capitalize">{dish.category}</span>
                </div>
            </div>

            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{dish.description}</p>

            {dish.seasonalNote && (
                <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-400">{dish.seasonalNote}</p>
                </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{dish.prepTime} + {dish.cookTime}</span>
                </div>
                <div className={`font-medium ${getDifficultyColor(dish.difficulty)}`}>
                    {dish.difficulty}
                </div>
                {dish.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                        {dish.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-dark-elevated rounded text-gray-600">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </button>
    );
}
