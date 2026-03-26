import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { generateVisualizationNarrative } from '../services/ai';
import { toneForBehavior } from '../services/feedback';
import { dayKey } from '../services/tasks';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Player'>;

const SESSION_SECONDS = 7 * 60;

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\n/g, ' ');
  const parts = normalized
    .split('. ')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((s) => (s.endsWith('.') ? s : `${s}.`));
}

export default function PlayerScreen() {
  const navigation = useNavigation<Nav>();
  const { userProfile, dailyProgress, todayTasks, updateProgress, appendSession } = useApp();
  const profile = userProfile?.futureSelf;

  const [phase, setPhase] = useState<'loading' | 'playing' | 'done'>('loading');
  const [narrative, setNarrative] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const [voice, setVoice] = useState(false);
  const [tone, setTone] = useState('neutral');

  const sentences = useMemo(() => splitSentences(narrative), [narrative]);
  const progress = sentences.length ? visibleCount / sentences.length : 0;

  const pulse = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorded = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.98,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const completed = todayTasks.filter((t) => t.isCompleted).length;
      const t = toneForBehavior(dailyProgress, completed, todayTasks.length);
      setTone(t);
      try {
        const text = await generateVisualizationNarrative(profile, t, dailyProgress);
        if (cancelled) return;
        setNarrative(text);
        setPhase('playing');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        if (cancelled) return;
        setNarrative('');
        setPhase('playing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, dailyProgress, todayTasks]);

  useEffect(() => {
    if (phase !== 'playing' || sentences.length === 0) return;
    const perMs = (SESSION_SECONDS * 1000 * 0.85) / Math.max(sentences.length, 1);
    setVisibleCount(1);
    if (sentences.length <= 1) {
      setPhase('done');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    let i = 1;
    timerRef.current = setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i === Math.floor(sentences.length / 3) || i === Math.floor((2 * sentences.length) / 3)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (i > 0 && i % 5 === 0) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (i >= sentences.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('done');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, perMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, sentences.length]);

  useEffect(() => {
    if (!voice || !narrative) {
      void Speech.stop();
      return;
    }
    Speech.speak(narrative, {
      language: 'en-IN',
      rate: 0.92,
    });
    return () => {
      void Speech.stop();
    };
  }, [voice, narrative]);

  useEffect(() => {
    if (phase !== 'done' || recorded.current) return;
    recorded.current = true;
    void (async () => {
      const p = { ...dailyProgress };
      p.sessionListens += 1;
      p.lastSessionDayKey = dayKey();
      await updateProgress(p);
      await appendSession({
        id: `${Date.now()}`,
        startedAt: new Date().toISOString(),
        durationSeconds: SESSION_SECONDS,
        narrativeTone: tone,
        completed: true,
      });
    })();
  }, [phase, dailyProgress, updateProgress, appendSession, tone]);

  const visibleText = sentences.slice(0, visibleCount).join('\n\n');

  const close = () => {
    Speech.stop();
    navigation.goBack();
  };

  if (!profile) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.centered}>
          <Text style={{ color: theme.textSecondary }}>No profile</Text>
          <Pressable onPress={close} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Close</Text>
          </Pressable>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={close} style={styles.iconBtn}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <Text style={styles.voiceLabel}>Voice</Text>
          <Switch value={voice} onValueChange={setVoice} trackColor={{ false: '#333', true: theme.accentCyan }} />
        </View>

        <View style={styles.orbWrap}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <LinearGradient
              colors={[`${theme.accentCyan}cc`, `${theme.accentViolet}99`, 'transparent']}
              style={styles.orb}
            />
          </Animated.View>
        </View>

        <WaveBars progress={progress} />

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>

        {phase === 'loading' && (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={theme.textPrimary} size="large" />
            <Text style={styles.loadingText}>Composing your visualization…</Text>
          </View>
        )}

        {(phase === 'playing' || phase === 'done') && (
          <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
            <Text style={styles.narrative}>{visibleText}</Text>
          </ScrollView>
        )}

        {phase === 'done' && (
          <Pressable style={styles.primaryBtn} onPress={close}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

function WaveBars({ progress }: { progress: number }) {
  const bars = 28;
  return (
    <View style={styles.waveRow}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 8 + (i / bars) * 22 * (0.4 + progress * 0.6);
        const opacity = 0.25 + progress * 0.45;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              { height: h, opacity, backgroundColor: theme.accentCyan, marginRight: i === bars - 1 ? 0 : 3 },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { color: theme.textSecondary, fontSize: 18, fontWeight: '600' },
  voiceLabel: { color: theme.textSecondary, fontSize: 15 },
  orbWrap: { alignItems: 'center', marginVertical: 12 },
  orb: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.9,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    paddingHorizontal: 16,
  },
  bar: { width: 5, borderRadius: 3 },
  progressTrack: {
    height: 4,
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accentCyan,
    borderRadius: 2,
  },
  centerBlock: { alignItems: 'center', marginTop: 24 },
  loadingText: { marginTop: 12, color: theme.textSecondary, fontSize: 15 },
  textScroll: { flex: 1, marginTop: 12 },
  textContent: { paddingHorizontal: 22, paddingBottom: 24 },
  narrative: {
    fontSize: 20,
    lineHeight: 30,
    color: theme.textPrimary,
    textAlign: 'center',
  },
  primaryBtn: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: theme.accentViolet,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
});
