// Type definitions for What's Cooking Worldwide feature

export type DishCategory = 'traditional' | 'seasonal' | 'trending' | 'popular';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Region = 'Asia' | 'Europe' | 'Americas' | 'Africa' | 'Oceania';

export interface CountryDish {
    id: string;
    title: string;
    country: string;
    countryCode: string; // ISO code for flag emoji
    category: DishCategory;
    description: string;
    difficulty: Difficulty;
    prepTime: string;
    cookTime: string;
    tags: string[];
    seasonalNote?: string; // e.g., "Perfect for February"
}

export interface CountryInfo {
    name: string;
    code: string; // ISO 3166-1 alpha-2 code
    flag: string; // Emoji flag
    region: Region;
    cuisine: string;
    description: string; // Brief cuisine description
    popular?: boolean; // Highlight popular countries
}

export interface WorldwideDishesCache {
    countryCode: string;
    month: number;
    year: number;
    dishes: CountryDish[];
    timestamp: number;
}

// Helper to get cache key
export function getCacheKey(countryCode: string, month: number, year: number): string {
    return `worldwide_${countryCode}_${month}_${year}`;
}

// Helper to check if cache is valid (7 days)
export function isCacheValid(timestamp: number): boolean {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < SEVEN_DAYS;
}

// Helper to get current month/year
export function getCurrentMonthYear(): { month: number; year: number } {
    const now = new Date();
    return {
        month: now.getMonth() + 1, // 1-12
        year: now.getFullYear()
    };
}
