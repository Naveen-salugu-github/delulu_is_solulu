import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { FutureSelfProfile, LifeCategory, RootStackParamList, UserProfile } from '../types';
import { LIFE_CATEGORIES } from '../types';
import { formatIncomeAnnualINR, incomeFromSlider } from '../services/income';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const LIFESTYLE = [
  'Luxury apartment',
  'Travel lifestyle',
  'Startup founder',
  'Athlete body',
  'Peaceful minimalist life',
];
const PERSONALITY = ['disciplined', 'confident', 'creative', 'fearless', 'calm', 'dominant'];
const FEARS = [
  'procrastination',
  'fear of failure',
  'lack of focus',
  'low confidence',
  'distractions',
];
const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
const INCOME_METHODS = ['Salary job', 'Business', 'Freelancing', 'Content/Creator', 'Investing', 'Mixed'];
const RELATIONSHIP_STATUS = ['Single', 'Dating', 'Committed', 'Married'];
const PARTNER_TRAITS = ['Feminine', 'Kind', 'Ambitious', 'Loyal', 'Playful', 'Emotionally mature', 'Fit', 'Spiritual'];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Set<LifeCategory>>(new Set());
  const [incomeT, setIncomeT] = useState(0.35);
  const [lifestyle, setLifestyle] = useState<Set<string>>(new Set());
  const [personality, setPersonality] = useState<Set<string>>(new Set());
  const [fears, setFears] = useState<Set<string>>(new Set());
  const [zodiacSign, setZodiacSign] = useState<string>('Leo');
  const [incomeMethod, setIncomeMethod] = useState<string>('Salary job');
  const [currentIncomeMonthly, setCurrentIncomeMonthly] = useState<string>('');
  const [relationshipStatus, setRelationshipStatus] = useState<string>('Single');
  const [partnerTraits, setPartnerTraits] = useState<Set<string>>(new Set());
  const [settlementVision, setSettlementVision] = useState<string>('');

  const annual = useMemo(() => incomeFromSlider(incomeT), [incomeT]);
  const incomeLabel = useMemo(() => formatIncomeAnnualINR(annual), [annual]);

  const next = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep((s) => s + 1);
    void Haptics.selectionAsync();
  };

  const back = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep((s) => Math.max(0, s - 1));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCat = (id: LifeCategory) => {
    void Haptics.selectionAsync();
    setCategories((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const finish = async () => {
    const fs: FutureSelfProfile = {
      goals: Array.from(categories),
      incomeTargetAnnualINR: annual,
      currentIncomeMonthlyINR: currentIncomeMonthly.trim()
        ? Number(currentIncomeMonthly.replace(/[^\d]/g, ''))
        : null,
      incomeMethod,
      lifestyleTags: Array.from(lifestyle).sort(),
      personalityTraits: Array.from(personality).sort(),
      fears: Array.from(fears).sort(),
      zodiacSign,
      relationshipStatus,
      idealPartnerTraits: Array.from(partnerTraits).sort(),
      settlementVision: settlementVision.trim(),
    };
    const profile: UserProfile = {
      id: `${Date.now()}`,
      futureSelf: fs,
      onboardingCompletedAt: null,
    };
    await completeOnboarding(profile);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable onPress={back} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          <Text style={styles.brand}>Ascend</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View>
              <Text style={styles.hero}>Design the life you want to step into.</Text>
              <Text style={styles.body}>
                Ascend builds immersive visualization sessions that evolve with your behavior.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  next();
                }}
              >
                <Text style={styles.primaryBtnText}>Start</Text>
              </Pressable>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.title}>What are you ascending toward?</Text>
              <Text style={styles.body}>Choose every area that matters.</Text>
              <View style={styles.chipWrap}>
                {LIFE_CATEGORIES.map((c) => {
                  const on = categories.has(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleCat(c.id)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Ionicons name={c.icon} size={18} color={theme.textPrimary} />
                      <Text style={styles.chipText}>{c.title}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={[
                  styles.primaryBtn,
                  categories.size === 0 && { opacity: 0.45 },
                ]}
                disabled={categories.size === 0}
                onPress={() => {
                  if (categories.size === 0) {
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    return;
                  }
                  next();
                }}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>Your income horizon</Text>
              <Text style={styles.body}>Slide from a steady foundation to a generational scale.</Text>
              <View style={styles.sliderCard}>
                <Text style={styles.incomeBig}>{incomeLabel}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={incomeT}
                  onValueChange={setIncomeT}
                  minimumTrackTintColor={theme.accentCyan}
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor={theme.textPrimary}
                />
              </View>
              <Pressable style={styles.primaryBtn} onPress={next}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <ChipStep
              title="What does your ideal life look like?"
              subtitle="Pick the scenes that feel true."
              items={LIFESTYLE}
              selected={lifestyle}
              onToggle={(v) => {
                setLifestyle((prev) => {
                  const n = new Set(prev);
                  if (n.has(v)) n.delete(v);
                  else n.add(v);
                  return n;
                });
                void Haptics.selectionAsync();
              }}
              onContinue={next}
            />
          )}

          {step === 4 && (
            <ChipStep
              title="Personality traits"
              subtitle="Choose traits your future self leads with."
              items={PERSONALITY}
              selected={personality}
              onToggle={(v) => {
                setPersonality((prev) => {
                  const n = new Set(prev);
                  if (n.has(v)) n.delete(v);
                  else n.add(v);
                  return n;
                });
                void Haptics.selectionAsync();
              }}
              onContinue={next}
            />
          )}

          {step === 5 && (
            <ChipStep
              title="What holds you back today?"
              subtitle="Name the friction so the story can transform it."
              items={FEARS}
              selected={fears}
              onToggle={(v) => {
                setFears((prev) => {
                  const n = new Set(prev);
                  if (n.has(v)) n.delete(v);
                  else n.add(v);
                  return n;
                });
                void Haptics.selectionAsync();
              }}
              onContinue={next}
            />
          )}

          {step === 6 && (
            <ChipStep
              title="What is your zodiac sign?"
              subtitle="We use this to shape communication style and emotional pacing."
              items={ZODIAC}
              selected={new Set([zodiacSign])}
              onToggle={(v) => {
                setZodiacSign(v);
                void Haptics.selectionAsync();
              }}
              singleSelect
              onContinue={next}
            />
          )}

          {step === 7 && (
            <ChipStep
              title="How are you making money right now?"
              subtitle="This helps generate realistic daily tasks and money language."
              items={INCOME_METHODS}
              selected={new Set([incomeMethod])}
              onToggle={(v) => {
                setIncomeMethod(v);
                void Haptics.selectionAsync();
              }}
              singleSelect
              onContinue={next}
            />
          )}

          {step === 8 && (
            <View>
              <Text style={styles.title}>Current monthly income</Text>
              <Text style={styles.body}>Optional, but improves your growth timeline realism.</Text>
              <TextInput
                value={currentIncomeMonthly}
                onChangeText={setCurrentIncomeMonthly}
                placeholder="e.g. 75000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                style={styles.input}
              />
              <Pressable style={styles.primaryBtn} onPress={next}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {step === 9 && (
            <ChipStep
              title="Relationship status"
              subtitle="This keeps the relationship narrative authentic."
              items={RELATIONSHIP_STATUS}
              selected={new Set([relationshipStatus])}
              onToggle={(v) => {
                setRelationshipStatus(v);
                void Haptics.selectionAsync();
              }}
              singleSelect
              onContinue={next}
            />
          )}

          {step === 10 && (
            <ChipStep
              title="Your ideal girlfriend / partner traits"
              subtitle="Pick what matters most to you emotionally and practically."
              items={PARTNER_TRAITS}
              selected={partnerTraits}
              onToggle={(v) => {
                setPartnerTraits((prev) => {
                  const n = new Set(prev);
                  if (n.has(v)) n.delete(v);
                  else n.add(v);
                  return n;
                });
                void Haptics.selectionAsync();
              }}
              onContinue={next}
            />
          )}

          {step === 11 && (
            <View>
              <Text style={styles.title}>Where do you want to settle?</Text>
              <Text style={styles.body}>City/country or vibe: \"Dubai\", \"Bangalore\", \"Bali by the beach\".</Text>
              <TextInput
                value={settlementVision}
                onChangeText={setSettlementVision}
                placeholder="e.g. Bangalore, then Dubai"
                placeholderTextColor={theme.textSecondary}
                style={styles.input}
              />
              <Pressable style={styles.primaryBtn} onPress={next}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {step === 12 && (
            <View>
              <Text style={styles.title}>Your future self profile</Text>
              <View style={styles.summary}>
                <SummaryRow label="Focus" value={Array.from(categories).join(', ') || '—'} />
                <SummaryRow label="Income" value={incomeLabel} />
                <SummaryRow label="Money mode" value={incomeMethod} />
                <SummaryRow label="Zodiac" value={zodiacSign} />
                <SummaryRow label="Lifestyle" value={Array.from(lifestyle).join(', ') || '—'} />
                <SummaryRow label="Traits" value={Array.from(personality).join(', ') || '—'} />
                <SummaryRow label="Friction" value={Array.from(fears).join(', ') || '—'} />
                <SummaryRow label="Relationship" value={relationshipStatus} />
                <SummaryRow label="Ideal partner" value={Array.from(partnerTraits).join(', ') || '—'} />
                <SummaryRow label="Settlement" value={settlementVision || '—'} />
              </View>
              <Text style={styles.footnote}>
                Sessions adapt when you miss tasks or protect streaks.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                onPress={() => void finish()}
              >
                <Text style={styles.primaryBtnText}>Enter Ascend</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function ChipStep({
  title,
  subtitle,
  items,
  selected,
  onToggle,
  onContinue,
}: {
  title: string;
  subtitle: string;
  items: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  singleSelect?: boolean;
  onContinue: () => void;
}) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{subtitle}</Text>
      <View style={styles.chipWrap}>
        {items.map((item) => {
          const on = selected.has(item);
          return (
            <Pressable key={item} onPress={() => onToggle(item)} style={[styles.chip, on && styles.chipOnAlt]}>
              <Text style={styles.chipText}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.primaryBtn} onPress={onContinue}>
        <Text style={styles.primaryBtnText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.summaryLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  brand: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  hero: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 16,
    lineHeight: 40,
  },
  title: { fontSize: 22, fontWeight: '600', color: theme.textPrimary, marginBottom: 8 },
  body: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 16 },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: theme.accentViolet,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.glassStroke,
  },
  chipOn: {
    backgroundColor: `${theme.accentViolet}55`,
  },
  chipOnAlt: {
    backgroundColor: `${theme.accentCyan}33`,
  },
  chipText: { color: theme.textPrimary, fontWeight: '600', fontSize: 14 },
  sliderCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.glassStroke,
    marginBottom: 8,
  },
  incomeBig: { fontSize: 28, fontWeight: '600', color: theme.textPrimary, marginBottom: 8 },
  slider: { width: '100%', height: 44 },
  input: {
    borderWidth: 1,
    borderColor: theme.glassStroke,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    color: theme.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summary: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.glassStroke,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 16, fontWeight: '500', color: theme.textPrimary },
  footnote: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 20,
  },
});
