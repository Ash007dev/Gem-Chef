'use client';

import { ChefHat, Utensils, Cookie } from 'lucide-react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

export default function Loader({ size = 'md', message }: LoaderProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            {/* Animated foodie loader */}
            <div className="relative">
                {/* Outer pulsing ring */}
                <div className={`absolute inset-0 ${sizeClasses[size]} bg-orange-400 rounded-full animate-ping opacity-20`} />

                {/* Inner rotating icons */}
                <div className={`relative ${sizeClasses[size]} bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200`}>
                    <div className="animate-bounce-slow">
                        <ChefHat className={`${iconSizes[size]} text-white`} />
                    </div>
                </div>

                {/* Orbiting elements */}
                <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                        <Utensils className="w-3 h-3 text-orange-400" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                        <Cookie className="w-3 h-3 text-amber-400" />
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <p className="text-slate-500 text-sm animate-pulse">{message}</p>
            )}
        </div>
    );
}

// Inline loader for buttons and small spaces
export function InlineLoader({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex gap-1 ${className}`}>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
    );
}
