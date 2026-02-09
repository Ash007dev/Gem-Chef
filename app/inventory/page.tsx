'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Plus,
    Minus,
    Trash2,
    Camera,
    Upload,
    X,
    Package,
    AlertTriangle,
    Clock,
    CheckCircle,
    Calendar,
    TrendingDown,
    Search,
    ChefHat,
    ShoppingCart,
    Sparkles,
    Loader2
} from 'lucide-react';
import {
    InventoryItem,
    getInventory,
    addItem,
    updateItemQuantity,
    deleteItem,
    getExpiringItems,
    getExpiredItems,
    getInventoryByCategory,
    parseQuantity,
    inferCategory,
    addMultipleItems,
    getSmartLowStockItems,
    SmartLowStockItem,
    getSuggestedExpiryDate,
    needsExpiryDate,
    getWeeklyUsageRate
} from '@/utils/inventory';
import { scanBill, fileToBase64, analyzeRecipeFeasibility, RecipeFeasibilityResult } from '@/utils/gemini';

// Categories with icons
const CATEGORY_ORDER: InventoryItem['category'][] = [
    'Produce', 'Dairy', 'Proteins', 'Pantry', 'Spices', 'Beverages', 'Other'
];

const CATEGORY_EMOJI: Record<InventoryItem['category'], string> = {
    'Produce': '🥬',
    'Dairy': '🥛',
    'Proteins': '🍗',
    'Pantry': '🍚',
    'Spices': '🧂',
    'Beverages': '🥤',
    'Other': '📦',
};

const UNITS = ['pieces', 'kg', 'g', 'L', 'ml', 'cups', 'tbsp', 'tsp', 'packets', 'bottles', 'cans'];

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [showScanSheet, setShowScanSheet] = useState(false);
    const [showCheckRecipeSheet, setShowCheckRecipeSheet] = useState(false);
    const [smartLowStockItems, setSmartLowStockItems] = useState<SmartLowStockItem[]>([]);
    const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
    const [expiredItems, setExpiredItems] = useState<InventoryItem[]>([]);

    // Reload inventory from localStorage
    const refreshInventory = () => {
        setInventory(getInventory());
        setSmartLowStockItems(getSmartLowStockItems());
        setExpiringItems(getExpiringItems(3));
        setExpiredItems(getExpiredItems());
    };

    useEffect(() => {
        refreshInventory();
    }, []);

    const handleQuantityChange = (id: string, delta: number) => {
        updateItemQuantity(id, delta, 'manual');
        refreshInventory();
    };

    const handleDelete = (id: string) => {
        deleteItem(id);
        refreshInventory();
    };

    const groupedInventory = getInventoryByCategory();

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">Inventory</h1>
                <p className="text-gray-500 text-sm">
                    {inventory.length} items in your kitchen
                </p>
            </header>

            {/* Expired Items Alert */}
            {expiredItems.length > 0 && (
                <section className="mb-4 animate-fade-in">
                    <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-red-400">Expired!</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {expiredItems.map(item => (
                                <span
                                    key={item.id}
                                    className="px-2 py-1 bg-red-900/60 rounded-full text-xs text-red-200"
                                >
                                    {item.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Smart Low Stock Alerts - based on usage rate */}
            {smartLowStockItems.length > 0 && (
                <section className="mb-4 animate-fade-in">
                    <div className="bg-amber-900/30 border border-amber-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-400">Won't Last the Week</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {smartLowStockItems.map(item => (
                                <span
                                    key={item.id}
                                    className="px-2 py-1 bg-amber-900/50 rounded-full text-xs text-amber-200"
                                >
                                    {item.name} ({item.daysRemaining}d left)
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Expiring Soon Alerts */}
            {expiringItems.length > 0 && (
                <section className="mb-6 animate-fade-in">
                    <div className="bg-orange-900/30 border border-orange-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-medium text-orange-400">Expiring Soon</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {expiringItems.map(item => (
                                <span
                                    key={item.id}
                                    className="px-2 py-1 bg-orange-900/50 rounded-full text-xs text-orange-200"
                                >
                                    {item.name} ({new Date(item.expiryDate!).toLocaleDateString()})
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className="mb-8">
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowScanSheet(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium"
                    >
                        <Camera className="w-5 h-5" />
                        <span>Scan Bill</span>
                    </button>
                    <button
                        onClick={() => setShowAddSheet(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-dark-card border border-dark-border rounded-xl text-white font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Manually</span>
                    </button>
                </div>
                {/* Check Recipe Button */}
                <button
                    onClick={() => setShowCheckRecipeSheet(true)}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-emerald-600/20 border border-emerald-600/50 rounded-xl text-emerald-400 font-medium hover:bg-emerald-600/30 transition-colors"
                >
                    <ChefHat className="w-5 h-5" />
                    <span>Can I Make This Recipe?</span>
                </button>
            </section>

            {/* Empty State */}
            {inventory.length === 0 && (
                <section className="text-center py-16 animate-fade-in">
                    <div className="w-16 h-16 bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">Your inventory is empty</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Add items manually or scan a grocery bill to get started
                    </p>
                </section>
            )}

            {/* Inventory List by Category */}
            {CATEGORY_ORDER.map(category => {
                const items = groupedInventory[category];
                if (items.length === 0) return null;

                return (
                    <section key={category} className="mb-6">
                        <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <span>{CATEGORY_EMOJI[category]}</span>
                            {category}
                            <span className="text-gray-600">({items.length})</span>
                        </h2>
                        <div className="space-y-2">
                            {items.map(item => (
                                <InventoryItemCard
                                    key={item.id}
                                    item={item}
                                    onQuantityChange={handleQuantityChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}

            {/* Add Item Sheet */}
            <AddItemSheet
                isOpen={showAddSheet}
                onClose={() => setShowAddSheet(false)}
                onAdd={() => {
                    refreshInventory();
                    setShowAddSheet(false);
                }}
            />

            {/* Bill Scan Sheet */}
            <BillScanSheet
                isOpen={showScanSheet}
                onClose={() => setShowScanSheet(false)}
                onItemsAdded={() => {
                    refreshInventory();
                    setShowScanSheet(false);
                }}
            />

            {/* Check Recipe Sheet */}
            <CheckRecipeSheet
                isOpen={showCheckRecipeSheet}
                onClose={() => setShowCheckRecipeSheet(false)}
                inventoryItems={inventory.map(i => i.name)}
            />
        </div>
    );
}

// Inventory Item Card Component
function InventoryItemCard({
    item,
    onQuantityChange,
    onDelete
}: {
    item: InventoryItem;
    onQuantityChange: (id: string, delta: number) => void;
    onDelete: (id: string) => void;
}) {
    const weeklyUsage = getWeeklyUsageRate(item.name);

    // Snack items - don't show low stock for single-serving items
    const snackPatterns = /cake|vada|samosa|pakora|pakoda|bhaji|bhajji|puff|pastry|donut|brownie|cookie|muffin|cupcake|croissant|sandwich|burger|pizza|wrap|roll|paratha|puri|dosa|idli|uttapam|snack|plate|piece/i;
    const isSnackItem = snackPatterns.test(item.name);
    const isSingleServing = item.category === 'Other' && item.quantity <= 1;

    const isLowStock = !isSnackItem && !isSingleServing && item.quantity <= 2;
    const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

    return (
        <div className={`bg-dark-card border rounded-xl p-4 flex items-center gap-4 ${isExpired ? 'border-red-800/50' : 'border-dark-border'}`}>
            {/* Item Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-gray-400 text-sm">
                        {item.quantity} {item.unit}
                    </span>
                    {weeklyUsage > 0 && (
                        <span className="text-gray-600 text-xs">
                            ({weeklyUsage}/wk used)
                        </span>
                    )}
                    {isExpired && (
                        <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-xs text-red-400">
                            Expired
                        </span>
                    )}
                    {!isExpired && isExpiringSoon && (
                        <span className="px-1.5 py-0.5 bg-orange-500/20 rounded text-xs text-orange-400">
                            Expires soon
                        </span>
                    )}
                    {isLowStock && !isExpired && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">
                            Low
                        </span>
                    )}
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onQuantityChange(item.id, -1)}
                    className="w-8 h-8 bg-dark-elevated rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                <button
                    onClick={() => onQuantityChange(item.id, 1)}
                    className="w-8 h-8 bg-dark-elevated rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Delete Button */}
            <button
                onClick={() => onDelete(item.id)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

// Add Item Sheet Component
function AddItemSheet({
    isOpen,
    onClose,
    onAdd
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void;
}) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('pieces');
    const [category, setCategory] = useState<InventoryItem['category']>('Other');
    const [expiryDate, setExpiryDate] = useState('');

    // Auto-suggest expiry when name changes
    useEffect(() => {
        if (name.trim()) {
            const inferredCat = inferCategory(name);
            setCategory(inferredCat);
            if (needsExpiryDate(inferredCat)) {
                const suggested = getSuggestedExpiryDate(name, inferredCat);
                setExpiryDate(suggested);
            } else {
                setExpiryDate('');
            }
        }
    }, [name]);

    const handleSubmit = () => {
        if (!name.trim()) return;

        addItem({
            name: name.trim(),
            quantity: parseFloat(quantity) || 1,
            unit,
            category,
            expiryDate: expiryDate || undefined,
        });

        // Reset form
        setName('');
        setQuantity('1');
        setUnit('pieces');
        setCategory('Other');
        setExpiryDate('');

        onAdd();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 animate-fade-in">
            <div className="w-full max-w-lg bg-dark-card border-t border-dark-border rounded-t-3xl p-6 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Add Item</h2>
                    <button onClick={onClose} className="text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Item Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Tomatoes"
                            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder:text-gray-600"
                        />
                    </div>

                    {/* Quantity & Unit */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-1 block">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="0"
                                step="0.5"
                                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-1 block">Unit</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white"
                            >
                                {UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as InventoryItem['category'])}
                            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white"
                        >
                            {CATEGORY_ORDER.map(cat => (
                                <option key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Expiry Date - with AI suggestion info */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1 block">
                            Expiry Date {needsExpiryDate(category) ? '(AI-suggested)' : '(Optional)'}
                        </label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white"
                        />
                        {needsExpiryDate(category) && expiryDate && (
                            <p className="text-xs text-gray-500 mt-1">
                                Suggested based on typical shelf life
                            </p>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="w-full mt-6 py-4 bg-white text-black rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add to Inventory
                </button>
            </div>
        </div>
    );
}

// Bill Scan Sheet Component - with expiry date input
interface ScannedItemWithExpiry {
    name: string;
    quantity: string;
    category?: string;
    selected: boolean;
    expiryDate: string;
    showExpiryInput: boolean;
}

function BillScanSheet({
    isOpen,
    onClose,
    onItemsAdded
}: {
    isOpen: boolean;
    onClose: () => void;
    onItemsAdded: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedItemWithExpiry[]>([]);
    const [error, setError] = useState('');

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setError('');
        setScannedItems([]);

        try {
            const { base64, mimeType } = await fileToBase64(file);
            const result = await scanBill(base64, mimeType);

            if (result.items.length > 0) {
                // Add expiry date suggestions for perishable items
                const itemsWithExpiry = result.items.map(item => {
                    const cat = (item.category as InventoryItem['category']) || inferCategory(item.name);
                    const needsExpiry = needsExpiryDate(cat);
                    return {
                        ...item,
                        selected: true,
                        expiryDate: needsExpiry ? getSuggestedExpiryDate(item.name, cat) : '',
                        showExpiryInput: needsExpiry,
                    };
                });
                setScannedItems(itemsWithExpiry);
            } else {
                setError('No food items found in the receipt. Try a clearer image.');
            }
        } catch (err) {
            setError('Failed to scan bill. Please try again.');
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    const toggleItem = (index: number) => {
        setScannedItems(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, selected: !item.selected } : item
            )
        );
    };

    const updateExpiry = (index: number, date: string) => {
        setScannedItems(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, expiryDate: date } : item
            )
        );
    };

    const handleAddAll = () => {
        const selectedItems = scannedItems.filter(item => item.selected);

        const itemsToAdd = selectedItems.map(item => {
            const { quantity, unit } = parseQuantity(item.quantity);
            return {
                name: item.name,
                quantity,
                unit,
                category: (item.category as InventoryItem['category']) || inferCategory(item.name),
                expiryDate: item.expiryDate || undefined,
            };
        });

        addMultipleItems(itemsToAdd);
        setScannedItems([]);
        onItemsAdded();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 animate-fade-in">
            <div className="w-full max-w-lg bg-dark-card border-t border-dark-border rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Scan Grocery Bill</h2>
                    <button onClick={onClose} className="text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* No items scanned yet */}
                {scannedItems.length === 0 && !isScanning && (
                    <>
                        <p className="text-gray-400 text-sm mb-6">
                            Take a photo of your grocery receipt or upload an image. AI will extract all food items and suggest expiry dates automatically.
                        </p>

                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-dark-elevated border border-dark-border rounded-xl text-white"
                            >
                                <Camera className="w-5 h-5" />
                                <span>Take Photo</span>
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
                                    input.click();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-dark-elevated border border-dark-border rounded-xl text-white"
                            >
                                <Upload className="w-5 h-5" />
                                <span>Upload</span>
                            </button>
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}
                    </>
                )}

                {/* Scanning indicator */}
                {isScanning && (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Scanning receipt...</p>
                        <p className="text-gray-600 text-sm mt-1">AI is identifying food items</p>
                    </div>
                )}

                {/* Scanned Items Preview with Expiry */}
                {scannedItems.length > 0 && (
                    <>
                        <p className="text-gray-400 text-sm mb-4">
                            Found {scannedItems.length} items. Expiry dates are AI-suggested for perishables - adjust if needed.
                        </p>

                        <div className="space-y-3 mb-6">
                            {scannedItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`rounded-xl transition-colors ${item.selected
                                        ? 'bg-green-900/30 border border-green-800/50'
                                        : 'bg-dark-elevated border border-dark-border opacity-50'
                                        }`}
                                >
                                    {/* Item row */}
                                    <button
                                        onClick={() => toggleItem(index)}
                                        className="w-full flex items-center gap-3 p-3"
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.selected ? 'bg-green-500' : 'bg-dark-border'
                                            }`}>
                                            {item.selected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-white text-sm">{item.name}</p>
                                            <p className="text-gray-500 text-xs">{item.quantity} • {item.category || 'Other'}</p>
                                        </div>
                                    </button>

                                    {/* Expiry input for perishables */}
                                    {item.selected && item.showExpiryInput && (
                                        <div className="px-3 pb-3 pt-0">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <input
                                                    type="date"
                                                    value={item.expiryDate}
                                                    onChange={(e) => updateExpiry(index, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 px-2 py-1 bg-dark-elevated border border-dark-border rounded-lg text-white text-sm"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 ml-6">Expiry (AI-suggested)</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setScannedItems([])}
                                className="flex-1 py-3 bg-dark-elevated border border-dark-border rounded-xl text-gray-300 font-medium"
                            >
                                Scan Again
                            </button>
                            <button
                                onClick={handleAddAll}
                                disabled={scannedItems.filter(i => i.selected).length === 0}
                                className="flex-1 py-3 bg-white text-black rounded-xl font-semibold disabled:opacity-50"
                            >
                                Add {scannedItems.filter(i => i.selected).length} Items
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Check Recipe Sheet Component - Analyzes if a recipe can be made from inventory
function CheckRecipeSheet({
    isOpen,
    onClose,
    inventoryItems
}: {
    isOpen: boolean;
    onClose: () => void;
    inventoryItems: string[];
}) {
    const [recipeName, setRecipeName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<RecipeFeasibilityResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!recipeName.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const feasibility = await analyzeRecipeFeasibility(recipeName.trim(), inventoryItems);
            setResult(feasibility);
        } catch (err) {
            setError('Failed to analyze recipe. Please try again.');
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClose = () => {
        setRecipeName('');
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
            <div className="bg-dark-elevated w-full max-h-[90vh] rounded-t-3xl animate-slide-up overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-dark-elevated z-10 p-6 border-b border-dark-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Can I Make This?</h2>
                        <p className="text-sm text-gray-400">Check if you have the ingredients</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-dark-card rounded-full">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Recipe Input */}
                    <div className="space-y-3">
                        <label className="text-sm text-gray-400">Recipe Name</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={recipeName}
                                onChange={(e) => setRecipeName(e.target.value)}
                                placeholder="e.g., Butter Chicken, Pasta Carbonara..."
                                className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={!recipeName.trim() || isAnalyzing}
                                className="px-6 py-3 bg-emerald-600 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center gap-2"
                            >
                                {isAnalyzing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Your inventory: {inventoryItems.length} items
                        </p>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Status Banner */}
                            {result.canMake ? (
                                <div className="p-4 bg-emerald-900/40 border border-emerald-600/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-400">You Can Make This! 🎉</h3>
                                            <p className="text-sm text-emerald-300/80">You have all the essential ingredients</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-orange-900/40 border border-orange-600/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                                            <ShoppingCart className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-orange-400">Missing Some Ingredients</h3>
                                            <p className="text-sm text-orange-300/80">
                                                {result.partialMatch
                                                    ? "You're close! Just need a few items"
                                                    : "You'll need to shop for these items"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Ingredients Analysis */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Available Ingredients */}
                                <div className="p-4 bg-dark-card rounded-xl">
                                    <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        You Have ({result.availableIngredients.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {result.availableIngredients.length > 0 ? (
                                            result.availableIngredients.map((ing, i) => (
                                                <p key={i} className="text-sm text-gray-300">✓ {ing}</p>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">None</p>
                                        )}
                                    </div>
                                </div>

                                {/* Missing Ingredients */}
                                <div className="p-4 bg-dark-card rounded-xl">
                                    <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        Need ({result.missingIngredients.length})
                                    </h4>
                                    <div className="space-y-1">
                                        {result.missingIngredients.length > 0 ? (
                                            result.missingIngredients.map((ing, i) => (
                                                <p key={i} className="text-sm text-gray-300">• {ing}</p>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">Nothing!</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Suggestion (when can't make) */}
                            {!result.canMake && result.suggestion && (
                                <div className="p-4 bg-blue-900/30 border border-blue-600/50 rounded-xl">
                                    <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Suggestion
                                    </h4>
                                    <p className="text-sm text-gray-300">{result.suggestion}</p>
                                </div>
                            )}

                            {/* Full Recipe (when can make) */}
                            {result.canMake && result.recipe && (
                                <div className="space-y-4">
                                    <div className="border-t border-dark-border pt-4">
                                        <h3 className="text-lg font-bold text-white mb-1">{result.recipe.title}</h3>
                                        <p className="text-sm text-gray-400">{result.recipe.description}</p>
                                    </div>

                                    {/* Recipe Meta */}
                                    <div className="flex gap-4 text-sm">
                                        <span className="px-3 py-1 bg-dark-card rounded-full text-gray-300">
                                            ⏱️ Prep: {result.recipe.prepTime}
                                        </span>
                                        <span className="px-3 py-1 bg-dark-card rounded-full text-gray-300">
                                            🍳 Cook: {result.recipe.cookTime}
                                        </span>
                                        <span className="px-3 py-1 bg-dark-card rounded-full text-gray-300">
                                            👥 {result.recipe.servings} servings
                                        </span>
                                    </div>

                                    {/* Ingredients List */}
                                    <div className="p-4 bg-dark-card rounded-xl">
                                        <h4 className="text-sm font-medium text-white mb-3">Ingredients</h4>
                                        <ul className="space-y-1">
                                            {result.recipe.ingredients.map((ing, i) => (
                                                <li key={i} className="text-sm text-gray-300">• {ing}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-white">Instructions</h4>
                                        {result.recipe.steps.map((step, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-white font-bold">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tips */}
                                    {result.recipe.tips && result.recipe.tips.length > 0 && (
                                        <div className="p-4 bg-amber-900/20 border border-amber-600/30 rounded-xl">
                                            <h4 className="text-sm font-medium text-amber-400 mb-2">💡 Chef's Tips</h4>
                                            <ul className="space-y-1">
                                                {result.recipe.tips.map((tip, i) => (
                                                    <li key={i} className="text-sm text-gray-300">• {tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
