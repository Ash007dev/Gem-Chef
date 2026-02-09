'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, BookOpen, Settings, Activity } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Today', icon: Utensils },
    { href: '/nutrition', label: 'Nutrition', icon: Activity },
    { href: '/cooklog', label: 'Cooklog', icon: BookOpen },
    { href: '/preferences', label: 'Preferences', icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    // Hide nav on cooking/recipe detail pages
    const hiddenPaths = ['/cook', '/recipe/'];
    const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

    if (shouldHide) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-dark-border pb-safe">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 rounded-lg transition-colors ${isActive
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                            <span className="text-[11px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
