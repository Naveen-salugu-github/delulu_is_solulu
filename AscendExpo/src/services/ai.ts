import type { DailyProgress, FutureSelfProfile, NarrativeToneKind } from '../types';

export type NarrativeSource = 'groq' | 'fallback';
export type NarrativeResult = {
  text: string;
  source: NarrativeSource;
};

const TARGET_MIN_WORDS = 520;
const TARGET_MAX_WORDS = 650;

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
  const selfDesc = profile.selfDescription ?? 'not shared';
  const shapingEvent = profile.shapingEvent ?? 'not shared';
  const importantPeople = profile.mostImportantPeople ?? 'not shared';
  const manifestation = profile.manifestation ?? 'not shared';

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

  return `You are a premium visualization narrator. Generate a vivid second-person “day in the life” scene designed to be exactly one immersive 4-minute session (target 520-650 words, never exceed 650) for someone building their future self in India.

Tone mode: ${tone}

The user’s inputs below are for internal grounding only. Do not echo them as a list. Do not sound like you are reading answers back. Instead, write as if their future is already reachable and their habits are already in motion.

Guidance:
- Second person POV: use “you”.
- Start immediately inside a sensory scene the user can inhabit (no long preface). Within the first 2–3 sentences, anchor: place, time of day, body sensation, one concrete object.
- This MUST feel like a narrated “day in your future life” with a beginning, middle, and end. Do not write generic motivation. Do not write aphorisms or quotes.
- Use a natural day arc in 3 movements: morning (arrival + identity), midday (busy/impactful work + money/leadership), evening (love/home/meaning + calm close).
- Make the day feel busy in a satisfying way: meetings, deep work blocks, messages, travel, training, creative flow—specific but not brand-heavy.
- Luxury should be shown through sensory details (space, time freedom, calm service, quality, travel, quiet confidence), not named luxury brands.
- Include 1–2 spontaneous life moments that make success feel emotionally real (for example: gifting your mother something meaningful, hosting friends on a weekend trip, upgrading your home, treating family to travel). Keep these moments naturally woven into the story, not as separate “sections.”
- Make the narrative feel like an intimate narrator describing you after you’ve arrived—like someone watching your day, or your future self describing it. Keep it cinematic and specific.
- Use zodiac to shape communication rhythm and micro-behavior (pace, emphasis, tone), but do NOT mention “your zodiac sign” explicitly or rely on stereotypes.
- Use money/lifestyle/relationship/settlement details to create lived sensory scenes (morning routine, work sessions, partner moments, city atmosphere).
- If tone is confrontational, reference skipped days in a compassionate but direct way (“You remember the day you almost quit, and you didn’t.”). Still end with a path forward.
- Avoid guarantees of outcomes. Keep it grounded and realistic.
- No bullet points. Paragraphs only. No headings. No quotes used as formatting.
- Keep sentence structure suitable for subtitles and TTS: clear sentence endings, not extremely long sentences.
- Use mostly present tense. Keep momentum words active and embodied (breathe, notice, choose, move, return, commit).
- End with a grounded closeout for immediate action after this 4-minute session: one concrete action the user will take right after listening (small, specific, repeatable).

User inputs (internal use only):
- Preferred name to use in voice: ${name}
- Location now: ${location}
- Gender: ${gender}
- Age: ${age}
- Kids: ${kids}
- Work: ${workRole}
- Self description: ${selfDesc}
- Shaping experience: ${shapingEvent}
- Most important people: ${importantPeople}
- What they want most (manifestation): ${manifestation}
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
): Promise<NarrativeResult> {
  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!groqKey) {
    return {
      text: normalizeNarrativeLength(localFallback(profile, tone, metrics)),
      source: 'fallback',
    };
  }

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
    return { text: localFallback(profile, tone, metrics), source: 'fallback' };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return {
      text: normalizeNarrativeLength(localFallback(profile, tone, metrics)),
      source: 'fallback',
    };
  }
  return { text: normalizeNarrativeLength(text), source: 'groq' };
}

function localFallback(
  profile: FutureSelfProfile,
  tone: NarrativeToneKind,
  metrics: DailyProgress
): string {
  const name = profile.preferredName?.trim() || 'you';
  const location = profile.locationNow?.trim() || 'your city';
  const gender = profile.gender?.trim() || 'your identity';
  const age = profile.age != null ? `${profile.age}` : 'this season of life';
  const hasKids = profile.hasKids?.trim() || 'your family reality';
  const workRole = profile.workRole?.trim() || 'your current work';
  const selfDescription = profile.selfDescription?.trim() || 'someone learning to trust their own pace';
  const shapingEvent = profile.shapingEvent?.trim() || 'a hard chapter that taught resilience';
  const importantPeople = profile.mostImportantPeople?.trim() || 'the people you love';
  const focus = profile.goals.join(', ');
  const tags = profile.lifestyleTags.join(', ');
  const traits = profile.personalityTraits.join(', ');
  const fears = profile.fears.join(', ');
  const zodiac = profile.zodiacSign ?? 'your inner rhythm';
  const relationship = profile.relationshipStatus ?? 'open-hearted';
  const partner = (profile.idealPartnerTraits ?? []).join(', ') || 'supportive and aligned';
  const settlement = profile.settlementVision ?? 'a city that expands your growth';
  const manifestation = profile.manifestation ?? `${focus}—the version of you that finally feels inevitable`;

  const opener =
    tone === 'empowering'
      ? `Morning arrives and you’re already moving. ${name}, the day feels full in a good way—clear, intentional, expensive in the currency of calm.`
      : tone === 'confrontational'
        ? `Morning arrives and you remember the days you almost quit. Not dramatically. Just quietly. And you feel the moment you chose discipline anyway—because you are not here to bargain with yourself anymore.`
        : tone === 'supportive'
          ? `Morning arrives, gentle. If yesterday felt heavier than you expected, you don’t punish yourself. You return, and the return is the whole skill.`
          : `Morning arrives. The room softens. Your breath deepens. You step into a day that fits you.`;

  const behavior =
    metrics.missedDays > 0
      ? `Missed days aren’t a verdict. They’re friction you can learn from. You notice the pattern, and then you change it—today, in small ways that actually stick.`
      : `Your streak is not a trophy. It’s evidence. It proves you can steer your attention, even when nobody is watching.`;

  const body = `${name}, imagine this clearly. It’s a real day in your future life. You are ${selfDescription}. You live in ${location}. You move through ${age} with grounded intent. Your ${gender} expression feels authentic, and ${hasKids} is held with care, not chaos.

You wake up in a space that feels like relief. Light spills across a clean surface. A glass of water waits where you always leave it. Your phone is already full, but it doesn’t own you. You choose the first ten minutes. You breathe. You stretch. You feel the quiet power in your chest that comes from doing this enough times.

Your morning looks like the life you asked for—${tags}. Not flashy. Just unmistakably higher quality. You move with ${traits}. You notice the impulse to rush, and you choose precision instead. The city air feels different when you’re not trying to prove anything.

Midday is busy. The kind of busy you once thought you could never hold. In ${workRole}, you’re the person people wait for before they decide. Your calendar has weight. Your work has consequences. You enter a meeting and the room settles without you asking. You speak with calm, and it lands. Money is handled like logistics now, not like emotion. You see it in the small choices: you don’t bargain with your standards. You don’t delay the hard call. You move.

In between calls, life reminds you why this matters. It’s your mother’s birthday week, and you finalize a gift she once pointed at and laughed away as too much. This time, you don’t overthink. You just send it. Later, her voice note is soft and disbelieving, and you listen to it twice.

By late afternoon, plans lock in for a weekend break. Friends in the group chat, travel details done in minutes, not months. Maybe it’s a short yacht day, maybe it’s a quiet coastal stay, maybe it’s a city escape with good food and no rush. The point is not showing off. The point is you built a life where joy fits without permission.

What you want most—${manifestation}—stops feeling like a wish and starts feeling like a direction. Even when fear shows up—${fears}—you don’t debate it. You answer with the next right step, the one you can repeat.

Evening slows the day down without collapsing it. In love, your standards are quiet but clear. With ${relationship} energy, you don’t chase reassurance—you create safety. A partner who matches ${partner} feels close in the small moments: the check-in that doesn’t feel forced, the presence that doesn’t try to fix, the warmth that feels earned.

And in the place you want to settle—${settlement}—your life has a rhythm. You can hear it in the city air, feel it in your body, and sense it in your choices: steady, deliberate, and yours. The people who matter most—${importantPeople}—feel that shift in you before you say a word.

Even the chapter that shaped you—${shapingEvent}—is no longer just pain to carry. It becomes wisdom you walk with.

When doubt rises, you breathe like someone who has practiced returning to center. Then you open your eyes and carry one scene with you—the sound of your future morning, the steadiness in your hands, and the subtle message that says: you’re already doing it.

Now, when this ends, do one small real thing. Open your notes. Write one sentence: what matters today. Then set a 20-minute timer and start.`;

  return normalizeNarrativeLength([opener, behavior, body].join('\n\n'));
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

function normalizeNarrativeLength(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length <= TARGET_MAX_WORDS) return cleaned;

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned];
  const kept: string[] = [];
  let total = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (total + sentenceWords > TARGET_MAX_WORDS) break;
    kept.push(sentence.trim());
    total += sentenceWords;
  }

  if (total < TARGET_MIN_WORDS && kept.length < sentences.length) {
    for (let i = kept.length; i < sentences.length; i += 1) {
      const sentence = sentences[i].trim();
      const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
      if (total + sentenceWords > TARGET_MAX_WORDS) break;
      kept.push(sentence);
      total += sentenceWords;
      if (total >= TARGET_MIN_WORDS) break;
    }
  }

  return kept.join(' ').trim() || cleaned;
}
