import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: Request) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Extract base64 data from data URL
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze this food image and identify the dish.

Return a JSON object with these exact fields:
{
    "name": "Full name of the dish",
    "cuisine": "Type of cuisine (e.g., Italian, Indian, Chinese, Mexican, American, etc.)",
    "confidence": A number from 60-99 representing how confident you are,
    "description": "A brief 1-2 sentence description of the dish"
}

If this is not a food image or the dish cannot be identified, return:
{
    "name": "Unknown Dish",
    "cuisine": "Unknown",
    "confidence": 0,
    "description": "Could not identify the dish in this image"
}

Return ONLY the JSON object, no markdown formatting.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            },
            prompt,
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up the response
        let cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Parse the JSON
        const dishInfo = JSON.parse(cleanedText);

        return NextResponse.json(dishInfo);
    } catch (error) {
        console.error('Error identifying dish:', error);
        return NextResponse.json(
            { error: 'Failed to identify dish' },
            { status: 500 }
        );
    }
}
