'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Youtube,
    Link as LinkIcon,
    ChefHat,
    Check,
    Clock,
    FileText,
    List
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateVideoRecipe, VideoSyncedRecipe } from '../../utils/gemini';

export default function CookAlongPage() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recipe, setRecipe] = useState<VideoSyncedRecipe | null>(null);

    // Analyze video URL to generate summary
    const handleAnalyze = async (urlOverride?: string) => {
        const urlToUse = urlOverride || url;
        if (!urlToUse) return;

        // Update valid URL state if provided directly
        if (urlOverride) setUrl(urlOverride);

        setIsAnalyzing(true);
        try {
            // Simple extraction of video ID or topic from URL text for prompt context
            const context = urlToUse.includes('youtube') || urlToUse.includes('youtu.be') ? `YouTube video: ${urlToUse}` : `Cooking video about: ${urlToUse}`;

            const generatedRecipe = await generateVideoRecipe(context);
            setRecipe(generatedRecipe);
        } catch (error) {
            console.error('Failed to analyze video:', error);
            alert('Could not analyze the video. Please maintain a valid YouTube URL.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center">
            {/* Header / Nav */}
            <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-black/80 backdrop-blur-md">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-dark-elevated rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                    <SkipBack className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <Youtube className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-lg">Video to Recipe</span>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            <div className="max-w-4xl w-full px-6 pb-24 space-y-8 animate-fade-in">

                {/* Initial Input State (Always visible until recipe generated, or move up if generated) */}
                <div className={`transition-all duration-500 ${recipe ? 'hidden' : 'flex flex-col items-center py-20'}`}>
                    <div className="text-center space-y-6 max-w-lg mx-auto">
                        <div className="w-24 h-24 bg-gradient-to-tr from-red-600 to-pink-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-red-900/40 mb-6">
                            <FileText className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Summarize Any Recipe Video
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Paste a YouTube link and get a structured, easy-to-read recipe summary instantly. No more pausing and rewinding.
                        </p>

                        <div className="w-full space-y-4 pt-4">
                            <div className="relative group">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Paste YouTube Link here..."
                                    className="w-full bg-dark-card border border-dark-border rounded-xl py-5 pl-12 pr-4 text-white text-lg placeholder:text-gray-600 focus:border-red-500 focus:outline-none transition-all shadow-lg shadow-black/50"
                                />
                            </div>

                            <button
                                onClick={() => handleAnalyze()}
                                disabled={!url || isAnalyzing}
                                className="w-full py-5 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl shadow-red-900/20"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing Video...
                                    </>
                                ) : (
                                    <>Summarize Recipe <FileText className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>

                        <div className="pt-8 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleAnalyze('https://www.youtube.com/watch?v=JpCjC1gR9Bw')}
                                className="p-4 bg-dark-card border border-dark-border rounded-xl text-left hover:border-red-500/50 transition-colors group"
                            >
                                <span className="text-xs text-red-400 font-bold uppercase tracking-wider block mb-1">Try Example</span>
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Gordon Ramsay Pasta</span>
                            </button>
                            <button
                                onClick={() => handleAnalyze('https://www.youtube.com/watch?v=2sX4fCggtWs')}
                                className="p-4 bg-dark-card border border-dark-border rounded-xl text-left hover:border-red-500/50 transition-colors group"
                            >
                                <span className="text-xs text-red-400 font-bold uppercase tracking-wider block mb-1">Try Example</span>
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Classic Carbonara</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recipe Layout */}
                {recipe && (
                    <div className="animate-slide-up space-y-8 max-w-3xl mx-auto">

                        {/* Title Card */}
                        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <ChefHat className="w-24 h-24 text-white/5 rotate-12" />
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                                {recipe.title}
                            </h1>
                            <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                {recipe.description}
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-dark-elevated px-4 py-2 rounded-lg text-sm font-medium text-gray-300">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    {recipe.totalTime}
                                </div>
                                <div className="flex items-center gap-2 bg-dark-elevated px-4 py-2 rounded-lg text-sm font-medium text-gray-300">
                                    <List className="w-4 h-4 text-orange-400" />
                                    {recipe.ingredients.length} Ingredients
                                </div>
                                {url && (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-red-600/10 text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600/20 transition-colors border border-red-600/20"
                                    >
                                        <Youtube className="w-4 h-4" />
                                        Watch Original Video
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">

                            {/* Ingredients Column */}
                            <div className="md:col-span-1 space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white/90">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                        <List className="w-4 h-4 text-orange-400" />
                                    </div>
                                    Ingredients
                                </h3>
                                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden divide-y divide-dark-border/50">
                                    {recipe.ingredients.map((ing, i) => (
                                        <div key={i} className="p-4 text-sm text-gray-300 hover:bg-dark-elevated transition-colors flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                            {ing}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Steps Column */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white/90">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <ChefHat className="w-4 h-4 text-blue-400" />
                                    </div>
                                    Instructions
                                </h3>
                                <div className="space-y-4">
                                    {recipe.steps.map((step, index) => (
                                        <div
                                            key={index}
                                            className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />
                                            <div className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/20">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <h4 className="font-bold text-gray-200 mb-1 text-lg">
                                                        {step.instruction}
                                                    </h4>
                                                    <p className="text-gray-400 text-sm leading-relaxed">
                                                        {step.explanation}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => {
                                    setRecipe(null);
                                    setUrl('');
                                }}
                                className="px-6 py-3 bg-dark-elevated border border-dark-border rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-all"
                            >
                                Summarize Another Video
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
