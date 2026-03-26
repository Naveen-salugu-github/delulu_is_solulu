import type { FutureSelfProfile } from '../types';

export type AmbienceKind = 'rain' | 'waves' | 'wind' | 'birds';

export function pickAmbience(profile: FutureSelfProfile): AmbienceKind {
  const tags = (profile.lifestyleTags ?? []).join(' ').toLowerCase();
  const settle = (profile.settlementVision ?? '').toLowerCase();
  const text = `${tags} ${settle}`;

  if (text.includes('beach') || text.includes('bali') || text.includes('waves') || text.includes('sea')) return 'waves';
  if (text.includes('travel') || text.includes('mountain') || text.includes('hike')) return 'wind';
  if (text.includes('peaceful') || text.includes('minimal') || text.includes('rain')) return 'rain';
  if (text.includes('garden') || text.includes('nature') || text.includes('forest')) return 'birds';

  // Default: rain is generally soothing and non-distracting under voice.
  return 'rain';
}

/**
 * Web-safe ambient URLs.
 * You can replace these with your own hosted files later.
 */
export function ambienceUrl(kind: AmbienceKind): string {
  switch (kind) {
    case 'waves':
      return 'https://assets.mixkit.co/sfx/download/mixkit-sea-waves-loop-1196.mp3';
    case 'wind':
      return 'https://assets.mixkit.co/sfx/download/mixkit-wind-in-the-trees-1170.mp3';
    case 'birds':
      return 'https://assets.mixkit.co/sfx/download/mixkit-forest-birds-ambience-1210.mp3';
    case 'rain':
    default:
      return 'https://assets.mixkit.co/sfx/download/mixkit-rain-loop-1243.mp3';
  }
}

