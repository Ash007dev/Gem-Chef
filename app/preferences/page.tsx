'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, MapPin, Check, Plus } from 'lucide-react';

// Types
type DietaryPref = 'Veg' | 'Non-Veg' | 'Both';
type MealType = 'Breakfast' | 'Brunch' | 'Lunch' | 'Snack' | 'Dinner';
type AgeGroup = 'Baby (0-2)' | 'Toddler (2-5)' | 'Kid (5-12)' | 'Teen (13-19)' | 'Adult (20-59)' | 'Senior (60+)';

interface Preferences {
    location: string;
    dietary: DietaryPref;
    ageGroup: AgeGroup;
    cuisinePreferences: Record<MealType, string>;
    customCuisines: string[];
    dislikedDishes: string[];
    autoDeleteDays: number;
}

const DEFAULT_PREFERENCES: Preferences = {
    location: '',
    dietary: 'Both',
    ageGroup: 'Adult (20-59)',
    cuisinePreferences: {
        Breakfast: 'Same as Location',
        Brunch: 'Same as Location',
        Lunch: 'Same as Location',
        Snack: 'Same as Location',
        Dinner: 'Same as Location',
    },
    customCuisines: [],
    dislikedDishes: [],
    autoDeleteDays: 7,
};

const CUISINES = [
    'Same as Location',
    'Indian',
    'South Indian',
    'North Indian',
    'Kerala',
    'Andhra',
    'Tamil',
    'Hyderabadi',
    'Bengali',
    'Punjabi',
    'Gujarati',
    'Maharashtrian',
    'Rajasthani',
    'Chinese',
    'Italian',
    'Mexican',
    'Thai',
    'Japanese',
    'Mediterranean',
    'American',
    'Continental',
];

export default function PreferencesPage() {
    const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
    const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [loaded, setLoaded] = useState(false);

    // Load preferences from localStorage after mount (avoids hydration mismatch)
    useEffect(() => {
        const saved = localStorage.getItem('smartchef_preferences');
        if (saved) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
        } else {
            detectLocation();
        }
        setLoaded(true);
    }, []);

    // Save preferences to localStorage (only after initial load)
    useEffect(() => {
        if (!loaded) return;
        localStorage.setItem('smartchef_preferences', JSON.stringify(preferences));
    }, [preferences, loaded]);

    const detectLocation = async () => {
        setIsDetecting(true);

        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        console.log('Got coordinates:', latitude, longitude);

                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                            {
                                headers: {
                                    'User-Agent': 'SmartChef/1.0',
                                    'Accept': 'application/json'
                                }
                            }
                        );

                        if (!res.ok) {
                            throw new Error('Geocoding failed');
                        }

                        const data = await res.json();
                        console.log('Location data:', data);

                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
                        const state = data.address?.state || data.address?.county || '';
                        const locationStr = [city, state].filter(Boolean).join(', ') || 'Location detected';
                        setPreferences(prev => ({ ...prev, location: locationStr }));
                    } catch (err) {
                        console.error('Geocoding error:', err);
                        setPreferences(prev => ({ ...prev, location: 'Tap to retry' }));
                    } finally {
                        setIsDetecting(false);
                    }
                },
                (err) => {
                    console.error('Geolocation error:', err.message);
                    setPreferences(prev => ({ ...prev, location: 'Location access denied' }));
                    setIsDetecting(false);
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        } else {
            setPreferences(prev => ({ ...prev, location: 'Geolocation not supported' }));
            setIsDetecting(false);
        }
    };

    const updateDietary = (value: DietaryPref) => {
        setPreferences(prev => ({ ...prev, dietary: value }));
    };

    const updateCuisine = (meal: MealType, cuisine: string) => {
        setPreferences(prev => ({
            ...prev,
            cuisinePreferences: { ...prev.cuisinePreferences, [meal]: cuisine },
        }));
        setExpandedMeal(null);
    };

    const updateAgeGroup = (value: AgeGroup) => {
        setPreferences(prev => ({ ...prev, ageGroup: value }));
    };

    const mealTypes: MealType[] = ['Breakfast', 'Brunch', 'Lunch', 'Snack', 'Dinner'];
    const dietaryOptions: DietaryPref[] = ['Veg', 'Non-Veg', 'Both'];
    const ageGroups: AgeGroup[] = ['Baby (0-2)', 'Toddler (2-5)', 'Kid (5-12)', 'Teen (13-19)', 'Adult (20-59)', 'Senior (60+)'];

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-2xl font-semibold text-white">Settings</h1>
            </header>

            {!loaded ? (
                <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-3">
                            <div className="h-4 w-24 bg-dark-card rounded animate-pulse" />
                            <div className="h-12 w-full bg-dark-card rounded-xl animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (<>

                {/* Location Section */}
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-500 mb-3">Location</h2>
                    <button
                        onClick={detectLocation}
                        disabled={isDetecting}
                        className="w-full flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-xl"
                    >
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div className="text-left">
                                <p className="text-white text-sm">
                                    {isDetecting ? 'Detecting...' : preferences.location || 'Tap to detect'}
                                </p>
                                <p className="text-gray-500 text-xs">Used for regional cuisine suggestions</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </section>

                {/* Dietary Preference */}
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-500 mb-3">Dietary Preference</h2>
                    <div className="flex gap-2">
                        {dietaryOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => updateDietary(option)}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${preferences.dietary === option
                                    ? 'bg-white text-black'
                                    : 'bg-dark-card border border-dark-border text-gray-400'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Age Group */}
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-500 mb-3">Cooking For</h2>
                    <div className="flex flex-wrap gap-2">
                        {ageGroups.map((option) => (
                            <button
                                key={option}
                                onClick={() => updateAgeGroup(option)}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${preferences.ageGroup === option
                                    ? 'bg-white text-black'
                                    : 'bg-dark-card border border-dark-border text-gray-400'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Cuisine Preferences */}
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-500 mb-3">Cuisine by Meal</h2>
                    <div className="space-y-2">
                        {mealTypes.map((meal) => (
                            <div key={meal}>
                                <button
                                    onClick={() => setExpandedMeal(expandedMeal === meal ? null : meal)}
                                    className="w-full flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-xl"
                                >
                                    <span className="text-white text-sm">{meal}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 text-sm">
                                            {preferences.cuisinePreferences[meal]}
                                        </span>
                                        {expandedMeal === meal ? (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                        )}
                                    </div>
                                </button>

                                {/* Cuisine Options */}
                                {expandedMeal === meal && (
                                    <div className="mt-2 p-3 bg-dark-elevated border border-dark-border rounded-xl animate-fade-in">
                                        {/* Custom Input */}
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={customInput}
                                                onChange={(e) => setCustomInput(e.target.value)}
                                                placeholder="Type custom cuisine..."
                                                className="flex-1 px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm placeholder:text-gray-600"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (customInput.trim()) {
                                                        updateCuisine(meal, customInput.trim());
                                                        // Add to custom cuisines if not already in list
                                                        if (!CUISINES.includes(customInput.trim()) &&
                                                            !preferences.customCuisines.includes(customInput.trim())) {
                                                            setPreferences(prev => ({
                                                                ...prev,
                                                                customCuisines: [...prev.customCuisines, customInput.trim()]
                                                            }));
                                                        }
                                                        setCustomInput('');
                                                    }
                                                }}
                                                className="px-3 py-2 bg-white text-black rounded-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Preset + Custom Cuisines */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {[...CUISINES, ...preferences.customCuisines].map((cuisine) => (
                                                <button
                                                    key={cuisine}
                                                    onClick={() => updateCuisine(meal, cuisine)}
                                                    className={`p-3 rounded-lg text-sm text-left transition-colors ${preferences.cuisinePreferences[meal] === cuisine
                                                        ? 'bg-white text-black'
                                                        : 'bg-dark-card text-gray-300 hover:bg-dark-border'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{cuisine}</span>
                                                        {preferences.cuisinePreferences[meal] === cuisine && (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Auto Delete */}
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-500 mb-3">Data Management</h2>
                    <div className="p-4 bg-dark-card border border-dark-border rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white text-sm">Auto-delete cooklog entries</p>
                                <p className="text-gray-500 text-xs">Remove entries older than</p>
                            </div>
                            <select
                                value={preferences.autoDeleteDays}
                                onChange={(e) => setPreferences(prev => ({
                                    ...prev,
                                    autoDeleteDays: Number(e.target.value)
                                }))}
                                className="bg-dark-elevated border border-dark-border rounded-lg px-3 py-2 text-sm text-white"
                            >
                                <option value={7}>7 days</option>
                                <option value={30}>30 days</option>
                                <option value={90}>90 days</option>
                                <option value={0}>Never</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Reset */}
                <button
                    onClick={() => {
                        setPreferences(DEFAULT_PREFERENCES);
                        detectLocation();
                    }}
                    className="w-full py-3 bg-dark-card border border-dark-border rounded-xl text-gray-400 text-sm"
                >
                    Reset to Defaults
                </button>

            </>)}
        </div>
    );
}
