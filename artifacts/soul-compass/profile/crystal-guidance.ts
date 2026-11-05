import { crystalCatalog, type Crystal } from '../constants/content';
import type { DailyAstrology, NatalElementBalance, ZodiacElement } from './astrology';

type Calculated = Extract<DailyAstrology, { status: 'calculated' }>;
type Options = {
  intentions?: string[];
  hiddenCrystals?: string[];
  feeling?: string | null;
  dateKey?: string;
};

export type CrystalRecommendation = {
  crystal: Crystal;
  reason: string;
  basis: 'chart' | 'feeling' | 'intention';
  matchedIntentions: string[];
  feelingLabel?: string;
};

export type NatalCrystalRecommendation = {
  crystal: Crystal;
  element: ZodiacElement;
  reason: string;
};

const elementalThemes: Record<ZodiacElement, readonly string[]> = {
  Fire: ['energy', 'courage', 'confidence', 'initiative', 'expression', 'optimism', 'direction', 'creativity', 'renewal', 'joy', 'growth'],
  Air: ['clarity', 'focus', 'attention', 'communication', 'learning', 'perspective', 'curiosity', 'freedom', 'values', 'change', 'adaptability', 'opportunity'],
  Water: ['calm', 'rest', 'reflection', 'intuition', 'connection', 'empathy', 'ease', 'comfort', 'self-trust', 'presence', 'imagination'],
  Earth: ['grounding', 'patience', 'structure', 'resilience', 'balance', 'boundaries', 'steadiness', 'growth', 'renewal'],
};

const zodiacElements: ZodiacElement[] = ['Fire', 'Air', 'Water', 'Earth'];

function getNatalStoneReason(
  element: ZodiacElement,
  crystal: Crystal,
  balance: NatalElementBalance,
): string {
  const themes = crystal.themes.filter((theme) => elementalThemes[element].includes(theme));
  const themeCopy = themes.slice(0, 2).join(' and ') || 'its traditional associations';
  const balanced = balance.dominant.length === zodiacElements.length;

  if (balanced) {
    return `Your chart has a fairly even mix of elements. In this guide, ${crystal.name}'s ${themeCopy} themes are one symbolic angle to explore.`;
  }
  if (balance.leastRepresented.includes(element) && !balance.dominant.includes(element)) {
    return `Your chart has fewer ${element.toLowerCase()} placements. In this guide, we pair ${crystal.name}'s ${themeCopy} themes with ${element.toLowerCase()} as a prompt to explore that side of your chart.`;
  }
  if (balance.dominant.includes(element)) {
    return `Your chart has more ${element.toLowerCase()} placements. In this guide, we pair ${crystal.name}'s ${themeCopy} themes with ${element.toLowerCase()} as a prompt to reflect on that part of your chart.`;
  }
  return `In this guide, ${crystal.name}'s ${themeCopy} themes are paired with ${element.toLowerCase()} as one symbolic angle on your chart.`;
}

/**
 * Creates a birth-chart-only set of stone prompts. These are editorial symbolic
 * associations, not a claim that crystals change elemental balance or outcomes.
 */
export function getNatalCrystalSuggestions(
  balance: NatalElementBalance,
  hiddenCrystals: string[] = [],
  limit = 8,
): NatalCrystalRecommendation[] {
  if (limit <= 0) return [];
  const hidden = new Set(hiddenCrystals);
  const candidates = crystalCatalog.flatMap((crystal, index) => {
    if (hidden.has(slugOf(crystal.name))) return [];
    const overlap = Object.fromEntries(
      zodiacElements.map((element) => [
        element,
        crystal.themes.filter((theme) => elementalThemes[element].includes(theme)).length,
      ]),
    ) as Record<ZodiacElement, number>;
    const element = zodiacElements
      .slice()
      .sort((first, second) => {
        const firstWeight = balance.leastRepresented.includes(first) ? 2.4 : balance.dominant.includes(first) ? 1.7 : 1;
        const secondWeight = balance.leastRepresented.includes(second) ? 2.4 : balance.dominant.includes(second) ? 1.7 : 1;
        return (overlap[second] * secondWeight) - (overlap[first] * firstWeight);
      })[0];
    const themeScore = zodiacElements.reduce((score, current) => {
      const weight = balance.leastRepresented.includes(current)
        ? 2.4
        : balance.dominant.includes(current) ? 1.7 : 1;
      return score + overlap[current] * weight;
    }, 0);
    return [{
      crystal,
      element,
      score: themeScore,
      index,
      reason: getNatalStoneReason(element, crystal, balance),
    }];
  });

  candidates.sort((first, second) => second.score - first.score || first.index - second.index);
  const selected: typeof candidates = [];
  const perElement = new Map<ZodiacElement, number>();
  for (const candidate of candidates) {
    if ((perElement.get(candidate.element) ?? 0) >= 3) continue;
    selected.push(candidate);
    perElement.set(candidate.element, (perElement.get(candidate.element) ?? 0) + 1);
    if (selected.length === limit) return selected;
  }
  for (const candidate of candidates) {
    if (selected.some((item) => item.crystal.name === candidate.crystal.name)) continue;
    selected.push(candidate);
    if (selected.length === limit) break;
  }
  return selected;
}

export const FEELING_OPTIONS = [
  { id: 'steady', label: 'Feeling okay', description: 'Nothing especially good or hard—just an ordinary day.', themes: ['balance', 'grounding', 'ease'] },
  { id: 'energized', label: 'Full of energy', description: 'You woke up ready to take on the day.', themes: ['energy', 'confidence', 'initiative'] },
  { id: 'tired', label: 'Feeling tired', description: 'You feel mentally or physically worn out and want to save your energy.', themes: ['rest', 'ease', 'grounding'] },
  { id: 'easy-day', label: 'Taking it easy', description: 'No big plans today; you want a lighter pace.', themes: ['ease', 'rest', 'presence'] },
  { id: 'under-pressure', label: 'Under pressure', description: 'A lot is on your mind, and you need room to breathe.', themes: ['calm', 'boundaries', 'grounding'] },
  { id: 'low', label: 'Feeling low', description: 'You feel sad or flat and could use a little comfort.', themes: ['comfort', 'connection', 'self-trust'] },
  { id: 'restless', label: 'Restless', description: 'You have energy, but it is hard to settle on one thing.', themes: ['focus', 'patience', 'grounding'] },
  { id: 'focused', label: 'Ready to focus', description: 'You want to give one task your full attention.', themes: ['focus', 'clarity', 'structure'] },
  { id: 'curious', label: 'Curious', description: 'You feel open to a new idea or a different path.', themes: ['curiosity', 'learning', 'change'] },
  { id: 'connection', label: 'Seeking connection', description: 'You would like closeness or a good conversation.', themes: ['connection', 'communication', 'empathy'] },
  { id: 'brave', label: 'Ready for a challenge', description: 'You feel ready to do something that takes nerve.', themes: ['courage', 'confidence', 'resilience'] },
  { id: 'reflective', label: 'Reflective', description: 'You want some quiet to understand what you are feeling.', themes: ['reflection', 'intuition', 'clarity'] },
] as const;

const intentionThemes: Record<string, readonly string[]> = {
  rest: ['rest', 'calm', 'ease', 'grounding'],
  focus: ['focus', 'clarity', 'attention', 'structure'],
  reflection: ['reflection', 'intuition', 'perspective', 'self-trust'],
  courage: ['courage', 'confidence', 'initiative', 'resilience'],
  connection: ['connection', 'communication', 'empathy', 'values'],
  change: ['change', 'adaptability', 'renewal', 'curiosity'],
};

const planetThemes: Record<string, readonly string[]> = {
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

const aspectThemes: Record<string, readonly string[]> = {
  conjunction: ['focus', 'initiative', 'energy'],
  sextile: ['curiosity', 'opportunity', 'communication'],
  square: ['patience', 'boundaries', 'resilience'],
  trine: ['ease', 'confidence', 'balance'],
  opposition: ['perspective', 'balance', 'communication'],
};

const allThemes = new Set(
  crystalCatalog.flatMap((crystal) => crystal.themes),
);

const slugOf = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, ' ');

function getIntentionTags(intention: string): Set<string> {
  const normalized = normalize(intention);
  const direct = intentionThemes[normalized];
  if (direct) return new Set(direct);
  const words = normalized.split(' ').filter(Boolean);
  return new Set(words.filter((word) => allThemes.has(word)));
}

function getMatchedIntentions(crystal: Crystal, intentions: readonly string[]) {
  return intentions.filter((intention) => {
    const tags = getIntentionTags(intention);
    return crystal.themes.some((theme) => tags.has(theme));
  });
}

function getChartThemes(astrology: Calculated | undefined): Set<string> {
  if (!astrology) return new Set();
  const themes = new Set<string>();
  for (const aspect of astrology.aspects.slice(0, 3)) {
    for (const theme of [
      ...(planetThemes[aspect.transitBody] ?? []),
      ...(aspectThemes[aspect.aspect] ?? []),
      ...(planetThemes[aspect.natalBody] ?? []),
    ]) themes.add(theme);
  }
  if (themes.size === 0) {
    for (const placement of astrology.natalPlacements) {
      for (const theme of planetThemes[placement.body] ?? []) themes.add(theme);
    }
  }
  return themes;
}

function stableScore(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function dayContext(astrology: Calculated | undefined): string {
  const aspect = astrology?.aspects[0];
  if (aspect?.quality === 'challenging') return 'Today’s theme points to a place where patience may help.';
  if (aspect?.aspect === 'conjunction') return 'One theme may feel especially present today.';
  if (aspect) return 'Today’s theme suggests room to try a small, useful step.';
  return 'Your chart offers a broad theme for the day.';
}

function rank(
  astrology: Calculated | undefined,
  { intentions = [], hiddenCrystals = [], feeling, dateKey }: Options,
  limit = 1,
): CrystalRecommendation[] {
  const selectedFeeling = FEELING_OPTIONS.find((option) => option.id === feeling);
  const uniqueIntentions = Array.from(
    new Set(intentions.map(normalize).filter(Boolean)),
  );
  const hasPersonalContext = Boolean(astrology || selectedFeeling || uniqueIntentions.length);
  if (!hasPersonalContext) return [];

  const hidden = new Set(hiddenCrystals);
  const chartTags = getChartThemes(astrology);
  const feelingTags = new Set<string>(selectedFeeling?.themes ?? []);
  const leadAspect = astrology?.aspects[0];
  const tieSeed = [
    astrology?.calculationDate ?? dateKey ?? 'no-chart',
    leadAspect ? `${leadAspect.transitBody}-${leadAspect.aspect}-${leadAspect.natalBody}` : '',
    selectedFeeling?.id ?? '',
    uniqueIntentions.join('|'),
    astrology?.natalPlacements.map((placement) => `${placement.body}:${placement.sign}`).join('|') ?? '',
  ].join(':');

  return crystalCatalog
    .filter((crystal) => !hidden.has(slugOf(crystal.name)))
    .map((crystal) => {
      const matched = getMatchedIntentions(crystal, uniqueIntentions);
      const intentionTags = new Set(matched.flatMap((intention) => [...getIntentionTags(intention)]));
      const intentionMatchCount = crystal.themes.filter((theme) => intentionTags.has(theme)).length;
      const feelingMatchCount = crystal.themes.filter((theme) => feelingTags.has(theme)).length;
      const chartMatchCount = crystal.themes.filter((theme) => chartTags.has(theme)).length;
      const intentionScore = intentionMatchCount * 2.7;
      const feelingScore = feelingMatchCount * 1.5;
      const chartScore = chartMatchCount * 1.7;
      const tieBreaker = stableScore(`${tieSeed}:${crystal.name}`) * 0.35;
      const score = intentionScore + feelingScore + chartScore + tieBreaker;
      return {
        crystal,
        matched,
        score,
        chartMatchCount,
        feelingMatchCount,
        intentionMatchCount,
        suitable: chartMatchCount >= 2 || feelingMatchCount > 0 || intentionMatchCount > 0,
      };
    })
    .filter((candidate) => candidate.suitable)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map(({ crystal, matched, chartMatchCount, feelingMatchCount }) => {
      const selectedMeaning = crystal.note.toLowerCase().replace(' · ', ' and ');
      const intentionCopy = matched.length
        ? `It also fits your intention to ${matched.join(' and ')}.`
        : null;
      const chartCopy = astrology && chartMatchCount > 0 && chartMatchCount < 2
        ? 'A related theme from today’s chart also informed this suggestion.'
        : null;
      const feelingCopy = selectedFeeling && feelingMatchCount > 0
        ? `Your selected feeling, “${selectedFeeling.label.toLowerCase()},” helped guide this suggestion.`
        : null;
      const reason = [
        astrology && chartMatchCount >= 2 ? dayContext(astrology) : null,
        `${crystal.name} is traditionally associated with ${selectedMeaning}.`,
        feelingCopy,
        intentionCopy,
        chartCopy,
        'Treat it as a reflection prompt, not a promise.',
      ].filter(Boolean).join(' ');
      return {
        crystal,
        basis: chartMatchCount >= 2 ? 'chart' : feelingMatchCount > 0 ? 'feeling' : 'intention',
        matchedIntentions: matched,
        feelingLabel: selectedFeeling?.label,
        reason,
      };
    });
}

export function getCrystalSuggestions(
  astrology: Calculated | undefined,
  options: Options = {},
  limit = 3,
) {
  return rank(astrology, options, limit);
}

export function getCrystalRecommendation(astrology: Calculated, options: Options = {}) {
  return rank(astrology, options, 1)[0] ?? null;
}

export function getIntentionRecommendation(options: Options) {
  return rank(undefined, options, 1)[0] ?? null;
}

export function getCompanionReason(
  crystal: Crystal,
  recommendation: CrystalRecommendation | null,
): string {
  const companionMeaning = crystal.note.toLowerCase().replace(' · ', ' and ');
  if (!recommendation) {
    return `This is a sample. ${crystal.name} is traditionally linked with ${companionMeaning}.`;
  }
  const context = recommendation.basis === 'chart'
    ? recommendation.feelingLabel ? 'today’s chart theme and how you feel' : 'today’s chart theme'
    : recommendation.basis === 'feeling'
      ? `how you feel today (${recommendation.feelingLabel?.toLowerCase()})`
      : recommendation.matchedIntentions.length > 0
        ? `your intention to ${recommendation.matchedIntentions.join(' and ')}`
        : 'your chosen stone';
  return `If you want another angle, ${crystal.name} is traditionally linked with ${companionMeaning}—a small prompt for ${context}, not a promise.`;
}
