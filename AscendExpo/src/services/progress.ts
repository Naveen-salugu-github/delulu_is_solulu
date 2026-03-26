import type { DailyProgress } from '../types';

export function registerAllTasksCompleted(
  progress: DailyProgress,
  todayKey: string,
  calendar: { parseDay: (k: string) => Date | null } = defaultCalendar
): DailyProgress {
  const next = { ...progress };
  if (next.lastAllTasksDayKey === todayKey) return next;

  const todayDate = calendar.parseDay(todayKey);
  if (!todayDate) {
    next.lastAllTasksDayKey = todayKey;
    return next;
  }

  if (next.lastAllTasksDayKey) {
    const lastDate = calendar.parseDay(next.lastAllTasksDayKey);
    if (lastDate) {
      const days = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 1) {
        next.streakDays += 1;
      } else if (days > 1) {
        next.missedDays += days - 1;
        next.streakDays = 1;
      }
    }
  } else {
    next.streakDays = 1;
  }

  next.lastAllTasksDayKey = todayKey;
  return next;
}

const defaultCalendar = {
  parseDay(key: string): Date | null {
    const [y, m, d] = key.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  },
};
