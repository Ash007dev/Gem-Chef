// YouTube video extraction utilities

import type { VideoMetadata, VideoTranscript, TranscriptSegment } from './video-recipe-types';
import { extractYouTubeId } from './video-recipe-types';

// YouTube Data API v3 base URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Get YouTube API key from environment
function getYouTubeApiKey(): string {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new Error('YouTube API key not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to .env.local');
    }
    return apiKey;
}

/**
 * Fetch YouTube video metadata (title, duration, thumbnail, channel)
 */
export async function getYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
    try {
        const apiKey = getYouTubeApiKey();
        const url = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            throw new Error('Video not found');
        }

        const video = data.items[0];
        const snippet = video.snippet;
        const contentDetails = video.contentDetails;

        // Parse ISO 8601 duration (e.g., "PT15M33S" = 15 minutes 33 seconds)
        const duration = parseDuration(contentDetails.duration);

        return {
            videoId,
            title: snippet.title,
            channelName: snippet.channelTitle,
            duration,
            thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
            platform: 'youtube',
        };
    } catch (error) {
        console.error('Failed to fetch YouTube metadata:', error);
        throw error;
    }
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: "PT15M33S" -> 933 seconds
 */
function parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get YouTube video transcript/captions
 * Uses youtube-transcript package
 */
export async function getYouTubeTranscript(videoId: string): Promise<VideoTranscript> {
    try {
        // Dynamic import to avoid SSR issues
        const { YoutubeTranscript } = await import('youtube-transcript');

        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcriptData || transcriptData.length === 0) {
            throw new Error('No transcript available for this video');
        }

        // Convert to our format
        const segments: TranscriptSegment[] = transcriptData.map((item: any) => ({
            text: item.text,
            start: item.offset / 1000, // Convert ms to seconds
            duration: item.duration / 1000, // Convert ms to seconds
        }));

        // Concatenate all text
        const fullText = segments.map(s => s.text).join(' ');

        return {
            segments,
            fullText,
            language: 'en', // youtube-transcript doesn't provide language info
        };
    } catch (error: any) {
        console.error('Failed to fetch YouTube transcript:', error);

        // Provide helpful error messages
        if (error.message?.includes('Transcript is disabled')) {
            throw new Error('This video has transcripts/captions disabled');
        } else if (error.message?.includes('No transcripts')) {
            throw new Error('No captions available for this video. Try a video with auto-generated or manual captions.');
        }

        throw new Error('Failed to get video transcript. The video may not have captions enabled.');
    }
}

/**
 * Validate YouTube URL and extract video ID
 */
export function validateYouTubeUrl(url: string): { valid: boolean; videoId: string | null; error?: string } {
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        return {
            valid: false,
            videoId: null,
            error: 'Invalid YouTube URL. Please use a valid youtube.com or youtu.be link.',
        };
    }

    return {
        valid: true,
        videoId,
    };
}

/**
 * Get video embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get video watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get video thumbnail URL (various sizes)
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
    return `https://img.youtube.com/vi/${videoId}/${quality === 'maxres' ? 'maxresdefault' : quality === 'high' ? 'hqdefault' : quality === 'medium' ? 'mqdefault' : 'default'}.jpg`;
}

/**
 * Check if video is likely a cooking video based on title/description
 * This is a basic heuristic check
 */
export function isLikelyCookingVideo(title: string, description?: string): boolean {
    const cookingKeywords = [
        'recipe', 'cook', 'bake', 'chef', 'kitchen', 'food', 'dish', 'meal',
        'ingredient', 'how to make', 'tutorial', 'easy', 'delicious',
        'homemade', 'prepare', 'cuisine', 'cooking', 'baking'
    ];

    const text = `${title} ${description || ''}`.toLowerCase();

    return cookingKeywords.some(keyword => text.includes(keyword));
}

/**
 * Extract video info from URL (convenience function)
 */
export async function extractVideoInfo(url: string): Promise<{
    videoId: string;
    metadata: VideoMetadata;
    transcript: VideoTranscript;
}> {
    // Validate URL
    const validation = validateYouTubeUrl(url);
    if (!validation.valid || !validation.videoId) {
        throw new Error(validation.error || 'Invalid URL');
    }

    const videoId = validation.videoId;

    // Fetch metadata and transcript in parallel
    const [metadata, transcript] = await Promise.all([
        getYouTubeMetadata(videoId),
        getYouTubeTranscript(videoId),
    ]);

    return {
        videoId,
        metadata,
        transcript,
    };
}
