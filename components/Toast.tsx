'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning';
}

// Simple toast hook for error handling
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, removeToast };
}

// Toast container component
export function ToastContainer({
    toasts,
    onRemove
}: {
    toasts: Toast[];
    onRemove: (id: string) => void;
}) {
    return (
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: <AlertTriangle className="w-5 h-5" />,
    };

    return (
        <div
            className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-2xl shadow-lg 
                  flex items-center gap-3 animate-slide-down pointer-events-auto`}
        >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                {icons[toast.type]}
            </div>
            <span className="flex-1 font-medium text-sm">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// Friendly error messages for Gemini API
export function getChefErrorMessage(error: unknown): string {
    const messages = [
        "The Chef is thinking... try again! 👨‍🍳",
        "Oops! The kitchen got busy. One more try? 🍳",
        "AI is stirring the pot... please retry! 🥄",
        "Recipe inspiration loading... try once more! 📖",
    ];

    console.error('Gemini API error:', error);
    return messages[Math.floor(Math.random() * messages.length)];
}
