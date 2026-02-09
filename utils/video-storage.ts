// localStorage management for video recipes

import type { VideoRecipe, VideoRecipeCache, VideoStep } from './video-recipe-types';

const STORAGE_KEY = 'cook_along_videos';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Save extracted video recipe
export function saveVideoRecipe(recipe: VideoRecipe): void {
    try {
        const existing = getSavedVideoRecipes();
        const cache: VideoRecipeCache = {
            videoId: recipe.videoId,
            recipe,
            timestamp: Date.now(),
        };

        // Remove existing entry for this video if it exists
        const filtered = existing.filter(c => c.videoId !== recipe.videoId);

        // Add new entry at the beginning (most recent first)
        const updated = [cache, ...filtered];

        // Keep only the 50 most recent videos
        const trimmed = updated.slice(0, 50);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save video recipe:', error);
    }
}

// Get all saved video recipes
export function getSavedVideoRecipes(): VideoRecipeCache[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const recipes: VideoRecipeCache[] = JSON.parse(stored);

        // Filter out expired caches
        const now = Date.now();
        const valid = recipes.filter(cache => {
            return (now - cache.timestamp) < CACHE_DURATION;
        });

        // Update storage if we filtered anything out
        if (valid.length !== recipes.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
        }

        return valid;
    } catch (error) {
        console.error('Failed to get saved video recipes:', error);
        return [];
    }
}

// Get specific video recipe by ID
export function getVideoRecipe(videoId: string): VideoRecipe | null {
    try {
        const recipes = getSavedVideoRecipes();
        const found = recipes.find(cache => cache.videoId === videoId);
        return found ? found.recipe : null;
    } catch (error) {
        console.error('Failed to get video recipe:', error);
        return null;
    }
}

// Check if video recipe exists in cache
export function hasVideoRecipe(videoId: string): boolean {
    return getVideoRecipe(videoId) !== null;
}

// Delete video recipe
export function deleteVideoRecipe(videoId: string): void {
    try {
        const existing = getSavedVideoRecipes();
        const filtered = existing.filter(cache => cache.videoId !== videoId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Failed to delete video recipe:', error);
    }
}

// Update step timestamp (manual adjustment)
export function updateStepTimestamp(
    videoId: string,
    stepId: string,
    newTimestamp: number
): void {
    try {
        const recipe = getVideoRecipe(videoId);
        if (!recipe) return;

        const stepIndex = recipe.steps.findIndex(s => s.id === stepId);
        if (stepIndex === -1) return;

        // Update the timestamp
        recipe.steps[stepIndex].timestamp = newTimestamp;

        // Recalculate endTimestamp if needed
        if (stepIndex < recipe.steps.length - 1) {
            recipe.steps[stepIndex].endTimestamp = recipe.steps[stepIndex + 1].timestamp;
        }

        // Save updated recipe
        saveVideoRecipe(recipe);
    } catch (error) {
        console.error('Failed to update step timestamp:', error);
    }
}

// Update multiple step timestamps at once
export function updateStepTimestamps(
    videoId: string,
    updates: { stepId: string; timestamp: number }[]
): void {
    try {
        const recipe = getVideoRecipe(videoId);
        if (!recipe) return;

        updates.forEach(({ stepId, timestamp }) => {
            const stepIndex = recipe.steps.findIndex(s => s.id === stepId);
            if (stepIndex !== -1) {
                recipe.steps[stepIndex].timestamp = timestamp;

                // Recalculate endTimestamp
                if (stepIndex < recipe.steps.length - 1) {
                    recipe.steps[stepIndex].endTimestamp = recipe.steps[stepIndex + 1].timestamp;
                }
            }
        });

        saveVideoRecipe(recipe);
    } catch (error) {
        console.error('Failed to update step timestamps:', error);
    }
}

// Get recent video recipes (for display on landing page)
export function getRecentVideoRecipes(limit: number = 6): VideoRecipe[] {
    try {
        const recipes = getSavedVideoRecipes();
        return recipes.slice(0, limit).map(cache => cache.recipe);
    } catch (error) {
        console.error('Failed to get recent video recipes:', error);
        return [];
    }
}

// Clear all video recipes
export function clearAllVideoRecipes(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear video recipes:', error);
    }
}

// Export video recipe as JSON (for sharing/backup)
export function exportVideoRecipe(videoId: string): string | null {
    try {
        const recipe = getVideoRecipe(videoId);
        if (!recipe) return null;
        return JSON.stringify(recipe, null, 2);
    } catch (error) {
        console.error('Failed to export video recipe:', error);
        return null;
    }
}

// Import video recipe from JSON
export function importVideoRecipe(jsonString: string): boolean {
    try {
        const recipe: VideoRecipe = JSON.parse(jsonString);

        // Validate required fields
        if (!recipe.videoId || !recipe.title || !recipe.steps || !Array.isArray(recipe.steps)) {
            throw new Error('Invalid recipe format');
        }

        saveVideoRecipe(recipe);
        return true;
    } catch (error) {
        console.error('Failed to import video recipe:', error);
        return false;
    }
}

// Get storage usage info
export function getStorageInfo(): {
    count: number;
    oldestDate: string | null;
    newestDate: string | null;
} {
    try {
        const recipes = getSavedVideoRecipes();

        if (recipes.length === 0) {
            return { count: 0, oldestDate: null, newestDate: null };
        }

        const timestamps = recipes.map(r => r.timestamp);
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);

        return {
            count: recipes.length,
            oldestDate: new Date(oldest).toISOString(),
            newestDate: new Date(newest).toISOString(),
        };
    } catch (error) {
        console.error('Failed to get storage info:', error);
        return { count: 0, oldestDate: null, newestDate: null };
    }
}
