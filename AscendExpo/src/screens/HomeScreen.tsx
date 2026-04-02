import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { futureSelfMessage } from '../services/feedback';
import {
  computeEmotionalState,
  eveningTaskNudge,
  homeHeadline,
  type EmotionalState,
} from '../services/EmotionalStateEngine';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { userProfile, dailyProgress, refreshTasksIfNeeded, todayTasks, toggleTask } = useApp();
  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(null);

  const message = useMemo(
    () => futureSelfMessage(dailyProgress, userProfile?.futureSelf ?? null),
    [dailyProgress, userProfile]
  );

  const name = userProfile?.futureSelf?.preferredName?.trim() ?? '';

  useEffect(() => {
    void refreshTasksIfNeeded();
  }, [refreshTasksIfNeeded]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await computeEmotionalState();
      if (!cancelled) setEmotionalState(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [dailyProgress.streakDays, dailyProgress.missedDays]);

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';

  const headline = emotionalState ? homeHeadline(emotionalState) : 'Your future self is here.';
  const incomplete = todayTasks.filter((t) => !t.isCompleted).length;
  const showEveningNudge = hour >= 20 && incomplete > 0 && emotionalState;
  const taskNudge = emotionalState ? eveningTaskNudge(emotionalState, name || 'You') : '';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.greet}>{greet}</Text>
          <Text style={styles.sub}>{headline}</Text>

          <GlassCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Talk to your future self</Text>
              <Ionicons name="mic-outline" size={22} color={theme.accentCyan} />
            </View>
            <Text style={styles.cardBody}>
              A first-person voice message from the you you are building — tuned to your streak and your story.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Player');
              }}
            >
              <Text style={styles.primaryBtnText}>Begin session</Text>
            </Pressable>
          </GlassCard>

          {todayTasks.length > 0 && (
            <GlassCard style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Today</Text>
                <Text style={styles.badge}>
                  {todayTasks.filter((t) => t.isCompleted).length}/{todayTasks.length}
                </Text>
              </View>
              {showEveningNudge && (
                <Text style={styles.nudge}>{taskNudge}</Text>
              )}
              {todayTasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => void toggleTask(task.id)}
                >
                  <Ionicons
                    name={task.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={task.isCompleted ? theme.accentCyan : theme.textSecondary}
                  />
                  <View style={styles.taskText}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDetail}>{task.detail}</Text>
                  </View>
                </Pressable>
              ))}
            </GlassCard>
          )}

          <GlassCard style={styles.card}>
            <View style={styles.streakRow}>
              <View style={styles.flame}>
                <Ionicons name="flame" size={28} color={theme.accentPink} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Progress streak</Text>
                <Text style={styles.cardBody}>
                  {dailyProgress.streakDays} days anchored · {dailyProgress.missedDays} missed signal
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Future self message</Text>
            <Text style={styles.message}>{message}</Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  greet: { fontSize: 28, fontWeight: '600', color: theme.textPrimary },
  sub: { marginTop: 6, fontSize: 16, color: theme.textSecondary, marginBottom: 18, lineHeight: 24 },
  card: { marginBottom: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
  cardBody: { marginTop: 8, fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
  badge: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  nudge: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
    color: theme.accentViolet,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 14,
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
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(109,59,255,0.18)',
  },
  taskText: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  taskDetail: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flame: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: `${theme.accentViolet}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { marginTop: 10, fontSize: 16, color: theme.textSecondary, lineHeight: 24 },
});
