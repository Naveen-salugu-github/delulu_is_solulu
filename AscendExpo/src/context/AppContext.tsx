import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Haptics from 'expo-haptics';
import type {
  DailyProgress,
  DailyTask,
  UserProfile,
  VisualizationSessionRecord,
} from '../types';
import * as persistence from '../services/persistence';
import { buildDailyTasks, dayKey } from '../services/tasks';
import { registerAllTasksCompleted } from '../services/progress';
import { invalidateEmotionalStateCache } from '../services/EmotionalStateEngine';

type AppContextValue = {
  hydrated: boolean;
  userProfile: UserProfile | null;
  dailyProgress: DailyProgress;
  todayTasks: DailyTask[];
  sessionHistory: VisualizationSessionRecord[];
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProgress: (p: DailyProgress) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  appendSession: (r: VisualizationSessionRecord) => Promise<void>;
  refreshTasksIfNeeded: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(persistence.defaultProgress());
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [sessionHistory, setSessionHistory] = useState<VisualizationSessionRecord[]>([]);

  const tasksRef = useRef<DailyTask[]>([]);
  const progressRef = useRef<DailyProgress>(persistence.defaultProgress());
  tasksRef.current = todayTasks;
  progressRef.current = dailyProgress;

  const hydrate = useCallback(async () => {
    const [profile, progress, tasks, sessions] = await Promise.all([
      persistence.loadUserProfile(),
      persistence.loadDailyProgress(),
      persistence.loadDailyTasks(),
      persistence.loadSessionHistory(),
    ]);
    setUserProfile(profile);
    setDailyProgress(progress);
    progressRef.current = progress;
    setSessionHistory(sessions);

    const key = dayKey();
    if (tasks.length && tasks[0]?.dayKey === key) {
      setTodayTasks(tasks);
      tasksRef.current = tasks;
    } else {
      const generated = buildDailyTasks(profile, progress);
      setTodayTasks(generated);
      tasksRef.current = generated;
      await persistence.saveDailyTasks(generated);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const completeOnboarding = useCallback(async (profile: UserProfile) => {
    const p: UserProfile = {
      ...profile,
      onboardingCompletedAt: new Date().toISOString(),
    };
    setUserProfile(p);
    await persistence.saveUserProfile(p);
    const progress = await persistence.loadDailyProgress();
    const tasks = buildDailyTasks(p, progress);
    setTodayTasks(tasks);
    tasksRef.current = tasks;
    await persistence.saveDailyTasks(tasks);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const updateProgress = useCallback(async (p: DailyProgress) => {
    setDailyProgress(p);
    progressRef.current = p;
    await persistence.saveDailyProgress(p);
    await invalidateEmotionalStateCache();
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    const prev = tasksRef.current;
    const idx = prev.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    const was = prev[idx].isCompleted;
    const next = [...prev];
    next[idx] = { ...next[idx], isCompleted: !was };
    setTodayTasks(next);
    tasksRef.current = next;
    await persistence.saveDailyTasks(next);

    if (!was) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let p: DailyProgress = { ...progressRef.current };
    if (!was && next[idx].isCompleted) p.dailyTasksCompleted += 1;
    if (was && !next[idx].isCompleted) {
      p.dailyTasksCompleted = Math.max(0, p.dailyTasksCompleted - 1);
    }
    p.lastActiveDayKey = dayKey();

    const completedCount = next.filter((t) => t.isCompleted).length;
    if (completedCount === next.length && next.length > 0) {
      p = registerAllTasksCompleted(p, dayKey());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setDailyProgress(p);
    progressRef.current = p;
    await persistence.saveDailyProgress(p);
    await invalidateEmotionalStateCache();
  }, []);

  const appendSession = useCallback(async (r: VisualizationSessionRecord) => {
    setSessionHistory((prev) => {
      const next = [...prev, r];
      void persistence.saveSessionHistory(next);
      return next;
    });
  }, []);

  const refreshTasksIfNeeded = useCallback(async () => {
    const key = dayKey();
    if (tasksRef.current[0]?.dayKey === key) return;
    const profile = await persistence.loadUserProfile();
    const progress = await persistence.loadDailyProgress();
    const t = buildDailyTasks(profile, progress);
    setTodayTasks(t);
    tasksRef.current = t;
    await persistence.saveDailyTasks(t);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      userProfile,
      dailyProgress,
      todayTasks,
      sessionHistory,
      completeOnboarding,
      updateProgress,
      toggleTask,
      appendSession,
      refreshTasksIfNeeded,
    }),
    [
      hydrated,
      userProfile,
      dailyProgress,
      todayTasks,
      sessionHistory,
      completeOnboarding,
      updateProgress,
      toggleTask,
      appendSession,
      refreshTasksIfNeeded,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
