import type { AspectName, PlanetaryBody, TransitAspect } from './astrology';

const planetThemes: Record<PlanetaryBody, readonly string[]> = {
  Sun: ['confidence', 'direction', 'courage'],
  Moon: ['rest', 'reflection', 'connection'],
  Mercury: ['communication', 'focus', 'learning'],
  Venus: ['connection', 'values', 'creativity'],
  Mars: ['energy', 'initiative', 'courage'],
  Jupiter: ['growth', 'perspective', 'optimism'],
  Saturn: ['structure', 'patience', 'boundaries'],
  Uranus: ['change', 'freedom', 'curiosity'],
  Neptune: ['imagination', 'reflection', 'intuition'],
  Pluto: ['renewal', 'boundaries', 'resilience'],
};

const aspectThemes: Record<AspectName, readonly string[]> = {
  conjunction: ['focus', 'initiative', 'energy'],
  sextile: ['curiosity', 'opportunity', 'communication'],
  square: ['patience', 'boundaries', 'resilience'],
  trine: ['ease', 'confidence', 'balance'],
  opposition: ['perspective', 'balance', 'communication'],
};

/** Shared tag vocabulary for transit analysis and crystal matching. */
export function getTransitAspectThemes(
  aspect: Pick<TransitAspect, 'transitBody' | 'aspect' | 'natalBody'>,
): string[] {
  return [
    ...new Set([
      ...planetThemes[aspect.transitBody],
      ...aspectThemes[aspect.aspect],
      ...planetThemes[aspect.natalBody],
    ]),
  ];
}
