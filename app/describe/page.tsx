'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Sparkles,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    ChefHat,
    RefreshCcw,
    AlertCircle,
    Type
} from 'lucide-react';
import { generateDishImage, identifyDish, identifyDishFromText, DishIdentity } from '../../utils/gemini';

export default function DescribePage() {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'verify' | 'result'>('input');
    const [refining, setRefining] = useState(false);
    const [identifiedDish, setIdentifiedDish] = useState<DishIdentity | null>(null);

    const handleIdentify = async (refiningPrompt?: string) => {
        if (!description && !refiningPrompt) return;

        setIsLoading(true);
        setError(null);

        const promptToUse = refiningPrompt
            ? `${description}. Refinement: ${refiningPrompt}`
            : description;

        try {
            // Updated flow: Try Image -> Verify. If Image fails -> Identify directly (Result).

            try {
                // Attempt to generate image first
                const base64Image = await generateDishImage(promptToUse);
                setGeneratedImage(base64Image);
                setStep('verify');
                if (refiningPrompt) setDescription(promptToUse);
                setRefining(false);
                setIsLoading(false); // Stop loading as we await user verification
                return;
            } catch (imageErr) {
                console.warn('Image generation failed, falling back to text identification', imageErr);
                // Silently fall through to text identification
            }

            // Fallback or Direct Identification
            const identity = await identifyDishFromText(promptToUse);
            setIdentifiedDish(identity);
            setGeneratedImage(null); // Ensure no broken image is shown
            setStep('result');

        } catch (err) {
            console.error(err);
            setError('Could not identify the dish. Please try describing it with more details.');
        } finally {
            // Only stop loading if we didn't return early (verify step stops it manually or earlier)
            // Actually in the success case above we return. So this runs if we hit the catch block or fall through to result.
            setIsLoading(false);
        }
    };

    const handleSkipImage = async () => {
        if (!description) return;
        setIsLoading(true);
        setError(null);
        try {
            const identity = await identifyDishFromText(description);
            setIdentifiedDish(identity);
            setStep('result');
        } catch (err) {
            console.error(err);
            setError('Failed to identify dish from text. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!generatedImage) return;

        setIsLoading(true);
        try {
            const identity = await identifyDish(generatedImage);
            setIdentifiedDish(identity);
            setStep('result');
        } catch (err) {
            setError('Failed to identify dish. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateRecipe = () => {
        if (identifiedDish) {
            // Navigate to recipe list with the identified dish name as search/context
            // storing directly in localStorage for the recipe generator to pick up
            // or passing via query params.
            // For now, let's use query params for a 'search' page or similar, 
            // OR store in a temporary state that 'scan' or 'recipe' page reads.

            // We can simulate a "scanned" result by putting it in localStorage 
            // like the scan page does, then redirecting to recipes.

            // However, the existing 'scan' flow leads to 'recipes'. 
            // Let's assume there's a /recipes page that takes ingredients. 
            // Here we have a dish name. 

            // Let's check how /scan works. If it goes to /recipes with ingredients.
            // We can spoof it by saying "Dish: [Name]" is the ingredient.

            const params = new URLSearchParams();
            params.set('dishName', identifiedDish.dishName);
            params.set('cuisine', identifiedDish.cuisine);
            params.set('description', identifiedDish.description);
            // We can also infer meal type from time of day or just default
            params.set('meal', 'Any');

            router.push(`/recipes?${params.toString()}`);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white px-5 pt-6 pb-24">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-dark-card border border-dark-border active:scale-95 transition-transform"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500">
                    Describe to Cook
                </h1>
            </header>

            <div className="max-w-md mx-auto">
                {/* Input Step */}
                {step === 'input' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                What do you remember eating?
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. A creamy pasta with sun-dried tomatoes I had at a cafe..."
                                className="w-full h-32 bg-black/50 border border-dark-border rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
                            />

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => handleIdentify()}
                                    disabled={!description || isLoading}
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl text-white font-medium shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Identifying...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Identify Dish
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex flex-col items-center text-center gap-3 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                                {error.includes('Image generation failed') && (
                                    <button
                                        onClick={handleSkipImage}
                                        className="px-4 py-2 bg-dark-card border border-dark-border hover:bg-dark-elevated rounded-lg text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        <Type className="w-3 h-3" />
                                        Skip Image & Identify Text
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="text-center text-xs text-gray-600 mt-8">
                            Powered by Gemini Imagen
                        </div>
                    </div>
                )}

                {/* Verify Step */}
                {step === 'verify' && generatedImage && (
                    <div className="animate-fade-in space-y-6">
                        <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 ring-1 ring-white/10">
                            {/* Image */}
                            <img
                                src={`data:image/jpeg;base64,${generatedImage}`}
                                alt="Generated dish"
                                className="w-full h-full object-cover"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <p className="text-white font-medium text-lg mb-4 text-center">
                                    Is this what you're thinking of?
                                </p>

                                {!refining ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setRefining(true)}
                                            className="flex-1 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white font-medium hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                            No, refine it
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={isLoading}
                                            className="flex-1 py-3 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-xl text-green-400 font-medium hover:bg-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                            Yes, that's it!
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-slide-up">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="What looks different? (e.g. 'It was greener')"
                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-400 backdrop-blur-md focus:outline-none focus:border-orange-500/50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleIdentify(e.currentTarget.value);
                                            }}
                                        />
                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => setRefining(false)}
                                                className="text-xs text-gray-400 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    const input = (e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement).value;
                                                    handleIdentify(input);
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-600 rounded-lg text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"
                                            >
                                                <RefreshCcw className="w-3 h-3" />
                                                Regenerate
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Result Step */}
                {step === 'result' && identifiedDish && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-dark-card border border-dark-border rounded-3xl p-1 overflow-hidden">
                            {generatedImage && (
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-1 bg-dark-elevated">
                                    <img
                                        src={`data:image/jpeg;base64,${generatedImage}`}
                                        alt="Identified dish"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-6">
                                <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
                                    {identifiedDish.cuisine}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {identifiedDish.dishName}
                                </h2>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    {identifiedDish.description}
                                </p>

                                <button
                                    onClick={handleGenerateRecipe}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl text-white font-bold text-lg shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <ChefHat className="w-6 h-6" />
                                    Generate Recipe
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => {
                                    setStep('input');
                                    setGeneratedImage(null);
                                    setIdentifiedDish(null);
                                    setDescription('');
                                }}
                                className="text-gray-500 text-sm hover:text-white transition-colors"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
