'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Check, Sparkles, Zap, ChefHat, Heart, Sofa, User } from 'lucide-react';

type MealTime = 'Breakfast' | 'Brunch' | 'Lunch' | 'Snack' | 'Dinner';
type DietaryPref = 'Veg' | 'Non-Veg' | 'Both';
type CookingStyle = 'Quick & Easy' | 'Restaurant Style' | 'Healthy' | 'Comfort Food';
type AgeGroup = 'Baby (0-2)' | 'Toddler (2-5)' | 'Kid (5-12)' | 'Teen (13-19)' | 'Adult (20-59)' | 'Senior (60+)';

interface PersonalizeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (prefs: {
        mealTime: MealTime;
        dietary: DietaryPref;
        cuisine: string;
        cookingStyle: CookingStyle;
        ageGroup: AgeGroup;
    }) => void;
    initialMeal?: MealTime;
    initialDietary?: DietaryPref;
    initialStyle?: CookingStyle;
    initialAgeGroup?: AgeGroup;
}

const COOKING_STYLES: { value: CookingStyle; icon: typeof Zap; description: string }[] = [
    { value: 'Quick & Easy', icon: Zap, description: 'Under 30 mins' },
    { value: 'Restaurant Style', icon: ChefHat, description: 'Chef-level dishes' },
    { value: 'Healthy', icon: Heart, description: 'Nutritious & light' },
    { value: 'Comfort Food', icon: Sofa, description: 'Homestyle favorites' },
];

export default function PersonalizeSheet({
    isOpen,
    onClose,
    onApply,
    initialMeal = 'Lunch',
    initialDietary = 'Both',
    initialStyle = 'Quick & Easy',
    initialAgeGroup = 'Adult (20-59)'
}: PersonalizeSheetProps) {
    const [mealTime, setMealTime] = useState<MealTime>(initialMeal);
    const [dietary, setDietary] = useState<DietaryPref>(initialDietary);
    const [cookingStyle, setCookingStyle] = useState<CookingStyle>(initialStyle);
    const [ageGroup, setAgeGroup] = useState<AgeGroup>(initialAgeGroup);
    const [useLocationCuisine, setUseLocationCuisine] = useState(true);
    const [customCuisine, setCustomCuisine] = useState('');

    // Load saved preferences
    useEffect(() => {
        const saved = localStorage.getItem('smartchef_preferences');
        if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.dietary) setDietary(prefs.dietary);
            if (prefs.cookingStyle) setCookingStyle(prefs.cookingStyle);
            if (prefs.ageGroup) setAgeGroup(prefs.ageGroup);
            if (prefs.cuisinePreferences?.[mealTime]) {
                const savedCuisine = prefs.cuisinePreferences[mealTime];
                if (savedCuisine === 'Same as Location') {
                    setUseLocationCuisine(true);
                } else {
                    setUseLocationCuisine(false);
                    setCustomCuisine(savedCuisine);
                }
            }
        }
    }, [mealTime]);

    const handleReset = () => {
        setMealTime('Lunch');
        setDietary('Both');
        setCookingStyle('Quick & Easy');
        setAgeGroup('Adult (20-59)');
        setUseLocationCuisine(true);
        setCustomCuisine('');
    };

    const handleApply = () => {
        const cuisine = useLocationCuisine ? 'Same as Location' : customCuisine || 'Same as Location';

        // Save to localStorage
        const saved = localStorage.getItem('smartchef_preferences');
        const prefs = saved ? JSON.parse(saved) : {};
        prefs.dietary = dietary;
        prefs.cookingStyle = cookingStyle;
        prefs.ageGroup = ageGroup;
        prefs.cuisinePreferences = prefs.cuisinePreferences || {};
        prefs.cuisinePreferences[mealTime] = cuisine;
        localStorage.setItem('smartchef_preferences', JSON.stringify(prefs));

        onApply({ mealTime, dietary, cuisine, cookingStyle, ageGroup });
        onClose();
    };

    if (!isOpen) return null;

    const mealOptions: MealTime[] = ['Breakfast', 'Brunch', 'Lunch', 'Snack', 'Dinner'];
    const dietaryOptions: DietaryPref[] = ['Veg', 'Non-Veg', 'Both'];

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-lg bg-[#0a0a0f] rounded-t-3xl p-6 pb-10 animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-white">Personalize</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1 text-gray-400 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button onClick={onClose}>
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                    Customize your meal preferences to get the best dishes for you.
                </p>

                {/* Cooking Style */}
                <div className="mb-6">
                    <h3 className="text-white font-medium mb-3">Cooking Style</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {COOKING_STYLES.map((style) => {
                            const Icon = style.icon;
                            return (
                                <button
                                    key={style.value}
                                    onClick={() => setCookingStyle(style.value)}
                                    className={`p-3 rounded-xl text-left transition-colors ${cookingStyle === style.value
                                            ? 'bg-indigo-900/50 border border-indigo-600'
                                            : 'bg-gray-800/50 border border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={`w-4 h-4 ${cookingStyle === style.value ? 'text-indigo-400' : 'text-gray-400'
                                            }`} />
                                        <span className={`text-sm font-medium ${cookingStyle === style.value ? 'text-white' : 'text-gray-300'
                                            }`}>
                                            {style.value}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{style.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Meal Time */}
                <div className="mb-6">
                    <h3 className="text-white font-medium mb-3">Meal Time</h3>
                    <div className="flex flex-wrap gap-2">
                        {mealOptions.map((meal) => (
                            <button
                                key={meal}
                                onClick={() => setMealTime(meal)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mealTime === meal
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                                    }`}
                            >
                                {mealTime === meal && <Check className="w-3 h-3 inline mr-1" />}
                                {meal}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dietary Preference */}
                <div className="mb-6">
                    <h3 className="text-white font-medium mb-3">Dietary Preference</h3>
                    <div className="flex gap-2">
                        {dietaryOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => setDietary(option)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${dietary === option
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                                    }`}
                            >
                                {dietary === option && <Check className="w-3 h-3 inline mr-1" />}
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Age Group */}
                <div className="mb-6">
                    <h3 className="text-white font-medium mb-2">Cooking For</h3>
                    <p className="text-gray-500 text-xs mb-3">Recipes will be adapted for this age group</p>
                    <div className="flex flex-wrap gap-2">
                        {(['Baby (0-2)', 'Toddler (2-5)', 'Kid (5-12)', 'Teen (13-19)', 'Adult (20-59)', 'Senior (60+)'] as AgeGroup[]).map((option) => (
                            <button
                                key={option}
                                onClick={() => setAgeGroup(option)}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${ageGroup === option
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                                    }`}
                            >
                                {ageGroup === option && <User className="w-3 h-3 inline mr-1" />}
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cuisine for Meal */}
                <div className="mb-6">
                    <h3 className="text-white font-medium mb-3">Cuisine for {mealTime}</h3>

                    {/* Location Toggle */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-300">Same as my Location</span>
                        <button
                            onClick={() => setUseLocationCuisine(!useLocationCuisine)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${useLocationCuisine ? 'bg-indigo-600' : 'bg-gray-700'
                                }`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${useLocationCuisine ? 'right-1' : 'left-1'
                                }`} />
                        </button>
                    </div>

                    {/* Custom Cuisine Input */}
                    <input
                        type="text"
                        value={customCuisine}
                        onChange={(e) => {
                            setCustomCuisine(e.target.value);
                            if (e.target.value) setUseLocationCuisine(false);
                        }}
                        placeholder="Custom Cuisine (e.g., Kerala, Andhra, Chettinad)"
                        disabled={useLocationCuisine}
                        className={`w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder:text-gray-600 text-sm ${useLocationCuisine ? 'opacity-50' : ''
                            }`}
                    />
                </div>

                {/* Apply Button */}
                <button
                    onClick={handleApply}
                    className="w-full py-4 bg-indigo-900/50 hover:bg-indigo-900/70 border border-indigo-800 rounded-2xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Sparkles className="w-4 h-4" />
                    Rethink Dishes
                </button>
            </div>
        </div>
    );
}
