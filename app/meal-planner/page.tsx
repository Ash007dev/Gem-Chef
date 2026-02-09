'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Coffee,
    Sun,
    Moon,
    Cookie,
    Plus,
    X,
    Check,
    Clock,
    ShoppingCart,
    Share2,
    Loader2,
    ChevronRight,
    Trash2,
    Flame
} from 'lucide-react';
import {
    generateMealSuggestions,
    generateGroceryList,
    type MealSuggestion,
    type GroceryList,
    type GroceryItem
} from '@/utils/gemini';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type Duration = 1 | 3 | 7;

interface PlannedMeal {
    id: string;
    day: number;
    mealType: MealType;
    meal: MealSuggestion;
}

interface DayPlan {
    day: number;
    dayName: string;
    date: string;
    meals: {
        breakfast?: MealSuggestion;
        lunch?: MealSuggestion;
        dinner?: MealSuggestion;
        snack?: MealSuggestion;
    };
}

const mealTypeConfig: Record<MealType, { icon: typeof Coffee; label: string; color: string }> = {
    breakfast: { icon: Coffee, label: 'Breakfast', color: 'text-amber-400 bg-amber-500/20' },
    lunch: { icon: Sun, label: 'Lunch', color: 'text-orange-400 bg-orange-500/20' },
    dinner: { icon: Moon, label: 'Dinner', color: 'text-indigo-400 bg-indigo-500/20' },
    snack: { icon: Cookie, label: 'Snack', color: 'text-pink-400 bg-pink-500/20' }
};

const categoryConfig: Record<string, { label: string; color: string }> = {
    produce: { label: 'Produce', color: 'bg-green-500/20 text-green-400' },
    dairy: { label: 'Dairy', color: 'bg-blue-500/20 text-blue-400' },
    protein: { label: 'Protein', color: 'bg-red-500/20 text-red-400' },
    grains: { label: 'Grains', color: 'bg-amber-500/20 text-amber-400' },
    spices: { label: 'Spices', color: 'bg-purple-500/20 text-purple-400' },
    other: { label: 'Other', color: 'bg-gray-500/20 text-gray-400' }
};

function getDayNames(duration: Duration): DayPlan[] {
    const days: DayPlan[] = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < duration; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push({
            day: i,
            dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()],
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            meals: {}
        });
    }
    return days;
}

// Meal Selection Modal
function MealSelectionModal({
    mealType,
    onClose,
    onSelect,
    existingMeals
}: {
    mealType: MealType;
    onClose: () => void;
    onSelect: (meal: MealSuggestion) => void;
    existingMeals: string[];
}) {
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSuggestions() {
            try {
                setLoading(true);
                setError(null);

                // Get user preferences
                const prefsStr = localStorage.getItem('smartchef_preferences');
                const prefs = prefsStr ? JSON.parse(prefsStr) : {};

                const meals = await generateMealSuggestions(mealType, {
                    cuisine: prefs.cuisine,
                    dietary: prefs.diet,
                    healthConditions: prefs.healthConditions || [],
                    allergies: prefs.allergies || [],
                    previousMeals: existingMeals
                });

                setSuggestions(meals);
            } catch (err) {
                console.error('Failed to get meal suggestions:', err);
                setError('Failed to load suggestions. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchSuggestions();
    }, [mealType, existingMeals]);

    const config = mealTypeConfig[mealType];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/80 animate-fade-in">
            <div className="bg-dark-card rounded-t-3xl w-full max-h-[85vh] overflow-hidden border-t border-dark-border animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-dark-card p-4 border-b border-dark-border">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-white">Choose {config.label}</span>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 bg-dark-elevated rounded-full flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm">Select a dish for your meal plan</p>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[65vh]">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
                            <p className="text-gray-400 text-sm">Finding {mealType} ideas...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
                            <p className="text-red-400 mb-4">{error}</p>
                            <button onClick={onClose} className="px-6 py-2 bg-dark-elevated rounded-lg text-white">
                                Close
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="space-y-3">
                            {suggestions.map((meal) => (
                                <button
                                    key={meal.id}
                                    onClick={() => onSelect(meal)}
                                    className="w-full p-4 bg-dark-elevated border border-dark-border rounded-xl text-left hover:bg-dark-card transition-colors active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white">{meal.title}</h4>
                                        {meal.isQuick && (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                Quick
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm mb-2">{meal.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {meal.totalTime}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Flame className="w-3 h-3" />
                                            {meal.calories}
                                        </span>
                                        <span>{meal.difficulty}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Grocery List View
function GroceryListView({
    groceryList,
    onClose,
    onShare
}: {
    groceryList: GroceryList;
    onClose: () => void;
    onShare: () => void;
}) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const toggleItem = (name: string) => {
        setCheckedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    };

    const groupedItems = groceryList.items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, GroceryItem[]>);

    const categoryOrder = ['produce', 'dairy', 'protein', 'grains', 'spices', 'other'];

    return (
        <div className="fixed inset-0 z-50 bg-black animate-fade-in overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm p-4 border-b border-dark-border z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="w-10 h-10 bg-dark-card rounded-full flex items-center justify-center">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Shopping List</h1>
                            <p className="text-xs text-gray-500">{groceryList.items.length} items from {groceryList.totalRecipes} recipes</p>
                        </div>
                    </div>
                    <button
                        onClick={onShare}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium text-sm flex items-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {categoryOrder.map(category => {
                    const items = groupedItems[category];
                    if (!items || items.length === 0) return null;

                    const config = categoryConfig[category];

                    return (
                        <div key={category} className="mb-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 ${config.color}`}>
                                <span className="text-sm font-medium">{config.label}</span>
                                <span className="text-xs opacity-70">({items.length})</span>
                            </div>

                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => toggleItem(item.name)}
                                        className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 ${checkedItems.has(item.name)
                                                ? 'bg-dark-elevated border-dark-border opacity-50'
                                                : 'bg-dark-card border-dark-border'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checkedItems.has(item.name)
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-gray-600'
                                            }`}>
                                            {checkedItems.has(item.name) && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`font-medium ${checkedItems.has(item.name) ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.quantity} · For: {item.forRecipes.slice(0, 2).join(', ')}
                                                {item.forRecipes.length > 2 && ` +${item.forRecipes.length - 2} more`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MealPlannerPage() {
    const router = useRouter();
    const [duration, setDuration] = useState<Duration | null>(null);
    const [days, setDays] = useState<DayPlan[]>([]);
    const [selectingMeal, setSelectingMeal] = useState<{ day: number; mealType: MealType } | null>(null);
    const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
    const [generatingList, setGeneratingList] = useState(false);
    const [showGroceryList, setShowGroceryList] = useState(false);

    // Initialize days when duration is selected
    useEffect(() => {
        if (duration) {
            setDays(getDayNames(duration));
        }
    }, [duration]);

    const handleSelectMeal = (meal: MealSuggestion) => {
        if (!selectingMeal) return;

        setDays(prev => prev.map(d => {
            if (d.day === selectingMeal.day) {
                return {
                    ...d,
                    meals: {
                        ...d.meals,
                        [selectingMeal.mealType]: meal
                    }
                };
            }
            return d;
        }));

        setSelectingMeal(null);
    };

    const removeMeal = (day: number, mealType: MealType) => {
        setDays(prev => prev.map(d => {
            if (d.day === day) {
                const newMeals = { ...d.meals };
                delete newMeals[mealType];
                return { ...d, meals: newMeals };
            }
            return d;
        }));
    };

    const getExistingMeals = (): string[] => {
        return days.flatMap(d =>
            Object.values(d.meals).filter(Boolean).map(m => m!.title)
        );
    };

    const getTotalMeals = (): number => {
        return days.reduce((acc, d) => acc + Object.keys(d.meals).length, 0);
    };

    const handleGenerateGroceryList = async () => {
        const plannedMeals = days.flatMap(d =>
            Object.values(d.meals).filter(Boolean).map(m => ({
                title: m!.title,
                ingredients: m!.ingredients
            }))
        );

        if (plannedMeals.length === 0) return;

        try {
            setGeneratingList(true);
            const list = await generateGroceryList(plannedMeals);
            setGroceryList(list);
            setShowGroceryList(true);
        } catch (err) {
            console.error('Failed to generate grocery list:', err);
        } finally {
            setGeneratingList(false);
        }
    };

    const handleShareWhatsApp = () => {
        if (!groceryList) return;

        const categoryOrder = ['produce', 'dairy', 'protein', 'grains', 'spices', 'other'];
        const groupedItems = groceryList.items.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, GroceryItem[]>);

        let text = `*Shopping List* (${groceryList.items.length} items)\n\n`;

        categoryOrder.forEach(category => {
            const items = groupedItems[category];
            if (items && items.length > 0) {
                const config = categoryConfig[category];
                text += `*${config.label}*\n`;
                items.forEach(item => {
                    text += `- ${item.name}: ${item.quantity}\n`;
                });
                text += '\n';
            }
        });

        text += `_Generated by GemChef_`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Duration Selection Screen
    if (!duration) {
        return (
            <div className="min-h-screen bg-black px-5 pt-12 pb-24 animate-fade-in">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-dark-card rounded-full flex items-center justify-center mb-6"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-purple-400" />
                        <h1 className="text-2xl font-bold text-white">Meal Planner</h1>
                    </div>
                    <p className="text-gray-500">Plan your meals and generate a smart shopping list</p>
                </div>

                <h2 className="text-sm font-medium text-gray-400 mb-4">How many days do you want to plan?</h2>

                <div className="space-y-3">
                    {[
                        { days: 1 as Duration, label: 'Today Only', desc: 'Plan breakfast, lunch, dinner for today' },
                        { days: 3 as Duration, label: '3 Days', desc: 'Short-term meal planning' },
                        { days: 7 as Duration, label: 'Full Week', desc: 'Complete weekly meal prep' }
                    ].map(option => (
                        <button
                            key={option.days}
                            onClick={() => setDuration(option.days)}
                            className="w-full p-4 bg-dark-card border border-dark-border rounded-xl text-left flex items-center justify-between active:scale-[0.98] transition-transform"
                        >
                            <div>
                                <h3 className="font-semibold text-white mb-1">{option.label}</h3>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Meal Planning Grid
    return (
        <div className="min-h-screen bg-black pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm px-5 pt-12 pb-4 z-10 border-b border-dark-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDuration(null)}
                            className="w-10 h-10 bg-dark-card rounded-full flex items-center justify-center"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-white">
                                {duration === 1 ? "Today's Meals" : duration === 3 ? '3-Day Plan' : 'Weekly Plan'}
                            </h1>
                            <p className="text-xs text-gray-500">{getTotalMeals()} meals planned</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Days Grid */}
            <div className="px-5 py-4 space-y-6">
                {days.map(day => (
                    <div key={day.day} className="bg-dark-card border border-dark-border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-white">{day.dayName}</h3>
                                <p className="text-xs text-gray-500">{day.date}</p>
                            </div>
                        </div>

                        {/* Meal Slots */}
                        <div className="space-y-2">
                            {(Object.keys(mealTypeConfig) as MealType[]).map(mealType => {
                                const config = mealTypeConfig[mealType];
                                const Icon = config.icon;
                                const meal = day.meals[mealType];

                                return (
                                    <div
                                        key={mealType}
                                        className="flex items-center gap-3 p-3 bg-dark-elevated rounded-xl"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        {meal ? (
                                            <div className="flex-1 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-white text-sm">{meal.title}</p>
                                                    <p className="text-xs text-gray-500">{meal.totalTime} · {meal.calories}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeMeal(day.day, mealType)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSelectingMeal({ day: day.day, mealType })}
                                                className="flex-1 flex items-center justify-between text-gray-500 hover:text-white transition-colors"
                                            >
                                                <span className="text-sm">Add {config.label}</span>
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Action Bar */}
            {getTotalMeals() > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur-sm border-t border-dark-border">
                    <button
                        onClick={handleGenerateGroceryList}
                        disabled={generatingList}
                        className="w-full py-4 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {generatingList ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating List...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-5 h-5" />
                                Generate Grocery List ({getTotalMeals()} meals)
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Meal Selection Modal */}
            {selectingMeal && (
                <MealSelectionModal
                    mealType={selectingMeal.mealType}
                    onClose={() => setSelectingMeal(null)}
                    onSelect={handleSelectMeal}
                    existingMeals={getExistingMeals()}
                />
            )}

            {/* Grocery List View */}
            {showGroceryList && groceryList && (
                <GroceryListView
                    groceryList={groceryList}
                    onClose={() => setShowGroceryList(false)}
                    onShare={handleShareWhatsApp}
                />
            )}
        </div>
    );
}
