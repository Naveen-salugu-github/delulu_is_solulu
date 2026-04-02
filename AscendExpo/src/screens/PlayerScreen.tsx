import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Platform,
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
import { dayKey } from '../services/tasks';
import { ambienceSource, pickAmbience } from '../services/ambience';
import {
  computeEmotionalState,
  invalidateEmotionalStateCache,
  sessionOpeningLine,
  type EmotionalState,
} from '../services/EmotionalStateEngine';
import { generateFutureSelfScript, splitScriptIntoParagraphs } from '../services/FutureSelfScriptService';
import { appendVoiceSession } from '../services/SessionHistoryService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Player'>;

type AmbienceChoice = 'off' | 'auto' | 'rain' | 'waves' | 'wind' | 'birds';
const AMBIENCE_ORDER: AmbienceChoice[] = ['off', 'auto', 'rain', 'waves', 'wind', 'birds'];

const INTRO_MS = 2000;
const SAMANTHA_ID = 'com.apple.ttsbundle.Samantha-compact';

function computeEmotionalStateSyncLocal(p: import('../types').DailyProgress): EmotionalState {
  const tone =
    p.streakDays <= 2 || p.missedDays >= 2
      ? 'urgent'
      : p.streakDays >= 7 && p.missedDays === 0
        ? 'proud'
        : 'supportive';
  return {
    tone,
    streakScore: p.streakDays,
    lastUpdated: new Date().toISOString(),
    missedRecently: p.missedDays >= 1,
  };
}

export default function PlayerScreen() {
  const navigation = useNavigation<Nav>();
  const { userProfile, dailyProgress, todayTasks, updateProgress, appendSession } = useApp();
  const profile = userProfile?.futureSelf;

  const [phase, setPhase] = useState<'loading' | 'intro' | 'playing' | 'done'>('loading');
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);
  const [script, setScript] = useState('');
  const [scriptSource, setScriptSource] = useState<'groq' | 'fallback'>('fallback');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [paraIndex, setParaIndex] = useState(0);
  const [wordsShownInPara, setWordsShownInPara] = useState(0);
  const [voice, setVoice] = useState(true);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ambienceChoice, setAmbienceChoice] = useState<AmbienceChoice>('auto');
  const [ambienceVolume, setAmbienceVolume] = useState(0.35);
  const [ambienceError, setAmbienceError] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;
  const respondScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.42)).current;
  const ambienceRef = useRef<Audio.Sound | null>(null);
  const isClosingRef = useRef(false);
  const hasStartedSessionRef = useRef(false);
  const finishedRef = useRef(false);
  const voiceIdRef = useRef<string | undefined>(undefined);
  const voiceLangRef = useRef<string>('en-US');
  const wordTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceOffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorded = useRef(false);

  const currentWords = useMemo(() => {
    const p = paragraphs[paraIndex] ?? '';
    return p.trim().split(/\s+/).filter(Boolean);
  }, [paragraphs, paraIndex]);

  const progress = useMemo(() => {
    if (paragraphs.length === 0) return 0;
    const w = currentWords.length || 1;
    const frac = Math.min(1, wordsShownInPara / w);
    return (paraIndex + frac) / paragraphs.length;
  }, [paragraphs.length, paraIndex, wordsShownInPara, currentWords.length]);

  const displayText = useMemo(() => {
    const prev = paragraphs.slice(0, paraIndex).join('\n\n');
    const cur = currentWords.slice(0, wordsShownInPara).join(' ');
    if (!prev) return cur;
    if (!cur) return prev;
    return `${prev}\n\n${cur}`;
  }, [paragraphs, paraIndex, currentWords, wordsShownInPara]);

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
    if (hasStartedSessionRef.current) return;
    hasStartedSessionRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const state = await computeEmotionalState();
        const scriptResult = await generateFutureSelfScript(profile, state.tone, dailyProgress);
        if (cancelled || isClosingRef.current) return;

        setEmotionalState(state);
        setScript(scriptResult.text);
        setScriptSource(scriptResult.source);
        setParagraphs(splitScriptIntoParagraphs(scriptResult.text));
        setParaIndex(0);
        setWordsShownInPara(0);
        setPhase('intro');

        const voices = await Speech.getAvailableVoicesAsync();
        const samantha = voices.find((v) => v.identifier === SAMANTHA_ID);
        const en = voices.find((v) => v.language?.startsWith('en')) ?? voices[0];
        if (Platform.OS === 'ios' && samantha) {
          voiceIdRef.current = samantha.identifier;
          voiceLangRef.current = samantha.language ?? 'en-US';
        } else if (en) {
          voiceIdRef.current = en.identifier;
          voiceLangRef.current = en.language ?? 'en-US';
        }

        introTimerRef.current = setTimeout(() => {
          if (cancelled || isClosingRef.current) return;
          setPhase('playing');
        }, INTRO_MS);
      } catch {
        if (cancelled || isClosingRef.current) return;
        const state = computeEmotionalStateSyncLocal(dailyProgress);
        setEmotionalState(state);
        const r = await generateFutureSelfScript(profile, state.tone, dailyProgress);
        setScript(r.text);
        setScriptSource(r.source);
        setParagraphs(splitScriptIntoParagraphs(r.text));
        setPhase('intro');
        introTimerRef.current = setTimeout(() => {
          if (!isClosingRef.current) setPhase('playing');
        }, INTRO_MS);
      }
    })();

    return () => {
      cancelled = true;
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, [profile, dailyProgress]);

  useEffect(() => {
    if (!profile) return;
    if (phase !== 'playing' && phase !== 'intro') return;

    let cancelled = false;
    void (async () => {
      try {
        setAmbienceError(false);
        if (ambienceRef.current) {
          await ambienceRef.current.stopAsync();
          await ambienceRef.current.unloadAsync();
          ambienceRef.current = null;
        }
        if (ambienceChoice === 'off' || phase === 'intro') return;

        const kind =
          ambienceChoice === 'auto' ? pickAmbience(profile) : (ambienceChoice as Exclude<AmbienceChoice, 'off' | 'auto'>);
        const source = ambienceSource(kind);
        const { sound } = await Audio.Sound.createAsync(source, {
          isLooping: true,
          volume: ambienceVolume,
          shouldPlay: true,
        });
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        ambienceRef.current = sound;
      } catch {
        setAmbienceError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, phase, ambienceChoice]);

  useEffect(() => {
    void (async () => {
      try {
        if (ambienceRef.current) await ambienceRef.current.setVolumeAsync(ambienceVolume);
      } catch {}
    })();
  }, [ambienceVolume]);

  const clearWordTick = useCallback(() => {
    if (wordTickRef.current) {
      clearInterval(wordTickRef.current);
      wordTickRef.current = null;
    }
  }, []);

  const startWordTickForParagraph = useCallback(
    (wordCount: number) => {
      clearWordTick();
      if (wordCount <= 0) return;
      const ms = Math.max(220, Math.min(380, Math.floor(60000 / (wordCount * 2.2))));
      wordTickRef.current = setInterval(() => {
        setWordsShownInPara((w) => {
          if (w >= wordCount) {
            clearWordTick();
            return w;
          }
          return w + 1;
        });
      }, ms);
    },
    [clearWordTick]
  );

  const runParagraphSpeech = useRef<() => void>(() => {});

  runParagraphSpeech.current = () => {
    if (finishedRef.current || isClosingRef.current) return;
    const paras = paragraphs;
    const idx = paraIndex;
    if (idx >= paras.length) {
      finishedRef.current = true;
      setIsSpeaking(false);
      clearWordTick();
      setPhase('done');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const text = paras[idx]?.trim() ?? '';
    const words = text.split(/\s+/).filter(Boolean);
    setWordsShownInPara(0);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startWordTickForParagraph(words.length);
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

    const onParaDone = () => {
      clearWordTick();
      setWordsShownInPara(words.length);
      setIsSpeaking(false);
      setParaIndex((p) => p + 1);
    };

    if (!voiceRef.current || !text) {
      if (voiceOffTimerRef.current) clearTimeout(voiceOffTimerRef.current);
      const dur = Math.max(2500, words.length * 420);
      voiceOffTimerRef.current = setTimeout(() => {
        if (isClosingRef.current) return;
        onParaDone();
      }, dur);
      return;
    }

    Speech.stop();
    Speech.speak(text, {
      language: voiceLangRef.current,
      voice: voiceIdRef.current,
      pitch: 1.0,
      rate: 0.88,
      volume: 1,
      onDone: () => {
        if (isClosingRef.current) return;
        onParaDone();
      },
      onError: () => {
        if (isClosingRef.current) return;
        onParaDone();
      },
    });
  };

  useEffect(() => {
    if (phase !== 'playing' || paragraphs.length === 0) return;
    finishedRef.current = false;
    runParagraphSpeech.current();
  }, [phase, paraIndex, paragraphs.length]);

  useEffect(() => {
    if (phase !== 'playing') clearWordTick();
  }, [phase, clearWordTick]);

  useEffect(() => {
    return () => {
      clearWordTick();
      if (voiceOffTimerRef.current) clearTimeout(voiceOffTimerRef.current);
      Speech.stop();
    };
  }, [clearWordTick]);

  useEffect(() => {
    if (phase !== 'done' || recorded.current) return;
    recorded.current = true;
    void (async () => {
      const tone = emotionalState?.tone ?? 'supportive';
      const p = { ...dailyProgress };
      p.sessionListens += 1;
      p.lastSessionDayKey = dayKey();
      await updateProgress(p);
      await invalidateEmotionalStateCache();

      const preview = script.slice(0, 80);
      await appendVoiceSession({
        date: new Date().toISOString(),
        tone,
        scriptPreview: preview,
        streakAtTime: dailyProgress.streakDays,
      });

      const estSeconds = Math.max(60, Math.round(script.split(/\s+/).filter(Boolean).length * 0.35));
      await appendSession({
        id: `${Date.now()}`,
        startedAt: new Date().toISOString(),
        durationSeconds: estSeconds,
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
  }, [phase, emotionalState, script, dailyProgress, updateProgress, appendSession]);

  const close = () => {
    isClosingRef.current = true;
    finishedRef.current = true;
    clearWordTick();
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    if (voiceOffTimerRef.current) clearTimeout(voiceOffTimerRef.current);
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
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
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

  const opening = emotionalState ? sessionOpeningLine(emotionalState) : '';
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
            <Text style={styles.voiceLabel}>{isSpeaking ? 'Future self • speaking' : 'Future self'}</Text>
            <View style={[styles.sourceBadge, scriptSource === 'groq' ? styles.sourceGroq : styles.sourceFallback]}>
              <Text style={styles.sourceBadgeText}>{scriptSource === 'groq' ? 'Groq AI' : 'Offline'}</Text>
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
            <Text style={styles.ambienceHint}>Ambience unavailable on this device right now.</Text>
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
            <Text style={styles.loadingText}>Your future self is finding the words…</Text>
          </View>
        )}

        {phase === 'intro' && (
          <View style={styles.centerBlock}>
            <Text style={styles.introText}>{opening}</Text>
          </View>
        )}

        {(phase === 'playing' || phase === 'done') && (
          <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
            <Text style={styles.narrative}>{phase === 'done' ? script : displayText}</Text>
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
  centerBlock: { alignItems: 'center', marginTop: 24, paddingHorizontal: 24 },
  loadingText: { marginTop: 12, color: theme.textSecondary, fontSize: 15, textAlign: 'center' },
  introText: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
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
    backgroundColor: 'rgba(255,255,255,0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#2f1f6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryBtnText: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
});
