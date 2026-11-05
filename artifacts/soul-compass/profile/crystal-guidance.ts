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

function dayContext(astrology: Calculated | undefined): string {
  const aspect = astrology?.aspects[0];
  if (aspect?.quality === 'challenging') return 'Take one thing at a time today';
  if (aspect?.aspect === 'conjunction') return 'One clear focus may help today';
  if (aspect) return 'Look for one small step you can take today';
  return 'Make a little room to reflect today';
}

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
  const meaning = associations[winner.crystal.name].meaning;
  const intention = winner.matched.length > 0
    ? ` It also reflects your intention to ${winner.matched.join(' and ')}.`
    : '';
  const reason = astrology
    ? `${dayContext(astrology)}. ${winner.crystal.name} is traditionally linked with ${meaning}.${intention}`
    : `Your intention to ${winner.matched.join(' and ')} fits with ${winner.crystal.name}'s traditional association with ${meaning}.`;
  return {
    crystal: winner.crystal,
    basis: astrology ? 'chart' : 'intention',
    matchedIntentions: winner.matched,
    reason,
  };
}

export function getCrystalRecommendation(astrology: Calculated, options: Options = {}) {
  return rank(astrology, options);
}
export function getIntentionRecommendation(options: Options) {
  return rank(undefined, options);
}

export function getCompanionReason(
  crystal: Crystal,
  recommendation: CrystalRecommendation | null,
): string {
  const companionMeaning = associations[crystal.name]?.meaning ?? 'a different perspective';
  if (!recommendation) {
    return `Sample suggestion: ${crystal.name} is traditionally linked with ${companionMeaning}.`;
  }
  const context = recommendation.basis === 'chart'
    ? 'today’s theme'
    : recommendation.matchedIntentions.length > 0
      ? `your intention to ${recommendation.matchedIntentions.join(' and ')}`
      : 'your chosen stone';
  return `${crystal.name} offers another symbolic reminder for ${context}: ${companionMeaning}.`;
}
