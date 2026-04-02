import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyProgress } from '../types';
import * as persistence from './persistence';

const CACHE_KEY = 'ascend_emotional_state';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export type EmotionalTone = 'proud' | 'supportive' | 'urgent';

export interface EmotionalState {
  tone: EmotionalTone;
  streakScore: number;
  lastUpdated: string;
  missedRecently: boolean;
}

type CachedPayload = EmotionalState & { cachedAt: number };

/** Without per-day history, treat high missedDays as "missed recently" for urgent band. */
function computeToneFromProgress(progress: DailyProgress): EmotionalTone {
  const streak = progress.streakDays;
  const missed = progress.missedDays;
  // Spec: 0–2 streak OR missed 2+ of last 5 → urgent (we approximate "last 5" via missedDays >= 2).
  if (streak <= 2 || missed >= 2) return 'urgent';
  // 7+ streak, no recent misses → proud
  if (streak >= 7 && missed === 0) return 'proud';
  // 3–6 streak, consistent → supportive
  return 'supportive';
}

export function computeEmotionalStateSync(progress: DailyProgress): EmotionalState {
  const tone = computeToneFromProgress(progress);
  return {
    tone,
    streakScore: progress.streakDays,
    lastUpdated: new Date().toISOString(),
    missedRecently: progress.missedDays >= 1,
  };
}

export async function computeEmotionalState(): Promise<EmotionalState> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CachedPayload;
      if (parsed.cachedAt && Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
        return {
          tone: parsed.tone,
          streakScore: parsed.streakScore,
          lastUpdated: parsed.lastUpdated,
          missedRecently: parsed.missedRecently,
        };
      }
    } catch {
      // fall through
    }
  }

  const progress = await persistence.loadDailyProgress();
  const state = computeEmotionalStateSync(progress);
  const payload: CachedPayload = { ...state, cachedAt: Date.now() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  return state;
}

/** Invalidate cache when streak/progress changes meaningfully (optional hook). */
export async function invalidateEmotionalStateCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

export function homeHeadline(state: EmotionalState): string {
  const x = state.streakScore;
  switch (state.tone) {
    case 'proud':
      return `You're on a ${x}-day streak. Your future self is proud.`;
    case 'supportive':
      return `Your future self is waiting. Come back today.`;
    case 'urgent':
      return `You said you wanted this. Your future self needs you to show up.`;
  }
}

export function sessionOpeningLine(state: EmotionalState): string {
  switch (state.tone) {
    case 'proud':
      return 'Your future self has something to celebrate with you.';
    case 'supportive':
      return "Your future self wants to talk. They've been waiting.";
    case 'urgent':
      return 'Your future self needs you to hear something important right now.';
  }
}

export function eveningTaskNudge(state: EmotionalState, name: string): string {
  const n = name.trim() || 'You';
  switch (state.tone) {
    case 'proud':
      return 'One more thing before tomorrow. Keep the streak alive.';
    case 'supportive':
      return "Still time today. What's one small thing you can do right now?";
    case 'urgent':
      return `${n}. You haven't done today's task. Your future self remembers this day.`;
  }
}
