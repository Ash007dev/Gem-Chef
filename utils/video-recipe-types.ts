// Type definitions for Cook-Along (Video Sync) feature

export type VideoPlatform = 'youtube' | 'instagram';

export type ExtractionStage =
    | 'fetching'      // Fetching video metadata
    | 'transcribing'  // Getting video transcript/captions
    | 'analyzing'     // AI analyzing content
    | 'structuring'   // Structuring into recipe format
    | 'complete'      // Extraction complete
    | 'error';        // Error occurred

export interface VideoMetadata {
    videoId: string;
    title: string;
    channelName?: string;
    duration: number; // seconds
    thumbnail: string;
    platform: VideoPlatform;
}

export interface VideoStep {
    id: string;
    stepNumber: number;
    instruction: string;
    timestamp: number; // seconds from start
    endTimestamp?: number; // when this step ends
    duration?: number; // estimated duration of this step in seconds
    ingredients?: string[]; // ingredients used in this step
    hasTimer?: boolean;
    timerDuration?: number; // seconds
    timerLabel?: string; // e.g., "Let simmer", "Rest the dough"
}

export interface VideoRecipe {
    id: string;
    videoUrl: string;
    videoId: string;
    platform: VideoPlatform;

    // Video metadata
    title: string;
    channelName?: string;
    duration: number; // seconds
    thumbnail: string;

    // Extracted recipe data
    ingredients: string[];
    steps: VideoStep[];

    // Metadata
    extractedAt: string; // ISO timestamp
    language?: string;
    cuisine?: string;
}

export interface VideoAnalysisProgress {
    stage: ExtractionStage;
    progress: number; // 0-100
    message: string;
    error?: string;
}

export interface TranscriptSegment {
    text: string;
    start: number; // seconds
    duration: number; // seconds
}

export interface VideoTranscript {
    segments: TranscriptSegment[];
    language?: string;
    fullText: string; // concatenated text
}

// Cache structure for localStorage
export interface VideoRecipeCache {
    videoId: string;
    recipe: VideoRecipe;
    timestamp: number;
}

// Helper function to generate unique step ID
export function generateStepId(videoId: string, stepNumber: number): string {
    return `${videoId}-step-${stepNumber}`;
}

// Helper to format timestamp for display (e.g., "2:15")
export function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to format duration (e.g., "2m 15s")
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
}

// Helper to get current step based on video time
export function getCurrentStep(steps: VideoStep[], currentTime: number): VideoStep | null {
    if (steps.length === 0) return null;

    // Find the step whose timestamp is <= currentTime
    // and either has no endTimestamp or endTimestamp > currentTime
    for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.timestamp <= currentTime) {
            if (!step.endTimestamp || step.endTimestamp > currentTime) {
                return step;
            }
        }
    }

    // If no step found, return first step if we're before it starts
    if (currentTime < steps[0].timestamp) {
        return steps[0];
    }

    // Otherwise return last step
    return steps[steps.length - 1];
}

// Helper to get next step
export function getNextStep(steps: VideoStep[], currentStep: VideoStep): VideoStep | null {
    const currentIndex = steps.findIndex(s => s.id === currentStep.id);
    if (currentIndex === -1 || currentIndex === steps.length - 1) return null;
    return steps[currentIndex + 1];
}

// Helper to get previous step
export function getPreviousStep(steps: VideoStep[], currentStep: VideoStep): VideoStep | null {
    const currentIndex = steps.findIndex(s => s.id === currentStep.id);
    if (currentIndex <= 0) return null;
    return steps[currentIndex - 1];
}

// Helper to calculate time until next step
export function getTimeUntilNextStep(currentTime: number, nextStep: VideoStep | null): number | null {
    if (!nextStep) return null;
    const timeUntil = nextStep.timestamp - currentTime;
    return timeUntil > 0 ? timeUntil : 0;
}

// Validate video URL
export function isValidYouTubeUrl(url: string): boolean {
    const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
}

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}
