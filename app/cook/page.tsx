'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Camera,
    Check,
    X,
    Volume2,
    VolumeX,
    Trophy,
    ShoppingCart,
    Clock,
    Users,
    Play,
    Pause,
    Video
} from 'lucide-react';
import {
    verifyCookingStep,
    fileToBase64,
    type Recipe,
    type StepVerificationResult
} from '@/utils/gemini';
import LiveCookingOverlay from '@/components/LiveCookingOverlay';

// Success Toast
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-6 left-4 right-4 z-50 animate-slide-up">
            <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
                <Check className="w-5 h-5" />
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
}

// Failure Modal
function FailureModal({
    feedback,
    onTryAgain,
    onClose
}: {
    feedback: string;
    onTryAgain: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
            <div className="bg-dark-card rounded-2xl p-6 w-full max-w-sm border border-dark-border animate-scale-in">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-center text-white mb-2">
                    Almost there!
                </h3>
                <p className="text-center text-gray-400 mb-6 text-sm">
                    {feedback}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-dark-elevated border border-dark-border rounded-xl font-medium text-gray-300"
                    >
                        Skip
                    </button>
                    <button
                        onClick={onTryAgain}
                        className="flex-1 py-3 bg-white text-black rounded-xl font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}

// Completion Modal with Share Feature
function CompletionModal({ recipe, onFinish }: { recipe: Recipe; onFinish: () => void }) {
    const [servingsConsumed, setServingsConsumed] = useState(1);

    const [showShare, setShowShare] = useState(false);
    const [dishPhoto, setDishPhoto] = useState<string | null>(null);
    const [isGeneratingCard, setIsGeneratingCard] = useState(false);
    const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Save to cooklog and log nutrition (prevent duplicates - only add once per recipe per session)
    useEffect(() => {
        const savedLog = localStorage.getItem('cooklog');
        const cooklog = savedLog ? JSON.parse(savedLog) : [];

        // Check if this exact recipe was already logged today
        const today = new Date().toDateString();
        const alreadyLogged = cooklog.some(
            (entry: any) => entry.id === recipe.id && new Date(entry.cookedAt).toDateString() === today
        );

        if (!alreadyLogged) {
            cooklog.unshift({
                ...recipe,
                cookedAt: new Date().toISOString()
            });
            localStorage.setItem('cooklog', JSON.stringify(cooklog.slice(0, 50)));
        }

        // Log nutrition
        if (recipe.nutrition) {
            const { logNutrition, generateLogId, getTodayDate } = require('@/utils/nutrition-storage');
            const totalNutrition = {
                calories: recipe.nutrition.calories * servingsConsumed,
                protein: recipe.nutrition.protein * servingsConsumed,
                carbs: recipe.nutrition.carbs * servingsConsumed,
                fat: recipe.nutrition.fat * servingsConsumed,
                fiber: (recipe.nutrition.fiber || 0) * servingsConsumed,
                sodium: (recipe.nutrition.sodium || 0) * servingsConsumed,
                sugar: (recipe.nutrition.sugar || 0) * servingsConsumed
            };

            logNutrition({
                id: generateLogId(),
                date: getTodayDate(),
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                mealType: getMealTypeFromTime(),
                servings: servingsConsumed,
                nutrition: totalNutrition,
                timestamp: new Date().toISOString()
            });
        }
    }, [recipe, servingsConsumed]);

    const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setDishPhoto(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const generateShareCard = async () => {
        if (!dishPhoto || !canvasRef.current) return;

        setIsGeneratingCard(true);

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Card dimensions (Instagram-friendly 1:1)
            canvas.width = 1080;
            canvas.height = 1080;

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Load and draw dish photo
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = dishPhoto;
            });

            // Draw circular photo with border
            const photoSize = 600;
            const photoX = (canvas.width - photoSize) / 2;
            const photoY = 120;

            // White border
            ctx.beginPath();
            ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fill();

            // Clip to circle and draw image
            ctx.save();
            ctx.beginPath();
            ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
            ctx.clip();

            // Cover fit the image
            const imgRatio = img.width / img.height;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            if (imgRatio > 1) {
                sx = (img.width - img.height) / 2;
                sw = img.height;
            } else {
                sy = (img.height - img.width) / 2;
                sh = img.width;
            }
            ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoSize, photoSize);
            ctx.restore();

            // Recipe title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            const title = recipe.title.length > 25 ? recipe.title.substring(0, 25) + '...' : recipe.title;
            ctx.fillText(title, canvas.width / 2, photoY + photoSize + 80);

            // Cook time and servings
            ctx.fillStyle = '#888888';
            ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(`${recipe.totalTime} • ${recipe.servings}`, canvas.width / 2, photoY + photoSize + 130);

            // Key ingredients (max 3)
            const keyIngredients = recipe.ingredients.provided.slice(0, 3).map(ing => {
                // Extract just the ingredient name (before weight/quantity details)
                const match = ing.match(/^[\d\s]*(?:cup|tbsp|tsp|g|kg|ml|l|piece|pcs|medium|large|small)?\s*(.+?)(?:\s*\(|,|$)/i);
                return match ? match[1].trim() : ing.split('(')[0].trim();
            }).join(' • ');
            ctx.fillStyle = '#666666';
            ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(keyIngredients.substring(0, 50), canvas.width / 2, photoY + photoSize + 180);

            // Branding
            ctx.fillStyle = '#444444';
            ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Made with SmartChef', canvas.width / 2, canvas.height - 50);

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            setShareCardUrl(dataUrl);

        } catch (err) {
            console.error('Failed to generate share card:', err);
        } finally {
            setIsGeneratingCard(false);
        }
    };

    // Generate card when photo is selected
    useEffect(() => {
        if (dishPhoto) {
            generateShareCard();
        }
    }, [dishPhoto]);

    const handleShare = async (platform: 'native' | 'download') => {
        if (!shareCardUrl) return;

        if (platform === 'download') {
            // Download image
            const link = document.createElement('a');
            link.download = `${recipe.title.replace(/\s+/g, '_')}_SmartChef.png`;
            link.href = shareCardUrl;
            link.click();
        } else if (platform === 'native' && navigator.share) {
            try {
                // Convert data URL to blob
                const response = await fetch(shareCardUrl);
                const blob = await response.blob();
                const file = new File([blob], `${recipe.title}_SmartChef.png`, { type: 'image/png' });

                await navigator.share({
                    title: `I made ${recipe.title}!`,
                    text: `Just cooked ${recipe.title} using SmartChef! 🍳`,
                    files: [file]
                });
            } catch (err) {
                // Fallback to download if share fails
                handleShare('download');
            }
        }
    };

    if (showShare) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in overflow-y-auto">
                <div className="bg-dark-card rounded-2xl p-6 w-full max-w-sm border border-dark-border animate-scale-in my-8">
                    <h3 className="text-lg font-semibold text-center text-white mb-4">
                        Share Your Creation
                    </h3>

                    {!dishPhoto ? (
                        <>
                            <p className="text-center text-gray-400 text-sm mb-6">
                                Take a photo of your dish to create a shareable recipe card!
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2 mb-3"
                            >
                                <Camera className="w-5 h-5" />
                                Take Photo
                            </button>
                            <button
                                onClick={() => setShowShare(false)}
                                className="w-full py-3 text-gray-400"
                            >
                                Skip
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Preview */}
                            <div className="mb-4 rounded-xl overflow-hidden">
                                {isGeneratingCard ? (
                                    <div className="aspect-square bg-dark-elevated flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : shareCardUrl ? (
                                    <img src={shareCardUrl} alt="Share card preview" className="w-full" />
                                ) : null}
                            </div>

                            {/* Share options */}
                            {shareCardUrl && (
                                <div className="space-y-3">
                                    {/* Native share (WhatsApp, Instagram, etc.) */}
                                    {'share' in navigator && (
                                        <button
                                            onClick={() => handleShare('native')}
                                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                        >
                                            Share to App
                                        </button>
                                    )}

                                    {/* Download */}
                                    <button
                                        onClick={() => handleShare('download')}
                                        className="w-full py-4 bg-dark-elevated border border-dark-border text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                    >
                                        Save to Gallery
                                    </button>

                                    {/* Retake */}
                                    <button
                                        onClick={() => {
                                            setDishPhoto(null);
                                            setShareCardUrl(null);
                                        }}
                                        className="w-full py-3 text-gray-400 text-sm"
                                    >
                                        Retake Photo
                                    </button>

                                    {/* Done */}
                                    <button
                                        onClick={onFinish}
                                        className="w-full py-3 text-gray-500 text-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Hidden canvas for generating share card */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        );
    }

    const getMealTypeFromTime = () => {
        const hour = new Date().getHours();
        if (hour < 10) return 'Breakfast';
        if (hour < 12) return 'Brunch';
        if (hour < 15) return 'Lunch';
        if (hour < 18) return 'Snack';
        return 'Dinner';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
            <div className="bg-dark-card rounded-2xl p-8 w-full max-w-sm border border-dark-border animate-scale-in text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                    Well Done!
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                    You've completed {recipe.title}
                </p>

                {/* Nutrition Summary */}
                {recipe.nutrition && (
                    <div className="bg-dark-elevated border border-dark-border rounded-xl p-4 mb-6">
                        <h3 className="text-xs font-medium text-gray-400 mb-3">Nutrition Logged</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {Math.round(recipe.nutrition.calories * servingsConsumed)}
                                </div>
                                <div className="text-xs text-gray-500">Calories</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-white">
                                    {Math.round(recipe.nutrition.protein * servingsConsumed)}g
                                </div>
                                <div className="text-xs text-gray-500">Protein</div>
                            </div>
                        </div>

                        {/* Servings Adjuster */}
                        <div className="mt-4 pt-4 border-t border-dark-border">
                            <label className="text-xs text-gray-400 block mb-2">Servings consumed</label>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setServingsConsumed(Math.max(0.5, servingsConsumed - 0.5))}
                                    className="w-8 h-8 bg-dark-card border border-dark-border rounded-lg text-white"
                                >
                                    -
                                </button>
                                <span className="text-lg font-medium text-white w-12 text-center">
                                    {servingsConsumed}
                                </span>
                                <button
                                    onClick={() => setServingsConsumed(servingsConsumed + 0.5)}
                                    className="w-8 h-8 bg-dark-card border border-dark-border rounded-lg text-white"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowShare(true)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold mb-3 flex items-center justify-center gap-2"
                >
                    <Camera className="w-5 h-5" />
                    Share Your Dish
                </button>
                <button
                    onClick={onFinish}
                    className="w-full py-3 bg-dark-elevated border border-dark-border text-white rounded-xl font-medium"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

// Pre-cook Overview
function PreCookOverview({
    recipe,
    onStart
}: {
    recipe: Recipe;
    onStart: () => void;
}) {
    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24 animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-2">{recipe.title}</h1>
            <p className="text-gray-500 text-sm mb-6">{recipe.description}</p>

            {/* Meta */}
            <div className="flex gap-4 mb-8 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {recipe.totalTime}
                </span>
                <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {recipe.servings}
                </span>
            </div>

            {/* Ingredients */}
            <section className="mb-6">
                <h2 className="text-sm font-medium text-gray-400 mb-3">Ingredients</h2>
                <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <ul className="space-y-2">
                        {recipe.ingredients.provided.map((ing, idx) => (
                            <li key={idx} className="text-white text-sm flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                {ing}
                            </li>
                        ))}
                    </ul>
                    {recipe.ingredients.shoppingList.length > 0 && (
                        <>
                            <div className="h-px bg-dark-border my-4" />
                            <h3 className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3" />
                                Shopping List
                            </h3>
                            <ul className="space-y-2">
                                {recipe.ingredients.shoppingList.map((ing, idx) => (
                                    <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                                        <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </section>

            {/* Prep Tips */}
            {recipe.mealPrep && recipe.mealPrep.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-400 mb-3">Prep Tips</h2>
                    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                        <ul className="space-y-2">
                            {recipe.mealPrep.map((tip, idx) => (
                                <li key={idx} className="text-gray-300 text-sm">
                                    • {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Start Button */}
            <button
                onClick={onStart}
                className="w-full py-4 bg-white text-black rounded-xl font-semibold flex items-center justify-center gap-2"
            >
                <Play className="w-5 h-5" />
                Start Cooking
            </button>
        </div>
    );
}

function CookContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [phase, setPhase] = useState<'overview' | 'cooking' | 'complete'>('overview');
    const [currentStep, setCurrentStep] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showLiveMode, setShowLiveMode] = useState(false);
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    const [successToast, setSuccessToast] = useState('');
    const [failureModal, setFailureModal] = useState<string | null>(null);

    // Ensure voices are loaded (they load asynchronously in some browsers)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) setVoicesLoaded(true);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Stop all speech when leaving the page — multiple strategies for reliability
    useEffect(() => {
        const stopSpeech = () => {
            window.speechSynthesis.cancel();
        };

        // Handle browser back/forward
        window.addEventListener('beforeunload', stopSpeech);
        window.addEventListener('pagehide', stopSpeech);
        window.addEventListener('popstate', stopSpeech);

        // Handle visibility change (tab switch, app switch)
        const handleVisibility = () => {
            if (document.hidden) {
                // Don't stop on tab switch — only stop on actual navigation
            }
        };

        // Intercept link clicks to stop speech before Next.js navigation
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor && anchor.href) {
                stopSpeech();
            }
        };
        document.addEventListener('click', handleClick, true);

        return () => {
            stopSpeech();
            window.removeEventListener('beforeunload', stopSpeech);
            window.removeEventListener('pagehide', stopSpeech);
            window.removeEventListener('popstate', stopSpeech);
            document.removeEventListener('click', handleClick, true);
        };
    }, []);

    // Load recipe from sessionStorage or localStorage (for plate-to-recipe)
    useEffect(() => {
        // First check sessionStorage (main flow)
        let stored = sessionStorage.getItem('currentRecipe');

        // Fallback: check localStorage for plate-to-recipe
        if (!stored) {
            const plateRecipe = localStorage.getItem('plate_to_recipe_current');
            if (plateRecipe) {
                try {
                    const parsed = JSON.parse(plateRecipe);
                    // Convert plate-to-recipe format to cook page format
                    const cookRecipe: any = {
                        id: `plate-${Date.now()}`,
                        title: parsed.title,
                        description: parsed.description,
                        prepTime: parsed.prepTime || '15 min',
                        cookTime: parsed.cookTime || '30 min',
                        totalTime: parsed.totalTime || `${parseInt(parsed.prepTime || '15') + parseInt(parsed.cookTime || '30')} min`,
                        servings: typeof parsed.servings === 'number' ? `${parsed.servings} servings` : (parsed.servings || '2 servings'),
                        difficulty: parsed.difficulty || 'Medium',
                        calories: parsed.calories || 'N/A',
                        type: 'traditional' as const,
                        ingredients: parsed.ingredients?.provided
                            ? parsed.ingredients
                            : { provided: parsed.ingredients || [], shoppingList: [] },
                        steps: parsed.steps || [],
                        mealPrep: parsed.tips || parsed.mealPrep || [],
                        // Add nutrition field if available
                        nutrition: parsed.nutrition || undefined
                    };
                    setRecipe(cookRecipe);
                    // Clear the localStorage after loading
                    localStorage.removeItem('plate_to_recipe_current');
                    return;
                } catch (e) {
                    console.error('Failed to parse plate recipe:', e);
                }
            }
            router.push('/scan');
        } else {
            setRecipe(JSON.parse(stored));
        }
    }, [router]);

    // Get a female voice
    const getFemaleVoice = (): SpeechSynthesisVoice | null => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer specific high-quality female voices
        const preferred = ['Samantha', 'Karen', 'Victoria', 'Zira', 'Google UK English Female', 'Google US English', 'Fiona', 'Moira', 'Tessa'];
        for (const name of preferred) {
            const match = voices.find(v => v.name.includes(name));
            if (match) return match;
        }
        // Fallback: find any female-sounding voice
        const female = voices.find(v => /female|woman/i.test(v.name));
        if (female) return female;
        // Last resort: pick first English voice
        return voices.find(v => v.lang.startsWith('en')) || null;
    };

    // Speak current step
    const speakStep = (text: string) => {
        if (!voiceEnabled || typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        const femaleVoice = getFemaleVoice();
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = 1.1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Speak on step change
    useEffect(() => {
        if (phase === 'cooking' && recipe && voiceEnabled) {
            speakStep(recipe.steps[currentStep]);
        }
    }, [currentStep, phase, recipe, voiceEnabled]);

    const handleNext = () => {
        if (!recipe) return;
        if (currentStep < recipe.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setPhase('complete');
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleVerify = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !recipe) return;

        setIsVerifying(true);

        try {
            const { base64, mimeType } = await fileToBase64(file);
            const result = await verifyCookingStep(
                recipe.steps[currentStep],
                recipe.title,
                base64,
                mimeType
            );

            if (result.status === 'pass') {
                // Speak the AI's detailed tip
                if (voiceEnabled && result.spokenTip) {
                    speakStep(result.spokenTip);
                }
                setSuccessToast(result.feedback);
                // Show time remaining if provided
                if (result.timeRemaining) {
                    setSuccessToast(`${result.feedback} (${result.timeRemaining})`);
                }
                setTimeout(handleNext, 2000);
            } else {
                // Speak failure feedback too
                if (voiceEnabled && result.spokenTip) {
                    speakStep(result.spokenTip);
                }
                setFailureModal(result.feedback);
            }
        } catch (err) {
            console.error('Verification failed:', err);
            setFailureModal('Could not verify. Try again or skip.');
        } finally {
            setIsVerifying(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const toggleVoice = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        setVoiceEnabled(!voiceEnabled);
    };

    if (!recipe) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (phase === 'overview') {
        return (
            <div>
                <header className="fixed top-0 left-0 right-0 z-30 bg-black px-5 py-4">
                    <button onClick={() => { window.speechSynthesis.cancel(); router.back(); }} className="flex items-center gap-2 text-gray-400">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                </header>
                <div className="pt-14">
                    <PreCookOverview recipe={recipe} onStart={() => setPhase('cooking')} />
                </div>
            </div>
        );
    }

    if (phase === 'complete') {
        return <CompletionModal recipe={recipe} onFinish={() => { window.speechSynthesis.cancel(); router.push('/cooklog'); }} />;
    }

    // Cooking Phase
    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-dark-border">
                <button onClick={() => { window.speechSynthesis.cancel(); setPhase('overview'); }} className="text-gray-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400">
                    Step {currentStep + 1} of {recipe.steps.length}
                </span>
                <button onClick={toggleVoice} className="text-gray-400">
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-dark-card">
                <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }}
                />
            </div>

            {/* Step Content */}
            <div className="flex-1 flex flex-col justify-center px-6 py-8">
                <p className="text-2xl text-white leading-relaxed animate-fade-in">
                    {recipe.steps[currentStep]}
                </p>

                {isSpeaking && (
                    <div className="mt-4 flex items-center gap-2 text-gray-500">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm">Speaking...</span>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="px-5 pb-8 space-y-3">
                {/* Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="flex-1 py-4 bg-dark-card border border-dark-border rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-4 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        {currentStep === recipe.steps.length - 1 ? 'Finish' : 'Next'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Verify Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleVerify}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVerifying}
                    className="w-full py-4 bg-dark-card border border-dark-border rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Camera className="w-5 h-5" />
                    {isVerifying ? 'Checking...' : 'Snap to Verify'}
                </button>

                {/* Live Mode Button */}
                <button
                    onClick={() => setShowLiveMode(true)}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                >
                    <Video className="w-5 h-5" />
                    Start Live Mode
                </button>
            </div>

            {/* Toasts & Modals */}
            {successToast && (
                <SuccessToast message={successToast} onClose={() => setSuccessToast('')} />
            )}
            {failureModal && (
                <FailureModal
                    feedback={failureModal}
                    onTryAgain={() => {
                        setFailureModal(null);
                        fileInputRef.current?.click();
                    }}
                    onClose={() => {
                        setFailureModal(null);
                        handleNext();
                    }}
                />
            )}

            {/* Live Cooking Overlay */}
            <LiveCookingOverlay
                isOpen={showLiveMode}
                onClose={() => setShowLiveMode(false)}
                recipeTitle={recipe.title}
                currentStep={recipe.steps[currentStep]}
                stepNumber={currentStep + 1}
                totalSteps={recipe.steps.length}
                ingredients={[...recipe.ingredients.provided, ...recipe.ingredients.shoppingList]}
                onStepChange={(step) => setCurrentStep(step - 1)}
            />
        </div>
    );
}

export default function CookPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CookContent />
        </Suspense>
    );
}
