'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, AlertTriangle, CheckCircle2, Flame, Droplets } from 'lucide-react';

// Types for AR overlays
export interface ARAnnotation {
    id: string;
    type: 'timer' | 'alert' | 'success' | 'highlight' | 'temperature' | 'progress';
    text: string;
    subtext?: string;
    position: 'top' | 'center' | 'bottom';
    duration?: number; // Auto-dismiss after ms
    progress?: number; // 0-100 for progress type
}

interface AROverlayProps {
    annotations: ARAnnotation[];
    onDismiss: (id: string) => void;
    currentStep: string;
    stepNumber: number;
    totalSteps: number;
    showStepGuide: boolean;
    activeTimer?: {
        label: string;
        seconds: number;
        total: number;
    } | null;
}

export default function AROverlay({
    annotations,
    onDismiss,
    currentStep,
    stepNumber,
    totalSteps,
    showStepGuide,
    activeTimer
}: AROverlayProps) {
    const [visibleAnnotations, setVisibleAnnotations] = useState<ARAnnotation[]>([]);

    // Handle auto-dismiss for timed annotations
    useEffect(() => {
        setVisibleAnnotations(annotations);

        annotations.forEach(ann => {
            if (ann.duration) {
                setTimeout(() => {
                    onDismiss(ann.id);
                }, ann.duration);
            }
        });
    }, [annotations, onDismiss]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnnotationIcon = (type: ARAnnotation['type']) => {
        switch (type) {
            case 'timer':
                return <Timer className="w-5 h-5" />;
            case 'alert':
                return <AlertTriangle className="w-5 h-5" />;
            case 'success':
                return <CheckCircle2 className="w-5 h-5" />;
            case 'temperature':
                return <Flame className="w-5 h-5" />;
            default:
                return null;
        }
    };

    const getAnnotationColors = (type: ARAnnotation['type']) => {
        switch (type) {
            case 'timer':
                return 'from-blue-500/90 to-blue-600/90 border-blue-400/50';
            case 'alert':
                return 'from-orange-500/90 to-red-500/90 border-orange-400/50';
            case 'success':
                return 'from-green-500/90 to-emerald-500/90 border-green-400/50';
            case 'temperature':
                return 'from-red-500/90 to-orange-500/90 border-red-400/50';
            case 'progress':
                return 'from-purple-500/90 to-pink-500/90 border-purple-400/50';
            default:
                return 'from-gray-500/90 to-gray-600/90 border-gray-400/50';
        }
    };

    const topAnnotations = visibleAnnotations.filter(a => a.position === 'top');
    const centerAnnotations = visibleAnnotations.filter(a => a.position === 'center');
    const bottomAnnotations = visibleAnnotations.filter(a => a.position === 'bottom');

    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            {/* Active Timer Overlay - Top Right */}
            {activeTimer && (
                <div className="absolute top-20 right-4 pointer-events-auto">
                    <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm rounded-2xl p-4 border border-amber-400/50 shadow-lg shadow-amber-500/20 animate-pulse-soft">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <Timer className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                                    {activeTimer.label}
                                </p>
                                <p className="text-white text-2xl font-bold font-mono">
                                    {formatTime(activeTimer.seconds)}
                                </p>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{
                                    width: `${((activeTimer.total - activeTimer.seconds) / activeTimer.total) * 100}%`
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step Guide Overlay - Top Left */}
            {showStepGuide && (
                <div className="absolute top-20 left-4 right-24 pointer-events-auto">
                    <div className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-400/50 shadow-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold">{stepNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white/70 text-xs font-medium mb-1">
                                    Step {stepNumber} of {totalSteps}
                                </p>
                                <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                                    {currentStep}
                                </p>
                            </div>
                        </div>
                        {/* Step progress */}
                        <div className="mt-3 flex gap-1">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${i < stepNumber ? 'bg-white' :
                                            i === stepNumber - 1 ? 'bg-white animate-pulse' :
                                                'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Annotations */}
            <div className="absolute top-44 left-4 right-4 flex flex-col gap-2">
                {topAnnotations.map(ann => (
                    <div
                        key={ann.id}
                        className={`bg-gradient-to-r ${getAnnotationColors(ann.type)} backdrop-blur-sm rounded-xl p-3 border shadow-lg animate-slide-in pointer-events-auto`}
                        onClick={() => onDismiss(ann.id)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-white">{getAnnotationIcon(ann.type)}</span>
                            <div>
                                <p className="text-white font-medium text-sm">{ann.text}</p>
                                {ann.subtext && (
                                    <p className="text-white/70 text-xs">{ann.subtext}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Center Annotations - Visual Cues */}
            {centerAnnotations.length > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-auto">
                    {centerAnnotations.map(ann => (
                        <div
                            key={ann.id}
                            className={`bg-gradient-to-r ${getAnnotationColors(ann.type)} backdrop-blur-md rounded-3xl px-8 py-6 border shadow-2xl animate-bounce-soft`}
                            onClick={() => onDismiss(ann.id)}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-white scale-150">{getAnnotationIcon(ann.type)}</span>
                                <p className="text-white font-bold text-lg text-center">{ann.text}</p>
                                {ann.subtext && (
                                    <p className="text-white/80 text-sm text-center">{ann.subtext}</p>
                                )}
                                {ann.type === 'progress' && ann.progress !== undefined && (
                                    <div className="w-48 h-2 bg-black/30 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all"
                                            style={{ width: `${ann.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Annotations - Quick Tips */}
            <div className="absolute bottom-36 left-4 right-4 flex flex-col gap-2">
                {bottomAnnotations.map(ann => (
                    <div
                        key={ann.id}
                        className={`bg-gradient-to-r ${getAnnotationColors(ann.type)} backdrop-blur-sm rounded-xl p-3 border shadow-lg animate-slide-up pointer-events-auto`}
                        onClick={() => onDismiss(ann.id)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-white">{getAnnotationIcon(ann.type)}</span>
                            <div className="flex-1">
                                <p className="text-white font-medium text-sm">{ann.text}</p>
                                {ann.subtext && (
                                    <p className="text-white/70 text-xs">{ann.subtext}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Scanning Effect Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan" />
            </div>

            {/* Corner Visual Cues */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-cyan-400/60 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-cyan-400/60 rounded-tr-lg" />
            <div className="absolute bottom-32 left-4 w-12 h-12 border-l-2 border-b-2 border-cyan-400/60 rounded-bl-lg" />
            <div className="absolute bottom-32 right-4 w-12 h-12 border-r-2 border-b-2 border-cyan-400/60 rounded-br-lg" />
        </div>
    );
}

// Hook for managing AR annotations
export function useARAnnotations() {
    const [annotations, setAnnotations] = useState<ARAnnotation[]>([]);
    const [activeTimer, setActiveTimer] = useState<{
        label: string;
        seconds: number;
        total: number;
    } | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const addAnnotation = useCallback((annotation: Omit<ARAnnotation, 'id'>) => {
        const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setAnnotations(prev => [...prev, { ...annotation, id }]);
        return id;
    }, []);

    const removeAnnotation = useCallback((id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    }, []);

    const clearAnnotations = useCallback(() => {
        setAnnotations([]);
    }, []);

    // Timer functions
    const startTimer = useCallback((label: string, seconds: number) => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setActiveTimer({ label, seconds, total: seconds });

        timerRef.current = setInterval(() => {
            setActiveTimer(prev => {
                if (!prev || prev.seconds <= 1) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    // Show completion notification
                    addAnnotation({
                        type: 'success',
                        text: `${label} Complete!`,
                        subtext: 'Time to move on',
                        position: 'center',
                        duration: 3000
                    });
                    return null;
                }
                return { ...prev, seconds: prev.seconds - 1 };
            });
        }, 1000);
    }, [addAnnotation]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setActiveTimer(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Helper functions for common annotations
    const showAlert = useCallback((text: string, subtext?: string) => {
        return addAnnotation({
            type: 'alert',
            text,
            subtext,
            position: 'top',
            duration: 5000
        });
    }, [addAnnotation]);

    const showSuccess = useCallback((text: string, subtext?: string) => {
        return addAnnotation({
            type: 'success',
            text,
            subtext,
            position: 'center',
            duration: 3000
        });
    }, [addAnnotation]);

    const showTemperatureAlert = useCallback((text: string, subtext?: string) => {
        return addAnnotation({
            type: 'temperature',
            text,
            subtext,
            position: 'bottom',
            duration: 4000
        });
    }, [addAnnotation]);

    return {
        annotations,
        activeTimer,
        addAnnotation,
        removeAnnotation,
        clearAnnotations,
        startTimer,
        stopTimer,
        showAlert,
        showSuccess,
        showTemperatureAlert
    };
}
