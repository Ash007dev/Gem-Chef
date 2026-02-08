import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to provide the Gemini API key for Live API connections
 * In production, you'd generate ephemeral tokens here
 * 
 * Note: For full security in production, implement proper ephemeral token generation
 * See: https://ai.google.dev/gemini-api/docs/ephemeral-tokens
 */
export async function GET(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'API key not configured' },
            { status: 500 }
        );
    }

    // In development, we return the API key directly
    // In production, you'd want to:
    // 1. Authenticate the user
    // 2. Generate a short-lived ephemeral token
    // 3. Return the ephemeral token instead

    return NextResponse.json({
        apiKey: apiKey,
        model: 'gemini-2.0-flash-live-001',
        expiresAt: Date.now() + 3600000 // 1 hour from now
    });
}
