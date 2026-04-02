import type { DailyProgress, FutureSelfProfile } from '../types';
import { formatIncomeAnnualINR } from './income';
import type { EmotionalTone } from './EmotionalStateEngine';

export type ScriptSource = 'groq' | 'fallback';

export type FutureSelfScriptResult = {
  text: string;
  source: ScriptSource;
};

const DEFAULT_TIMELINE_YEARS = 10;

function displayName(profile: FutureSelfProfile): string {
  return profile.preferredName?.trim() || 'friend';
}

function timelineYears(_profile: FutureSelfProfile): number {
  // Onboarding does not collect timeline yet; single default keeps prompts consistent.
  return DEFAULT_TIMELINE_YEARS;
}

function buildGoalsList(profile: FutureSelfProfile): string {
  return profile.goals.length ? profile.goals.join(', ') : 'growth across life areas';
}

function buildTargetsList(profile: FutureSelfProfile): string {
  const parts: string[] = [];
  const income = formatIncomeAnnualINR(profile.incomeTargetAnnualINR);
  parts.push(`Income target: ${income}`);
  if (profile.manifestation?.trim()) parts.push(`Manifestation: ${profile.manifestation.trim()}`);
  if (profile.settlementVision?.trim()) parts.push(`Settlement vision: ${profile.settlementVision.trim()}`);
  if (profile.lifestyleTags.length) parts.push(`Lifestyle: ${profile.lifestyleTags.join(', ')}`);
  if (profile.workRole?.trim()) parts.push(`Career / work: ${profile.workRole.trim()}`);
  if (profile.relationshipStatus?.trim()) parts.push(`Relationship status: ${profile.relationshipStatus.trim()}`);
  if (profile.idealPartnerTraits?.length) parts.push(`Partner traits wanted: ${profile.idealPartnerTraits.join(', ')}`);
  if (profile.mostImportantPeople?.trim()) parts.push(`Most important people: ${profile.mostImportantPeople.trim()}`);
  if (profile.locationNow?.trim()) parts.push(`Where they live now: ${profile.locationNow.trim()}`);
  return parts.join('; ');
}

function buildStrugglesList(profile: FutureSelfProfile): string {
  const bits: string[] = [];
  if (profile.currentStruggle?.trim()) bits.push(profile.currentStruggle.trim());
  if (profile.fears.length) bits.push(`Fears/friction: ${profile.fears.join(', ')}`);
  return bits.length ? bits.join('; ') : 'not specified — infer gently from goals only';
}

function systemPrompt(tone: EmotionalTone): string {
  return `You are writing a voice message FROM the user's future self to their present self.
RULES — follow every one without exception:

Start EXACTLY with: "Hey [name]. It's you — [X] years from now."
Speak in first person as the future self. Never say "I hope you" — say "I remember when you" or "You did it" or "I need you to hear this."
Reference at least 3 specific details from their profile: exact targets (car model, salary number, city, relationship goal, career goal, etc.). Do not be vague.
Keep it between 180–220 words. Not shorter. Not longer.
Emotional tone is: ${tone}. Apply it as follows:

"proud": warm, celebrating, specific about what they achieved, ends with encouragement
"supportive": gentle but real, acknowledges the struggle, reminds them why they started, ends with one concrete action for today
"urgent": direct, no softening, tells them this is a critical moment, references the specific thing they're slipping on, ends with a challenge not a comfort

Do NOT use generic affirmations like "believe in yourself" or "you've got this." Every sentence must be specific to their profile.
Do NOT mention that you are an AI. You are them. Speak accordingly.
End with their name. Example: "I love you, [name]. Keep going."

Return ONLY the script text, no title or quotes.`;
}

function userPrompt(
  profile: FutureSelfProfile,
  tone: EmotionalTone,
  _metrics: DailyProgress
): string {
  const name = displayName(profile);
  const X = timelineYears(profile);
  const year = new Date().getFullYear() + X;
  return `USER PROFILE:
Name: ${name}
Timeline: ${X} years from now (year ${year})
Goals: ${buildGoalsList(profile)}
Specific targets: ${buildTargetsList(profile)}
Current struggles: ${buildStrugglesList(profile)}
Emotional tone: ${tone}`;
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWordRange(text: string, min: number, max: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length >= min && words.length <= max) return words.join(' ');
  if (words.length > max) return words.slice(0, max).join(' ');
  return words.join(' ');
}

export function offlineFutureSelfScript(profile: FutureSelfProfile, tone: EmotionalTone): string {
  const name = displayName(profile);
  const X = timelineYears(profile);
  const income = formatIncomeAnnualINR(profile.incomeTargetAnnualINR);
  const settle = profile.settlementVision?.trim() || 'the place you pictured';
  const manifest = profile.manifestation?.trim() || 'the life you keep describing';
  const work = profile.workRole?.trim() || 'the work you chose';

  const open = `Hey ${name}. It's you — ${X} years from now.`;

  if (tone === 'proud') {
    return (
      `${open} I remember when ${income} felt impossible on paper, and you still mapped ${settle} like it was already real. You did it — ${work} is yours now, and ${manifest} is not a moodboard anymore; it is Tuesday with receipts. I remember when you doubted the small daily reps. You stacked them until the people who matter stopped worrying and started bragging. The friction you listed — you did not erase it; you outgrew it by keeping promises to yourself when nobody clapped. I remember the nights you wanted to quit and chose one more honest hour anyway. I am not here to hype you with empty lines. I am here because you earned the specifics: the income line, the settlement vision, the relationship standard you wrote down, the calm in your voice when you close a hard loop. I remember the version of you who was scared to send the message and sent it anyway. That person built this. I love you, ${name}. Keep going.`
    );
  }
  if (tone === 'urgent') {
    return (
      `${open} I need you to hear this without padding. You said ${manifest} — not someday, not when you feel ready. Right now you are bleeding time on the exact patterns you named in your struggles, and I remember how expensive that felt in my bones. ${income} does not arrive because you visualize once; it arrives because you protect the next two hours like they matter. ${settle} stays a fantasy if ${work} stays half-hearted. This is the week where you either re-anchor or you teach yourself that your word is optional — and I refuse to let you learn that lesson. I remember the excuses that felt reasonable. I also remember the cost. Send one message, open one doc, do one rep before you sleep. Not tomorrow. Your name is still on the line. I love you, ${name}. Keep going.`
    );
  }
  return (
    `${open} I remember the version of you who typed ${manifest} like a confession and still went to work the next day. That counts. ${income} is a number, but the real plot is how you return after a miss — and you are still here, so the story is not over. ${settle} does not need perfection; it needs your steady hand in ${work}, one honest hour at a time. The struggles you carry do not make you behind; they make you human — and I am proud you named them instead of hiding. I remember when you thought you needed a perfect week. You only needed a truthful next step. Today, do one small thing that makes the future self trust you: a twenty-minute block, one hard message, one walk to reset your head, one boundary you keep. I love you, ${name}. Keep going.`
  );
}

export async function generateFutureSelfScript(
  profile: FutureSelfProfile,
  tone: EmotionalTone,
  metrics: DailyProgress
): Promise<FutureSelfScriptResult> {
  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!groqKey) {
    return { text: offlineFutureSelfScript(profile, tone), source: 'fallback' };
  }

  const baseURL = 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.EXPO_PUBLIC_GROQ_MODEL ?? 'llama-3.1-8b-instant';

  try {
    const res = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.75,
        messages: [
          { role: 'system', content: systemPrompt(tone) },
          { role: 'user', content: userPrompt(profile, tone, metrics) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn('[Ascend][FutureSelfScript] Groq error', res.status, detail?.slice(0, 400));
      return { text: offlineFutureSelfScript(profile, tone), source: 'fallback' };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!raw) return { text: offlineFutureSelfScript(profile, tone), source: 'fallback' };

    let text = raw.replace(/^["']|["']$/g, '').trim();
    const name = displayName(profile);
    const X = timelineYears(profile);
    const expectedOpen = `Hey ${name}. It's you — ${X} years from now.`;
    if (!text.toLowerCase().startsWith('hey ')) {
      text = `${expectedOpen} ${text}`;
    }
    let wc = countWords(text);
    if (wc > 220) text = trimToWordRange(text, 180, 220);
    wc = countWords(text);
    if (wc < 180 || wc > 220) {
      text = trimToWordRange(text, 180, 220);
      const wc2 = countWords(text);
      if (wc2 < 180) return { text: offlineFutureSelfScript(profile, tone), source: 'fallback' };
    }

    return { text, source: 'groq' };
  } catch {
    return { text: offlineFutureSelfScript(profile, tone), source: 'fallback' };
  }
}

export function splitScriptIntoParagraphs(script: string): string[] {
  const parts = script
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts;
  return [script.trim()].filter(Boolean);
}
