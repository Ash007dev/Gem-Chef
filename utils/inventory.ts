// Enhanced Inventory Management Utilities for GemChef
// All data stored locally in localStorage

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category: 'Produce' | 'Dairy' | 'Proteins' | 'Pantry' | 'Spices' | 'Beverages' | 'Other';
    expiryDate?: string; // ISO date string
    addedAt: string; // ISO date string
}

export interface UsageRecord {
    itemName: string;
    quantity: number;
    date: string; // ISO date string
    reason: 'manual' | 'recipe'; // manual adjustment or recipe cooking
}

export interface ScannedItem {
    name: string;
    quantity: string;
    category?: InventoryItem['category'];
    expiryDate?: string;
}

const STORAGE_KEY = 'smartchef_inventory';
const USAGE_HISTORY_KEY = 'smartchef_usage_history';

// =============================================================================
// SHELF LIFE DATABASE - AI-suggested expiry dates by item type
// =============================================================================

const SHELF_LIFE_DAYS: Record<string, number> = {
    // Produce - Fresh vegetables & fruits
    'tomato': 7, 'tomatoes': 7,
    'onion': 30, 'onions': 30,
    'potato': 21, 'potatoes': 21,
    'carrot': 14, 'carrots': 14,
    'garlic': 30,
    'ginger': 21,
    'pepper': 10, 'capsicum': 7, 'bell pepper': 7, 'shimla mirch': 7,
    'chili': 14, 'green chili': 7,
    'lemon': 21, 'lime': 21,
    'apple': 14, 'apples': 14,
    'banana': 5, 'bananas': 5,
    'orange': 14, 'oranges': 14,
    'lettuce': 7,
    'spinach': 5, 'palak': 5,
    'cabbage': 14,
    'cucumber': 7,
    'eggplant': 7, 'brinjal': 7,
    'broccoli': 7,
    'cauliflower': 7,
    'beans': 7, 'french beans': 7,
    'peas': 5,
    'corn': 5,
    'mango': 5, 'mangoes': 5,
    'grapes': 7,
    'berries': 5, 'strawberry': 5, 'blueberry': 5,
    'melon': 7, 'watermelon': 7,
    'coriander': 5, 'cilantro': 5,
    'mint': 5,
    'curry leaves': 7,

    // Dairy
    'milk': 7,
    'cheese': 14,
    'yogurt': 14, 'curd': 7, 'dahi': 7,
    'butter': 30,
    'cream': 7,
    'paneer': 5,
    'ghee': 180,

    // Proteins
    'chicken': 2,
    'mutton': 2,
    'fish': 2,
    'egg': 21, 'eggs': 21,
    'meat': 2,
    'beef': 2,
    'pork': 2,
    'shrimp': 2, 'prawn': 2, 'prawns': 2,
    'lamb': 2,
    'tofu': 7,

    // Pantry - longer shelf life
    'rice': 365,
    'flour': 180, 'atta': 90, 'maida': 180,
    'sugar': 730,
    'oil': 180, 'cooking oil': 180, 'vegetable oil': 180, 'olive oil': 180,
    'pasta': 365, 'noodles': 365,
    'bread': 5, 'bun': 3,
    'cereal': 180,
    'lentil': 365, 'lentils': 365, 'dal': 365,
    'chickpea': 365, 'chickpeas': 365, 'chana': 365,
    'soy sauce': 365,
    'vinegar': 730,
    'honey': 730,
    'jam': 180,
    'sauce': 180, 'ketchup': 180, 'mayonnaise': 90,

    // Spices - very long shelf life
    'salt': 1825,
    'black pepper': 365, 'kali mirch': 365,
    'turmeric': 365, 'haldi': 365,
    'cumin': 365, 'jeera': 365,
    'coriander powder': 365, 'dhaniya': 365,
    'chili powder': 365, 'red chili': 365,
    'garam masala': 180,
    'cinnamon': 365,
    'cardamom': 365, 'elaichi': 365,
    'clove': 365,
    'bay leaf': 365,

    // Beverages
    'juice': 7,
    'soda': 90,
    'tea': 365,
    'coffee': 180,
};

// Category-based default shelf life
const CATEGORY_DEFAULT_SHELF_LIFE: Record<InventoryItem['category'], number> = {
    'Produce': 7,
    'Dairy': 7,
    'Proteins': 2,
    'Pantry': 180,
    'Spices': 365,
    'Beverages': 30,
    'Other': 30,
};

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

function generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getInventory(): InventoryItem[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveInventory(items: InventoryItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

export function getUsageHistory(): UsageRecord[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(USAGE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveUsageHistory(records: UsageRecord[]): void {
    if (typeof window === 'undefined') return;
    // Keep only last 90 days of history to prevent localStorage bloat
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const filtered = records.filter(r => r.date >= ninetyDaysAgo);
    localStorage.setItem(USAGE_HISTORY_KEY, JSON.stringify(filtered));
}

function recordUsage(itemName: string, quantity: number, reason: 'manual' | 'recipe'): void {
    const history = getUsageHistory();
    history.push({
        itemName: itemName.toLowerCase(),
        quantity,
        date: new Date().toISOString(),
        reason,
    });
    saveUsageHistory(history);
}

/**
 * Get average weekly usage for an item
 */
export function getWeeklyUsageRate(itemName: string): number {
    const history = getUsageHistory();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentUsage = history.filter(
        r => r.itemName === itemName.toLowerCase() && new Date(r.date) >= sevenDaysAgo
    );

    const totalUsed = recentUsage.reduce((sum, r) => sum + r.quantity, 0);
    return totalUsed;
}

/**
 * Get average daily usage for an item (over last 30 days)
 */
export function getDailyUsageRate(itemName: string): number {
    const history = getUsageHistory();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentUsage = history.filter(
        r => r.itemName === itemName.toLowerCase() && new Date(r.date) >= thirtyDaysAgo
    );

    if (recentUsage.length === 0) return 0;

    const totalUsed = recentUsage.reduce((sum, r) => sum + r.quantity, 0);
    const daysCovered = Math.min(30, Math.ceil((Date.now() - new Date(recentUsage[0].date).getTime()) / (24 * 60 * 60 * 1000)) || 1);

    return totalUsed / daysCovered;
}

// =============================================================================
// SMART LOW-STOCK ALERTS
// =============================================================================

export interface SmartLowStockItem extends InventoryItem {
    daysRemaining: number;
    weeklyUsage: number;
    isLow: boolean;
}

/**
 * Get items that won't last the week based on usage history
 * Excludes snack items that are typically single-serving
 */
export function getSmartLowStockItems(): SmartLowStockItem[] {
    const inventory = getInventory();

    // Snack items that are typically single-serving - shouldn't show low stock
    const snackPatterns = /cake|vada|samosa|pakora|pakoda|bhaji|bhajji|puff|pastry|donut|brownie|cookie|muffin|cupcake|croissant|sandwich|burger|pizza|wrap|roll|paratha|puri|dosa|idli|uttapam|snack/i;

    return inventory.map(item => {
        const weeklyUsage = getWeeklyUsageRate(item.name);
        const dailyUsage = getDailyUsageRate(item.name);
        const isSnackItem = snackPatterns.test(item.name);

        let daysRemaining: number;
        let isLow: boolean;

        if (dailyUsage > 0) {
            // Calculate based on actual usage
            daysRemaining = Math.floor(item.quantity / dailyUsage);
            isLow = daysRemaining < 7; // Won't last a week
        } else {
            // No usage history
            if (isSnackItem) {
                // Snacks are single-serving - never show as low stock
                daysRemaining = 30;
                isLow = false;
            } else if (item.category === 'Other' && item.quantity <= 1) {
                // Single items in 'Other' category are likely snacks/one-time items
                daysRemaining = 30;
                isLow = false;
            } else {
                // Use category-based defaults for regular items
                const defaultThreshold = getCategoryDefaultThreshold(item.category);
                daysRemaining = item.quantity > defaultThreshold ? 30 : 7;
                isLow = item.quantity <= defaultThreshold;
            }
        }

        return {
            ...item,
            daysRemaining,
            weeklyUsage,
            isLow,
        };
    }).filter(item => item.isLow);
}

/**
 * Get default low-stock threshold by category
 */
function getCategoryDefaultThreshold(category: InventoryItem['category']): number {
    const thresholds: Record<InventoryItem['category'], number> = {
        'Produce': 2,
        'Dairy': 1,
        'Proteins': 1,
        'Pantry': 1,
        'Spices': 1,
        'Beverages': 2,
        'Other': 2,
    };
    return thresholds[category];
}

// =============================================================================
// EXPIRY DATE HELPERS
// =============================================================================

/**
 * Get suggested expiry date for an item based on its name/category
 */
export function getSuggestedExpiryDate(itemName: string, category: InventoryItem['category']): string {
    const name = itemName.toLowerCase();

    // Check specific item shelf life first
    for (const [key, days] of Object.entries(SHELF_LIFE_DAYS)) {
        if (name.includes(key)) {
            const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            return expiryDate.toISOString().split('T')[0];
        }
    }

    // Fall back to category default
    const defaultDays = CATEGORY_DEFAULT_SHELF_LIFE[category];
    const expiryDate = new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000);
    return expiryDate.toISOString().split('T')[0];
}

/**
 * Check if item needs expiry date (perishables)
 */
export function needsExpiryDate(category: InventoryItem['category']): boolean {
    // Pantry and Spices typically don't need expiry tracking (long shelf life)
    return ['Produce', 'Dairy', 'Proteins', 'Beverages'].includes(category);
}

/**
 * Get items expiring within N days
 */
export function getExpiringItems(days: number = 3): InventoryItem[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return getInventory().filter(item => {
        if (!item.expiryDate) return false;
        const expiry = new Date(item.expiryDate);
        return expiry <= futureDate && expiry >= now;
    });
}

/**
 * Get expired items
 */
export function getExpiredItems(): InventoryItem[] {
    const now = new Date();
    return getInventory().filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < now;
    });
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

export function addItem(item: Omit<InventoryItem, 'id' | 'addedAt'>): InventoryItem {
    const inventory = getInventory();

    // Check if item with same name exists
    const existingIndex = inventory.findIndex(
        i => i.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existingIndex !== -1) {
        inventory[existingIndex].quantity += item.quantity;
        if (item.expiryDate) {
            inventory[existingIndex].expiryDate = item.expiryDate;
        }
        saveInventory(inventory);
        return inventory[existingIndex];
    }

    const newItem: InventoryItem = {
        ...item,
        id: generateId(),
        addedAt: new Date().toISOString(),
    };

    inventory.push(newItem);
    saveInventory(inventory);
    return newItem;
}

export function addMultipleItems(items: Omit<InventoryItem, 'id' | 'addedAt'>[]): InventoryItem[] {
    return items.map(item => addItem(item));
}

/**
 * Update item quantity and track usage
 */
export function updateItemQuantity(id: string, delta: number, reason: 'manual' | 'recipe' = 'manual'): InventoryItem | null {
    const inventory = getInventory();
    const index = inventory.findIndex(item => item.id === id);

    if (index === -1) return null;

    const oldQuantity = inventory[index].quantity;
    inventory[index].quantity = Math.max(0, oldQuantity + delta);

    // Track usage if quantity decreased
    if (delta < 0) {
        recordUsage(inventory[index].name, Math.abs(delta), reason);
    }

    if (inventory[index].quantity === 0) {
        inventory.splice(index, 1);
        saveInventory(inventory);
        return null;
    }

    saveInventory(inventory);
    return inventory[index];
}

/**
 * Decrease inventory when a recipe is cooked
 * Matches ingredient names and reduces quantities
 */
export function deductRecipeIngredients(ingredients: string[]): { deducted: string[]; notFound: string[] } {
    const inventory = getInventory();
    const deducted: string[] = [];
    const notFound: string[] = [];

    for (const ingredient of ingredients) {
        const normalizedIngredient = ingredient.toLowerCase().trim();

        // Find matching inventory item
        const matchIndex = inventory.findIndex(item =>
            item.name.toLowerCase().includes(normalizedIngredient) ||
            normalizedIngredient.includes(item.name.toLowerCase())
        );

        if (matchIndex !== -1) {
            const item = inventory[matchIndex];
            // Deduct 1 unit (or appropriate amount based on unit type)
            const deductAmount = item.unit === 'pieces' || item.unit === 'packets' ? 1 : 0.5;

            if (item.quantity > deductAmount) {
                item.quantity -= deductAmount;
                recordUsage(item.name, deductAmount, 'recipe');
                deducted.push(item.name);
            } else {
                // Remove item if quantity would go to 0
                recordUsage(item.name, item.quantity, 'recipe');
                deducted.push(item.name);
                inventory.splice(matchIndex, 1);
            }
        } else {
            notFound.push(ingredient);
        }
    }

    saveInventory(inventory);
    return { deducted, notFound };
}

export function updateItem(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'addedAt'>>): InventoryItem | null {
    const inventory = getInventory();
    const index = inventory.findIndex(item => item.id === id);

    if (index === -1) return null;

    inventory[index] = { ...inventory[index], ...updates };
    saveInventory(inventory);
    return inventory[index];
}

export function deleteItem(id: string): boolean {
    const inventory = getInventory();
    const index = inventory.findIndex(item => item.id === id);

    if (index === -1) return false;

    inventory.splice(index, 1);
    saveInventory(inventory);
    return true;
}

export function clearInventory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getInventoryByCategory(): Record<InventoryItem['category'], InventoryItem[]> {
    const inventory = getInventory();
    const grouped: Record<InventoryItem['category'], InventoryItem[]> = {
        'Produce': [],
        'Dairy': [],
        'Proteins': [],
        'Pantry': [],
        'Spices': [],
        'Beverages': [],
        'Other': [],
    };

    inventory.forEach(item => {
        grouped[item.category].push(item);
    });

    return grouped;
}

export function getInventoryIngredientNames(): string[] {
    return getInventory().map(item => item.name);
}

export function parseQuantity(quantityStr: string): { quantity: number; unit: string } {
    const match = quantityStr.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
        return {
            quantity: parseFloat(match[1]) || 1,
            unit: match[2].trim() || 'pieces',
        };
    }
    return { quantity: 1, unit: 'pieces' };
}

export function inferCategory(itemName: string): InventoryItem['category'] {
    const name = itemName.toLowerCase();

    if (/tomato|onion|potato|carrot|garlic|ginger|pepper|chili|lemon|lime|vegetable|fruit|apple|banana|orange|lettuce|spinach|cabbage|cucumber|eggplant|brinjal|broccoli|cauliflower|beans|peas|corn|mango|grape|berry|melon|coriander|mint|curry/.test(name)) {
        return 'Produce';
    }

    if (/milk|cheese|yogurt|curd|butter|cream|paneer|ghee|dairy/.test(name)) {
        return 'Dairy';
    }

    if (/chicken|mutton|fish|egg|meat|beef|pork|shrimp|prawn|lamb|seafood|tofu|protein/.test(name)) {
        return 'Proteins';
    }

    if (/salt|pepper|turmeric|cumin|coriander|chili powder|garam masala|spice|cinnamon|cardamom|clove|bay leaf|oregano|basil|thyme|paprika|saffron/.test(name)) {
        return 'Spices';
    }

    if (/water|juice|soda|tea|coffee|drink|cola|beverage/.test(name)) {
        return 'Beverages';
    }

    if (/rice|flour|sugar|oil|pasta|noodle|bread|cereal|lentil|dal|pulse|bean|chickpea|soy sauce|vinegar|honey|jam|sauce|ketchup|mayonnaise/.test(name)) {
        return 'Pantry';
    }

    return 'Other';
}

// For backward compatibility
export function getLowStockItems(threshold: number = 2): InventoryItem[] {
    return getInventory().filter(item => item.quantity <= threshold);
}
