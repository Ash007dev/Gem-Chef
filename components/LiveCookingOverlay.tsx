'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    X,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MessageCircle,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    ChefHat,
    Loader2
} from 'lucide-react';
import { GeminiLiveSession, AudioPlayer, LiveSessionConfig } from '@/utils/gemini-live';

interface LiveCookingOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    recipeTitle: string;
    currentStep: string;
    stepNumber: number;
    totalSteps: number;
    ingredients: string[];
    onStepChange?: (step: number) => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function LiveCookingOverlay({
    isOpen,
    onClose,
    recipeTitle,
    currentStep,
    stepNumber,
    totalSteps,
    ingredients,
    onStepChange
}: LiveCookingOverlayProps) {
    // State
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [isFullScreen, setIsFullScreen] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState('');

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const sessionRef = useRef<GeminiLiveSession | null>(null);
    const audioPlayerRef = useRef<AudioPlayer | null>(null);

    // Initialize session when overlay opens
    useEffect(() => {
        if (isOpen && connectionState === 'disconnected') {
            initializeSession();
        }

        return () => {
            if (!isOpen) {
                cleanup();
            }
        };
    }, [isOpen]);

    // Update step in session when it changes
    useEffect(() => {
        if (sessionRef.current && connectionState === 'connected') {
            sessionRef.current.updateStep(stepNumber, currentStep);
        }
    }, [stepNumber, currentStep, connectionState]);

    const initializeSession = async () => {
        setConnectionState('connecting');
        setErrorMessage('');

        const config: LiveSessionConfig = {
            recipeTitle,
            currentStep,
            stepNumber,
            totalSteps,
            ingredients
        };

        const session = new GeminiLiveSession({
            onConnected: () => {
                setConnectionState('connected');
                addTranscript('🟢 Connected to SmartChef Live');
            },
            onDisconnected: () => {
                setConnectionState('disconnected');
                addTranscript('🔴 Disconnected');
            },
            onAudioResponse: (audioData) => {
                if (isSpeakerOn && audioPlayerRef.current) {
                    audioPlayerRef.current.play(audioData);
                }
            },
            onTextResponse: (text) => {
                addTranscript(`Chef: ${text}`);
            },
            onError: (error) => {
                setConnectionState('error');
                setErrorMessage(error);
                addTranscript(`❌ Error: ${error}`);
            },
            onListening: setIsListening,
            onSpeaking: setIsSpeaking
        }, config);

        sessionRef.current = session;
        audioPlayerRef.current = new AudioPlayer();

        // Connect to Gemini
        const connected = await session.connect();
        if (!connected) {
            setConnectionState('error');
            return;
        }

        // Start audio capture
        if (isMicOn) {
            await session.startAudioCapture();
        }

        // Start video capture
        if (isCameraOn && videoRef.current) {
            await session.startVideoCapture(videoRef.current);
        }
    };

    const cleanup = async () => {
        if (sessionRef.current) {
            await sessionRef.current.disconnect();
            sessionRef.current = null;
        }
        if (audioPlayerRef.current) {
            await audioPlayerRef.current.close();
            audioPlayerRef.current = null;
        }
        setConnectionState('disconnected');
        setTranscript([]);
    };

    const addTranscript = (text: string) => {
        setTranscript(prev => [...prev.slice(-10), text]); // Keep last 10 messages
    };

    const handleClose = async () => {
        await cleanup();
        onClose();
    };

    const toggleMic = () => {
        setIsMicOn(!isMicOn);
        // TODO: Actually toggle mic in session
    };

    const toggleCamera = () => {
        setIsCameraOn(!isCameraOn);
        // TODO: Actually toggle camera in session
    };

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        if (!isSpeakerOn && audioPlayerRef.current) {
            audioPlayerRef.current.stop();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 bg-black ${isFullScreen ? '' : 'p-4'}`}>
            <div className={`relative w-full h-full ${isFullScreen ? '' : 'rounded-2xl overflow-hidden'}`}>

                {/* Camera Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${connectionState === 'connected' ? 'bg-green-500/20 text-green-400' :
                            connectionState === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                                connectionState === 'error' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                            }`}>
                            {connectionState === 'connecting' && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {connectionState === 'connected' && (
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            )}
                            <span className="text-sm font-medium">
                                {connectionState === 'connecting' ? 'Connecting...' :
                                    connectionState === 'connected' ? 'Live' :
                                        connectionState === 'error' ? 'Error' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 bg-black/50 rounded-full text-white"
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-2 bg-red-500/80 rounded-full text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Recipe Info (Split View) */}
                {!isFullScreen && (
                    <div className="absolute top-20 left-4 right-4 bg-black/60 backdrop-blur rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-1">{recipeTitle}</h3>
                        <p className="text-gray-300 text-sm">
                            Step {stepNumber} of {totalSteps}: {currentStep}
                        </p>
                    </div>
                )}

                {/* Voice Activity Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {isSpeaking && (
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                <ChefHat className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-white rounded-full animate-pulse"
                                        style={{
                                            height: `${Math.random() * 30 + 10}px`,
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {isListening && !isSpeaking && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-400 rounded-full animate-ping" />
                            <span className="text-white text-sm">Listening...</span>
                        </div>
                    )}
                </div>

                {/* Transcript */}
                <div className="absolute bottom-32 left-4 right-4 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                        {transcript.map((text, idx) => (
                            <div
                                key={idx}
                                className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm animate-fade-in"
                            >
                                {text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center justify-center gap-4">
                        {/* Mic Toggle */}
                        <button
                            onClick={toggleMic}
                            className={`p-4 rounded-full transition-colors ${isMicOn ? 'bg-white text-black' : 'bg-red-500 text-white'
                                }`}
                        >
                            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                        </button>

                        {/* Camera Toggle */}
                        <button
                            onClick={toggleCamera}
                            className={`p-4 rounded-full transition-colors ${isCameraOn ? 'bg-white text-black' : 'bg-red-500 text-white'
                                }`}
                        >
                            {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </button>

                        {/* Speaker Toggle */}
                        <button
                            onClick={toggleSpeaker}
                            className={`p-4 rounded-full transition-colors ${isSpeakerOn ? 'bg-white text-black' : 'bg-gray-600 text-white'
                                }`}
                        >
                            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Step info in full screen */}
                    {isFullScreen && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-400 text-sm">
                                Step {stepNumber}/{totalSteps}
                            </p>
                            <p className="text-white font-medium mt-1 line-clamp-2">
                                {currentStep}
                            </p>
                        </div>
                    )}

                    {/* Error message */}
                    {errorMessage && (
                        <div className="mt-4 text-center">
                            <p className="text-red-400 text-sm">{errorMessage}</p>
                            <button
                                onClick={initializeSession}
                                className="mt-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium"
                            >
                                Retry Connection
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
