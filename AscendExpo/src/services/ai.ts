import type { DailyProgress, FutureSelfProfile, NarrativeToneKind } from '../types';

function buildPrompt(
  profile: FutureSelfProfile,
  tone: NarrativeToneKind,
  metrics: DailyProgress
): string {
  const name = profile.preferredName ?? 'you';
  const location = profile.locationNow ?? 'not shared';
  const gender = profile.gender ?? 'not shared';
  const age = profile.age != null ? `${profile.age}` : 'not shared';
  const kids = profile.hasKids ?? 'not shared';
  const workRole = profile.workRole ?? 'not shared';
  const workFeeling = profile.workFeeling ?? 'not shared';
  const recentBuild = profile.recentBuild ?? 'not shared';
  const selfDesc = profile.selfDescription ?? 'not shared';
  const shapingEvent = profile.shapingEvent ?? 'not shared';
  const struggle = profile.currentStruggle ?? 'not shared';
  const importantPeople = profile.mostImportantPeople ?? 'not shared';
  const manifestation = profile.manifestation ?? 'not shared';
  const whyImportant = profile.whyImportant ?? 'not shared';

  const goals = profile.goals.join(', ');
  const income = `₹ annual target ${Math.round(profile.incomeTargetAnnualINR)}`;
  const lifestyle = profile.lifestyleTags.join(', ');
  const traits = profile.personalityTraits.join(', ');
  const fears = profile.fears.join(', ');
  const zodiac = profile.zodiacSign ?? 'not shared';
  const zodiacStyle = zodiacGuide[zodiac] ?? zodiacGuide.default;
  const relationshipStatus = profile.relationshipStatus ?? 'not shared';
  const partnerTraits = (profile.idealPartnerTraits ?? []).join(', ') || 'not shared';
  const settlementVision = profile.settlementVision ?? 'not shared';

  return `You are a premium visualization coach. Generate a vivid second-person narrative (800–1200 words) for someone building their future self in India.

Tone mode: ${tone}

The user’s inputs below are for internal grounding only. Do not echo them as a list. Do not sound like you are reading answers back. Instead, write as if their future is already reachable and their habits are already in motion.

Guidance:
- Second person POV: use “you”.
- Make the narrative feel like the future self is speaking with subtle reassurance and specific, emotionally grounded details.
- Use zodiac to shape communication rhythm and micro-behavior (pace, emphasis, tone), but do NOT mention “your zodiac sign” explicitly or rely on stereotypes.
- Use money/lifestyle/relationship/settlement details to create lived sensory scenes (morning routine, work sessions, partner moments, city atmosphere).
- If tone is confrontational, reference skipped days in a compassionate but direct way (“You remember the day you almost quit, and you didn’t.”). Still end with a path forward.
- Avoid guarantees of outcomes. Keep it grounded and realistic.
- No bullet points. Paragraphs only. No headings. No quotes used as formatting.
- Keep sentence structure suitable for subtitles and TTS: clear sentence endings, not extremely long sentences.

User inputs (internal use only):
- Preferred name to use in voice: ${name}
- Location now: ${location}
- Gender: ${gender}
- Age: ${age}
- Kids: ${kids}
- Work: ${workRole}
- Feelings about work: ${workFeeling}
- Recently built: ${recentBuild}
- Self description: ${selfDesc}
- Shaping experience: ${shapingEvent}
- Current struggle: ${struggle}
- Most important people: ${importantPeople}
- What they want most (manifestation): ${manifestation}
- Why it matters: ${whyImportant}
- Life focus areas: ${goals}
- Income target: ${income}
- Lifestyle vision tags: ${lifestyle}
- Personality traits to amplify: ${traits}
- Friction / fears: ${fears}
- Zodiac (internal rhythm): ${zodiac}
- Zodiac guidance (internal): ${zodiacStyle}
- Relationship status: ${relationshipStatus}
- Ideal partner traits: ${partnerTraits}
- Settlement vision: ${settlementVision}

Behavioral context (use to adapt tone, not to list data):
- Streak days: ${metrics.streakDays}
- Missed days: ${metrics.missedDays}
- Session listens: ${metrics.sessionListens}
- Tasks completed (signal): ${metrics.dailyTasksCompleted}

Return ONLY the narrative text.`;
}

export async function generateVisualizationNarrative(
  profile: FutureSelfProfile,
  tone: NarrativeToneKind,
  metrics: DailyProgress
): Promise<string> {
  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!groqKey) return localFallback(profile, tone, metrics);

  const baseURL = 'https://api.groq.com/openai/v1/chat/completions';
  // Groq deprecated `llama3-8b-8192`; recommended replacement is `llama-3.1-8b-instant`.
  const model = process.env.EXPO_PUBLIC_GROQ_MODEL ?? 'llama-3.1-8b-instant';

  const res = await fetch(baseURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      messages: [
        { role: 'system', content: 'You write cinematic, grounded visualization narratives for premium consumer wellness apps.' },
        { role: 'user', content: buildPrompt(profile, tone, metrics) },
      ],
    }),
  });

  if (!res.ok) {
    // Helpful runtime signal (web/dev): open DevTools → Console to see why Groq rejected the request.
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      detail = '';
    }
    // Avoid printing secrets. (We don't log the Authorization header.)
    console.warn('[Ascend][Groq] Non-2xx response', {
      status: res.status,
      statusText: res.statusText,
      model,
      detail: detail?.slice(0, 800),
    });
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
  const name = profile.preferredName ?? 'you';
  const focus = profile.goals.join(', ');
  const tags = profile.lifestyleTags.join(', ');
  const traits = profile.personalityTraits.join(', ');
  const fears = profile.fears.join(', ');
  const zodiac = profile.zodiacSign ?? 'your inner rhythm';
  const relationship = profile.relationshipStatus ?? 'open-hearted';
  const partner = (profile.idealPartnerTraits ?? []).join(', ') || 'supportive and aligned';
  const settlement = profile.settlementVision ?? 'a city that expands your growth';
  const manifestation = profile.manifestation ?? `${focus}—the version of you that finally feels inevitable`;
  const whyImportant = profile.whyImportant ?? 'because you are done living below your potential';

  const opener =
    tone === 'empowering'
      ? `You wake up and the air feels different—like a quiet agreement you kept. ${name}, the life you’ve been aiming at is already forming in your routines, and you can feel it in the steadiness of your breath.`
      : tone === 'confrontational'
        ? `You remember the days you almost quit. Not dramatically. Just quietly. And you feel the moment you chose discipline anyway—because you are not here to bargain with yourself anymore.`
        : tone === 'supportive'
          ? `If today felt heavier than you expected, you don’t punish yourself. You return gently—because the future you want is built from repairs, not from perfect straight lines.`
          : `Close your eyes. The room softens. You step forward in your mind with the same calm you bring to your real life—one honest action at a time.`;

  const behavior =
    metrics.missedDays > 0
      ? `Missed days aren’t a verdict. They’re friction you can learn from. You notice the pattern, and then you change it—today, in small ways that actually stick.`
      : `Your streak is not a trophy. It’s evidence. It proves you can steer your attention, even when nobody is watching.`;

  const body = `Picture your mornings in a life that matches what you described: ${tags}. Your ${zodiac} nature shapes your pace—you notice the urge to escape, and you stay present just long enough to move. You lead with ${traits}, not as a performance, but as a natural response to the person you’re becoming.

What you want most—${manifestation}—stops feeling like a wish and starts feeling like a direction. And the reason it matters—${whyImportant}—becomes your anchor when the day tries to pull you back into old habits. Even when fear shows up—${fears}—you don’t debate it. You answer with the next right step, the one you can repeat.

In love, your standards are quiet but clear. With ${relationship} energy, you don’t chase reassurance—you create safety. A partner who matches ${partner} feels close in the small moments: the check-in that doesn’t feel forced, the presence that doesn’t try to fix, the warmth that feels earned.

And in the place you want to settle—${settlement}—your life has a rhythm. You can hear it in the city air, feel it in your body, and sense it in your choices: steady, deliberate, and yours.

When doubt rises, you breathe like someone who has practiced returning to center. Then you open your eyes and carry one scene with you—the sound of your future morning, the steadiness in your hands, and the subtle message that says: you’re already doing it.`;

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
