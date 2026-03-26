import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyProgress, DailyTask, UserProfile, VisualizationSessionRecord } from '../types';

const KEYS = {
  userProfile: 'ascend_user_profile',
  dailyProgress: 'ascend_daily_progress',
  dailyTasks: 'ascend_daily_tasks',
  sessionHistory: 'ascend_session_history',
} as const;

export async function loadUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.userProfile);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.userProfile, JSON.stringify(profile));
}

export async function loadDailyProgress(): Promise<DailyProgress> {
  const raw = await AsyncStorage.getItem(KEYS.dailyProgress);
  if (!raw) return defaultProgress();
  try {
    return JSON.parse(raw) as DailyProgress;
  } catch {
    return defaultProgress();
  }
}

export function defaultProgress(): DailyProgress {
  return {
    streakDays: 0,
    lastActiveDayKey: null,
    lastAllTasksDayKey: null,
    dailyTasksCompleted: 0,
    missedDays: 0,
    sessionListens: 0,
    lastSessionDayKey: null,
  };
}

export async function saveDailyProgress(p: DailyProgress): Promise<void> {
  await AsyncStorage.setItem(KEYS.dailyProgress, JSON.stringify(p));
}

export async function loadDailyTasks(): Promise<DailyTask[]> {
  const raw = await AsyncStorage.getItem(KEYS.dailyTasks);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DailyTask[];
  } catch {
    return [];
  }
}

export async function saveDailyTasks(tasks: DailyTask[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.dailyTasks, JSON.stringify(tasks));
}

export async function loadSessionHistory(): Promise<VisualizationSessionRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.sessionHistory);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as VisualizationSessionRecord[];
  } catch {
    return [];
  }
}

export async function saveSessionHistory(sessions: VisualizationSessionRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.sessionHistory, JSON.stringify(sessions));
}
