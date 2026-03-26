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
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { generateVisualizationNarrative } from '../services/ai';
import { toneForBehavior } from '../services/feedback';
import { dayKey } from '../services/tasks';
import { ambienceSource, pickAmbience } from '../services/ambience';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Player'>;

const SESSION_SECONDS = 4 * 60;

type AmbienceChoice = 'off' | 'auto' | 'rain' | 'waves' | 'wind' | 'birds';
const AMBIENCE_ORDER: AmbienceChoice[] = ['off', 'auto', 'rain', 'waves', 'wind', 'birds'];

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voice, setVoice] = useState(true);
  const [tone, setTone] = useState('neutral');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [narrativeSource, setNarrativeSource] = useState<'groq' | 'fallback'>('fallback');
  const [ambienceChoice, setAmbienceChoice] = useState<AmbienceChoice>('auto');
  const [ambienceVolume, setAmbienceVolume] = useState(0.35);
  const [ambienceError, setAmbienceError] = useState(false);

  const sentences = useMemo(() => splitSentences(narrative), [narrative]);
  const progress = sentences.length ? (currentIndex + 1) / sentences.length : 0;

  const pulse = useRef(new Animated.Value(1)).current;
  const respondScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.42)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorded = useRef(false);
  const speechQueueIndex = useRef(0);
  const finishedRef = useRef(false);
  const ambienceRef = useRef<Audio.Sound | null>(null);

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
    // Ensure device/browser audio can play under narration (including silent mode on iOS).
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useEffect(() => {
    Animated.timing(glow, {
      toValue: isSpeaking ? 1 : 0.42,
      duration: isSpeaking ? 220 : 420,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [glow, isSpeaking]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const completed = todayTasks.filter((t) => t.isCompleted).length;
      const t = toneForBehavior(dailyProgress, completed, todayTasks.length);
      setTone(t);
      try {
        const result = await generateVisualizationNarrative(profile, t, dailyProgress);
        if (cancelled) return;
        setNarrative(result.text);
        setNarrativeSource(result.source);
        setPhase('playing');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        if (cancelled) return;
        setNarrative('');
        setNarrativeSource('fallback');
        setPhase('playing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, dailyProgress, todayTasks]);

  useEffect(() => {
    if (!profile) return;
    if (phase !== 'playing') return;

    let cancelled = false;
    (async () => {
      try {
        setAmbienceError(false);
        // Stop any previous ambience.
        if (ambienceRef.current) {
          await ambienceRef.current.stopAsync();
          await ambienceRef.current.unloadAsync();
          ambienceRef.current = null;
        }

        if (ambienceChoice === 'off') return;

        const kind =
          ambienceChoice === 'auto' ? pickAmbience(profile) : (ambienceChoice as Exclude<AmbienceChoice, 'off' | 'auto'>);
        const source = ambienceSource(kind);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          source,
          { isLooping: true, volume: ambienceVolume, shouldPlay: true }
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        ambienceRef.current = sound;
      } catch {
        // If ambience fails (network/web/autoplay), narration continues and we show a subtle hint.
        setAmbienceError(true);
        console.warn('[Ascend][Ambience] Failed to play selected ambience track.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, phase, ambienceChoice]);

  useEffect(() => {
    void (async () => {
      try {
        if (ambienceRef.current) {
          await ambienceRef.current.setVolumeAsync(ambienceVolume);
        }
      } catch {
        // Ignore transient player update errors.
      }
    })();
  }, [ambienceVolume]);

  useEffect(() => {
    if (phase !== 'playing' || sentences.length === 0 || voice) return;
    const perMs = (SESSION_SECONDS * 1000 * 0.85) / Math.max(sentences.length, 1);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIndex(0);
    setIsSpeaking(false);
    if (sentences.length <= 1) {
      setPhase('done');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      const nextIndex = Math.min(sentences.length - 1, i);
      setCurrentIndex(nextIndex);
      if (nextIndex === Math.floor(sentences.length / 3) || nextIndex === Math.floor((2 * sentences.length) / 3)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (nextIndex > 0 && nextIndex % 5 === 0) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (nextIndex >= sentences.length - 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSpeaking(false);
        setPhase('done');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, perMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, sentences.length, voice]);

  useEffect(() => {
    if (!voice || phase !== 'playing' || sentences.length === 0) {
      setIsSpeaking(false);
      void Speech.stop();
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    finishedRef.current = false;
    speechQueueIndex.current = 0;
    setCurrentIndex(0);

    let preferredVoice: { identifier?: string; language?: string } | null = null;
    (async () => {
      const voices = await Speech.getAvailableVoicesAsync();
      preferredVoice =
        voices.find(
          (v) =>
            v.language.startsWith('en-IN') &&
            (v.quality === 'Enhanced' || v.quality === 'Default')
        ) ?? voices.find((v) => v.language.startsWith('en-')) ?? voices[0] ?? null;

      const speakNext = async () => {
        if (finishedRef.current) return;
        const idx = speechQueueIndex.current;
        if (idx >= sentences.length) {
          finishedRef.current = true;
          setIsSpeaking(false);
          setPhase('done');
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return;
        }

        setCurrentIndex(idx);
        setIsSpeaking(true);

        Animated.sequence([
          Animated.timing(respondScale, {
            toValue: 1.08,
            duration: 140,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(respondScale, {
            toValue: 1.0,
            duration: 220,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();

        if (idx === Math.floor(sentences.length / 3) || idx === Math.floor((2 * sentences.length) / 3)) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        if (idx > 0 && idx % 5 === 0) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        speechQueueIndex.current = idx + 1;
        const sentence = sentences[idx];

        Speech.speak(sentence, {
          language: preferredVoice?.language ?? 'en-IN',
          voice: preferredVoice?.identifier,
          pitch: 1.0,
          rate: 0.95,
          volume: 1,
          onDone: () => {
            setIsSpeaking(false);
            void speakNext();
          },
          onError: () => {
            finishedRef.current = true;
            setIsSpeaking(false);
            setPhase('done');
          },
        });
      };

      void speakNext();
    })();
    return () => {
      setIsSpeaking(false);
      void Speech.stop();
    };
  }, [voice, phase, sentences]);

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
      try {
        if (ambienceRef.current) {
          await ambienceRef.current.stopAsync();
          await ambienceRef.current.unloadAsync();
          ambienceRef.current = null;
        }
      } catch {}
    })();
  }, [phase, dailyProgress, updateProgress, appendSession, tone]);

  const currentSentence = sentences[currentIndex] ?? '';

  const close = () => {
    Speech.stop();
    setIsSpeaking(false);
    void (async () => {
      try {
        if (ambienceRef.current) {
          await ambienceRef.current.stopAsync();
          await ambienceRef.current.unloadAsync();
          ambienceRef.current = null;
        }
      } catch {}
    })();
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

  const ambienceLabel =
    ambienceChoice === 'off'
      ? 'Off'
      : ambienceChoice === 'auto'
        ? 'Auto'
        : ambienceChoice === 'wind'
          ? 'Breeze'
          : ambienceChoice.charAt(0).toUpperCase() + ambienceChoice.slice(1);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={close} style={styles.iconBtn}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <View style={styles.centerMeta}>
            <Text style={styles.voiceLabel}>{isSpeaking ? 'Voice • speaking' : 'Voice'}</Text>
            <View style={[styles.sourceBadge, narrativeSource === 'groq' ? styles.sourceGroq : styles.sourceFallback]}>
              <Text style={styles.sourceBadgeText}>
                {narrativeSource === 'groq' ? 'Groq AI' : 'Local Fallback'}
              </Text>
            </View>
          </View>
          <Switch value={voice} onValueChange={setVoice} trackColor={{ false: '#333', true: theme.accentCyan }} />
        </View>

        <View style={styles.ambienceRow}>
          <Pressable
            style={({ pressed }) => [styles.ambiencePill, pressed && { opacity: 0.88 }]}
            onPress={() => {
              const idx = AMBIENCE_ORDER.indexOf(ambienceChoice);
              const next = AMBIENCE_ORDER[(idx + 1) % AMBIENCE_ORDER.length] ?? 'auto';
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAmbienceChoice(next);
            }}
          >
            <Ionicons name="musical-notes-outline" size={18} color={theme.textSecondary} />
            <Text style={styles.ambienceText}>Ambience: {ambienceLabel}</Text>
          </Pressable>
          {ambienceError && ambienceChoice !== 'off' && (
            <Text style={styles.ambienceHint}>Ambience unavailable on this network/device right now.</Text>
          )}
          {ambienceChoice !== 'off' && (
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabel}>Volume</Text>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={ambienceVolume}
                onValueChange={setAmbienceVolume}
                minimumTrackTintColor={theme.accentCyan}
                maximumTrackTintColor="rgba(109,59,255,0.18)"
                thumbTintColor={theme.textPrimary}
              />
              <Text style={styles.volumeValue}>{Math.round(ambienceVolume * 100)}%</Text>
            </View>
          )}
        </View>

        <View style={styles.orbWrap}>
          <Animated.View style={{ transform: [{ scale: pulse }, { scale: respondScale }], opacity: glow }}>
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
            <Text style={styles.narrative}>{phase === 'playing' ? currentSentence : narrative}</Text>
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
  ambienceRow: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  ambiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(109,59,255,0.18)',
  },
  ambienceText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  ambienceHint: {
    marginTop: 6,
    color: theme.textSecondary,
    fontSize: 12,
    opacity: 0.9,
  },
  volumeRow: {
    marginTop: 8,
    width: '100%',
    paddingRight: 6,
  },
  volumeLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  volumeSlider: { width: '100%', height: 30 },
  volumeValue: {
    alignSelf: 'flex-end',
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: -2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { color: theme.textSecondary, fontSize: 18, fontWeight: '600' },
  centerMeta: { alignItems: 'center', justifyContent: 'center' },
  voiceLabel: { color: theme.textSecondary, fontSize: 15 },
  sourceBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  sourceGroq: {
    backgroundColor: 'rgba(46, 204, 113, 0.18)',
    borderColor: 'rgba(46, 204, 113, 0.45)',
  },
  sourceFallback: {
    backgroundColor: 'rgba(241, 196, 15, 0.18)',
    borderColor: 'rgba(241, 196, 15, 0.45)',
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: 0.2,
  },
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
    backgroundColor: 'rgba(109,59,255,0.10)',
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
