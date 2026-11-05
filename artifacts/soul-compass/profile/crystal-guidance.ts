import { calculatedCrystalCatalog, type Crystal } from '../constants/content';
import type { DailyAstrology } from './astrology';

type Calculated = Extract<DailyAstrology, { status: 'calculated' }>;
type Options = { intentions?: string[]; hiddenCrystals?: string[]; feeling?: string | null };
export type CrystalRecommendation = {
  crystal: Crystal;
  reason: string;
  basis: 'chart' | 'feeling' | 'intention';
  matchedIntentions: string[];
  feelingLabel?: string;
};
export const FEELING_OPTIONS = [
  { id: 'steady', label: 'Feeling okay', description: 'Nothing especially good or hard—just an ordinary day.', primary: 'Moonstone', secondary: 'Amethyst' },
  { id: 'energized', label: 'Full of energy', description: 'You woke up ready to take on the day.', primary: 'Labradorite', secondary: 'Amethyst' },
  { id: 'tired', label: 'Feeling tired', description: 'You feel mentally or physically worn out and want to save your energy.', primary: 'Amethyst', secondary: 'Moonstone' },
  { id: 'easy-day', label: 'Taking it easy', description: 'No big plans today; you want a lighter pace.', primary: 'Amethyst', secondary: 'Moonstone' },
  { id: 'under-pressure', label: 'Under pressure', description: 'A lot is on your mind, and you need room to breathe.', primary: 'Amethyst', secondary: 'Labradorite' },
  { id: 'low', label: 'Feeling low', description: 'You feel sad or flat and could use a little comfort.', primary: 'Moonstone', secondary: 'Amethyst' },
  { id: 'restless', label: 'Restless', description: 'You have energy, but it is hard to settle on one thing.', primary: 'Amethyst', secondary: 'Labradorite' },
  { id: 'focused', label: 'Ready to focus', description: 'You want to give one task your full attention.', primary: 'Amethyst', secondary: 'Labradorite' },
  { id: 'curious', label: 'Curious', description: 'You feel open to a new idea or a different path.', primary: 'Labradorite', secondary: 'Moonstone' },
  { id: 'connection', label: 'Seeking connection', description: 'You would like closeness or a good conversation.', primary: 'Moonstone', secondary: 'Amethyst' },
  { id: 'brave', label: 'Ready for a challenge', description: 'You feel ready to do something that takes nerve.', primary: 'Labradorite', secondary: 'Moonstone' },
  { id: 'reflective', label: 'Reflective', description: 'You want some quiet to understand what you are feeling.', primary: 'Moonstone', secondary: 'Amethyst' },
] as const;

const associations: Record<string, { words: string[]; meaning: string }> = {
  Moonstone: { words: ['reflection', 'connection', 'intuition'], meaning: 'reflection, connection and new beginnings' },
  Amethyst: { words: ['rest', 'focus', 'calm', 'clarity', 'stillness'], meaning: 'stillness, perspective and thoughtful attention' },
  Labradorite: { words: ['courage', 'change', 'curiosity'], meaning: 'curiosity and openness to change' },
};
const slugOf = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

function dayContext(astrology: Calculated | undefined): string {
  const aspect = astrology?.aspects[0];
  if (aspect?.quality === 'challenging') return 'If today feels demanding, take one thing at a time';
  if (aspect?.aspect === 'conjunction') return 'If everything asks for attention, choose one thing';
  if (aspect) return 'A small step may be enough for today';
  return 'Make a little room to notice how you feel today';
}

function rank(astrology: Calculated | undefined, { intentions = [], hiddenCrystals = [], feeling }: Options): CrystalRecommendation | null {
  const aspect = astrology?.aspects[0];
  const chartChoice = aspect?.quality === 'challenging' ? 'Labradorite'
    : aspect?.aspect === 'conjunction' ? 'Amethyst' : 'Moonstone';
  const selectedFeeling = FEELING_OPTIONS.find(option => option.id === feeling);
  const transitWeight = selectedFeeling && aspect?.quality === 'challenging' ? 4 : astrology ? 2 : 0;
  const unique = Array.from(new Set(intentions.map(i => i.trim().toLowerCase()).filter(Boolean)));
  const ranked = Object.values(calculatedCrystalCatalog)
    .filter(crystal => !hiddenCrystals.includes(slugOf(crystal.name)))
    .map(crystal => {
      const matched = unique.filter(i => associations[crystal.name].words.includes(i));
      const feelingScore = selectedFeeling?.primary === crystal.name ? 3
        : selectedFeeling?.secondary === crystal.name ? 0.5 : 0;
      const chartScore = astrology && crystal.name === chartChoice ? transitWeight : 0;
      return { crystal, matched, score: matched.length * 3 + feelingScore + chartScore };
    })
    .sort((a, b) => b.score - a.score
      || Number(b.crystal.name === chartChoice) - Number(a.crystal.name === chartChoice)
      || Number(b.crystal.name === selectedFeeling?.primary) - Number(a.crystal.name === selectedFeeling?.primary));
  const winner = ranked[0];
  if (!winner || (!astrology && winner.matched.length === 0 && !selectedFeeling)) return null;
  const meaning = associations[winner.crystal.name].meaning;
  const intention = winner.matched.length > 0
    ? ` It also connects with your intention to ${winner.matched.join(' and ')}.`
    : '';
  const reason = astrology
    ? `${dayContext(astrology)}. ${winner.crystal.name} is traditionally linked with ${meaning}.${intention}${selectedFeeling ? ` Your feeling, “${selectedFeeling.label.toLowerCase()},” is considered alongside the day’s chart theme.` : ''} Think of it as a reminder, not a promise.`
    : selectedFeeling
      ? `${winner.crystal.name} is traditionally linked with ${meaning}. Your choice, “${selectedFeeling.label.toLowerCase()},”${winner.matched.length > 0 ? ` and intention to ${winner.matched.join(' and ')}` : ''} helped guide this suggestion. Keep it as a small prompt, not a rule.`
      : `Your intention to ${winner.matched.join(' and ')} fits with ${winner.crystal.name}'s traditional association with ${meaning}. Keep it as a small prompt, not a rule.`;
  return {
    crystal: winner.crystal,
    basis: astrology ? 'chart' : selectedFeeling ? 'feeling' : 'intention',
    matchedIntentions: winner.matched,
    feelingLabel: selectedFeeling?.label,
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
    return `This is a sample. ${crystal.name} is traditionally linked with ${companionMeaning}.`;
  }
  const context = recommendation.basis === 'chart'
    ? recommendation.feelingLabel ? 'today’s theme and how you feel' : 'today’s theme'
    : recommendation.basis === 'feeling'
      ? `how you feel today (${recommendation.feelingLabel?.toLowerCase()})`
    : recommendation.matchedIntentions.length > 0
      ? `your intention to ${recommendation.matchedIntentions.join(' and ')}`
      : 'your chosen stone';
  return `If you want another angle, ${crystal.name} is traditionally linked with ${companionMeaning}—a small prompt for ${context}, not a promise.`;
}
