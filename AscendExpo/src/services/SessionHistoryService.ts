import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmotionalTone } from './EmotionalStateEngine';

/**
 * Voice-message session log (future-self scripts).
 * Note: `ascend_session_history` is already used for legacy VisualizationSessionRecord[];
 * this key keeps the new shape without breaking existing installs.
 */
export const VOICE_SESSION_HISTORY_KEY = 'ascend_future_self_voice_sessions';

export interface FutureSelfVoiceSessionRecord {
  date: string;
  tone: EmotionalTone;
  scriptPreview: string;
  streakAtTime: number;
}

export async function loadVoiceSessionHistory(): Promise<FutureSelfVoiceSessionRecord[]> {
  const raw = await AsyncStorage.getItem(VOICE_SESSION_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FutureSelfVoiceSessionRecord[];
  } catch {
    return [];
  }
}

export async function appendVoiceSession(entry: FutureSelfVoiceSessionRecord): Promise<void> {
  const prev = await loadVoiceSessionHistory();
  const next = [...prev, entry];
  await AsyncStorage.setItem(VOICE_SESSION_HISTORY_KEY, JSON.stringify(next));
}
