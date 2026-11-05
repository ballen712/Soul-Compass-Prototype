import { crystalCatalog, type Crystal } from '../constants/content';
import type { DailyAstrology, NatalElementBalance, TransitAspect, ZodiacElement } from './astrology';

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
const MINIMUM_DAILY_CHART_THEME_MATCHES = 4;

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

const aspectWording: Record<string, string> = {
  conjunction: 'meet around one shared focus',
  sextile: 'offer a small opening to work with',
  square: 'create a point of tension that may need patience',
  trine: 'work together with relative ease',
  opposition: 'highlight two different priorities to balance',
};

const plainTheme: Record<string, string> = {
  energy: 'energy', initiative: 'taking a first step', confidence: 'trust in your choices',
  courage: 'bravery', direction: 'clear priorities', rest: 'rest', reflection: 'reflection',
  connection: 'connection', communication: 'honest conversation', focus: 'focus',
  learning: 'learning', values: 'what matters to you', creativity: 'creative ideas',
  grounding: 'steady, practical steps', patience: 'patience', balance: 'balance',
  resilience: 'keeping going through difficulty', calm: 'a calmer pace', curiosity: 'curiosity',
  change: 'adjusting to change', adaptability: 'flexibility', growth: 'growth',
  perspective: 'another point of view', optimism: 'hope', structure: 'organization',
  boundaries: 'personal limits', imagination: 'imagination', ease: 'ease',
  opportunity: 'an opening to try', intuition: 'inner reflection', 'self-trust': 'self-trust',
  expression: 'saying what you mean', joy: 'joy', comfort: 'comfort',
  presence: 'being present', freedom: 'freedom', play: 'play',
};

const themeAction: Record<string, string> = {
  energy: 'choose one useful task and make a small start',
  initiative: 'begin with the first step instead of waiting for the perfect moment',
  focus: 'give one task ten uninterrupted minutes',
  clarity: 'write down what you know and the next decision',
  confidence: 'take one small step you might otherwise put off',
  courage: 'say one honest thing you have been postponing',
  grounding: 'choose one practical next step and stay with it',
  patience: 'finish one thing before taking on the next',
  rest: 'take an unhurried break before deciding what comes next',
  ease: 'give yourself permission to take the simpler route',
  calm: 'pause for a few slow breaths before you respond',
  connection: 'check in with someone without trying to fix everything',
  communication: 'ask one clear question and listen to the answer',
  empathy: 'make room for your own needs as well as someone else’s',
  boundaries: 'decide one thing you can leave for another day',
  resilience: 'pick a manageable next step instead of solving it all at once',
  reflection: 'write one honest sentence about what you need',
  intuition: 'notice your first response before rushing to act',
  curiosity: 'ask one open question before settling on an answer',
  change: 'leave a little room for your plan to shift',
  adaptability: 'adjust one small part of the plan rather than starting over',
  creativity: 'make a little room for a fresh idea',
  joy: 'notice one small thing that brightens the day',
  balance: 'check what needs attention and what can wait',
  perspective: 'look at the situation from a different point of view',
  structure: 'choose a simple order for the next two tasks',
  learning: 'stay open to one thing you did not know before',
  'self-trust': 'make one small decision and let it be enough',
  presence: 'give the next few minutes your full attention',
  optimism: 'look for one workable possibility',
  direction: 'choose the one outcome that matters most today',
  values: 'let what matters to you guide one practical choice',
  expression: 'say what you mean in a kind, direct way',
  opportunity: 'try one low-risk first step',
  freedom: 'notice where you have a choice',
  imagination: 'consider a different possibility',
  play: 'make a little room for something enjoyable',
  growth: 'focus on what you can learn from the next step',
};

function chartConnection(astrology: Calculated | undefined, crystal: Crystal) {
  if (!astrology) return null;
  const matches = astrology.aspects.slice(0, 3).map((aspect: TransitAspect) => {
    const themes = [
      ...(planetThemes[aspect.transitBody] ?? []),
      ...(aspectThemes[aspect.aspect] ?? []),
      ...(planetThemes[aspect.natalBody] ?? []),
    ].filter((theme, index, all) =>
      crystal.themes.includes(theme) && all.indexOf(theme) === index,
    );
    return { aspect, themes };
  }).filter((item) => item.themes.length > 0)
    .sort((a, b) => b.themes.length - a.themes.length);
  return matches[0] ?? null;
}

function labelThemes(themes: readonly string[]) {
  return themes.slice(0, 2).map((theme) => plainTheme[theme] ?? theme.replaceAll('-', ' ')).join(' and ');
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
        // Editorial fit rule, not a scientific compatibility score. A broad
        // transit overlap alone is insufficient; explicit preferences can
        // independently provide a direct personal connection.
        suitable: chartMatchCount >= MINIMUM_DAILY_CHART_THEME_MATCHES || feelingMatchCount > 0 || intentionMatchCount > 0,
      };
    })
    .filter((candidate) => candidate.suitable)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map(({ crystal, matched, chartMatchCount, feelingMatchCount }) => {
      const selectedMeaning = crystal.note.toLowerCase().replace(' · ', ' and ');
      const natalLink = chartConnection(astrology, crystal);
      const chartThemes = natalLink?.themes ?? [];
      const feelingThemes = selectedFeeling
        ? crystal.themes.filter((theme) => selectedFeeling.themes.includes(theme))
        : [];
      const relevantThemes = chartThemes.length ? chartThemes : feelingThemes;
      const action = relevantThemes.map((theme) => themeAction[theme]).find(Boolean);
      const intentionCopy = matched.length
        ? `Your chosen intention to ${matched.join(' and ')} also guided this match.`
        : null;
      const feelingCopy = selectedFeeling && feelingMatchCount > 0
        ? `You chose “${selectedFeeling.label.toLowerCase()},” which connects with ${labelThemes(feelingThemes)}.`
        : null;
      const chartCopy = natalLink
        ? astrology?.preciseBirthMoment
          ? `Today, transiting ${natalLink.aspect.transitBody} and your natal ${natalLink.aspect.natalBody} ${aspectWording[natalLink.aspect.aspect] ?? 'form a link'} in your chart, bringing ${labelThemes(chartThemes)} into focus.`
          : `Today’s chart links ${natalLink.aspect.transitBody} with ${labelThemes(chartThemes)}.`
        : null;
      const intentionReason = intentionCopy
        ? `${crystal.name} shares themes of ${selectedMeaning}. ${intentionCopy}`
        : null;
      const reason = [
        chartCopy,
        !chartCopy && !feelingCopy ? intentionReason : null,
        feelingCopy,
        chartCopy && feelingCopy ? `This stone also connects with ${labelThemes(feelingThemes)}.` : null,
        action ? `Use ${crystal.name} as a reminder to ${action}.` : `${crystal.name} connects with ${selectedMeaning}; you could use it as a prompt to choose one useful next step.`,
        'This is a symbolic prompt, not a guaranteed effect.',
      ].filter(Boolean).join(' ');
      return {
        crystal,
        basis: chartMatchCount >= MINIMUM_DAILY_CHART_THEME_MATCHES ? 'chart' : feelingMatchCount > 0 ? 'feeling' : 'intention',
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
