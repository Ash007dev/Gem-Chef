'use client';

import { Recipe } from './gemini';

export interface PrepReminder {
    id: string;
    recipeId: string;
    recipeTitle: string;
    prepType: string;
    prepDescription: string;
    durationMinutes: number;
    plannedCookTime: string;  // ISO string
    reminderTime: string;     // ISO string - when to remind
    createdAt: string;        // ISO string
    notified: boolean;
}

const STORAGE_KEY = 'smartchef_prep_reminders';

/**
 * Get all prep reminders from localStorage
 */
export function getReminders(): PrepReminder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Save reminders to localStorage
 */
function saveReminders(reminders: PrepReminder[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

/**
 * Add a new prep reminder
 */
export function addReminder(
    recipe: Recipe,
    prepReq: NonNullable<Recipe['prepRequirements']>[0],
    plannedCookTime: Date
): PrepReminder {
    const reminders = getReminders();

    // Calculate reminder time = plannedCookTime - durationMinutes
    const reminderTime = new Date(plannedCookTime.getTime() - prepReq.durationMinutes * 60 * 1000);

    const newReminder: PrepReminder = {
        id: `prep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        prepType: prepReq.type,
        prepDescription: prepReq.description,
        durationMinutes: prepReq.durationMinutes,
        plannedCookTime: plannedCookTime.toISOString(),
        reminderTime: reminderTime.toISOString(),
        createdAt: new Date().toISOString(),
        notified: false
    };

    reminders.push(newReminder);
    saveReminders(reminders);

    // Schedule browser notification
    scheduleNotification(newReminder);

    return newReminder;
}

/**
 * Delete a reminder by ID
 */
export function deleteReminder(id: string): void {
    const reminders = getReminders().filter(r => r.id !== id);
    saveReminders(reminders);
}

/**
 * Mark a reminder as notified
 */
export function markNotified(id: string): void {
    const reminders = getReminders();
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
        reminder.notified = true;
        saveReminders(reminders);
    }
}

/**
 * Get upcoming reminders (not yet notified)
 */
export function getUpcomingReminders(): PrepReminder[] {
    const now = new Date();
    return getReminders()
        .filter(r => !r.notified && new Date(r.reminderTime) > now)
        .sort((a, b) => new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime());
}

/**
 * Get overdue reminders (reminder time passed but not notified)
 */
export function getOverdueReminders(): PrepReminder[] {
    const now = new Date();
    return getReminders()
        .filter(r => !r.notified && new Date(r.reminderTime) <= now)
        .sort((a, b) => new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime());
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

/**
 * Check if notifications are supported and permitted
 */
export function canNotify(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }
    return Notification.permission === 'granted';
}

/**
 * Schedule a notification for a reminder
 */
function scheduleNotification(reminder: PrepReminder): void {
    if (!canNotify()) return;

    const reminderTime = new Date(reminder.reminderTime);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay <= 0) {
        // Already past, notify immediately
        showNotification(reminder);
    } else {
        // Schedule for later
        setTimeout(() => {
            showNotification(reminder);
        }, delay);
    }
}

/**
 * Show the actual notification
 */
function showNotification(reminder: PrepReminder): void {
    if (!canNotify()) return;

    const title = `Time to prep for ${reminder.recipeTitle}!`;
    const body = `${reminder.prepDescription} (${formatDuration(reminder.durationMinutes)})`;

    const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: reminder.id,
        requireInteraction: true
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };

    markNotified(reminder.id);
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
}

/**
 * Format time for display
 */
export function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date for display
 */
export function formatDate(isoString: string): string {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Check and trigger any due reminders (call on app load)
 */
export function checkDueReminders(): PrepReminder[] {
    const overdue = getOverdueReminders();
    overdue.forEach(reminder => {
        showNotification(reminder);
    });
    return overdue;
}

/**
 * Get prep type icon name (for Lucide icons)
 */
export function getPrepTypeIcon(type: string): string {
    switch (type) {
        case 'marination': return 'Beef';
        case 'soaking': return 'Droplets';
        case 'defrosting': return 'Snowflake';
        case 'resting': return 'Clock';
        case 'chilling': return 'Refrigerator';
        default: return 'Timer';
    }
}

/**
 * Get prep type color
 */
export function getPrepTypeColor(type: string): string {
    switch (type) {
        case 'marination': return 'text-orange-400 bg-orange-500/20';
        case 'soaking': return 'text-blue-400 bg-blue-500/20';
        case 'defrosting': return 'text-cyan-400 bg-cyan-500/20';
        case 'resting': return 'text-purple-400 bg-purple-500/20';
        case 'chilling': return 'text-indigo-400 bg-indigo-500/20';
        default: return 'text-gray-400 bg-gray-500/20';
    }
}
