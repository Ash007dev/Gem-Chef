'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, Shuffle, MapPin, Utensils, Leaf, SlidersHorizontal, ChefHat } from 'lucide-react';
import { identifyIngredients, fileToBase64 } from '@/utils/gemini';
import PersonalizeSheet from '@/components/PersonalizeSheet';

type MealTime = 'Breakfast' | 'Brunch' | 'Lunch' | 'Snack' | 'Dinner';
type DietaryPref = 'Veg' | 'Non-Veg' | 'Both';
type CookingStyle = 'Quick & Easy' | 'Restaurant Style' | 'Healthy' | 'Comfort Food';

export default function HomePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Context state
    const [location, setLocation] = useState('Detecting...');
    const [greeting, setGreeting] = useState('');

    // Preferences
    const [mealTime, setMealTime] = useState<MealTime>('Lunch');
    const [dietary, setDietary] = useState<DietaryPref>('Both');
    const [cuisine, setCuisine] = useState('Same as Location');
    const [cookingStyle, setCookingStyle] = useState<CookingStyle>('Quick & Easy');
    const [showPersonalize, setShowPersonalize] = useState(false);

    // Ingredients
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');

    // Get time-based greeting and auto-select meal, load saved preferences
    useEffect(() => {
        // Time-based meal selection
        const hour = new Date().getHours();
        if (hour < 10) {
            setGreeting('Good Morning');
            setMealTime('Breakfast');
        } else if (hour < 12) {
            setGreeting('Good Morning');
            setMealTime('Brunch');
        } else if (hour < 15) {
            setGreeting('Good Afternoon');
            setMealTime('Lunch');
        } else if (hour < 18) {
            setGreeting('Good Evening');
            setMealTime('Snack');
        } else {
            setGreeting('Good Evening');
            setMealTime('Dinner');
        }

        // Load saved preferences
        const saved = localStorage.getItem('smartchef_preferences');
        if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.dietary) setDietary(prefs.dietary);
            if (prefs.location) setLocation(prefs.location);
        }
    }, []);

    // Get location
    useEffect(() => {
        const getLocation = async () => {
            if (typeof window === 'undefined' || !navigator.geolocation) {
                setLocation('Your City');
                return;
            }

            // Set a timeout for geolocation
            const timeoutId = setTimeout(() => {
                setLocation('Your City');
            }, 5000);

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    clearTimeout(timeoutId);
                    try {
                        const { latitude, longitude } = position.coords;
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                            {
                                headers: {
                                    'User-Agent': 'SmartChef App'
                                }
                            }
                        );
                        const data = await res.json();
                        const city = data.address?.city ||
                            data.address?.town ||
                            data.address?.village ||
                            data.address?.county ||
                            '';
                        const state = data.address?.state || '';
                        const locationStr = [city, state].filter(Boolean).join(', ') || 'Your City';
                        setLocation(locationStr);
                    } catch (err) {
                        console.error('Location error:', err);
                        setLocation('Your City');
                    }
                },
                (err) => {
                    clearTimeout(timeoutId);
                    console.error('Geolocation error:', err);
                    setLocation('Your City');
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000 // Cache for 5 minutes
                }
            );
        };

        getLocation();
    }, []);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setError('');

        try {
            const { base64, mimeType } = await fileToBase64(file);
            const result = await identifyIngredients(base64, mimeType);

            if (result.ingredients.length > 0) {
                setIngredients(result.ingredients);
            } else {
                setError('No ingredients found. Try another image.');
            }
        } catch (err) {
            setError('Failed to scan. Please try again.');
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleGetRecipes = () => {
        if (ingredients.length === 0) return;

        const params = new URLSearchParams({
            ingredients: ingredients.join(','),
            meal: mealTime,
            dietary: dietary,
            location: location,
            style: cookingStyle,
            cuisine: cuisine,
        });

        router.push(`/recipes?${params.toString()}`);
    };

    const mealTimes: MealTime[] = ['Breakfast', 'Brunch', 'Lunch', 'Snack', 'Dinner'];
    const dietaryOptions: DietaryPref[] = ['Veg', 'Non-Veg', 'Both'];

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-1">SmartChef</h1>
                <p className="text-gray-500 text-sm">
                    What would you like to cook?
                </p>
            </header>

            {/* Context Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card rounded-full">
                    <Utensils className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-white">{mealTime}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card rounded-full">
                    <Leaf className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-white">{dietary}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card rounded-full">
                    <ChefHat className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-white">{cookingStyle}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-white">{location}</span>
                </div>
                <button
                    onClick={() => setShowPersonalize(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/30 border border-indigo-800 rounded-full"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-sm text-indigo-300">Personalize</span>
                </button>
            </div>

            {/* Meal Time Selector */}
            <section className="mb-6">
                <h2 className="text-sm font-medium text-gray-400 mb-3">Meal Time</h2>
                <div className="flex flex-wrap gap-2">
                    {mealTimes.map((meal) => (
                        <button
                            key={meal}
                            onClick={() => setMealTime(meal)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mealTime === meal
                                ? 'bg-white text-black'
                                : 'bg-dark-card text-gray-400 hover:text-white'
                                }`}
                        >
                            {meal}
                        </button>
                    ))}
                </div>
            </section>

            {/* Dietary Preference */}
            <section className="mb-8">
                <h2 className="text-sm font-medium text-gray-400 mb-3">Dietary Preference</h2>
                <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => setDietary(option)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${dietary === option
                                ? 'bg-white text-black'
                                : 'bg-dark-card text-gray-400 hover:text-white'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </section>

            {/* Scan Section */}
            <section className="mb-8">
                <h2 className="text-sm font-medium text-gray-400 mb-3">Scan Ingredients</h2>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-dark-card border border-dark-border rounded-xl text-white hover:bg-dark-elevated transition-colors disabled:opacity-50"
                    >
                        <Camera className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm font-medium">
                            {isScanning ? 'Scanning...' : 'Take Photo'}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
                            input.click();
                        }}
                        disabled={isScanning}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-dark-card border border-dark-border rounded-xl text-white hover:bg-dark-elevated transition-colors disabled:opacity-50"
                    >
                        <Upload className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-sm font-medium">Upload</span>
                    </button>
                </div>

                {error && (
                    <p className="mt-3 text-red-400 text-sm">{error}</p>
                )}
            </section>

            {/* Ingredients Display */}
            {ingredients.length > 0 && (
                <section className="mb-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-medium text-gray-400">Found Ingredients</h2>
                        <button
                            onClick={() => setIngredients([])}
                            className="text-xs text-gray-500 hover:text-white"
                        >
                            Clear
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {ingredients.map((ingredient, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-full text-sm text-white"
                            >
                                {ingredient}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Demo Mode */}
            {ingredients.length === 0 && (
                <section className="mb-8">
                    <p className="text-gray-500 text-sm mb-3">Or try with sample ingredients:</p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: 'Italian', items: ['Pasta', 'Tomatoes', 'Basil', 'Garlic', 'Olive Oil'] },
                            { label: 'Indian', items: ['Rice', 'Dal', 'Onion', 'Tomato', 'Spices'] },
                            { label: 'Asian', items: ['Rice', 'Soy Sauce', 'Ginger', 'Vegetables'] },
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => setIngredients(preset.items)}
                                className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-full text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Get Recipes Button */}
            {ingredients.length > 0 && (
                <button
                    onClick={handleGetRecipes}
                    className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors animate-slide-up"
                >
                    Get Recipes
                </button>
            )}

            {/* Personalize Sheet */}
            <PersonalizeSheet
                isOpen={showPersonalize}
                onClose={() => setShowPersonalize(false)}
                onApply={(prefs) => {
                    setMealTime(prefs.mealTime);
                    setDietary(prefs.dietary);
                    setCuisine(prefs.cuisine);
                    setCookingStyle(prefs.cookingStyle);
                }}
                initialMeal={mealTime}
                initialDietary={dietary}
                initialStyle={cookingStyle}
            />
        </div>
    );
}
