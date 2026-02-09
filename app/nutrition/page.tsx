'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Target,
    TrendingUp,
    Calendar,
    Flame,
    Activity,
    Plus,
    Settings,
    ChevronRight
} from 'lucide-react';
import {
    getDietPlan,
    getTodayDate,
    getDailyTotals,
    getWeeklyLogs,
    calculateProgress,
    getWeeklySummary
} from '@/utils/nutrition-storage';
import { DietPlan, DailyNutrition, NutritionProgress } from '@/utils/nutrition-types';
import DietSetup from '@/components/DietSetup';

export default function NutritionPage() {
    const router = useRouter();
    const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
    const [todayData, setTodayData] = useState<DailyNutrition | null>(null);
    const [progress, setProgress] = useState<NutritionProgress | null>(null);
    const [weeklyData, setWeeklyData] = useState<DailyNutrition[]>([]);
    const [showDietSetup, setShowDietSetup] = useState(false);
    const [view, setView] = useState<'today' | 'week'>('today');

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const plan = getDietPlan();
        setDietPlan(plan);

        const today = getTodayDate();
        const dailyData = getDailyTotals(today);
        setTodayData(dailyData);

        const weekly = getWeeklyLogs();
        setWeeklyData(weekly);

        if (plan) {
            const consumed = {
                calories: dailyData.totalCalories,
                protein: dailyData.totalProtein,
                carbs: dailyData.totalCarbs,
                fat: dailyData.totalFat,
                fiber: dailyData.totalFiber
            };
            const prog = calculateProgress(consumed, plan);
            setProgress(prog);
        }
    };

    // Show setup if no diet plan
    useEffect(() => {
        if (!dietPlan) {
            setShowDietSetup(true);
        }
    }, [dietPlan]);

    const CircularProgress = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
        const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-dark-border"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className={color}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-white">{Math.round(value)}</div>
                        <div className="text-xs text-gray-400">/ {max}</div>
                    </div>
                </div>
                <div className="mt-2 text-sm text-gray-400">{label}</div>
            </div>
        );
    };

    const MacroBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
        const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
        const remaining = Math.max(0, max - value);

        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-white">{label}</span>
                    <span className="text-sm text-gray-400">
                        {Math.round(value)}g / {max}g
                    </span>
                </div>
                <div className="h-3 bg-dark-border rounded-full overflow-hidden">
                    <div
                        className={`h-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                    {remaining > 0 ? `${Math.round(remaining)}g remaining` : 'Goal met!'}
                </div>
            </div>
        );
    };

    if (!dietPlan) {
        return (
            <>
                <div className="min-h-screen bg-black px-5 pt-12 pb-24 flex flex-col items-center justify-center">
                    <div className="text-center max-w-sm">
                        <div className="w-20 h-20 bg-dark-card rounded-full flex items-center justify-center mx-auto mb-6">
                            <Target className="w-10 h-10 text-gray-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Set Your Diet Goals</h1>
                        <p className="text-gray-400 mb-8">
                            Create a personalized diet plan to start tracking your nutrition
                        </p>
                        <button
                            onClick={() => setShowDietSetup(true)}
                            className="w-full py-4 bg-white text-black rounded-xl font-semibold"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
                <DietSetup
                    isOpen={showDietSetup}
                    onClose={() => router.push('/')}
                    onComplete={loadData}
                />
            </>
        );
    }

    const weeklySummary = getWeeklySummary();

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => router.back()} className="text-gray-400">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setShowDietSetup(true)}
                        className="text-gray-400 hover:text-white"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
                <h1 className="text-3xl font-bold text-white mb-1">Nutrition</h1>
                <p className="text-gray-500 text-sm">Track your daily intake</p>
            </header>

            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setView('today')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'today'
                            ? 'bg-white text-black'
                            : 'bg-dark-card text-gray-400'
                        }`}
                >
                    Today
                </button>
                <button
                    onClick={() => setView('week')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'week'
                            ? 'bg-white text-black'
                            : 'bg-dark-card text-gray-400'
                        }`}
                >
                    This Week
                </button>
            </div>

            {view === 'today' && todayData && progress && (
                <div className="space-y-6 animate-fade-in">
                    {/* Calorie Progress */}
                    <section className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <div className="flex justify-center mb-6">
                            <CircularProgress
                                value={todayData.totalCalories}
                                max={dietPlan.dailyCalories}
                                label="Calories"
                                color={progress.isOverGoal ? 'text-red-400' : 'text-white'}
                            />
                        </div>
                        {progress.isOverGoal && (
                            <div className="text-center text-sm text-red-400 mb-4">
                                ⚠️ Over daily goal by {Math.round(todayData.totalCalories - dietPlan.dailyCalories)} cal
                            </div>
                        )}
                        {!progress.isOverGoal && progress.remaining.calories > 0 && (
                            <div className="text-center text-sm text-gray-400">
                                {Math.round(progress.remaining.calories)} calories remaining
                            </div>
                        )}
                    </section>

                    {/* Macros */}
                    <section className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
                        <h2 className="text-sm font-medium text-gray-400 mb-4">Macros</h2>
                        <MacroBar
                            label="Protein"
                            value={todayData.totalProtein}
                            max={dietPlan.macros.protein}
                            color="bg-blue-500"
                        />
                        <MacroBar
                            label="Carbs"
                            value={todayData.totalCarbs}
                            max={dietPlan.macros.carbs}
                            color="bg-green-500"
                        />
                        <MacroBar
                            label="Fat"
                            value={todayData.totalFat}
                            max={dietPlan.macros.fat}
                            color="bg-yellow-500"
                        />
                    </section>

                    {/* Today's Meals */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-400 mb-3">Today's Meals</h2>
                        {todayData.meals.length === 0 ? (
                            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                                <Flame className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No meals logged yet</p>
                                <p className="text-gray-600 text-xs mt-1">Cook a recipe to start tracking</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayData.meals.map((meal) => (
                                    <div
                                        key={meal.id}
                                        className="bg-dark-card border border-dark-border rounded-xl p-4"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-medium text-white">{meal.recipeTitle}</h3>
                                                <p className="text-xs text-gray-500">{meal.mealType}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-white">
                                                    {Math.round(meal.nutrition.calories)}
                                                </div>
                                                <div className="text-xs text-gray-500">cal</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-xs text-gray-400">
                                            <span>P: {Math.round(meal.nutrition.protein)}g</span>
                                            <span>C: {Math.round(meal.nutrition.carbs)}g</span>
                                            <span>F: {Math.round(meal.nutrition.fat)}g</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {view === 'week' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Weekly Stats */}
                    <section className="bg-dark-card border border-dark-border rounded-xl p-6">
                        <h2 className="text-sm font-medium text-gray-400 mb-4">Weekly Summary</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {weeklySummary.averageCalories}
                                </div>
                                <div className="text-xs text-gray-400">Avg Calories/Day</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {weeklySummary.daysMetGoal}/7
                                </div>
                                <div className="text-xs text-gray-400">Days Met Goal</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {weeklySummary.totalMeals}
                                </div>
                                <div className="text-xs text-gray-400">Total Meals</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {weeklySummary.averageProtein}g
                                </div>
                                <div className="text-xs text-gray-400">Avg Protein</div>
                            </div>
                        </div>
                    </section>

                    {/* Daily Breakdown */}
                    <section>
                        <h2 className="text-sm font-medium text-gray-400 mb-3">Daily Breakdown</h2>
                        <div className="space-y-2">
                            {weeklyData.map((day) => {
                                const date = new Date(day.date);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                const isToday = day.date === getTodayDate();
                                const metGoal = dietPlan && day.totalCalories <= dietPlan.dailyCalories && day.totalCalories > 0;

                                return (
                                    <div
                                        key={day.date}
                                        className={`bg-dark-card border rounded-xl p-4 ${isToday ? 'border-white' : 'border-dark-border'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-500">{dayName}</div>
                                                    <div className="text-sm font-medium text-white">
                                                        {date.getDate()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {day.totalCalories > 0 ? `${Math.round(day.totalCalories)} cal` : 'No data'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {day.meals.length} meal{day.meals.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            {day.totalCalories > 0 && (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${metGoal ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {metGoal ? '✓' : '○'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}

            {/* Diet Setup Modal */}
            <DietSetup
                isOpen={showDietSetup}
                onClose={() => setShowDietSetup(false)}
                onComplete={loadData}
            />
        </div>
    );
}
