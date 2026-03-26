export type LifeCategory =
  | 'wealth'
  | 'career'
  | 'health'
  | 'confidence'
  | 'relationships'
  | 'lifestyle';

export const LIFE_CATEGORIES: {
  id: LifeCategory;
  title: string;
  icon:
    | 'cash-outline'
    | 'briefcase-outline'
    | 'heart-outline'
    | 'color-wand-outline'
    | 'people-outline'
    | 'sunny-outline';
}[] = [
  { id: 'wealth', title: 'Wealth', icon: 'cash-outline' },
  { id: 'career', title: 'Career', icon: 'briefcase-outline' },
  { id: 'health', title: 'Health', icon: 'heart-outline' },
  { id: 'confidence', title: 'Confidence', icon: 'color-wand-outline' },
  { id: 'relationships', title: 'Relationships', icon: 'people-outline' },
  { id: 'lifestyle', title: 'Lifestyle', icon: 'sunny-outline' },
];

export interface FutureSelfProfile {
  // Identity & context (onboarding)
  preferredName?: string;
  locationNow?: string;
  gender?: string;
  age?: number | null;
  hasKids?: string;
  workRole?: string;
  workFeeling?: string;
  recentBuild?: string;
  selfDescription?: string;
  shapingEvent?: string;
  currentStruggle?: string;
  mostImportantPeople?: string;
  manifestation?: string;
  whyImportant?: string;

  goals: LifeCategory[];
  incomeTargetAnnualINR: number;
  lifestyleTags: string[];
  personalityTraits: string[];
  fears: string[];
  zodiacSign?: string;
  relationshipStatus?: string;
  idealPartnerTraits?: string[];
  settlementVision?: string;
}

export interface UserProfile {
  id: string;
  futureSelf: FutureSelfProfile;
  onboardingCompletedAt: string | null;
}

export interface DailyProgress {
  streakDays: number;
  lastActiveDayKey: string | null;
  lastAllTasksDayKey: string | null;
  dailyTasksCompleted: number;
  missedDays: number;
  sessionListens: number;
  lastSessionDayKey: string | null;
}

export interface DailyTask {
  id: string;
  title: string;
  detail: string;
  category: LifeCategory;
  isCompleted: boolean;
  dayKey: string;
}

export interface VisualizationSessionRecord {
  id: string;
  startedAt: string;
  durationSeconds: number;
  narrativeTone: string;
  completed: boolean;
}

export type NarrativeToneKind = 'empowering' | 'confrontational' | 'supportive' | 'neutral';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Player: undefined;
};
