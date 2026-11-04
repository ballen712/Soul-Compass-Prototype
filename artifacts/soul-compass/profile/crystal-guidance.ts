import { calculatedCrystalCatalog, type Crystal } from '../constants/content';
import type { DailyAstrology } from './astrology';

type Calculated = Extract<DailyAstrology, { status: 'calculated' }>;
type Options = { intentions?: string[]; hiddenCrystals?: string[] };
export type CrystalRecommendation = {
  crystal: Crystal;
  reason: string;
  basis: 'chart' | 'intention';
  matchedIntentions: string[];
};
const associations: Record<string, { words: string[]; meaning: string }> = {
  Moonstone: { words: ['reflection', 'connection', 'intuition'], meaning: 'reflection, connection and new beginnings' },
  Amethyst: { words: ['rest', 'focus', 'calm', 'clarity', 'stillness'], meaning: 'stillness, perspective and thoughtful attention' },
  Labradorite: { words: ['courage', 'change', 'curiosity'], meaning: 'curiosity and openness to change' },
};
const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

function rank(astrology: Calculated | undefined, { intentions = [], hiddenCrystals = [] }: Options): CrystalRecommendation | null {
  const aspect = astrology?.aspects[0];
  const chartChoice = aspect?.quality === 'challenging' ? 'Labradorite'
    : aspect?.aspect === 'conjunction' ? 'Amethyst' : 'Moonstone';
  const unique = Array.from(new Set(intentions.map(i => i.trim().toLowerCase()).filter(Boolean)));
  const ranked = Object.values(calculatedCrystalCatalog)
    .filter(crystal => !hiddenCrystals.includes(slugOf(crystal.name)))
    .map(crystal => {
      const matched = unique.filter(i => associations[crystal.name].words.includes(i));
      return { crystal, matched, score: matched.length * 3 + (astrology && crystal.name === chartChoice ? 2 : 0) };
    })
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  if (!winner || (!astrology && winner.matched.length === 0)) return null;
  const natalSun = astrology?.natalPlacements.find(p => p.body === 'Sun');
  const factor = aspect
    ? `${aspect.transitBody} ${aspect.aspect} natal ${aspect.natalBody}`
    : natalSun ? `natal Sun in ${natalSun.sign}` : 'an eligible natal factor';
  const intention = winner.matched.length > 0
    ? ` It matches your ${winner.matched.join(', ')} intention${winner.matched.length === 1 ? '' : 's'}.`
    : '';
  return {
    crystal: winner.crystal,
    basis: astrology ? 'chart' : 'intention',
    matchedIntentions: winner.matched,
    reason: `${winner.crystal.name} is traditionally associated with ${associations[winner.crystal.name].meaning}.${intention} ${
      astrology ? `Today’s calculated chart theme is ${factor}. This is a symbolic pairing alongside that theme, not a measured crystal effect.`
        : 'This pick uses your intention, not a calculated birth chart.'
    } Recommendations use the visible three-stone catalog whether or not you own a stone. Crystal symbolism is reflective, not a scientific or medical claim.`,
  };
}

export function getCrystalRecommendation(astrology: Calculated, options: Options = {}) {
  return rank(astrology, options);
}
export function getIntentionRecommendation(options: Options) {
  return rank(undefined, options);
}
