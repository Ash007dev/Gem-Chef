'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera,
    BookOpen,
    Settings,
    ChefHat,
    MapPin,
    Sparkles,
    Clock,
    Flame,
    ArrowRight,
    Leaf,
    Utensils,
    ImageIcon,
    TrendingUp,
    Zap,
    Timer,
    CookingPot,
    Calendar,
    NotebookPen,
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const [greeting, setGreeting] = useState('');
    const [mealSuggestion, setMealSuggestion] = useState('');
    const [location, setLocation] = useState('');
    const [dietary, setDietary] = useState('');
    const [recentCount, setRecentCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Time-based greeting & meal suggestion
        const hour = new Date().getHours();
        if (hour < 6) {
            setGreeting('Late Night');
            setMealSuggestion('midnight snack');
        } else if (hour < 10) {
            setGreeting('Good Morning');
            setMealSuggestion('breakfast');
        } else if (hour < 12) {
            setGreeting('Good Morning');
            setMealSuggestion('brunch');
        } else if (hour < 15) {
            setGreeting('Good Afternoon');
            setMealSuggestion('lunch');
        } else if (hour < 18) {
            setGreeting('Good Evening');
            setMealSuggestion('evening snack');
        } else {
            setGreeting('Good Evening');
            setMealSuggestion('dinner');
        }

        // Load saved preferences
        const saved = localStorage.getItem('smartchef_preferences');
        if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.location) setLocation(prefs.location);
            if (prefs.dietary) setDietary(prefs.dietary);
        }

        // Count recent cooklog items
        const cooklog = localStorage.getItem('cooklog');
        if (cooklog) {
            const items = JSON.parse(cooklog);
            setRecentCount(items.length);
        }
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black px-5 pt-14 pb-28">
            {/* Hero */}
            <header className="mb-10 animate-fade-in">
                <p className="text-gray-500 text-sm mb-1">{greeting}</p>
                <h1 className="text-[2rem] font-bold text-white leading-tight mb-3">
                    What's cooking<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
                        today?
                    </span>
                </h1>
                {location && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-dark-card border border-dark-border rounded-full">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">{location}</span>
                    </div>
                )}
            </header>

            {/* Primary CTA – Scan */}
            <section className="mb-6 animate-slide-up">
                <button
                    onClick={() => router.push('/scan')}
                    className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-600/20 border border-orange-500/20 p-6 text-left group active:scale-[0.98] transition-transform"
                >
                    {/* Glow */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors" />

                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-5 h-5 text-orange-400" />
                                <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
                                    Scan & Cook
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-1">
                                Scan your ingredients
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Snap a photo and get personalized {mealSuggestion} recipes
                            </p>
                        </div>
                        <div className="mt-1 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ArrowRight className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </button>
            </section>

            {/* Info Chips */}
            {dietary && (
                <div className="flex gap-2 mb-8 animate-fade-in">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full">
                        <Leaf className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-gray-300">{dietary}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full">
                        <Utensils className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-300 capitalize">{mealSuggestion}</span>
                    </div>
                </div>
            )}

            {/* Quick Cook - Time Filter */}
            <section className="mb-8 animate-fade-in">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Quick Cook
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                    How much time do you have?
                </p>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { mins: 15, label: '15 min', Icon: Zap, color: 'text-yellow-400' },
                        { mins: 30, label: '30 min', Icon: Timer, color: 'text-orange-400' },
                        { mins: 45, label: '45 min', Icon: CookingPot, color: 'text-amber-400' },
                        { mins: 60, label: '1 hour', Icon: ChefHat, color: 'text-red-400' },
                    ].map((preset) => (
                        <button
                            key={preset.mins}
                            onClick={() => router.push(`/scan?maxTime=${preset.mins}`)}
                            className="bg-dark-card border border-dark-border rounded-xl p-3 text-center hover:bg-dark-elevated hover:border-orange-500/30 active:scale-[0.97] transition-all group"
                        >
                            <div className="flex justify-center mb-1">
                                <preset.Icon className={`w-5 h-5 ${preset.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <span className="text-white text-sm font-medium">
                                {preset.label}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Feature Grid */}
            <section className="mb-8">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Explore
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {/* Cooklog */}
                    <button
                        onClick={() => router.push('/cooklog')}
                        className="bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:bg-dark-elevated active:scale-[0.97] transition-all"
                    >
                        <BookOpen className="w-5 h-5 text-blue-400 mb-3" />
                        <h4 className="text-white text-sm font-medium mb-0.5">Cooklog</h4>
                        <p className="text-gray-500 text-xs">
                            {recentCount > 0
                                ? `${recentCount} dish${recentCount > 1 ? 'es' : ''} cooked`
                                : 'Your cooking history'}
                        </p>
                    </button>

                    {/* Preferences */}
                    <button
                        onClick={() => router.push('/preferences')}
                        className="bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:bg-dark-elevated active:scale-[0.97] transition-all"
                    >
                        <Settings className="w-5 h-5 text-gray-400 mb-3" />
                        <h4 className="text-white text-sm font-medium mb-0.5">Settings</h4>
                        <p className="text-gray-500 text-xs">Diet, cuisine & more</p>
                    </button>

                    {/* Plate to Recipe */}
                    <button
                        onClick={() => router.push('/plate-to-recipe')}
                        className="bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:bg-dark-elevated active:scale-[0.97] transition-all"
                    >
                        <ImageIcon className="w-5 h-5 text-orange-400 mb-3" />
                        <h4 className="text-white text-sm font-medium mb-0.5">Plate to Recipe</h4>
                        <p className="text-gray-500 text-xs">Photo to full recipe</p>
                    </button>

                    {/* My Recipes */}
                    <button
                        onClick={() => router.push('/my-recipes')}
                        className="bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:bg-dark-elevated active:scale-[0.97] transition-all"
                    >
                        <NotebookPen className="w-5 h-5 text-amber-400 mb-3" />
                        <h4 className="text-white text-sm font-medium mb-0.5">My Recipes</h4>
                        <p className="text-gray-500 text-xs">Your personal collection</p>
                    </button>

                    {/* Analytics */}
                    <button
                        onClick={() => router.push('/analytics')}
                        className="bg-dark-card border border-dark-border rounded-xl p-4 text-left hover:bg-dark-elevated active:scale-[0.97] transition-all"
                    >
                        <TrendingUp className="w-5 h-5 text-green-400 mb-3" />
                        <h4 className="text-white text-sm font-medium mb-0.5">Analytics</h4>
                        <p className="text-gray-500 text-xs">Track your progress</p>
                    </button>

                    {/* Meal Planner */}
                    <button
                        onClick={() => router.push('/meal-planner')}
                        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-left hover:from-purple-500/30 hover:to-pink-500/30 active:scale-[0.97] transition-all col-span-2"
                    >
                        <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-purple-400" />
                            <div>
                                <h4 className="text-white text-sm font-medium mb-0.5">Meal Planner & Grocery List</h4>
                                <p className="text-gray-400 text-xs">Plan meals for the week, auto-generate shopping list</p>
                            </div>
                        </div>
                    </button>
                </div>
            </section>

            {/* How it Works */}
            <section className="animate-fade-in">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                    How Gem Chef works
                </h3>
                <div className="space-y-3">
                    {[
                        {
                            icon: Camera,
                            color: 'text-orange-400',
                            bg: 'bg-orange-400/10',
                            title: 'Scan',
                            desc: 'Take a photo of your available ingredients',
                        },
                        {
                            icon: Sparkles,
                            color: 'text-purple-400',
                            bg: 'bg-purple-400/10',
                            title: 'Generate',
                            desc: 'AI creates recipes matching your preferences',
                        },
                        {
                            icon: Flame,
                            color: 'text-pink-400',
                            bg: 'bg-pink-400/10',
                            title: 'Cook',
                            desc: 'Step-by-step guided cooking with live assist',
                        },
                        {
                            icon: Clock,
                            color: 'text-blue-400',
                            bg: 'bg-blue-400/10',
                            title: 'Track',
                            desc: 'Your cooklog keeps a record of every dish',
                        },
                    ].map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.title}
                                className="flex items-center gap-4 p-3 bg-dark-card/50 border border-dark-border rounded-xl"
                            >
                                <div className={`w-10 h-10 ${step.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-5 h-5 ${step.color}`} />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">
                                        <span className="text-gray-500 mr-1.5">{i + 1}.</span>
                                        {step.title}
                                    </p>
                                    <p className="text-gray-500 text-xs">{step.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
