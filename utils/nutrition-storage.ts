/**
 * Nutrition Storage Utilities
 * Handles localStorage operations for diet plans and nutrition logs
 */

import {
    DietPlan,
    NutritionLog,
    DailyNutrition,
    NutritionInfo,
    NutritionProgress,
    WeeklySummary
} from './nutrition-types';

// Storage keys
const DIET_PLAN_KEY = 'smartchef_diet_plan';
const NUTRITION_LOGS_KEY = 'smartchef_nutrition_logs';

/**
 * Save diet plan to localStorage
 */
export function saveDietPlan(plan: DietPlan): void {
    try {
        localStorage.setItem(DIET_PLAN_KEY, JSON.stringify(plan));
    } catch (error) {
        console.error('Failed to save diet plan:', error);
    }
}

/**
 * Get diet plan from localStorage
 */
export function getDietPlan(): DietPlan | null {
    try {
        const stored = localStorage.getItem(DIET_PLAN_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as DietPlan;
    } catch (error) {
        console.error('Failed to load diet plan:', error);
        return null;
    }
}

/**
 * Delete diet plan
 */
export function deleteDietPlan(): void {
    try {
        localStorage.removeItem(DIET_PLAN_KEY);
    } catch (error) {
        console.error('Failed to delete diet plan:', error);
    }
}

/**
 * Log a nutrition entry
 */
export function logNutrition(entry: NutritionLog): void {
    try {
        console.log('[NutritionStorage] logNutrition called with:', entry);
        const logs = getNutritionLogs();
        console.log('[NutritionStorage] Current logs count:', logs.length);
        logs.push(entry);
        // Keep last 365 days of logs
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 365);
        const filtered = logs.filter(log => new Date(log.date) >= cutoffDate);
        localStorage.setItem(NUTRITION_LOGS_KEY, JSON.stringify(filtered));
        console.log('[NutritionStorage] Saved logs count:', filtered.length);
    } catch (error) {
        console.error('Failed to log nutrition:', error);
    }
}

/**
 * Get all nutrition logs, optionally filtered by date
 */
export function getNutritionLogs(date?: string): NutritionLog[] {
    try {
        const stored = localStorage.getItem(NUTRITION_LOGS_KEY);
        if (!stored) return [];
        const logs = JSON.parse(stored) as NutritionLog[];

        if (date) {
            return logs.filter(log => log.date === date);
        }
        return logs;
    } catch (error) {
        console.error('Failed to load nutrition logs:', error);
        return [];
    }
}

/**
 * Get nutrition logs for a date range
 */
export function getNutritionLogsRange(startDate: string, endDate: string): NutritionLog[] {
    try {
        const logs = getNutritionLogs();
        return logs.filter(log => log.date >= startDate && log.date <= endDate);
    } catch (error) {
        console.error('Failed to load nutrition logs range:', error);
        return [];
    }
}

/**
 * Delete a nutrition log entry
 */
export function deleteNutritionLog(id: string): void {
    try {
        const logs = getNutritionLogs();
        const filtered = logs.filter(log => log.id !== id);
        localStorage.setItem(NUTRITION_LOGS_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to delete nutrition log:', error);
    }
}

/**
 * Get daily nutrition totals for a specific date
 */
export function getDailyTotals(date: string): DailyNutrition {
    const logs = getNutritionLogs(date);

    const totals: DailyNutrition = {
        date,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        meals: logs
    };

    logs.forEach(log => {
        totals.totalCalories += log.nutrition.calories;
        totals.totalProtein += log.nutrition.protein;
        totals.totalCarbs += log.nutrition.carbs;
        totals.totalFat += log.nutrition.fat;
        totals.totalFiber += log.nutrition.fiber || 0;
    });

    return totals;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get weekly nutrition logs (last 7 days including today)
 */
export function getWeeklyLogs(): DailyNutrition[] {
    const today = new Date();
    const weekly: DailyNutrition[] = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        weekly.push(getDailyTotals(dateStr));
    }

    return weekly;
}

/**
 * Calculate progress toward diet goals
 */
export function calculateProgress(
    consumed: NutritionInfo,
    goals: DietPlan
): NutritionProgress {
    const percentages = {
        calories: goals.dailyCalories > 0 ? (consumed.calories / goals.dailyCalories) * 100 : 0,
        protein: goals.macros.protein > 0 ? (consumed.protein / goals.macros.protein) * 100 : 0,
        carbs: goals.macros.carbs > 0 ? (consumed.carbs / goals.macros.carbs) * 100 : 0,
        fat: goals.macros.fat > 0 ? (consumed.fat / goals.macros.fat) * 100 : 0
    };

    const remaining = {
        calories: Math.max(0, goals.dailyCalories - consumed.calories),
        protein: Math.max(0, goals.macros.protein - consumed.protein),
        carbs: Math.max(0, goals.macros.carbs - consumed.carbs),
        fat: Math.max(0, goals.macros.fat - consumed.fat)
    };

    return {
        consumed,
        goals,
        percentages,
        remaining,
        isOverGoal: consumed.calories > goals.dailyCalories
    };
}

/**
 * Get weekly summary statistics
 */
export function getWeeklySummary(): WeeklySummary {
    const dailyTotals = getWeeklyLogs();
    const dietPlan = getDietPlan();

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let daysMetGoal = 0;
    let totalMeals = 0;

    dailyTotals.forEach(day => {
        totalCalories += day.totalCalories;
        totalProtein += day.totalProtein;
        totalCarbs += day.totalCarbs;
        totalFat += day.totalFat;
        totalMeals += day.meals.length;

        if (dietPlan && day.totalCalories <= dietPlan.dailyCalories && day.totalCalories > 0) {
            daysMetGoal++;
        }
    });

    const daysWithData = dailyTotals.filter(d => d.meals.length > 0).length || 1;

    return {
        weekStart: dailyTotals[0].date,
        weekEnd: dailyTotals[dailyTotals.length - 1].date,
        dailyTotals,
        averageCalories: Math.round(totalCalories / daysWithData),
        averageProtein: Math.round(totalProtein / daysWithData),
        averageCarbs: Math.round(totalCarbs / daysWithData),
        averageFat: Math.round(totalFat / daysWithData),
        daysMetGoal,
        totalMeals
    };
}

/**
 * Generate a unique ID for nutrition logs
 */
export function generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear all nutrition data (for testing or reset)
 */
export function clearAllNutritionData(): void {
    try {
        localStorage.removeItem(DIET_PLAN_KEY);
        localStorage.removeItem(NUTRITION_LOGS_KEY);
    } catch (error) {
        console.error('Failed to clear nutrition data:', error);
    }
}
