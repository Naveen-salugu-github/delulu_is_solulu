import React, { useMemo } from 'react';
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

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { userProfile, dailyProgress, refreshTasksIfNeeded } = useApp();

  const message = useMemo(
    () => futureSelfMessage(dailyProgress, userProfile?.futureSelf ?? null),
    [dailyProgress, userProfile]
  );

  React.useEffect(() => {
    void refreshTasksIfNeeded();
  }, [refreshTasksIfNeeded]);

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.greet}>{greet}</Text>
          <Text style={styles.sub}>A calm, cinematic space for your future self.</Text>

          <GlassCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Daily visualization</Text>
              <Ionicons name="pulse-outline" size={22} color={theme.accentCyan} />
            </View>
            <Text style={styles.cardBody}>
              5–10 minutes of immersive narrative tuned to your goals and your week.
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

          <GlassCard style={styles.card}>
            <View style={styles.streakRow}>
              <View style={styles.flame}>
                <Ionicons name="flame" size={28} color={theme.accentPink} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Progress streak</Text>
                <Text style={styles.cardBody}>
                  {dailyProgress.streakDays} days anchored · {dailyProgress.missedDays} missed
                  signal
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
  sub: { marginTop: 6, fontSize: 15, color: theme.textSecondary, marginBottom: 18 },
  card: { marginBottom: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
  cardBody: { marginTop: 8, fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
  badge: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: theme.accentViolet,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
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
