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

// Completion Modal
function CompletionModal({ recipe, onFinish }: { recipe: Recipe; onFinish: () => void }) {
    // Save to cooklog (prevent duplicates - only add once per recipe per session)
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
    }, [recipe]);

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
                    You've completed {recipe.title}. Added to your cooklog.
                </p>
                <button
                    onClick={onFinish}
                    className="w-full py-3 bg-white text-black rounded-xl font-semibold"
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

    const [successToast, setSuccessToast] = useState('');
    const [failureModal, setFailureModal] = useState<string | null>(null);

    // Load recipe from sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('currentRecipe');
        if (stored) {
            setRecipe(JSON.parse(stored));
        } else {
            router.push('/scan');
        }
    }, [router]);

    // Speak current step
    const speakStep = (text: string) => {
        if (!voiceEnabled || typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
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
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400">
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
        return <CompletionModal recipe={recipe} onFinish={() => router.push('/cooklog')} />;
    }

    // Cooking Phase
    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between border-b border-dark-border">
                <button onClick={() => setPhase('overview')} className="text-gray-400">
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
