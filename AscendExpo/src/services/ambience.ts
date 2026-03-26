import type { FutureSelfProfile } from '../types';

export type AmbienceKind = 'rain' | 'waves' | 'wind' | 'birds';
export type AmbienceSource = number;

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

export function ambienceSource(kind: AmbienceKind): AmbienceSource {
  switch (kind) {
    case 'waves':
      return require('../../assets/ambience/waves.wav');
    case 'wind':
      return require('../../assets/ambience/wind.wav');
    case 'birds':
      return require('../../assets/ambience/birds.wav');
    case 'rain':
    default:
      return require('../../assets/ambience/rain.wav');
  }
}

