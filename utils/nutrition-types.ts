/**
 * Nutrition and Diet Plan Type Definitions
 */

// Diet type options
export type DietType = 'weight-loss' | 'maintenance' | 'muscle-gain' | 'custom';

// Meal type for logging
export type MealType = 'Breakfast' | 'Brunch' | 'Lunch' | 'Snack' | 'Dinner';

/**
 * User's personal diet plan configuration
 */
export interface DietPlan {
    dailyCalories: number;
    macros: {
        protein: number;    // grams per day
        carbs: number;      // grams per day
        fat: number;        // grams per day
    };
    dietType: DietType;
    startDate: string;      // ISO date string
    isActive: boolean;
}

/**
 * Detailed nutrition information for a recipe or meal
 */
export interface NutritionInfo {
    calories: number;
    protein: number;        // grams
    carbs: number;          // grams
    fat: number;            // grams
    fiber?: number;         // grams
    sodium?: number;        // mg
    sugar?: number;         // grams
    saturatedFat?: number;  // grams
    cholesterol?: number;   // mg
}

/**
 * A single nutrition log entry (one meal/recipe cooked)
 */
export interface NutritionLog {
    id: string;
    date: string;           // YYYY-MM-DD format
    recipeId: string;
    recipeTitle: string;
    mealType: MealType;
    servings: number;       // Number of servings consumed
    nutrition: NutritionInfo;  // Total nutrition for servings consumed
    timestamp: string;      // ISO timestamp
}

/**
 * Daily nutrition totals
 */
export interface DailyNutrition {
    date: string;           // YYYY-MM-DD
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    meals: NutritionLog[];
}

/**
 * Progress tracking data
 */
export interface NutritionProgress {
    consumed: NutritionInfo;
    goals: DietPlan;
    percentages: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    remaining: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    isOverGoal: boolean;
}

/**
 * Weekly summary statistics
 */
export interface WeeklySummary {
    weekStart: string;      // YYYY-MM-DD
    weekEnd: string;        // YYYY-MM-DD
    dailyTotals: DailyNutrition[];
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    daysMetGoal: number;
    totalMeals: number;
}

/**
 * Preset diet plan templates
 */
export interface DietPreset {
    name: string;
    description: string;
    type: DietType;
    calorieMultiplier: number;  // Multiply by user's base calories
    macroRatios: {
        protein: number;    // percentage
        carbs: number;      // percentage
        fat: number;        // percentage
    };
}

/**
 * Default diet presets
 */
export const DIET_PRESETS: Record<DietType, DietPreset> = {
    'weight-loss': {
        name: 'Weight Loss',
        description: 'Calorie deficit with high protein',
        type: 'weight-loss',
        calorieMultiplier: 0.8,
        macroRatios: {
            protein: 35,
            carbs: 35,
            fat: 30
        }
    },
    'maintenance': {
        name: 'Maintenance',
        description: 'Balanced nutrition for maintaining weight',
        type: 'maintenance',
        calorieMultiplier: 1.0,
        macroRatios: {
            protein: 30,
            carbs: 40,
            fat: 30
        }
    },
    'muscle-gain': {
        name: 'Muscle Gain',
        description: 'Calorie surplus with high protein',
        type: 'muscle-gain',
        calorieMultiplier: 1.15,
        macroRatios: {
            protein: 35,
            carbs: 45,
            fat: 20
        }
    },
    'custom': {
        name: 'Custom',
        description: 'Set your own goals',
        type: 'custom',
        calorieMultiplier: 1.0,
        macroRatios: {
            protein: 30,
            carbs: 40,
            fat: 30
        }
    }
};

/**
 * Helper to calculate macros in grams from calories and percentages
 */
export function calculateMacrosFromCalories(
    totalCalories: number,
    proteinPercent: number,
    carbsPercent: number,
    fatPercent: number
): { protein: number; carbs: number; fat: number } {
    return {
        protein: Math.round((totalCalories * proteinPercent / 100) / 4),  // 4 cal/g
        carbs: Math.round((totalCalories * carbsPercent / 100) / 4),      // 4 cal/g
        fat: Math.round((totalCalories * fatPercent / 100) / 9)           // 9 cal/g
    };
}

/**
 * Helper to calculate calories from macros
 */
export function calculateCaloriesFromMacros(
    protein: number,
    carbs: number,
    fat: number
): number {
    return (protein * 4) + (carbs * 4) + (fat * 9);
}
