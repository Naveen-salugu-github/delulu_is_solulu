import type { DailyProgress, DailyTask, FutureSelfProfile, LifeCategory, UserProfile } from '../types';

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const templates: Record<LifeCategory, [string, string][]> = {
  wealth: [
    ['Deep work sprint', '45 minutes on a revenue skill—no inbox.'],
    ['Three ideas', 'Write three ideas that could earn or compound.'],
    ['Money clarity', 'Review one expense with calm intention.'],
  ],
  career: [
    ['Signal upgrade', 'Send one message that advances your career.'],
    ['Skill rep', '30 minutes of deliberate practice.'],
    ['Story polish', 'Rewrite your one-line professional story.'],
  ],
  health: [
    ['Move', '20 minutes of movement you enjoy.'],
    ['Fuel', 'One nourishing meal, phone away.'],
    ['Sleep gate', 'Set a non-negotiable wind-down time.'],
  ],
  confidence: [
    ['Evidence log', 'Write three proofs you handled hard things.'],
    ['Voice', 'Speak your goal out loud—clear, slow, certain.'],
    ['Boundary', 'Say one small no that protects your focus.'],
  ],
  relationships: [
    ['Reach', 'One thoughtful message to someone you value.'],
    ['Presence', '10 minutes of listening without fixing.'],
    ['Repair', 'If needed, one honest sentence that builds trust.'],
  ],
  lifestyle: [
    ['Environment', '10 minutes restoring one corner of your space.'],
    ['Joy', 'One small delight, guilt-free.'],
    ['Travel fund', 'Move a small amount toward a future trip.'],
  ],
};

const defaults: LifeCategory[] = [
  'wealth',
  'health',
  'confidence',
  'career',
  'relationships',
  'lifestyle',
];

export function buildDailyTasks(profile: UserProfile | null, _progress: DailyProgress): DailyTask[] {
  const key = dayKey();
  let base: LifeCategory[] = [];
  if (profile?.futureSelf.goals?.length) {
    base = [...profile.futureSelf.goals].sort((a, b) => a.localeCompare(b));
  }
  for (const c of defaults) {
    if (base.length >= 3) break;
    if (!base.includes(c)) base.push(c);
  }
  base = base.slice(0, 3);

  return base.map((cat, index) => {
    const options = templates[cat] ?? templates.wealth;
    const pick = options[index % options.length];
    return {
      id: `${key}-${cat}-${index}`,
      title: pick[0],
      detail: pick[1],
      category: cat,
      isCompleted: false,
      dayKey: key,
    };
  });
}
