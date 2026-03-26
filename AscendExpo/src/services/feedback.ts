import type { DailyProgress, FutureSelfProfile, NarrativeToneKind } from '../types';
import { LIFE_CATEGORIES } from '../types';

export function toneForBehavior(
  metrics: DailyProgress,
  tasksCompletedToday: number,
  totalTasksToday: number
): NarrativeToneKind {
  const completionRate =
    totalTasksToday > 0 ? tasksCompletedToday / totalTasksToday : 1;

  if (metrics.missedDays >= 3) return 'confrontational';
  if (metrics.streakDays >= 7 && completionRate >= 0.66) return 'empowering';
  if (completionRate < 0.34 && totalTasksToday > 0) return 'confrontational';
  if (metrics.missedDays >= 1 || completionRate < 0.66) return 'supportive';
  if (metrics.sessionListens >= 5) return 'empowering';
  return 'neutral';
}

export function futureSelfMessage(metrics: DailyProgress, profile: FutureSelfProfile | null): string {
  const firstGoal = profile?.goals[0];
  const focusLabel = firstGoal
    ? LIFE_CATEGORIES.find((c) => c.id === firstGoal)?.title ?? 'your path'
    : 'your path';

  if (metrics.streakDays === 0) {
    return `I am waiting on the other side of one honest hour. Start small—${focusLabel} grows in inches.`;
  }
  if (metrics.missedDays > 0) {
    return `You remember the days you almost quit. But today you can choose discipline again—for ${focusLabel}, and for you.`;
  }
  if (metrics.streakDays >= 14) {
    return 'Momentum is becoming identity. Keep the promise you made when nobody was watching.';
  }
  return `I am not built from perfection. I am built from returns—show up again today for ${focusLabel}.`;
}
