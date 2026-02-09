'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ChefHat, Flame, Clock, Trophy, TrendingUp,
    Calendar, Utensils, Star, Award, Target, Zap
} from 'lucide-react';
import { Recipe } from '@/utils/gemini';

interface CookedRecipe extends Recipe {
    cookedAt: string;
}

interface AnalyticsData {
    totalDishes: number;
    totalTimeMinutes: number;
    cuisineDistribution: Record<string, number>;
    weeklyCount: number;
    monthlyCount: number;
    currentStreak: number;
    longestStreak: number;
    skillLevel: string;
    skillProgress: number;
    recentActivity: { date: string; count: number }[];
}

const SKILL_LEVELS = [
    { name: 'Kitchen Newbie', minDishes: 0, icon: '🍳' },
    { name: 'Home Cook', minDishes: 5, icon: '👨‍🍳' },
    { name: 'Aspiring Chef', minDishes: 15, icon: '🔪' },
    { name: 'Skilled Cook', minDishes: 30, icon: '⭐' },
    { name: 'Master Chef', minDishes: 50, icon: '👑' },
    { name: 'Culinary Legend', minDishes: 100, icon: '🏆' },
];

export default function AnalyticsPage() {
    const router = useRouter();
    const [cooklog, setCooklog] = useState<CookedRecipe[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

    useEffect(() => {
        const saved = localStorage.getItem('cooklog');
        if (saved) {
            setCooklog(JSON.parse(saved));
        }
    }, []);

    const analytics = useMemo((): AnalyticsData => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Filter by time range
        const filteredLog = cooklog.filter(r => {
            const date = new Date(r.cookedAt);
            if (timeRange === 'week') return date >= oneWeekAgo;
            if (timeRange === 'month') return date >= oneMonthAgo;
            return true;
        });

        // Total dishes
        const totalDishes = filteredLog.length;

        // Total time (parse from strings like "30 min" or "1 hr 15 min")
        const totalTimeMinutes = filteredLog.reduce((acc, r) => {
            const timeStr = r.totalTime || r.cookTime || '0';
            let mins = 0;
            const hrMatch = timeStr.match(/(\d+)\s*hr/);
            const minMatch = timeStr.match(/(\d+)\s*min/);
            if (hrMatch) mins += parseInt(hrMatch[1]) * 60;
            if (minMatch) mins += parseInt(minMatch[1]);
            return acc + mins;
        }, 0);

        // Cuisine distribution (extract from recipe title/description or use default)
        const cuisineDistribution: Record<string, number> = {};
        const cuisineKeywords: Record<string, string[]> = {
            'Indian': ['curry', 'masala', 'paneer', 'dal', 'biryani', 'roti', 'naan', 'tikka', 'samosa', 'dosa', 'idli'],
            'Italian': ['pasta', 'pizza', 'risotto', 'lasagna', 'spaghetti', 'penne', 'bruschetta'],
            'Chinese': ['noodles', 'fried rice', 'manchurian', 'chow', 'dim sum', 'wok'],
            'Mexican': ['taco', 'burrito', 'quesadilla', 'nachos', 'enchilada'],
            'American': ['burger', 'sandwich', 'fries', 'hot dog', 'mac and cheese'],
            'Japanese': ['sushi', 'ramen', 'teriyaki', 'tempura', 'miso'],
            'Thai': ['pad thai', 'green curry', 'tom yum', 'satay'],
        };

        filteredLog.forEach(recipe => {
            const text = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
            let found = false;
            for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
                if (keywords.some(kw => text.includes(kw))) {
                    cuisineDistribution[cuisine] = (cuisineDistribution[cuisine] || 0) + 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                cuisineDistribution['Other'] = (cuisineDistribution['Other'] || 0) + 1;
            }
        });

        // Weekly and monthly counts (from all data)
        const weeklyCount = cooklog.filter(r => new Date(r.cookedAt) >= oneWeekAgo).length;
        const monthlyCount = cooklog.filter(r => new Date(r.cookedAt) >= oneMonthAgo).length;

        // Streak calculation
        const sortedDates = Array.from(new Set(cooklog.map(r =>
            new Date(r.cookedAt).toDateString()
        ))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
            for (let i = 0; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i]);
                const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

                if (currentDate.toDateString() === expectedDate.toDateString() ||
                    (i === 0 && currentDate.toDateString() === yesterday)) {
                    tempStreak++;
                } else {
                    break;
                }
            }
            currentStreak = tempStreak;
        }

        // Calculate longest streak
        tempStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const curr = new Date(sortedDates[i]);
            const next = new Date(sortedDates[i + 1]);
            const diff = curr.getTime() - next.getTime();
            if (diff <= 24 * 60 * 60 * 1000 + 1000) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Skill level
        const totalAllTime = cooklog.length;
        let skillLevel = SKILL_LEVELS[0];
        let nextLevel = SKILL_LEVELS[1];
        for (let i = SKILL_LEVELS.length - 1; i >= 0; i--) {
            if (totalAllTime >= SKILL_LEVELS[i].minDishes) {
                skillLevel = SKILL_LEVELS[i];
                nextLevel = SKILL_LEVELS[i + 1] || SKILL_LEVELS[i];
                break;
            }
        }
        const skillProgress = nextLevel.minDishes > skillLevel.minDishes
            ? ((totalAllTime - skillLevel.minDishes) / (nextLevel.minDishes - skillLevel.minDishes)) * 100
            : 100;

        // Recent activity (last 7 days)
        const recentActivity: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toDateString();
            const count = cooklog.filter(r => new Date(r.cookedAt).toDateString() === dateStr).length;
            recentActivity.push({
                date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
                count
            });
        }

        return {
            totalDishes,
            totalTimeMinutes,
            cuisineDistribution,
            weeklyCount,
            monthlyCount,
            currentStreak,
            longestStreak: Math.max(longestStreak, currentStreak),
            skillLevel: skillLevel.name,
            skillProgress: Math.min(100, skillProgress),
            recentActivity
        };
    }, [cooklog, timeRange]);

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };

    const getSkillIcon = (name: string) => {
        return SKILL_LEVELS.find(s => s.name === name)?.icon || '🍳';
    };

    const topCuisines = Object.entries(analytics.cuisineDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxActivity = Math.max(...analytics.recentActivity.map(a => a.count), 1);

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">Back</span>
                </button>
                <h1 className="text-2xl font-semibold text-white mb-2">Cooking Analytics</h1>
                <p className="text-gray-500 text-sm">Track your culinary journey</p>
            </header>

            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
                {(['week', 'month', 'all'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                            ? 'bg-white text-black'
                            : 'bg-dark-card border border-dark-border text-gray-400'
                            }`}
                    >
                        {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
                    </button>
                ))}
            </div>

            {/* Skill Level Card */}
            <section className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-4">
                    <div className="text-4xl">{getSkillIcon(analytics.skillLevel)}</div>
                    <div className="flex-1">
                        <p className="text-amber-400 text-xs font-medium mb-1">YOUR RANK</p>
                        <h2 className="text-white text-xl font-semibold">{analytics.skillLevel}</h2>
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{cooklog.length} dishes cooked</span>
                                <span>{Math.round(analytics.skillProgress)}%</span>
                            </div>
                            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
                                    style={{ width: `${analytics.skillProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <StatCard
                    icon={<ChefHat className="w-5 h-5" />}
                    iconColor="text-purple-400"
                    bgColor="bg-purple-500/10"
                    label="Dishes Cooked"
                    value={analytics.totalDishes.toString()}
                />
                <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    iconColor="text-blue-400"
                    bgColor="bg-blue-500/10"
                    label="Time Cooking"
                    value={formatTime(analytics.totalTimeMinutes)}
                />
                <StatCard
                    icon={<Flame className="w-5 h-5" />}
                    iconColor="text-orange-400"
                    bgColor="bg-orange-500/10"
                    label="Current Streak"
                    value={`${analytics.currentStreak} days`}
                />
                <StatCard
                    icon={<Trophy className="w-5 h-5" />}
                    iconColor="text-yellow-400"
                    bgColor="bg-yellow-500/10"
                    label="Best Streak"
                    value={`${analytics.longestStreak} days`}
                />
            </div>

            {/* Weekly Activity Chart */}
            <section className="bg-dark-card border border-dark-border rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-medium">Weekly Activity</h3>
                </div>
                <div className="flex items-end justify-between gap-2 h-24">
                    {analytics.recentActivity.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div
                                className="w-full bg-green-500/20 rounded-t-lg transition-all hover:bg-green-500/30"
                                style={{
                                    height: day.count > 0 ? `${(day.count / maxActivity) * 80}px` : '4px',
                                    minHeight: '4px'
                                }}
                            >
                                {day.count > 0 && (
                                    <div className="w-full h-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg" />
                                )}
                            </div>
                            <span className="text-xs text-gray-500">{day.date}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Cuisine Distribution */}
            {topCuisines.length > 0 && (
                <section className="bg-dark-card border border-dark-border rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Utensils className="w-5 h-5 text-pink-400" />
                        <h3 className="text-white font-medium">Cuisine Explorer</h3>
                    </div>
                    <div className="space-y-3">
                        {topCuisines.map(([cuisine, count], i) => {
                            const percentage = (count / analytics.totalDishes) * 100;
                            const colors = [
                                'from-purple-500 to-purple-400',
                                'from-blue-500 to-blue-400',
                                'from-green-500 to-green-400',
                                'from-orange-500 to-orange-400',
                                'from-pink-500 to-pink-400',
                            ];
                            return (
                                <div key={cuisine}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white">{cuisine}</span>
                                        <span className="text-gray-400">{count} dishes</span>
                                    </div>
                                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {topCuisines.length > 0 && (
                        <p className="text-gray-500 text-xs mt-4">
                            You've explored {Object.keys(analytics.cuisineDistribution).length} different cuisines!
                        </p>
                    )}
                </section>
            )}

            {/* Quick Stats */}
            <section className="bg-dark-card border border-dark-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-medium">Quick Stats</h3>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">This Week</span>
                        <span className="text-white font-medium">{analytics.weeklyCount} dishes</span>
                    </div>
                    <div className="h-px bg-dark-border" />
                    <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">This Month</span>
                        <span className="text-white font-medium">{analytics.monthlyCount} dishes</span>
                    </div>
                    <div className="h-px bg-dark-border" />
                    <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">All Time</span>
                        <span className="text-white font-medium">{cooklog.length} dishes</span>
                    </div>
                </div>
            </section>

            {/* Empty State */}
            {cooklog.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-dark-card rounded-xl flex items-center justify-center mb-5">
                        <ChefHat className="w-7 h-7 text-gray-600" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-medium text-white mb-1">No Cooking Data Yet</h2>
                    <p className="text-gray-500 text-sm text-center">
                        Complete your first recipe to start tracking your progress!
                    </p>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon,
    iconColor,
    bgColor,
    label,
    value
}: {
    icon: React.ReactNode;
    iconColor: string;
    bgColor: string;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center mb-3`}>
                <span className={iconColor}>{icon}</span>
            </div>
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className="text-white text-lg font-semibold">{value}</p>
        </div>
    );
}
