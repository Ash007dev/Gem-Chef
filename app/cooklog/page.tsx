'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Trash2, ChevronRight } from 'lucide-react';
import { Recipe } from '@/utils/gemini';

interface CookedRecipe extends Recipe {
  cookedAt: string;
}

export default function CooklogPage() {
  const router = useRouter();
  const [cooklog, setCooklog] = useState<CookedRecipe[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cooklog');
    if (saved) {
      setCooklog(JSON.parse(saved));
    }
  }, []);

  const handleDelete = (index: number) => {
    const updated = cooklog.filter((_, i) => i !== index);
    setCooklog(updated);
    localStorage.setItem('cooklog', JSON.stringify(updated));
  };

  const handleRecook = (recipe: CookedRecipe) => {
    sessionStorage.setItem('currentRecipe', JSON.stringify(recipe));
    router.push(`/cook?id=${recipe.id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group by date
  const groupedByDate = cooklog.reduce((acc, recipe) => {
    const dateKey = new Date(recipe.cookedAt).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(recipe);
    return acc;
  }, {} as Record<string, CookedRecipe[]>);

  return (
    <div className="min-h-screen bg-black px-5 pt-12 pb-24">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">My Cooklog</h1>
        <p className="text-gray-500 text-sm">
          A collection of dishes you've cooked, organized by day.
        </p>
      </header>

      <div className="h-px bg-dark-border mb-6" />

      {cooklog.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 bg-dark-card rounded-xl flex items-center justify-center mb-5">
            <BookOpen className="w-7 h-7 text-gray-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-medium text-white mb-1">Your Cooklog is Empty</h2>
          <p className="text-gray-500 text-sm text-center">
            Dishes you complete will appear here.
          </p>
        </div>
      ) : (
        /* Cooklog List */
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateKey, recipes]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-medium text-gray-500 mb-3">
                {formatDate(recipes[0].cookedAt)}
              </h2>
              <div className="space-y-2">
                {recipes.map((recipe, idx) => (
                  <div
                    key={`${recipe.id}-${idx}`}
                    className="bg-dark-card border border-dark-border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1" onClick={() => handleRecook(recipe)}>
                        <h3 className="text-white font-medium mb-1">{recipe.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(recipe.cookedAt)}
                          </span>
                          <span>{recipe.totalTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(cooklog.indexOf(recipe))}
                          className="p-2 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRecook(recipe)}
                          className="p-2 text-gray-500 hover:text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
