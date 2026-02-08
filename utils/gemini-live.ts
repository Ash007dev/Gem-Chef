/**
 * Gemini Live API Client for Real-Time Cooking
 * 
 * Handles:
 * - WebSocket connection to Gemini Live
 * - Audio input/output streaming
 * - Video frame capture and sending
 * - Session lifecycle management
 */

import { GoogleGenAI, Modality } from '@google/genai';

// Types
export interface LiveSessionConfig {
    recipeTitle: string;
    currentStep: string;
    stepNumber: number;
    totalSteps: number;
    ingredients: string[];
}

export interface LiveSessionCallbacks {
    onConnected: () => void;
    onDisconnected: () => void;
    onAudioResponse: (audioData: ArrayBuffer) => void;
    onTextResponse: (text: string) => void;
    onError: (error: string) => void;
    onListening: (isListening: boolean) => void;
    onSpeaking: (isSpeaking: boolean) => void;
}

export class GeminiLiveSession {
    private ai: GoogleGenAI | null = null;
    private session: any = null;
    private mediaStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private isConnected: boolean = false;
    private callbacks: LiveSessionCallbacks;
    private config: LiveSessionConfig;
    private videoElement: HTMLVideoElement | null = null;
    private frameInterval: NodeJS.Timeout | null = null;

    constructor(callbacks: LiveSessionCallbacks, config: LiveSessionConfig) {
        this.callbacks = callbacks;
        this.config = config;
    }

    /**
     * Connect to Gemini Live API
     */
    async connect(): Promise<boolean> {
        try {
            // Get API key from our backend
            const tokenResponse = await fetch('/api/gemini-token');
            const { apiKey, model } = await tokenResponse.json();

            if (!apiKey) {
                throw new Error('Failed to get API key');
            }

            // Initialize Gemini AI
            this.ai = new GoogleGenAI({ apiKey });

            // Create system instruction for cooking context
            const systemInstruction = this.buildSystemInstruction();

            // Connect to Live API
            this.session = await this.ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                        console.log('Connected to Gemini Live');
                        this.isConnected = true;
                        this.callbacks.onConnected();
                    },
                    onmessage: (message: any) => this.handleMessage(message),
                    onerror: (error: any) => {
                        console.error('Live API error:', error);
                        this.callbacks.onError(error.message || 'Connection error');
                    },
                    onclose: (event: any) => {
                        console.log('Disconnected from Gemini Live. Code:', event?.code, 'Reason:', event?.reason);
                        this.isConnected = false;
                        this.callbacks.onDisconnected();
                    },
                },
            });

            return true;
        } catch (error: any) {
            console.error('Failed to connect:', error);
            this.callbacks.onError(error.message || 'Failed to connect');
            return false;
        }
    }

    /**
     * Build system instruction for cooking assistant
     */
    private buildSystemInstruction(): string {
        return `You are SmartChef, a friendly and encouraging AI cooking assistant.

CURRENT CONTEXT:
- Recipe: ${this.config.recipeTitle}
- Step ${this.config.stepNumber} of ${this.config.totalSteps}
- Current instruction: ${this.config.currentStep}
- Ingredients available: ${this.config.ingredients.join(', ')}

YOUR ROLE:
1. Watch the user's cooking through the camera feed
2. Listen for their questions and respond helpfully
3. Proactively alert them if you notice:
   - Something burning or smoking
   - Wrong technique being used
   - Timing issues (too long, too short)
   - Missing steps
4. Provide encouraging feedback when things look good
5. Give timing reminders ("Flip in about 30 seconds")
6. Answer any cooking questions naturally

COMMUNICATION STYLE:
- Be warm, friendly, and conversational (not robotic)
- Keep responses brief (1-2 sentences) unless more detail is needed
- Use encouraging phrases: "Looking great!", "Perfect!", "Nice technique!"
- Be patient with beginners - explain things simply if asked

PROACTIVE ALERTS (speak up when you notice):
- "I see some smoke - you might want to lower the heat a bit"
- "That looks ready to flip now"
- "Don't forget to stir!"
- "Perfect color! Time for the next step"

Start by greeting the user and confirming what step they're on.`;
    }

    /**
     * Handle incoming messages from Gemini
     */
    private handleMessage(message: any) {
        // Handle interruption (user spoke while AI was speaking)
        if (message.serverContent?.interrupted) {
            this.callbacks.onSpeaking(false);
            return;
        }

        // Handle model turn (AI response)
        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                // Audio response
                if (part.inlineData?.data) {
                    const audioData = this.base64ToArrayBuffer(part.inlineData.data);
                    this.callbacks.onAudioResponse(audioData);
                    this.callbacks.onSpeaking(true);
                }
                // Text response
                if (part.text) {
                    this.callbacks.onTextResponse(part.text);
                }
            }
        }

        // Handle turn complete
        if (message.serverContent?.turnComplete) {
            this.callbacks.onSpeaking(false);
        }
    }

    /**
     * Start capturing audio from microphone
     */
    async startAudioCapture(): Promise<boolean> {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
                video: false,
            });

            // Create audio context for processing
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (event) => {
                if (!this.isConnected || !this.session) return;

                const inputData = event.inputBuffer.getChannelData(0);
                const pcmData = this.floatTo16BitPCM(inputData);
                const base64Audio = this.arrayBufferToBase64(pcmData.buffer as ArrayBuffer);

                // Send audio to Gemini
                this.session.sendRealtimeInput({
                    audio: {
                        data: base64Audio,
                        mimeType: 'audio/pcm;rate=16000',
                    },
                });

                this.callbacks.onListening(true);
            };

            source.connect(processor);
            processor.connect(this.audioContext.destination);

            return true;
        } catch (error: any) {
            console.error('Failed to start audio capture:', error);
            this.callbacks.onError('Microphone access denied');
            return false;
        }
    }

    /**
     * Start capturing video from camera
     */
    async startVideoCapture(videoElement: HTMLVideoElement): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment', // Use back camera on mobile
                },
            });

            videoElement.srcObject = stream;
            await videoElement.play();
            this.videoElement = videoElement;

            // Send video frames every 2 seconds
            this.frameInterval = setInterval(() => {
                this.captureAndSendFrame();
            }, 2000);

            return true;
        } catch (error: any) {
            console.error('Failed to start video capture:', error);
            this.callbacks.onError('Camera access denied');
            return false;
        }
    }

    /**
     * Capture current video frame and send to Gemini
     */
    private captureAndSendFrame() {
        if (!this.videoElement || !this.isConnected || !this.session) return;

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.7);
            const base64Image = imageData.split(',')[1];

            this.session.sendRealtimeInput({
                image: {
                    data: base64Image,
                    mimeType: 'image/jpeg',
                },
            });
        }
    }

    /**
     * Send a text message to Gemini
     */
    sendText(text: string) {
        if (!this.isConnected || !this.session) return;

        this.session.sendClientContent({
            turns: [{
                role: 'user',
                parts: [{ text }],
            }],
            turnComplete: true,
        });
    }

    /**
     * Update the current step context
     */
    updateStep(stepNumber: number, stepText: string) {
        this.config.stepNumber = stepNumber;
        this.config.currentStep = stepText;

        // Inform Gemini of the step change
        this.sendText(`I'm now on step ${stepNumber}: ${stepText}`);
    }

    /**
     * Disconnect and cleanup
     */
    async disconnect() {
        // Stop frame capture
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }

        // Stop media streams
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Stop video element
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }

        // Close audio context
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }

        // Close session
        if (this.session) {
            this.session.close();
            this.session = null;
        }

        this.isConnected = false;
    }

    // Utility functions
    private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

/**
 * Audio playback helper for Gemini responses
 */
export class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private queue: ArrayBuffer[] = [];
    private isPlaying: boolean = false;

    constructor() {
        this.audioContext = new AudioContext({ sampleRate: 24000 });
    }

    async play(audioData: ArrayBuffer) {
        if (!this.audioContext) return;

        this.queue.push(audioData);

        if (!this.isPlaying) {
            this.playNext();
        }
    }

    private async playNext() {
        if (this.queue.length === 0 || !this.audioContext) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const audioData = this.queue.shift()!;

        try {
            // Convert PCM to AudioBuffer
            const int16Array = new Int16Array(audioData);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768;
            }

            const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
            audioBuffer.copyToChannel(float32Array, 0);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.onended = () => this.playNext();
            source.start();
        } catch (error) {
            console.error('Audio playback error:', error);
            this.playNext();
        }
    }

    stop() {
        this.queue = [];
        this.isPlaying = false;
    }

    async close() {
        this.stop();
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
    }
}
