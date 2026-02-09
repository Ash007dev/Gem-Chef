import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
    try {
        const { dishName, cuisine } = await request.json();

        if (!dishName) {
            return NextResponse.json(
                { error: 'No dish name provided' },
                { status: 400 }
            );
        }

        // Load user preferences for personalization
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Generate a complete recipe for "${dishName}" (${cuisine} cuisine).

Return a JSON object with these exact fields:
{
    "title": "Full recipe title",
    "cuisine": "${cuisine}",
    "description": "A brief appetizing description (2-3 sentences)",
    "prepTime": "X mins",
    "cookTime": "X mins",
    "servings": number,
    "difficulty": "Easy" or "Medium" or "Hard",
    "ingredients": [
        "List each ingredient with quantity",
        "e.g., 2 cups all-purpose flour"
    ],
    "steps": [
        "Step 1: Clear instruction",
        "Step 2: Next instruction",
        "Continue for all steps..."
    ],
    "tips": [
        "Optional cooking tips",
        "Pro tips for best results"
    ]
}

Make the recipe:
- Authentic to the cuisine
- Practical for home cooking
- With clear, actionable steps
- Include exact measurements

Return ONLY the JSON object, no markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response
        let cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Parse the JSON
        const recipe = JSON.parse(cleanedText);

        return NextResponse.json(recipe);
    } catch (error) {
        console.error('Error generating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to generate recipe' },
            { status: 500 }
        );
    }
}
