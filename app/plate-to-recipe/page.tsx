'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Camera,
    Upload,
    X,
    Loader2,
    ChefHat,
    Clock,
    Users,
    Sparkles,
    AlertCircle,
    ImageIcon,
} from 'lucide-react';

interface IdentifiedDish {
    name: string;
    cuisine: string;
    confidence: number;
    description: string;
}

interface GeneratedRecipe {
    title: string;
    cuisine: string;
    description: string;
    prepTime: string;
    cookTime: string;
    servings: number;
    difficulty: string;
    ingredients: string[];
    steps: string[];
    tips?: string[];
}

export default function PlateToRecipePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [identifiedDish, setIdentifiedDish] = useState<IdentifiedDish | null>(null);
    const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
    const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
                setIdentifiedDish(null);
                setRecipe(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
                setIdentifiedDish(null);
                setRecipe(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setCapturedImage(null);
        setIdentifiedDish(null);
        setRecipe(null);
        setError(null);
    };

    const identifyDish = async () => {
        if (!capturedImage) return;

        setIsIdentifying(true);
        setError(null);

        try {
            const response = await fetch('/api/identify-dish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: capturedImage }),
            });

            if (!response.ok) {
                throw new Error('Failed to identify dish');
            }

            const data = await response.json();
            setIdentifiedDish(data);
        } catch (err) {
            setError('Could not identify the dish. Please try with a clearer image.');
            console.error(err);
        } finally {
            setIsIdentifying(false);
        }
    };

    const generateRecipe = async () => {
        if (!identifiedDish) return;

        setIsGeneratingRecipe(true);
        setError(null);

        try {
            const response = await fetch('/api/generate-recipe-from-dish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dishName: identifiedDish.name,
                    cuisine: identifiedDish.cuisine,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate recipe');
            }

            const data = await response.json();
            setRecipe(data);
        } catch (err) {
            setError('Could not generate recipe. Please try again.');
            console.error(err);
        } finally {
            setIsGeneratingRecipe(false);
        }
    };

    const startCooking = () => {
        if (recipe) {
            localStorage.setItem('plate_to_recipe_current', JSON.stringify(recipe));
            router.push('/cook?source=plate-to-recipe');
        }
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-dark-border">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-white font-semibold">Plate to Recipe</h1>
                    <div className="w-9" />
                </div>
            </header>

            <main className="px-5 py-6">
                {/* No Image State */}
                {!capturedImage && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-8 h-8 text-orange-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Identify Any Dish
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Take a photo of a dish or upload from gallery, and get the complete recipe
                            </p>
                        </div>

                        {/* Upload Options */}
                        <div className="space-y-3">
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                className="w-full flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl hover:bg-dark-elevated active:scale-[0.98] transition-all"
                            >
                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-orange-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-medium">Take a Photo</p>
                                    <p className="text-gray-500 text-sm">Use your camera to capture a dish</p>
                                </div>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl hover:bg-dark-elevated active:scale-[0.98] transition-all"
                            >
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-medium">Upload from Gallery</p>
                                    <p className="text-gray-500 text-sm">Choose a saved photo of food</p>
                                </div>
                            </button>
                        </div>

                        {/* Hidden file inputs */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCameraCapture}
                            className="hidden"
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Tips */}
                        <div className="mt-8 p-4 bg-dark-card/50 border border-dark-border rounded-xl">
                            <p className="text-gray-400 text-xs font-medium mb-2">Tips for best results:</p>
                            <ul className="text-gray-500 text-xs space-y-1">
                                <li>• Make sure the dish is clearly visible</li>
                                <li>• Good lighting helps with identification</li>
                                <li>• Works with photos from Instagram, restaurants, anywhere</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Image Captured State */}
                {capturedImage && !recipe && (
                    <div className="animate-fade-in">
                        {/* Image Preview */}
                        <div className="relative rounded-2xl overflow-hidden mb-4">
                            <img
                                src={capturedImage}
                                alt="Captured dish"
                                className="w-full aspect-square object-cover"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Not yet identified */}
                        {!identifiedDish && !isIdentifying && (
                            <button
                                onClick={identifyDish}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-transform"
                            >
                                Identify This Dish
                            </button>
                        )}

                        {/* Identifying */}
                        {isIdentifying && (
                            <div className="flex items-center justify-center gap-3 py-4">
                                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                <p className="text-gray-400">Analyzing dish...</p>
                            </div>
                        )}

                        {/* Identified */}
                        {identifiedDish && (
                            <div className="space-y-4">
                                {/* Dish Info Card */}
                                <div className="p-4 bg-dark-card border border-dark-border rounded-xl">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">
                                                {identifiedDish.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm">{identifiedDish.cuisine}</p>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full">
                                            <Sparkles className="w-3 h-3 text-green-400" />
                                            <span className="text-green-400 text-xs font-medium">
                                                {identifiedDish.confidence}% match
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm">{identifiedDish.description}</p>
                                </div>

                                {/* Generate Recipe Button */}
                                {!isGeneratingRecipe ? (
                                    <button
                                        onClick={generateRecipe}
                                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                    >
                                        <ChefHat className="w-5 h-5" />
                                        Get Recipe
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center gap-3 py-4">
                                        <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                        <p className="text-gray-400">Generating recipe...</p>
                                    </div>
                                )}

                                {/* Try different image */}
                                <button
                                    onClick={clearImage}
                                    className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors"
                                >
                                    Not the right dish? Try another photo
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Recipe Generated State */}
                {recipe && (
                    <div className="animate-fade-in">
                        {/* Recipe Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">{recipe.title}</h2>
                            <p className="text-gray-400 text-sm mb-4">{recipe.description}</p>

                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full">
                                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                                    <span className="text-gray-300 text-xs">{recipe.prepTime} prep</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full">
                                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                                    <span className="text-gray-300 text-xs">{recipe.cookTime} cook</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full">
                                    <Users className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-gray-300 text-xs">{recipe.servings} servings</span>
                                </div>
                            </div>
                        </div>

                        {/* Ingredients */}
                        <section className="mb-6">
                            <h3 className="text-white font-semibold mb-3">Ingredients</h3>
                            <div className="space-y-2">
                                {recipe.ingredients.map((ingredient, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-dark-card border border-dark-border rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                                        <span className="text-gray-300 text-sm">{ingredient}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Steps Preview */}
                        <section className="mb-6">
                            <h3 className="text-white font-semibold mb-3">
                                Steps ({recipe.steps.length})
                            </h3>
                            <div className="space-y-2">
                                {recipe.steps.slice(0, 3).map((step, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-dark-card border border-dark-border rounded-lg"
                                    >
                                        <span className="text-gray-500 text-xs">Step {idx + 1}</span>
                                        <p className="text-gray-300 text-sm mt-1">{step}</p>
                                    </div>
                                ))}
                                {recipe.steps.length > 3 && (
                                    <p className="text-gray-500 text-sm text-center">
                                        +{recipe.steps.length - 3} more steps
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Start Cooking Button */}
                        <button
                            onClick={startCooking}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            <ChefHat className="w-5 h-5" />
                            Start Cooking
                        </button>

                        {/* Try Another */}
                        <button
                            onClick={clearImage}
                            className="w-full mt-3 py-2 text-gray-400 text-sm hover:text-white transition-colors"
                        >
                            Try another dish
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
