import { crystalCatalog, type Crystal } from '../constants/content';
import type { DailyAstrology, NatalElementBalance, TransitAspect, ZodiacElement } from './astrology';

type Calculated = Extract<DailyAstrology, { status: 'calculated' }>;
type Options = {
  intentions?: string[];
  hiddenCrystals?: string[];
  crystalCollection?: string[];
  feeling?: string | null;
  dateKey?: string;
};
type CopyTranslator = (source: string) => string;

const identityCopy: CopyTranslator = (source) => source;

function fillCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function joinCopy(items: readonly string[], translate: CopyTranslator) {
  if (items.length < 2) return items[0] ?? '';
  if (items.length === 2) {
    return fillCopy(translate('{theme1} and {theme2}'), {
      theme1: items[0],
      theme2: items[1],
    });
  }
  return items.slice(0, -1).join(translate(', '))
    + translate(' and ')
    + items[items.length - 1];
}

function crystalMeaning(note: string, translate: CopyTranslator) {
  return joinCopy(
    translate(note)
      .split(/\s*·\s*/)
      .map((part) => part.trim())
      .filter(Boolean),
    translate,
  );
}

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
  translate: CopyTranslator,
  _translateStoneName: CopyTranslator,
): string {
  const themes = crystal.themes
    .filter((theme) => elementalThemes[element].includes(theme))
    .slice(0, 2)
    .map((theme) =>
      translate(plainTheme[theme] ?? theme.replaceAll('-', ' ')).replace(/^Crystal theme:\s*/u, ''),
    );
  const themeCopy = joinCopy(themes, translate) || crystalMeaning(crystal.note, translate);
  const balanced = balance.dominant.length === zodiacElements.length;
  const practiceTheme = crystal.themes.find((theme) =>
    elementalThemes[element].includes(theme) && Boolean(themeAction[theme]),
  );
  const action = translate(themeAction[practiceTheme ?? 'grounding']);
  const elementNote = balance.leastRepresented.includes(element)
    ? translate(`${element} is less prominent in your chart.`)
    : translate(`${element} is one of the stronger elements in your chart.`);
  const values = {
    themes: themeCopy,
    elementNote,
    action,
  };

  if (balanced) {
    return fillCopy(translate('Your chart has a fairly even mix of elements. This stone was chosen for its connection to {themes}. Use it as a reminder to put one of these qualities into practice today. For example: {action}.'), values);
  }
  if (balance.leastRepresented.includes(element) && !balance.dominant.includes(element)) {
    return fillCopy(translate('{elementNote} This stone was chosen for {themes}. Use it as a reminder to give those qualities more room in everyday life and bring a little balance to your day. For example: {action}.'), values);
  }
  if (balance.dominant.includes(element)) {
    return fillCopy(translate('{elementNote} This stone was chosen for {themes}, qualities you may already recognize in yourself. Use it as a reminder to direct those strengths toward one clear choice instead of taking on too much at once. For example: {action}.'), values);
  }
  return fillCopy(translate('This stone was chosen for its connection to {themes}. Use it as a reminder to explore those qualities in everyday life. For example: {action}.'), values);
}

/**
 * Creates the birth-chart-only stone list from the chart's reliable element balance.
 */
export function getNatalCrystalSuggestions(
  balance: NatalElementBalance,
  hiddenCrystals: string[] = [],
  limit = 8,
  translate: CopyTranslator = identityCopy,
  translateStoneName: CopyTranslator = identityCopy,
  crystalCollection: string[] = [],
): NatalCrystalRecommendation[] {
  if (limit <= 0) return [];
  const hidden = new Set(hiddenCrystals);
  const owned = new Set(crystalCollection);
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
    if (themeScore <= 0) return [];
    return [{
      crystal,
      element,
      score: themeScore,
      index,
      owned: owned.has(slugOf(crystal.name)),
      reason: getNatalStoneReason(element, crystal, balance, translate, translateStoneName),
    }];
  });

  candidates.sort((first, second) =>
    Number(second.owned) - Number(first.owned)
    || second.score - first.score
    || first.index - second.index,
  );
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

type FeelingOption = {
  id: string;
  label: string;
  description: string;
  themes: readonly string[];
};

export const FEELING_OPTIONS: readonly FeelingOption[] = [
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
];

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
// One shared chart theme is enough for a relevant fallback when a stronger
// match is not available.
const MINIMUM_DAILY_CHART_THEME_MATCHES = 1;

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

const plainTheme: Record<string, string> = {
  energy: 'Crystal theme: energy',
  initiative: 'Crystal theme: taking a first step',
  confidence: 'Crystal theme: trust in your choices',
  courage: 'Crystal theme: bravery',
  direction: 'Crystal theme: clear priorities',
  rest: 'Crystal theme: rest',
  reflection: 'Crystal theme: reflection',
  connection: 'Crystal theme: connection',
  communication: 'Crystal theme: honest conversation',
  focus: 'Crystal theme: focus',
  learning: 'Crystal theme: learning',
  values: 'Crystal theme: what matters to you',
  creativity: 'Crystal theme: creative ideas',
  grounding: 'Crystal theme: steady, practical steps',
  patience: 'Crystal theme: patience',
  balance: 'Crystal theme: balance',
  resilience: 'Crystal theme: keeping going through difficulty',
  calm: 'Crystal theme: a calmer pace',
  curiosity: 'Crystal theme: curiosity',
  change: 'Crystal theme: adjusting to change',
  adaptability: 'Crystal theme: flexibility',
  growth: 'Crystal theme: growth',
  perspective: 'Crystal theme: another point of view',
  optimism: 'Crystal theme: hope',
  structure: 'Crystal theme: organization',
  boundaries: 'Crystal theme: personal limits',
  imagination: 'Crystal theme: imagination',
  ease: 'Crystal theme: ease',
  opportunity: 'Crystal theme: an opening to try',
  intuition: 'Crystal theme: inner reflection',
  'self-trust': 'Crystal theme: self-trust',
  expression: 'Crystal theme: saying what you mean',
  joy: 'Crystal theme: joy',
  comfort: 'Crystal theme: comfort',
  presence: 'Crystal theme: being present',
  freedom: 'Crystal theme: freedom',
  play: 'Crystal theme: play',
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

const DIVERSITY_PENALTY = 1.8;

function symbolicSimilarity(first: Crystal, second: Crystal) {
  const firstThemes = new Set(first.themes);
  const secondThemes = new Set(second.themes);
  const unionSize = new Set([...firstThemes, ...secondThemes]).size;
  const sharedThemeRatio = unionSize
    ? [...firstThemes].filter((theme) => secondThemes.has(theme)).length / unionSize
    : 0;
  const sameGuideCategory = normalize(first.note) === normalize(second.note);

  // The note is the catalog's concise symbolic category; themes provide its
  // finer-grained tags. Tone is visual and is not treated as a meaning.
  return sameGuideCategory ? 1 : sharedThemeRatio;
}

function selectDiverseCandidates<T extends { crystal: Crystal; score: number }>(
  rankedCandidates: readonly T[],
  limit: number,
) {
  const remaining = [...rankedCandidates];
  const selected: T[] = [];

  while (remaining.length && selected.length < limit) {
    if (selected.length === 0) {
      selected.push(remaining.shift()!);
      continue;
    }

    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    let bestOriginalScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const strongestOverlap = selected.reduce(
        (maximum, chosen) => Math.max(maximum, symbolicSimilarity(candidate.crystal, chosen.crystal)),
        0,
      );
      const adjustedScore = candidate.score - DIVERSITY_PENALTY * strongestOverlap;

      // Original ranking wins ties, so results stay deterministic.
      if (
        adjustedScore > bestAdjustedScore
        || (adjustedScore === bestAdjustedScore && candidate.score > bestOriginalScore)
      ) {
        bestIndex = index;
        bestAdjustedScore = adjustedScore;
        bestOriginalScore = candidate.score;
      }
    }
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}

function labelThemes(themes: readonly string[], translate: CopyTranslator) {
  return joinCopy(
    themes.slice(0, 2).map((theme) => translate(plainTheme[theme] ?? theme.replaceAll('-', ' '))),
    translate,
  );
}

function rank(
  astrology: Calculated | undefined,
  { intentions = [], hiddenCrystals = [], crystalCollection = [], feeling, dateKey }: Options,
  limit = 1,
  translate: CopyTranslator = identityCopy,
  translateStoneName: CopyTranslator = identityCopy,
): CrystalRecommendation[] {
  const selectedFeeling = FEELING_OPTIONS.find((option) => option.id === feeling);
  const uniqueIntentions = Array.from(
    new Set(intentions.map(normalize).filter(Boolean)),
  );
  const hasPersonalContext = Boolean(astrology || selectedFeeling || uniqueIntentions.length);
  if (!hasPersonalContext) return [];

  const hidden = new Set(hiddenCrystals);
  const owned = new Set(crystalCollection);
  const chartTags = getChartThemes(astrology);
  const feelingTags = new Set<string>(selectedFeeling?.themes ?? []);
  const leadAspect = astrology?.aspects[0];
  // Residence affects this daily tie-break only through calculationDate; its
  // coordinates never enter crystal scoring or the geocentric chart factors.
  const tieSeed = [
    astrology?.calculationDate ?? dateKey ?? 'no-chart',
    leadAspect ? `${leadAspect.transitBody}-${leadAspect.aspect}-${leadAspect.natalBody}` : '',
    selectedFeeling?.id ?? '',
    uniqueIntentions.join('|'),
    astrology?.natalPlacements.map((placement) => `${placement.body}:${placement.sign}`).join('|') ?? '',
  ].join(':');

  const rankedCandidates = crystalCatalog
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
        owned: owned.has(slugOf(crystal.name)),
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
    .sort((first, second) => second.score - first.score);

  const ownedCandidates = rankedCandidates.filter((candidate) => candidate.owned);
  const selectedOwned = selectDiverseCandidates(
    ownedCandidates,
    Math.min(limit, ownedCandidates.length),
  );
  const selectedOwnedNames = new Set(selectedOwned.map(({ crystal }) => crystal.name));
  const selectedOther = selectDiverseCandidates(
    rankedCandidates.filter((candidate) =>
      !candidate.owned && !selectedOwnedNames.has(candidate.crystal.name),
    ),
    Math.max(0, limit - selectedOwned.length),
  );

  return [...selectedOwned, ...selectedOther]
    .map(({ crystal, matched, chartMatchCount, feelingMatchCount }) => {
      const stoneName = translateStoneName(crystal.name);
      const selectedMeaning = crystalMeaning(crystal.note, translate).toLocaleLowerCase();
      const natalLink = chartConnection(astrology, crystal);
      const chartThemes = natalLink?.themes ?? [];
      const feelingThemes = selectedFeeling
        ? crystal.themes.filter((theme) => selectedFeeling.themes.includes(theme))
        : [];
      const additionalFeelingThemes = feelingThemes.filter((theme) => !chartThemes.includes(theme));
      const action = selectedFeeling
        ? selectedFeeling.themes
          .filter((theme) => crystal.themes.includes(theme))
          .map((theme) => themeAction[theme] ? translate(themeAction[theme]) : '')
          .find(Boolean)
        : (chartThemes.length ? chartThemes : feelingThemes)
          .map((theme) => themeAction[theme] ? translate(themeAction[theme]) : '')
          .find(Boolean);
      const intentionText = joinCopy(matched.map((intention) => translate(intention.toLowerCase())), translate);
      const intentionCopy = matched.length
         ? fillCopy(translate('This suggestion also reflects your intention: {intentions}.'), {
          intentions: intentionText,
        })
        : null;
      const feelingCopy = selectedFeeling && feelingMatchCount > 0
        ? chartThemes.some((theme) => feelingThemes.includes(theme))
          ? fillCopy(translate('You chose “{feeling},” which also influenced this suggestion.'), {
            feeling: translate(selectedFeeling.label).toLocaleLowerCase(),
          })
          : fillCopy(translate('Your selected feeling connects with these themes: {themes}.'), {
            themes: labelThemes(feelingThemes, translate),
          })
        : null;
       const chartCopy = natalLink
         ? fillCopy(
            translate("Today's planetary connection highlights themes from your birth chart: {themes}."),
           { themes: labelThemes(chartThemes, translate) },
         )
         : null;
      const intentionReason = intentionCopy
         ? `${fillCopy(translate('The themes associated with {stone} are: {meaning}.'), {
          stone: stoneName,
          meaning: selectedMeaning,
        })} ${intentionCopy}`
        : null;
      const reason = [
        chartCopy,
        !chartCopy && !feelingCopy ? intentionReason : null,
        feelingCopy,
        chartCopy && feelingCopy && additionalFeelingThemes.length
          ? fillCopy(translate('This stone also reflects these themes: {themes}.'), {
            themes: labelThemes(additionalFeelingThemes, translate),
          })
          : null,
        action
          ? fillCopy(translate('{stone} can remind you of a small step: {action}.'), {
            stone: stoneName,
            action,
          })
          : fillCopy(translate('{stone} can be a helpful companion. Its themes include: {meaning}. It can remind you to choose one useful next step.'), {
            stone: stoneName,
            meaning: selectedMeaning,
          }),
      ].filter(Boolean).join(' ');
      return {
        crystal,
        basis: feelingMatchCount > 0
          ? 'feeling'
          : chartMatchCount >= MINIMUM_DAILY_CHART_THEME_MATCHES ? 'chart' : 'intention',
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
  translate: CopyTranslator = identityCopy,
  translateStoneName: CopyTranslator = identityCopy,
) {
  return rank(astrology, options, limit, translate, translateStoneName);
}

export function getCrystalRecommendation(
  astrology: Calculated,
  options: Options = {},
  translate: CopyTranslator = identityCopy,
  translateStoneName: CopyTranslator = identityCopy,
) {
  return rank(astrology, options, 1, translate, translateStoneName)[0] ?? null;
}

export function getIntentionRecommendation(
  options: Options,
  translate: CopyTranslator = identityCopy,
  translateStoneName: CopyTranslator = identityCopy,
) {
  return rank(undefined, options, 1, translate, translateStoneName)[0] ?? null;
}
