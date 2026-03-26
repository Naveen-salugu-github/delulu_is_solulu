import type { DailyProgress, FutureSelfProfile, NarrativeToneKind } from '../types';

function buildPrompt(
  profile: FutureSelfProfile,
  tone: NarrativeToneKind,
  metrics: DailyProgress
): string {
  const goals = profile.goals.join(', ');
  const income = `₹ annual target ${Math.round(profile.incomeTargetAnnualINR)}`;
  const currentIncome = profile.currentIncomeMonthlyINR
    ? `₹${Math.round(profile.currentIncomeMonthlyINR).toLocaleString('en-IN')} / month`
    : 'not shared';
  const moneyMethod = profile.incomeMethod ?? 'not shared';
  const lifestyle = profile.lifestyleTags.join(', ');
  const traits = profile.personalityTraits.join(', ');
  const fears = profile.fears.join(', ');
  const zodiac = profile.zodiacSign ?? 'not shared';
  const zodiacStyle = zodiacGuide[zodiac] ?? zodiacGuide.default;
  const relationshipStatus = profile.relationshipStatus ?? 'not shared';
  const partnerTraits = (profile.idealPartnerTraits ?? []).join(', ') || 'not shared';
  const settlementVision = profile.settlementVision ?? 'not shared';

  return `You are an expert visualization coach. Generate a vivid second-person visualization narrative for a user in India building their future self.

User Profile:
- Life focus areas: ${goals}
- Income aspiration: ${income}
- Current income baseline: ${currentIncome}
- Current money path: ${moneyMethod}
- Lifestyle vision tags: ${lifestyle}
- Personality traits to amplify: ${traits}
- Current friction / fears: ${fears}
- Zodiac sign: ${zodiac}
- Zodiac guidance: ${zodiacStyle}
- Relationship status: ${relationshipStatus}
- Ideal partner traits: ${partnerTraits}
- Settlement vision: ${settlementVision}

Behavioral context:
- Streak days: ${metrics.streakDays}
- Missed days: ${metrics.missedDays}
- Session listens: ${metrics.sessionListens}
- Tasks completed (signal): ${metrics.dailyTasksCompleted}

Required narrative tone mode: ${tone}

Rules:
- Second person POV ("you").
- Immersive sensory descriptions.
- Realistic timeline.
- Match communication style to zodiac guidance, but avoid stereotypes.
- Length: 800–1200 words.
- Paragraphs only, no bullet points.

Return only the narrative text.`;
}

export async function generateVisualizationNarrative(
  profile: FutureSelfProfile,
  tone: NarrativeToneKind,
  metrics: DailyProgress
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return localFallback(profile, tone, metrics);
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.85,
      messages: [
        { role: 'system', content: 'You write cinematic, grounded visualization narratives.' },
        { role: 'user', content: buildPrompt(profile, tone, metrics) },
      ],
    }),
  });

  if (!res.ok) {
    return localFallback(profile, tone, metrics);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return localFallback(profile, tone, metrics);
  return text;
}

function localFallback(
  profile: FutureSelfProfile,
  tone: NarrativeToneKind,
  metrics: DailyProgress
): string {
  const focus = profile.goals.join(', ');
  const tags = profile.lifestyleTags.join(', ');
  const traits = profile.personalityTraits.join(', ');
  const fears = profile.fears.join(', ');
  const zodiac = profile.zodiacSign ?? 'your inner rhythm';
  const relationship = profile.relationshipStatus ?? 'open-hearted';
  const partner = (profile.idealPartnerTraits ?? []).join(', ') || 'supportive and aligned';
  const settlement = profile.settlementVision ?? 'a city that expands your growth';
  const moneyPath = profile.incomeMethod ?? 'a path that compounds your strengths';

  const opener =
    tone === 'empowering'
      ? `You breathe in and the air feels like proof: the version of you that focuses on ${focus} is not a fantasy—she is a direction your nervous system already knows.`
      : tone === 'confrontational'
        ? 'You know the old pattern: the quiet negotiation with your future when the day gets loud. Today we do not negotiate. You listen to what you avoided—and you move anyway.'
        : tone === 'supportive'
          ? 'If you have been hard on yourself lately, start here: you are still in the story. The life you want is built from small returns, not perfect weeks.'
          : 'Close your eyes for a moment. Let the room soften. You are about to walk forward in your mind the way you want to walk forward in your days.';

  const behavior = `Your streak reads ${metrics.streakDays} days of showing up. Missed days (${metrics.missedDays}) are not a verdict; they are information about friction, not identity.`;

  const body = `Picture your mornings in a life that matches what you described: ${tags}. Your ${zodiac} nature keeps your choices intentional instead of impulsive. You move with the traits you chose: ${traits}. Your money path becomes clearer through ${moneyPath}, and you keep your standards high in love: ${relationship}, with a partner who feels ${partner}. You are building toward ${settlement}. The world still asks hard questions, especially around ${fears}, but you answer with motion—small, repeatable, undeniable.

When doubt rises, you breathe like someone who has practiced returning to center. By the time you open your eyes, carry one scene with you—the sound of your future morning, the steadiness in your hands.`;

  return [opener, behavior, body].join('\n\n');
}

const zodiacGuide: Record<string, string> = {
  Aries: 'direct, bold, action-first with disciplined follow-through',
  Taurus: 'grounded, sensory, patient, focused on long-term stability',
  Gemini: 'curious, adaptive, conversational, energized by variety',
  Cancer: 'emotionally intuitive, protective, values belonging and safety',
  Leo: 'confident, expressive, heart-led leadership and visibility',
  Virgo: 'detail-oriented, practical, systems-minded, consistency over hype',
  Libra: 'balanced, relational, aesthetic, seeks harmony and fairness',
  Scorpio: 'intense, strategic, transformative, all-in commitment',
  Sagittarius: 'optimistic, exploratory, growth-minded, freedom with purpose',
  Capricorn: 'structured, ambitious, disciplined, legacy-focused',
  Aquarius: 'visionary, unconventional, future-focused, independent thinker',
  Pisces: 'imaginative, empathic, spiritual, creative flow with grounding',
  default: 'balanced, self-aware, focused and emotionally grounded',
};
