'use client';

import { useState, useEffect } from 'react';
import { X, Target, TrendingDown, Activity, Dumbbell, ChevronRight } from 'lucide-react';
import {
    DietPlan,
    DietType,
    DIET_PRESETS,
    calculateMacrosFromCalories,
    calculateCaloriesFromMacros
} from '@/utils/nutrition-types';
import { saveDietPlan, getDietPlan } from '@/utils/nutrition-storage';

interface DietSetupProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

export default function DietSetup({ isOpen, onClose, onComplete }: DietSetupProps) {
    const [step, setStep] = useState<'type' | 'goals' | 'macros'>('type');
    const [dietType, setDietType] = useState<DietType>('maintenance');
    const [dailyCalories, setDailyCalories] = useState(2000);
    const [customMacros, setCustomMacros] = useState({
        protein: 30,
        carbs: 40,
        fat: 30
    });

    // Load existing diet plan
    useEffect(() => {
        if (isOpen) {
            const existing = getDietPlan();
            if (existing) {
                setDietType(existing.dietType);
                setDailyCalories(existing.dailyCalories);
                const totalCals = calculateCaloriesFromMacros(
                    existing.macros.protein,
                    existing.macros.carbs,
                    existing.macros.fat
                );
                if (totalCals > 0) {
                    setCustomMacros({
                        protein: Math.round((existing.macros.protein * 4 / totalCals) * 100),
                        carbs: Math.round((existing.macros.carbs * 4 / totalCals) * 100),
                        fat: Math.round((existing.macros.fat * 9 / totalCals) * 100)
                    });
                }
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        const preset = DIET_PRESETS[dietType];
        const macroPercentages = dietType === 'custom' ? customMacros : preset.macroRatios;

        const macrosInGrams = calculateMacrosFromCalories(
            dailyCalories,
            macroPercentages.protein,
            macroPercentages.carbs,
            macroPercentages.fat
        );

        const plan: DietPlan = {
            dailyCalories,
            macros: macrosInGrams,
            dietType,
            startDate: new Date().toISOString(),
            isActive: true
        };

        saveDietPlan(plan);
        onComplete?.();
        onClose();
    };

    const adjustMacro = (macro: 'protein' | 'carbs' | 'fat', delta: number) => {
        const newValue = Math.max(5, Math.min(70, customMacros[macro] + delta));
        const total = customMacros.protein + customMacros.carbs + customMacros.fat;
        const diff = newValue - customMacros[macro];

        // Distribute the difference to other macros
        const others = Object.keys(customMacros).filter(k => k !== macro) as ('protein' | 'carbs' | 'fat')[];
        const adjustment = -diff / others.length;

        setCustomMacros({
            ...customMacros,
            [macro]: newValue,
            [others[0]]: Math.max(5, customMacros[others[0]] + adjustment),
            [others[1]]: Math.max(5, customMacros[others[1]] + adjustment)
        });
    };

    if (!isOpen) return null;

    const macroPercentages = dietType === 'custom' ? customMacros : DIET_PRESETS[dietType].macroRatios;
    const macrosInGrams = calculateMacrosFromCalories(
        dailyCalories,
        macroPercentages.protein,
        macroPercentages.carbs,
        macroPercentages.fat
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-dark-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border-t sm:border border-dark-border max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Set Up Your Diet Plan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step 1: Diet Type */}
                    {step === 'type' && (
                        <div className="space-y-4 animate-fade-in">
                            <p className="text-gray-400 text-sm mb-6">
                                Choose your primary goal to get started
                            </p>

                            <div className="space-y-3">
                                {(Object.keys(DIET_PRESETS) as DietType[]).map((type) => {
                                    const preset = DIET_PRESETS[type];
                                    const icons = {
                                        'weight-loss': TrendingDown,
                                        'maintenance': Activity,
                                        'muscle-gain': Dumbbell,
                                        'custom': Target
                                    };
                                    const Icon = icons[type];

                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setDietType(type)}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${dietType === type
                                                    ? 'border-white bg-white/5'
                                                    : 'border-dark-border bg-dark-elevated hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${dietType === type ? 'bg-white text-black' : 'bg-dark-card text-gray-400'
                                                    }`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white">{preset.name}</h3>
                                                    <p className="text-sm text-gray-400">{preset.description}</p>
                                                </div>
                                                <ChevronRight className={`w-5 h-5 ${dietType === type ? 'text-white' : 'text-gray-600'
                                                    }`} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setStep('goals')}
                                className="w-full mt-6 py-4 bg-white text-black rounded-xl font-semibold"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {/* Step 2: Calorie Goals */}
                    {step === 'goals' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Daily Calorie Goal
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setDailyCalories(Math.max(1200, dailyCalories - 100))}
                                        className="px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white font-semibold"
                                    >
                                        -100
                                    </button>
                                    <div className="flex-1 text-center">
                                        <div className="text-4xl font-bold text-white">{dailyCalories}</div>
                                        <div className="text-sm text-gray-400">calories/day</div>
                                    </div>
                                    <button
                                        onClick={() => setDailyCalories(Math.min(5000, dailyCalories + 100))}
                                        className="px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white font-semibold"
                                    >
                                        +100
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min="1200"
                                    max="5000"
                                    step="50"
                                    value={dailyCalories}
                                    onChange={(e) => setDailyCalories(Number(e.target.value))}
                                    className="w-full mt-4"
                                />
                            </div>

                            {/* Macro Preview */}
                            <div className="bg-dark-elevated border border-dark-border rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Macro Breakdown</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Protein</span>
                                        <span className="text-white font-medium">{macrosInGrams.protein}g ({macroPercentages.protein}%)</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Carbs</span>
                                        <span className="text-white font-medium">{macrosInGrams.carbs}g ({macroPercentages.carbs}%)</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Fat</span>
                                        <span className="text-white font-medium">{macrosInGrams.fat}g ({macroPercentages.fat}%)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('type')}
                                    className="flex-1 py-4 bg-dark-elevated border border-dark-border rounded-xl text-white font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => dietType === 'custom' ? setStep('macros') : handleSave()}
                                    className="flex-1 py-4 bg-white text-black rounded-xl font-semibold"
                                >
                                    {dietType === 'custom' ? 'Customize Macros' : 'Save Plan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Custom Macros (only for custom diet) */}
                    {step === 'macros' && dietType === 'custom' && (
                        <div className="space-y-6 animate-fade-in">
                            <p className="text-gray-400 text-sm">
                                Adjust your macro percentages. Total should equal 100%.
                            </p>

                            {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                                <div key={macro}>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-white capitalize">{macro}</label>
                                        <span className="text-sm text-gray-400">
                                            {customMacros[macro]}% ({macrosInGrams[macro]}g)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => adjustMacro(macro, -5)}
                                            className="px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white"
                                        >
                                            -5
                                        </button>
                                        <input
                                            type="range"
                                            min="5"
                                            max="70"
                                            value={customMacros[macro]}
                                            onChange={(e) => adjustMacro(macro, Number(e.target.value) - customMacros[macro])}
                                            className="flex-1"
                                        />
                                        <button
                                            onClick={() => adjustMacro(macro, 5)}
                                            className="px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-white"
                                        >
                                            +5
                                        </button>
                                    </div>
                                    <div className="mt-2 h-2 bg-dark-elevated rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all"
                                            style={{ width: `${customMacros[macro]}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="bg-dark-elevated border border-dark-border rounded-xl p-4">
                                <div className="text-sm text-gray-400">Total: {customMacros.protein + customMacros.carbs + customMacros.fat}%</div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('goals')}
                                    className="flex-1 py-4 bg-dark-elevated border border-dark-border rounded-xl text-white font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-4 bg-white text-black rounded-xl font-semibold"
                                >
                                    Save Plan
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
