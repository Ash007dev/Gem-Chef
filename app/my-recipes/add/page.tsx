'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Minus,
    Camera,
    Mic,
    MicOff,
    FileText,
    Save,
    Loader2,
    Sparkles,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { parseRecipeText, fileToBase64, UserRecipe } from '@/utils/gemini';

type Tab = 'manual' | 'voice' | 'import';

function AddRecipeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    /* ─── Active tab ─── */
    const [activeTab, setActiveTab] = useState<Tab>('manual');

    /* ─── Manual form state ─── */
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [servings, setServings] = useState('4 servings');
    const [prepTime, setPrepTime] = useState('15 min');
    const [cookTime, setCookTime] = useState('30 min');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
    const [ingredients, setIngredients] = useState<string[]>(['']);
    const [steps, setSteps] = useState<string[]>(['']);
    const [photo, setPhoto] = useState<string | null>(null);

    /* ─── Voice state ─── */
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    /* ─── Text import state ─── */
    const [importText, setImportText] = useState('');

    /* ─── AI parsing state ─── */
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    /* ─── Load recipe for editing ─── */
    useEffect(() => {
        if (editId) {
            const saved = localStorage.getItem('smartchef_my_recipes');
            if (saved) {
                const recipes: UserRecipe[] = JSON.parse(saved);
                const recipe = recipes.find(r => r.id === editId);
                if (recipe) {
                    setTitle(recipe.title);
                    setDescription(recipe.description || '');
                    setServings(recipe.servings);
                    setPrepTime(recipe.prepTime);
                    setCookTime(recipe.cookTime);
                    setDifficulty(recipe.difficulty);
                    setIngredients(recipe.ingredients.length ? recipe.ingredients : ['']);
                    setSteps(recipe.steps.length ? recipe.steps : ['']);
                    setPhoto(recipe.photo || null);
                }
            }
        }
    }, [editId]);

    /* ─── Photo handler ─── */
    const photoInputRef = useRef<HTMLInputElement>(null);
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const { base64, mimeType } = await fileToBase64(file);
        setPhoto(`data:${mimeType};base64,${base64}`);
    };

    /* ─── Ingredient / Step list helpers ─── */
    const addIngredient = () => setIngredients(prev => [...prev, '']);
    const removeIngredient = (idx: number) => setIngredients(prev => prev.filter((_, i) => i !== idx));
    const updateIngredient = (idx: number, val: string) =>
        setIngredients(prev => prev.map((v, i) => (i === idx ? val : v)));

    const addStep = () => setSteps(prev => [...prev, '']);
    const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx));
    const updateStep = (idx: number, val: string) =>
        setSteps(prev => prev.map((v, i) => (i === idx ? val : v)));

    /* ─── Voice Recognition ─── */
    function createRecognition() {
        const SpeechRecognitionCtor = (window as unknown as Record<string, unknown>).SpeechRecognition ||
            (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognitionCtor as any)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        return recognition;
    }

    const startListening = () => {
        const recognition = createRecognition();
        if (!recognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }
        recognitionRef.current = recognition;
        let finalTranscript = voiceTranscript;

        recognition.onresult = (event: { results: { transcript: string; isFinal: boolean }[][] }) => {
            let interim = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i][0].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setVoiceTranscript(finalTranscript + interim);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.start();
        setIsListening(true);
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    /* ─── AI Parse (voice / text import) ─── */
    const handleAIParse = async (text: string, source: 'voice' | 'text-import') => {
        if (!text.trim()) {
            setError('Please provide some text to parse.');
            return;
        }
        setParsing(true);
        setError('');
        try {
            const parsed = await parseRecipeText(text);
            // Fill form with parsed data
            setTitle(parsed.title || '');
            setDescription(parsed.description || '');
            setServings(parsed.servings || '4 servings');
            setPrepTime(parsed.prepTime || '15 min');
            setCookTime(parsed.cookTime || '30 min');
            setDifficulty(parsed.difficulty || 'Easy');
            setIngredients(parsed.ingredients?.length ? parsed.ingredients : ['']);
            setSteps(parsed.steps?.length ? parsed.steps : ['']);
            // Switch to manual tab so user can review/edit
            setActiveTab('manual');
            setToast('Recipe parsed! Review and save below.');
            setTimeout(() => setToast(''), 3000);
        } catch {
            setError('Failed to parse recipe. Please try again or enter manually.');
        } finally {
            setParsing(false);
        }
    };

    /* ─── Save recipe ─── */
    const handleSave = () => {
        if (!title.trim()) {
            setError('Please enter a recipe title.');
            return;
        }
        const cleanIngredients = ingredients.filter(i => i.trim());
        const cleanSteps = steps.filter(s => s.trim());
        if (cleanIngredients.length === 0) {
            setError('Please add at least one ingredient.');
            return;
        }
        if (cleanSteps.length === 0) {
            setError('Please add at least one step.');
            return;
        }

        setSaving(true);
        setError('');

        const existing: UserRecipe[] = JSON.parse(localStorage.getItem('smartchef_my_recipes') || '[]');

        if (editId) {
            // Update existing recipe
            const idx = existing.findIndex(r => r.id === editId);
            if (idx !== -1) {
                existing[idx] = {
                    ...existing[idx],
                    title: title.trim(),
                    description: description.trim() || `A delicious ${title.trim()} recipe`,
                    servings,
                    prepTime,
                    cookTime,
                    difficulty,
                    ingredients: cleanIngredients,
                    steps: cleanSteps,
                    photo: photo || undefined,
                };
            }
        } else {
            // Create new recipe
            const newRecipe: UserRecipe = {
                id: `my_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                title: title.trim(),
                description: description.trim() || `A delicious ${title.trim()} recipe`,
                servings,
                prepTime,
                cookTime,
                difficulty,
                ingredients: cleanIngredients,
                steps: cleanSteps,
                photo: photo || undefined,
                createdAt: new Date().toISOString(),
                source: activeTab === 'manual' ? 'manual' : activeTab === 'voice' ? 'voice' : 'text-import',
            };
            existing.unshift(newRecipe);
        }

        localStorage.setItem('smartchef_my_recipes', JSON.stringify(existing));

        setSaving(false);
        router.push('/my-recipes');
    };

    const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
        { key: 'manual', label: 'Manual', icon: FileText },
        { key: 'voice', label: 'Voice', icon: Mic },
        { key: 'import', label: 'Import Text', icon: Sparkles },
    ];

    return (
        <div className="min-h-screen bg-black px-5 pt-12 pb-24">
            {/* Header */}
            <header className="flex items-center gap-3 mb-6">
                <button onClick={() => router.back()} className="text-gray-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-white">{editId ? 'Edit Recipe' : 'Add Recipe'}</h1>
            </header>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                ? 'bg-white text-black'
                                : 'bg-dark-card border border-dark-border text-gray-400'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <X className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* ─── Voice Tab ─── */}
            {activeTab === 'voice' && (
                <div className="space-y-4 animate-fade-in">
                    <p className="text-gray-400 text-sm">
                        Speak your recipe naturally. AI will structure it into proper format.
                    </p>

                    {/* Mic button */}
                    <div className="flex justify-center py-6">
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening
                                ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30'
                                : 'bg-white text-black'
                                }`}
                        >
                            {isListening
                                ? <MicOff className="w-8 h-8 text-white" />
                                : <Mic className="w-8 h-8" />
                            }
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-500">
                        {isListening ? 'Listening... tap to stop' : 'Tap to start speaking'}
                    </p>

                    {/* Transcript */}
                    {voiceTranscript && (
                        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                            <p className="text-gray-400 text-xs font-medium mb-2">Transcript</p>
                            <p className="text-white text-sm leading-relaxed">{voiceTranscript}</p>
                        </div>
                    )}

                    {/* Parse button */}
                    {voiceTranscript && !isListening && (
                        <button
                            onClick={() => handleAIParse(voiceTranscript, 'voice')}
                            disabled={parsing}
                            className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {parsing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Parsing with AI...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Structure with AI</>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* ─── Import Text Tab ─── */}
            {activeTab === 'import' && (
                <div className="space-y-4 animate-fade-in">
                    <p className="text-gray-400 text-sm">
                        Paste a WhatsApp message, notes, or any text. AI will format it into a recipe.
                    </p>

                    <textarea
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        placeholder="Paste your recipe text here...&#10;&#10;e.g. My grandma's dal recipe - take 1 cup toor dal, 2 tomatoes, 1 onion chopped, add turmeric, salt, cook in pressure cooker 3 whistles, then temper with cumin mustard seeds curry leaves..."
                        className="w-full h-48 px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
                    />

                    <button
                        onClick={() => handleAIParse(importText, 'text-import')}
                        disabled={parsing || !importText.trim()}
                        className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {parsing ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Parsing with AI...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Parse &amp; Structure</>
                        )}
                    </button>
                </div>
            )}

            {/* ─── Manual Form Tab ─── */}
            {activeTab === 'manual' && (
                <div className="space-y-5 animate-fade-in">
                    {/* Photo */}
                    <div>
                        {photo ? (
                            <div className="relative">
                                <img src={photo} alt="Recipe" className="w-full h-48 object-cover rounded-xl" />
                                <button
                                    onClick={() => setPhoto(null)}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-dark-border rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-500 transition-colors"
                            >
                                <Camera className="w-6 h-6" />
                                <span className="text-sm">Add photo (optional)</span>
                            </button>
                        )}
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">Recipe Name *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Grandma's Dal Tadka"
                            className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="A short description of the dish"
                            className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Meta row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Servings</label>
                            <input
                                type="text"
                                value={servings}
                                onChange={e => setServings(e.target.value)}
                                className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Prep Time</label>
                            <input
                                type="text"
                                value={prepTime}
                                onChange={e => setPrepTime(e.target.value)}
                                className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Cook Time</label>
                            <input
                                type="text"
                                value={cookTime}
                                onChange={e => setCookTime(e.target.value)}
                                className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-gray-500"
                            />
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">Difficulty</label>
                        <div className="flex gap-2">
                            {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${difficulty === d
                                        ? 'bg-white text-black'
                                        : 'bg-dark-card border border-dark-border text-gray-400'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                            Ingredients * ({ingredients.filter(i => i.trim()).length})
                        </label>
                        <div className="space-y-2">
                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ing}
                                        onChange={e => updateIngredient(idx, e.target.value)}
                                        placeholder={`Ingredient ${idx + 1}, e.g. 2 cups rice`}
                                        className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500"
                                    />
                                    {ingredients.length > 1 && (
                                        <button
                                            onClick={() => removeIngredient(idx)}
                                            className="w-12 flex items-center justify-center bg-dark-card border border-dark-border rounded-xl text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addIngredient}
                            className="mt-2 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add ingredient
                        </button>
                    </div>

                    {/* Steps */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                            Steps * ({steps.filter(s => s.trim()).length})
                        </label>
                        <div className="space-y-2">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <div className="w-8 h-12 flex items-center justify-center text-gray-500 text-sm font-medium flex-shrink-0">
                                        {idx + 1}.
                                    </div>
                                    <textarea
                                        value={step}
                                        onChange={e => updateStep(idx, e.target.value)}
                                        placeholder={`Step ${idx + 1}`}
                                        rows={2}
                                        className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none"
                                    />
                                    {steps.length > 1 && (
                                        <button
                                            onClick={() => removeStep(idx)}
                                            className="w-10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addStep}
                            className="mt-2 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add step
                        </button>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-white text-black rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {editId ? 'Updating...' : 'Saving...'}</>
                        ) : (
                            <><Save className="w-4 h-4" /> {editId ? 'Update Recipe' : 'Save Recipe'}</>
                        )}
                    </button>
                </div>
            )}

            {/* Success Toast */}
            {toast && (
                <div className="fixed bottom-24 left-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg animate-slide-up">
                    <Sparkles className="w-4 h-4" />
                    {toast}
                </div>
            )}
        </div>
    );
}

export default function AddRecipePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AddRecipeContent />
        </Suspense>
    );
}
