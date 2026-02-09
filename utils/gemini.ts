import { GoogleGenerativeAI } from '@google/generative-ai';

// Support multiple API keys for automatic rotation when quota is exhausted
// Set GEMINI_API_KEYS as comma-separated keys, or fall back to single GEMINI_API_KEY
const API_KEYS: string[] = (
    process.env.GEMINI_API_KEYS?.split(',').map(k => k.trim()).filter(Boolean) ||
    [process.env.GEMINI_API_KEY || '']
).filter(k => k.length > 0);

// Track which API key is currently active
let currentKeyIndex = 0;

// Create a new client for a given key index
function getClient(keyIndex: number): GoogleGenerativeAI {
    return new GoogleGenerativeAI(API_KEYS[keyIndex % API_KEYS.length]);
}

// Initialize with first key
let genAI = getClient(0);

// Rotate to the next API key
function rotateApiKey(): boolean {
    if (API_KEYS.length <= 1) return false;
    const prevIndex = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    // If we've cycled back to the start, all keys are exhausted
    if (currentKeyIndex === 0 && prevIndex !== 0) {
        console.warn('[GemChef] All API keys exhausted, cycling back to first');
    }
    genAI = getClient(currentKeyIndex);
    console.log(`[GemChef] Rotated to API key #${currentKeyIndex + 1} of ${API_KEYS.length}`);
    return true;
}

// Priority ordered Gemini models — extensive fallback chain
// If one model hits rate/quota limits, the next is tried silently
const MODEL_PRIORITY: string[] = [
    'gemini-3-pro-preview',       // Latest - most capable
    'gemini-3-flash-preview',     // Latest fast model
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-2.0-flash-thinking-exp',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-001',
];

// Track which model last succeeded so we start there next time
let lastWorkingModelIndex = 0;

// Detect if an error is a rate-limit / quota / unavailability issue
function isRetryableError(error: unknown): boolean {
    const msg = String(error).toLowerCase();
    return (
        msg.includes('429') ||
        msg.includes('rate') ||
        msg.includes('quota') ||
        msg.includes('resource_exhausted') ||
        msg.includes('resource has been exhausted') ||
        msg.includes('limit') ||
        msg.includes('overloaded') ||
        msg.includes('unavailable') ||
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('internal') ||
        msg.includes('capacity') ||
        msg.includes('too many requests') ||
        msg.includes('try again') ||
        msg.includes('not found') ||
        msg.includes('404') ||
        msg.includes('deprecated') ||
        msg.includes('permission') ||
        msg.includes('billing')
    );
}

// Helper to try models in sequence with API key rotation — completely silent
async function generateWithFallback<T>(
    operation: (modelName: string) => Promise<T>,
    context: string
): Promise<T> {
    let lastError: unknown;
    const totalKeys = API_KEYS.length;
    let keysTriedCount = 0;
    const startKeyIndex = currentKeyIndex;

    // Outer loop: try each API key
    while (keysTriedCount < totalKeys) {
        // Build an ordered list starting from the last working model
        const orderedModels = [
            ...MODEL_PRIORITY.slice(lastWorkingModelIndex),
            ...MODEL_PRIORITY.slice(0, lastWorkingModelIndex),
        ];

        let allModelsFailedWithQuota = true;

        for (let i = 0; i < orderedModels.length; i++) {
            const modelName = orderedModels[i];
            try {
                console.log(`[GemChef] Key #${currentKeyIndex + 1} → ${modelName} for ${context}`);
                const result = await operation(modelName);
                lastWorkingModelIndex = MODEL_PRIORITY.indexOf(modelName);
                console.log(`[GemChef] ✓ ${modelName} succeeded for ${context}`);
                return result;
            } catch (error) {
                console.warn(`[GemChef] ✗ ${modelName} failed for ${context}:`, error);
                lastError = error;

                // If this is a quota/rate error, all models on this key will fail
                if (isRetryableError(error)) {
                    // Skip remaining models on this key, rotate to next key
                    break;
                }
                // For non-quota errors (bad JSON, etc.), try next model on same key
                allModelsFailedWithQuota = false;
            }
        }

        // Try rotating to a different API key
        keysTriedCount++;
        if (keysTriedCount < totalKeys) {
            rotateApiKey();
        }
    }

    // If every key + model combo failed, throw the last error
    throw lastError || new Error(`All API keys and models failed for ${context}`);
}

// System instruction for food scanning
const SYSTEM_INSTRUCTION = `You are a food scanner. Your job is to identify edible ingredients visible in the image.
Rules:
- Only identify food items and cooking ingredients
- Ignore non-food items like plates, utensils, packaging
- Be specific (e.g., "red bell pepper" instead of just "pepper")
- Return ONLY raw JSON in this exact format: { "ingredients": ["item1", "item2", ...] }
- If no food is visible, return: { "ingredients": [] }`;

export interface IngredientResponse {
    ingredients: string[];
}

/**
 * Identifies food ingredients in an image using Gemini Vision with fallback
 */
export async function identifyIngredients(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<IngredientResponse> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = "Identify all ingredients in this image. Return valid JSON.";
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as IngredientResponse;
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'identifyIngredients');
}

/**
 * Helper to convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/jpeg;base64, prefix
            const base64 = result.split(',')[1];
            const mimeType = result.match(/:(.*?);/)?.[1] || 'image/jpeg';
            resolve({ base64, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

export interface Recipe {
    id: string;
    title: string;
    description: string;
    prepTime: string;
    cookTime: string;
    totalTime: string;
    servings: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    calories: string;
    type: 'quick' | 'traditional' | 'healthy' | 'comfort' | 'fusion' | 'simple' | 'regional';
    isRegional?: boolean;
    pairingsuggestion?: string;
    healthNotes?: string;
    ingredients: {
        provided: string[];
        shoppingList: string[];
    };
    steps: string[];
    mealPrep: string[];
}

/**
 * Generates recipes based on ingredients, context, style and preferences with fallback
 * Returns 3 regional signature dishes + 6 regular recipes
 */
export async function generateRecipes(
    ingredients: string[],
    context: {
        meal?: string;
        dietary?: string;
        location?: string;
        style?: string;
        cuisine?: string;
        ageGroup?: string;
        // Health profile
        healthConditions?: string[];
        allergies?: string[];
        // Time filter (Quick Cook feature)
        // Time filter (Quick Cook feature)
        maxTime?: number | null;
        // Specific dish mode
        dishName?: string;
        description?: string;
    } = {}
): Promise<Recipe[]> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.8
            }
        });

        const {
            meal = 'any',
            dietary = 'both',
            location = '',
            style = 'Quick & Easy',
            cuisine = 'Same as Location',
            ageGroup = 'Adult (20-59)',
            healthConditions = [],
            allergies = [],
            maxTime = null,
            dishName = '',
            description = ''
        } = context;

        // Determine the cuisine to use
        const effectiveCuisine = cuisine === 'Same as Location' ? location : cuisine;

        // Build health constraint prompt
        let healthConstraint = '';
        if (healthConditions.length > 0 || allergies.length > 0) {
            healthConstraint = `
        *** CRITICAL HEALTH PROFILE - SAFETY REQUIREMENTS ***
        ${healthConditions.length > 0 ? `
        The user has the following HEALTH CONDITIONS: ${healthConditions.join(', ')}
        
        Recipe requirements based on health conditions:
        ${healthConditions.includes('Diabetes') ? '- DIABETES: Avoid high-sugar ingredients, white rice, white bread, potatoes, maida. Prefer whole grains, millets, low-GI foods. No desserts with refined sugar or jaggery.' : ''}
        ${healthConditions.includes('Hypertension') ? '- HYPERTENSION: Minimize salt/sodium. Avoid pickles, papad, processed foods, soy sauce. Use herbs and spices for flavor instead.' : ''}
        ${healthConditions.includes('High Cholesterol') ? '- HIGH CHOLESTEROL: Avoid fried foods, ghee, butter, full-fat dairy, red meat, organ meats. Prefer olive oil, lean proteins.' : ''}
        ${healthConditions.includes('PCOD/PCOS') ? '- PCOD/PCOS: Avoid refined carbs, sugary foods, dairy. Include anti-inflammatory foods, lean proteins, fiber-rich ingredients.' : ''}
        ${healthConditions.includes('Thyroid') ? '- THYROID: Limit cruciferous vegetables (raw cabbage, broccoli, cauliflower), soy products. Include selenium-rich foods, iodized salt in moderation.' : ''}
        ${healthConditions.includes('Heart Disease') ? '- HEART DISEASE: No fried foods, limit sodium, avoid saturated fats. Include omega-3 rich foods, whole grains, vegetables.' : ''}
        ${healthConditions.includes('Kidney Issues') ? '- KIDNEY ISSUES: Limit potassium (bananas, potatoes, tomatoes), phosphorus (dairy, nuts), and sodium. Control protein portions.' : ''}
        ${healthConditions.includes('Uric Acid/Gout') ? '- URIC ACID/GOUT: Avoid high-purine foods: organ meats, red meat, shellfish, sardines, anchovies, mushrooms, spinach, cauliflower, rajma, chole. Limit dal intake. No alcohol-based cooking.' : ''}
        ${healthConditions.includes('Fatty Liver') ? '- FATTY LIVER: No fried foods, avoid added sugars, limit refined carbs. No alcohol. Prefer high-fiber foods, lean proteins, green vegetables.' : ''}
        ${healthConditions.includes('Gastritis/Acidity') ? '- GASTRITIS/ACIDITY: Avoid spicy foods, excessive chili, too much oil. No raw onion, garlic on empty stomach. Avoid citrus, tomatoes, vinegar. Prefer mild, easy-to-digest foods.' : ''}
        ${healthConditions.includes('Lactose Intolerance') ? '- LACTOSE INTOLERANCE: No milk, cream, paneer, khoya, rabri. Avoid milk-based desserts. Curd/yogurt in small amounts may be okay. Use plant-based alternatives.' : ''}
        ${healthConditions.includes('Pregnancy') ? '- PREGNANCY: No raw/undercooked foods, unpasteurized dairy, raw papaya, excessive caffeine. Avoid ajinomoto, artificial colors. Include iron-rich foods, folate, calcium.' : ''}
        ${healthConditions.includes('Post-Surgery') ? '- POST-SURGERY: Easy-to-digest foods only. No heavy, fried, spicy foods. Soft, well-cooked meals. Include protein for healing. Avoid gas-forming foods initially.' : ''}
        ` : ''}
        
        ${allergies.length > 0 ? `
        The user has the following ALLERGIES: ${allergies.join(', ')}
        
        ABSOLUTELY DO NOT include these ingredients or any derivatives:
        ${allergies.includes('Nuts') ? '- NO NUTS: almonds, cashews, walnuts, pistachios, hazelnuts, pecans, macadamia, nut oils, nut butters, badam, kaju' : ''}
        ${allergies.includes('Peanuts') ? '- NO PEANUTS: peanuts, peanut oil, peanut butter, groundnut, moongphali' : ''}
        ${allergies.includes('Dairy') ? '- NO DAIRY: milk, cream, butter, ghee, cheese, paneer, yogurt, curd, whey, casein, khoya, rabri, malai' : ''}
        ${allergies.includes('Gluten') ? '- NO GLUTEN: wheat, barley, rye, semolina, rava, maida, regular soy sauce, most bread/pasta/roti. Use rice, millets (bajra, jowar, ragi), or certified gluten-free alternatives.' : ''}
        ${allergies.includes('Eggs') ? '- NO EGGS: eggs, mayonnaise, egg noodles, dishes with egg wash or egg binding' : ''}
        ${allergies.includes('Shellfish') ? '- NO SHELLFISH: shrimp, prawns, crab, lobster, oysters, mussels, clams, scallops, jhinga' : ''}
        ${allergies.includes('Soy') ? '- NO SOY: soy sauce, tofu, tempeh, edamame, soy milk, soy lecithin' : ''}
        ${allergies.includes('Fish') ? '- NO FISH: any fish, fish sauce, fish oil, anchovy paste' : ''}
        ${allergies.includes('Sesame') ? '- NO SESAME: sesame seeds, tahini, sesame oil, til, til ka tel' : ''}
        ${allergies.includes('Coconut') ? '- NO COCONUT: coconut, coconut milk, coconut oil, coconut cream, nariyal, copra' : ''}
        ${allergies.includes('Mustard') ? '- NO MUSTARD: mustard seeds, mustard oil, sarson, rai, mustard paste' : ''}
        ${allergies.includes('Asafoetida (Hing)') ? '- NO ASAFOETIDA: hing, heeng - commonly used in Indian tempering' : ''}
        ${allergies.includes('Tamarind') ? '- NO TAMARIND: tamarind, imli, tamarind paste, kokum' : ''}
        ${allergies.includes('Fenugreek (Methi)') ? '- NO FENUGREEK: methi seeds, methi leaves, kasuri methi, fenugreek powder' : ''}
        
        Double-check EVERY ingredient to ensure no allergens are present, including hidden sources.
        ` : ''}
        
        For each recipe, include a "healthNotes" field explaining why this recipe is suitable for the user's health profile.
        `;
        }

        // Map cooking style to recipe generation hints
        const styleHints: Record<string, string> = {
            'Quick & Easy': 'Focus on recipes under 30 minutes with minimal prep',
            'Restaurant Style': 'Chef-level techniques, restaurant presentation, gourmet flavors',
            'Healthy': 'Low calorie, nutritious, balanced meals with health benefits',
            'Comfort Food': 'Hearty, homestyle, soul-warming dishes'
        };

        // Build age-specific prompt block
        let ageConstraint = '';
        let ageRecipeOverride = ''; // Override recipe categories for very young children

        if (ageGroup.includes('Baby')) {
            ageConstraint = `
        *** CRITICAL: COOKING FOR A BABY (0-2 YEARS OLD) ***
        ALL 9 recipes MUST be age-appropriate baby food. This is non-negotiable.
        ONLY generate these types of baby-safe foods:
        - Porridges (rice porridge, oat porridge, ragi porridge, dal porridge)
        - Purees (fruit puree, vegetable puree, mixed puree)
        - Mashed foods (mashed banana, mashed potato, mashed avocado, mashed dal-rice)
        - Soft khichdi (rice + lentil cooked very soft with mild spices)
        - Soups (strained, smooth vegetable or lentil soups)
        - Cerelac-style homemade cereal mixes
        - Soft idli, soft dosa pieces soaked in mild rasam
        
        ABSOLUTELY FORBIDDEN for babies:
        - NO salt (babies under 1 year) or very minimal salt (1-2 years)
        - NO honey (toxic for babies under 1)
        - NO sugar or jaggery for babies under 1
        - NO whole nuts, seeds, or chunks (choking hazard)
        - NO spicy food, chili, pepper
        - NO raw vegetables or hard fruits
        - NO cow's milk as main drink (under 1 year)
        - NO fried food
        - NO stews, curries, or adult dishes - even "mild" ones
        
        Every recipe must specify the exact age range it's suitable for (e.g., "6+ months", "8+ months", "12+ months").
        Texture must be explicitly stated: "smooth puree", "mashed with small soft lumps", "soft finger food".
        `;
            ageRecipeOverride = `
        GENERATE 9 BABY FOOD RECIPES (ignore the style/regional categories above):
        1. Simple Grain Porridge (rice/oat/ragi)
        2. Fruit Puree (banana/apple/pear)
        3. Vegetable Puree (carrot/sweet potato/pumpkin)
        4. Dal + Rice Mash (soft khichdi)
        5. Mixed Fruit & Veggie Puree
        6. Protein-Rich Baby Food (lentil/moong dal based)
        7. Cereal Mix / Sathu Maavu style porridge
        8. Soft Finger Foods (for 10+ months)
        9. Soup / Strained Broth

        Mark the first 3 as isRegional: true (use regional baby food traditions from ${effectiveCuisine || 'the user\'s region'}).
        `;
        } else if (ageGroup.includes('Toddler')) {
            ageConstraint = `
        *** CRITICAL: COOKING FOR A TODDLER (2-5 YEARS OLD) ***
        ALL 9 recipes must be toddler-appropriate. This is non-negotiable.
        ONLY generate these types of toddler-safe foods:
        - Soft porridges and upma
        - Mini idlis, soft dosa, soft chapati pieces
        - Soft rice with mild dal/sambar
        - Mashed/soft vegetables (not raw)
        - Mild pasta, soft noodles cut small
        - Pancakes, soft uttapam
        - Soft fruit bowls, smoothies
        - Mild soups with soft vegetables
        - Soft sandwiches, soft parathas
        - Kheer, payasam (mild, not too sweet)
        
        FORBIDDEN for toddlers:
        - NO whole nuts, whole grapes, popcorn, hard candy (choking hazards)
        - NO very spicy food (minimal mild spices only - turmeric, cumin are OK)
        - NO fried or deep-fried foods
        - NO raw vegetables or hard chunks
        - NO caffeine or carbonated drinks
        - NO heavy/rich restaurant-style food
        
        All food must be in small, bite-sized, soft pieces.
        Keep flavors mild and appealing to young children.
        `;
            ageRecipeOverride = `
        GENERATE 9 TODDLER-FRIENDLY RECIPES (adapt categories to be toddler-safe):
        1. Soft Porridge / Cereal (regional style)
        2. Mild Rice + Dal Combo
        3. Soft Regional Snack (mini idli, soft dosa, etc.)
        4. Veggie Mash or Soft Veggie Dish
        5. Toddler-Friendly Pasta/Noodles (soft, small pieces)
        6. Soft Pancake / Uttapam
        7. Mild Soup with Soft Veggies
        8. Healthy Smoothie / Fruit Bowl
        9. Soft Finger Food Platter

        Mark the first 3 as isRegional: true (use regional toddler foods from ${effectiveCuisine || 'the user\'s region'}).
        `;
        } else if (ageGroup.includes('Kid')) {
            ageConstraint = `
        - Cooking for children aged 5-12. Make recipes FUN, colorful, and appealing to kids.
        - Use mild spice levels. Include fun names and presentation ideas.
        - Ensure nutritious but tasty - hide vegetables creatively if needed.
        - Avoid very spicy, bitter, or complex flavors kids typically dislike.
        `;
        } else if (ageGroup.includes('Teen')) {
            ageConstraint = `
        - Cooking for teenagers (13-19). High-energy, protein-rich meals for growing bodies.
        - Can include moderate spice. Make recipes trendy and appealing (think wraps, bowls, loaded items).
        - Include quick snack options teens can make themselves.
        `;
        } else if (ageGroup.includes('Senior')) {
            ageConstraint = `
        - Cooking for seniors (60+). Easy-to-digest, soft-textured, low-sodium, low-oil meals.
        - Heart-healthy and gentle on the stomach. Avoid very spicy, deep-fried, or heavy foods.
        - Prefer steamed, boiled, lightly sautéed preparations. Include fiber and calcium-rich options.
        `;
        } else {
            ageConstraint = '- Standard adult portions and spice levels.';
        }

        const prompt = `
        You are a professional chef creating recipes for COMPLETE BEGINNERS who have never cooked before.
        
        Context:
        ${dishName
                ? `- The user wants to cook a specific dish: "${dishName}"
               - Description/Memory: "${description}"
               - IGNORE the "Available ingredients" list as the user wants this specific dish.`
                : `- Available ingredients: ${ingredients.join(', ')}`
            }
        - Meal time: ${meal}
        - Dietary preference: ${dietary === 'Veg' ? 'STRICTLY VEGETARIAN ONLY - absolutely NO meat, chicken, fish, seafood, eggs, or any non-vegetarian ingredient whatsoever. Only pure vegetarian dishes using vegetables, grains, legumes, dairy (milk, cheese, paneer, butter, ghee, curd/yogurt), nuts, and plant-based ingredients.' : dietary === 'Non-Veg' ? 'Non-vegetarian preferred (meat, chicken, fish, seafood, eggs allowed)' : 'No restriction (both vegetarian and non-vegetarian OK)'}
        - Cooking style: ${style} - ${styleHints[style] || 'Balanced approach'}
        - Cooking for age group: ${ageGroup}
        ${ageConstraint}
        ${healthConstraint}
        ${maxTime ? `
        *** STRICT TIME CONSTRAINT - QUICK COOK MODE ***
        The user has ONLY ${maxTime} MINUTES to cook. This is a hard limit.
        ALL 9 recipes MUST have a total cooking time (prep + cook) of ${maxTime} minutes OR LESS.
        
        - For ${maxTime <= 15 ? 'ultra-quick recipes: Focus on no-cook, microwave, or single-pan dishes that can be ready in 15 minutes or less.' :
                    maxTime <= 30 ? 'quick recipes: Focus on simple preparations, minimal steps, quick-cooking ingredients.' :
                        maxTime <= 45 ? 'moderate recipes: Allow for slightly more complex preparations, but still efficient cooking methods.' :
                            'standard recipes: Full recipes are acceptable, but avoid slow-cooking or multi-hour preparations.'}
        
        The "time" field in the JSON must be "${maxTime} min" or less for EVERY recipe.
        If a dish traditionally takes longer, suggest a quick version or alternative.
        ` : ''}
        ${effectiveCuisine ? `- Cuisine/Region: ${effectiveCuisine}` : ''}
        
        ${dietary === 'Veg' ? `*** EXTREMELY IMPORTANT DIETARY CONSTRAINT ***
        The user is VEGETARIAN. Every single one of the 9 recipes MUST be 100% vegetarian.
        Do NOT include ANY of these: meat, chicken, mutton, lamb, pork, beef, fish, shrimp, prawn, crab, lobster, squid, eggs, gelatin, or any animal-derived ingredients (dairy like milk, paneer, cheese, butter, ghee, yogurt IS allowed).
        If a regional dish is traditionally non-vegetarian, replace it with a famous VEGETARIAN dish from that region instead.
        Double-check every recipe and every ingredient to ensure strict vegetarian compliance.
        ` : ''}

        ${dishName ? `
        GENERATE 9 RECIPES FOR "${dishName}":
        1. The Authentic/Classic Version of ${dishName} (isRegional: true)
        2. ${dishName} with a Twist (Fusion or Modern) (isRegional: true)
        3. A Healthy/Lighter Version of ${dishName} (isRegional: true)
        4-9. Other variations or similar dishes from the same cuisine/style.
        ` :
                `
        ${ageRecipeOverride ? ageRecipeOverride : `GENERATE 9 RECIPES TOTAL:
        
        FIRST 3 - REGIONAL SIGNATURE DISHES (isRegional: true):
        ${effectiveCuisine ? `Top 3 must-try dishes from ${effectiveCuisine} cuisine. These are iconic, signature dishes of the region.` : 'Top 3 popular dishes from the user\'s region.'}
        
        NEXT 6 - REGULAR RECIPES based on "${style}" style:
        ${style === 'Quick & Easy' ?
                        '4. Super Quick (15 min), 5. Easy Weeknight, 6. No-Cook/Minimal, 7. One-Pan, 8. 5-Ingredient, 9. Microwave-Friendly' :
                        style === 'Restaurant Style' ?
                            '4. Fine Dining, 5. Professional Plating, 6. Complex Flavors, 7. Gourmet Fusion, 8. Chef\'s Special, 9. Signature Dish' :
                            style === 'Healthy' ?
                                '4. Low-Carb, 5. High-Protein, 6. Superfood Bowl, 7. Clean Eating, 8. Meal Prep Friendly, 9. Light & Fresh' :
                                '4. Nostalgic Home Cooking, 5. Hearty One-Pot, 6. Creamy & Rich, 7. Fried Favorites, 8. Slow-Cooked, 9. Family Recipe Style'
                    }
        `}
        `}

        CRITICAL REQUIREMENTS FOR BEGINNER-FRIENDLY RECIPES:
        
        1. STEPS MUST BE EXTREMELY DETAILED - Write as if teaching someone who has NEVER cooked before:
           - Specify exact temperatures (low/medium/high heat, or degrees)
           - Include visual and sensory cues: "until golden brown", "when it starts to bubble", "until fragrant about 30 seconds"
           - Explain techniques: "Sauté means to cook quickly in a small amount of oil while stirring"
           - Include timing for EVERY action: "Stir for 2 minutes", "Let it rest for 5 minutes"
           - Warn about common mistakes: "Don't overcrowd the pan or it will steam instead of fry"
           - Each step should be 2-3 sentences minimum with clear instructions
        
        2. PAIRING SUGGESTIONS - For each dish, suggest what to serve it with:
           - If it's a curry → suggest rice, bread, or accompaniments (e.g., "Best served with: Steamed basmati rice or Idiyappam/Appam")
           - If it's a bread/rice dish → suggest curries or sides (e.g., "Best served with: Kerala-style egg curry or vegetable stew")
           - If it's a standalone dish → suggest complementary sides
           - Make pairings culturally appropriate to the cuisine
        
        3. INGREDIENTS should have EXACT quantities with alternatives:
           - "2 medium onions (about 200g), finely diced"
           - "1 cup rice (200g) - Basmati or any long-grain rice works"

        Return JSON array with this exact schema:
        [
          {
            "id": "unique-id",
            "title": "Recipe Name",
            "description": "One line appetizing description",
            "prepTime": "e.g. 15 min",
            "cookTime": "e.g. 25 min",
            "totalTime": "e.g. 40 min",
            "servings": "e.g. 2-3 servings",
            "difficulty": "Easy" | "Medium" | "Hard",
            "calories": "e.g. 350 kcal per serving",
            "type": "regional" | "quick" | "traditional" | "healthy" | "comfort" | "fusion" | "simple",
            "isRegional": true or false (true for first 3 only),
            "pairingsuggestion": "Best served with: Steamed rice and Kerala-style sambar",
            "ingredients": {
              "provided": ["2 medium tomatoes (150g), roughly chopped"],
              "shoppingList": ["1 cup coconut milk (240ml) - canned works great"]
            },
            "steps": [
              "Step 1: Prepare your ingredients (mise en place). Wash and chop all vegetables before starting. This makes cooking smoother and prevents burning while you're busy cutting.",
              "Step 2: Heat a large pan or kadai over MEDIUM heat for 1 minute until hot. Add 2 tablespoons of oil and wait 30 seconds until the oil shimmers (ripples when you tilt the pan).",
              "Step 3: Add the mustard seeds. They will start to pop and splutter within 10-15 seconds. Cover with a lid to prevent splattering. Once the popping slows down, proceed to the next step.",
              "...continue with equally detailed steps..."
            ],
            "mealPrep": ["Can be stored in refrigerator for 3 days", "Reheat in microwave for 2 minutes"]
          }
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const recipes = JSON.parse(text);
            if (!Array.isArray(recipes) || recipes.length === 0) {
                throw new Error("Invalid recipe format");
            }
            return recipes as Recipe[];
        } catch (e) {
            console.error("Failed to parse recipes JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'generateRecipes');
}

export interface StepVerificationResult {
    status: 'pass' | 'fail';
    feedback: string;
    spokenTip: string;
    timeRemaining?: string;
}

/**
 * Verifies cooking step using vision with fallback
 * Returns detailed feedback including spoken tips
 */
export async function verifyCookingStep(
    currentStep: string,
    recipeTitle: string,
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<StepVerificationResult> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are a friendly cooking assistant helping someone cook ${recipeTitle}.
        Current step: "${currentStep}"
        
        Analyze this photo of their cooking progress and provide helpful feedback.
        
        Be encouraging and specific. If they need to wait, estimate the time.
        The "spokenTip" should be natural speech that will be read aloud.
        
        Return JSON:
        {
            "status": "pass" or "fail",
            "feedback": "Brief written feedback",
            "spokenTip": "Natural spoken advice like: Looking great! Let it cook for about 2 more minutes until golden brown.",
            "timeRemaining": "optional - e.g. '2 minutes' if they need to wait"
        }
        `;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as StepVerificationResult;
        } catch (e) {
            console.error("Failed to parse verification JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'verifyCookingStep');
}

export interface CookingTip {
    tip: string;
    action: 'wait' | 'adjust' | 'continue' | 'done';
    timeEstimate?: string;
}

/**
 * Gets real-time cooking advice based on photo
 * Returns natural language tips meant to be spoken aloud
 */
export async function getCookingTip(
    recipeTitle: string,
    currentStep: string,
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<CookingTip> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are a real-time cooking assistant. The user is cooking ${recipeTitle}.
        They are on this step: "${currentStep}"
        
        Look at this photo and give them ONE short, helpful tip.
        Speak naturally like a friend helping in the kitchen.
        
        Examples of good tips:
        - "That looks perfect! Move on to the next step."
        - "Give it about 2 more minutes, it's almost there."
        - "Turn the heat down a bit, it's getting too brown."
        - "Add a pinch more salt, it needs seasoning."
        
        Return JSON:
        {
            "tip": "Your natural spoken tip (1-2 sentences max)",
            "action": "wait" | "adjust" | "continue" | "done",
            "timeEstimate": "optional - e.g. '2 minutes'"
        }
        `;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as CookingTip;
        } catch (e) {
            console.error("Failed to parse tip JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'getCookingTip');
}

export interface DishIdentity {
    dishName: string;
    cuisine: string;
    description: string;
    confidence: string;
}

/**
 * Identifies a dish from an image using Gemini Vision
 */
export async function identifyDish(
    imageBase64: string,
    mimeType: string = 'image/jpeg'
): Promise<DishIdentity> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Identify this specific dish.
        Analyze the visual appearance, ingredients, and presentation.
        
        Return JSON:
        {
            "dishName": "Name of the dish (e.g. Penne Rosa, Butter Chicken)",
            "cuisine": "Cuisine origin (e.g. Italian, Indian)",
            "description": "Brief description of what is widely known about this dish",
            "confidence": "High" | "Medium" | "Low"
        }
        `;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as DishIdentity;
        } catch (e) {
            console.error("Failed to parse dish identity JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'identifyDish');
}

/**
 * Identifies a dish directly from a text description (fallback when image gen fails)
 */
export async function identifyDishFromText(
    description: string
): Promise<DishIdentity> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Identify the dish described here: "${description}"
        
        Return JSON:
        {
            "dishName": "Name of the dish (e.g. Penne Rosa, Butter Chicken)",
            "cuisine": "Cuisine origin (e.g. Italian, Indian)",
            "description": "Brief description of the dish",
            "confidence": "High" | "Medium" | "Low"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as DishIdentity;
        } catch (e) {
            console.error("Failed to parse dish identity JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'identifyDishFromText');
}

/**
 * Generates an image of a dish based on description using Imagen 3.0 via REST API
 * Note: standard GoogleGenerativeAI SDK doesn't fully support Imagen yet, using REST fallback
 */
export async function generateDishImage(description: string): Promise<string> {
    const apiKey = API_KEYS[currentKeyIndex];
    // Try multiple possible endpoints/models if one fails
    // Note: 'imagen-3.0-generate-001' is the beta model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const payload = {
        instances: [
            { prompt: `Professional food photography, close-up, high quality: ${description}` }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            outputOptions: { mimeType: "image/jpeg" }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Imagen API Error (${response.status}):`, errText);
            throw new Error(`Imagen API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            return data.predictions[0].bytesBase64Encoded;
        } else if (data.predictions && typeof data.predictions[0] === 'string') {
            return data.predictions[0];
        }

        throw new Error('Invalid response format from Imagen API');
    } catch (error) {
        console.error("Failed to generate image:", error);
        throw error;
    }
}

/**
 * Transforms basic ingredients into creative gourmet recipes
 */
export async function generateGourmetTransformations(
    basicIngredients: string,
    category: string = 'General'
): Promise<Recipe[]> {
    return generateWithFallback(async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are a creative chef specializing in "Gourmet Hacks" - transforming boring, basic ingredients into exciting, restaurant-quality meals using minimal additional items.

        User has: "${basicIngredients}"
        Category: ${category}

        Generate 3-4 CREATIVE transformation recipes.
        
        Rules:
        1. MUST use the user's basic ingredients as the star.
        2. Keep additional ingredients minimal (common pantry staples like oil, spices, onions, milk, etc.).
        3. Transformations should feel "Gourmet" or "Fusion" (e.g. Ramen -> Ramen Carbonara, Bread -> French Toast Roll-ups).
        4. No boring standard recipes (e.g. just "Boiled Eggs").

        Return JSON array matching this schema exactly:
        [
          {
            "id": "unique-id",
            "title": "Creative Recipe Name",
            "description": "Appetizing description of the transformation",
            "prepTime": "e.g. 5 min",
            "cookTime": "e.g. 10 min",
            "totalTime": "e.g. 15 min",
            "servings": "1-2",
            "difficulty": "Easy" | "Medium" | "Hard",
            "calories": "Estimated calories",
            "type": "fusion",
            "ingredients": {
              "provided": ["The basic ingredients used"],
              "shoppingList": ["Extra pantry staples needed"]
            },
            "steps": ["Detailed step 1", "Step 2..."]
          }
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as Recipe[];
        } catch (e) {
            console.error("Failed to parse gourmet recipes JSON:", text);
            throw new Error(`Invalid JSON response from ${modelName}`);
        }
    }, 'generateGourmetTransformations');
}

