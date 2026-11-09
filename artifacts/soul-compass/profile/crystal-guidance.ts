import { crystalCatalog, type Crystal } from '../constants/content';
import { calculateNatalElementBalanceFromPlacements } from './astrology';
import type {
  DailyAstrology,
  DailyTransitAnalysis,
  NatalElementBalance,
  TransitAspect,
  ZodiacElement,
} from './astrology';
import { getTransitAspectThemes } from './transit-themes';

type Calculated = Extract<DailyAstrology, { status: 'calculated' }>;
type Options = {
  intentions?: string[];
  hiddenCrystals?: string[];
  crystalCollection?: string[];
  feeling?: string | null;
  dateKey?: string;
  natalCrystalRecommendations?: readonly NatalCrystalRecommendation[];
};
type CopyTranslator = (source: string) => string;

const identityCopy: CopyTranslator = (source) => source;

export const DAILY_CRYSTAL_SCORE_WEIGHTS = {
  mainTransit: 35,
  natalProfile: 25,
  mood: 20,
  supportingAspects: 10,
  intentions: 10,
} as const;

export type DailyCrystalScoreBreakdown = {
  mainTransit: number;
  natalProfile: number;
  mood: number;
  supportingAspects: number;
  intentions: number;
  total: number;
};

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
  score: number;
  scoreBreakdown: DailyCrystalScoreBreakdown;
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

function uniqueThemes(themes: readonly string[]): string[] {
  return [...new Set(themes)];
}

function withoutUsedThemes(themes: readonly string[], used: ReadonlySet<string>): string[] {
  return uniqueThemes(themes).filter((theme) => !used.has(theme));
}

function factorScore(
  crystalThemes: ReadonlySet<string>,
  factorThemes: readonly string[],
  weight: number,
): number {
  if (!factorThemes.length) return 0;
  const overlap = factorThemes.filter((theme) => crystalThemes.has(theme)).length;
  return weight * overlap / factorThemes.length;
}

function getDailyMatchAspects(astrology: Calculated | undefined): {
  main: TransitAspect | null;
  supporting: TransitAspect[];
} {
  if (!astrology) return { main: null, supporting: [] };
  const analysis: DailyTransitAnalysis | undefined = astrology.transitAnalysis;
  const main = analysis?.dominantAspect ?? astrology.aspects[0] ?? null;
  const candidates = analysis?.supportingAspects ?? astrology.aspects.slice(1, 3);
  const mainThemes = new Set(main ? getTransitAspectThemes(main) : []);
  const supporting = candidates.filter((aspect) =>
    aspect !== main
    && getTransitAspectThemes(aspect).some((theme) => mainThemes.has(theme)),
  );
  return { main, supporting };
}

function deriveNatalRecommendations(
  astrology: Calculated | undefined,
  options: Options,
  translate: CopyTranslator,
  translateStoneName: CopyTranslator,
): readonly NatalCrystalRecommendation[] {
  if (options.natalCrystalRecommendations) return options.natalCrystalRecommendations;
  if (!astrology) return [];
  const balance = calculateNatalElementBalanceFromPlacements(
    astrology.natalPlacements,
    astrology.preciseBirthMoment,
  );
  return balance.status === 'calculated'
    ? getNatalCrystalSuggestions(
        balance,
        [],
        8,
        translate,
        translateStoneName,
        [],
      )
    : [];
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

const DIVERSITY_PENALTY_POINTS = 1.8;

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
      // This presentation-only adjustment diversifies alternatives after the
      // suitability score and primary recommendation have already been set.
      const adjustedScore = candidate.score - DIVERSITY_PENALTY_POINTS * strongestOverlap;

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

function labelMatchedThemes(themes: readonly string[], translate: CopyTranslator) {
  return joinCopy(
    themes.slice(0, 2).map((theme) => translate(theme)),
    translate,
  );
}

function rank(
  astrology: Calculated | undefined,
  options: Options,
  limit = 1,
  translate: CopyTranslator = identityCopy,
  translateStoneName: CopyTranslator = identityCopy,
): CrystalRecommendation[] {
  const {
    intentions = [],
    hiddenCrystals = [],
    crystalCollection = [],
    feeling,
  } = options;
  const selectedFeeling = FEELING_OPTIONS.find((option) => option.id === feeling);
  const uniqueIntentions = Array.from(
    new Set(intentions.map(normalize).filter(Boolean)),
  );
  const natalRecommendations = deriveNatalRecommendations(
    astrology,
    options,
    translate,
    translateStoneName,
  );
  const hasPersonalContext = Boolean(
    astrology || selectedFeeling || uniqueIntentions.length || natalRecommendations.length,
  );
  if (!hasPersonalContext) return [];

  const hidden = new Set(hiddenCrystals);
  const owned = new Set(crystalCollection);
  const { main: mainAspect, supporting: relatedSupportingAspects } =
    getDailyMatchAspects(astrology);
  const mainTransitThemes = uniqueThemes(
    mainAspect ? getTransitAspectThemes(mainAspect) : [],
  );
  const usedThemes = new Set(mainTransitThemes);
  const natalProfileThemes = withoutUsedThemes(
    natalRecommendations.flatMap(({ crystal }) => crystal.themes),
    usedThemes,
  );
  natalProfileThemes.forEach((theme) => usedThemes.add(theme));
  const moodThemes = withoutUsedThemes(selectedFeeling?.themes ?? [], usedThemes);
  moodThemes.forEach((theme) => usedThemes.add(theme));
  const supportingAspectThemes = withoutUsedThemes(
    relatedSupportingAspects.flatMap((aspect) => getTransitAspectThemes(aspect)),
    usedThemes,
  );
  supportingAspectThemes.forEach((theme) => usedThemes.add(theme));
  const intentionThemesForScoring = withoutUsedThemes(
    uniqueIntentions.flatMap((intention) => [...getIntentionTags(intention)]),
    usedThemes,
  );

  const rankedCandidates = crystalCatalog
    .map((crystal, index) => {
      const crystalThemes = new Set(crystal.themes);
      const matchedMainTransitThemes = mainTransitThemes.filter((theme) => crystalThemes.has(theme));
      const matchedNatalProfileThemes = natalProfileThemes.filter((theme) => crystalThemes.has(theme));
      const matchedMoodThemes = moodThemes.filter((theme) => crystalThemes.has(theme));
      const matchedSupportingThemes = supportingAspectThemes.filter((theme) => crystalThemes.has(theme));
      const matchedIntentionThemes = intentionThemesForScoring.filter((theme) => crystalThemes.has(theme));
      const natalRecommendation = natalRecommendations.find(
        ({ crystal: natalCrystal }) => slugOf(natalCrystal.name) === slugOf(crystal.name),
      ) ?? null;
      const intentionMatches = getMatchedIntentions(crystal, uniqueIntentions).filter((intention) =>
        [...getIntentionTags(intention)].some((theme) =>
          intentionThemesForScoring.includes(theme) && crystalThemes.has(theme),
        ),
      );
      const scoreBreakdown = {
        mainTransit: factorScore(
          crystalThemes,
          mainTransitThemes,
          DAILY_CRYSTAL_SCORE_WEIGHTS.mainTransit,
        ),
        natalProfile:
          (natalRecommendation ? 15 : 0)
          + factorScore(
            crystalThemes,
            natalProfileThemes,
            DAILY_CRYSTAL_SCORE_WEIGHTS.natalProfile - 15,
          ),
        mood: factorScore(
          crystalThemes,
          moodThemes,
          DAILY_CRYSTAL_SCORE_WEIGHTS.mood,
        ),
        supportingAspects: factorScore(
          crystalThemes,
          supportingAspectThemes,
          DAILY_CRYSTAL_SCORE_WEIGHTS.supportingAspects,
        ),
        intentions: factorScore(
          crystalThemes,
          intentionThemesForScoring,
          DAILY_CRYSTAL_SCORE_WEIGHTS.intentions,
        ),
      };
      const totalScore = Object.values(scoreBreakdown)
        .reduce((sum, value) => sum + value, 0);
      const score = Math.round(totalScore * 100) / 100;
      const supportingAspect = relatedSupportingAspects.find((aspect) =>
        getTransitAspectThemes(aspect).some((theme) =>
          matchedSupportingThemes.includes(theme),
        ),
      ) ?? null;
      const matchedThemes = uniqueThemes([
        ...matchedMainTransitThemes,
        ...matchedNatalProfileThemes,
        ...matchedMoodThemes,
        ...matchedSupportingThemes,
        ...matchedIntentionThemes,
      ]);
      return {
        crystal,
        index,
        score,
        scoreBreakdown: { ...scoreBreakdown, total: score },
        owned: owned.has(slugOf(crystal.name)),
        mainAspect,
        supportingAspect,
        natalRecommendation,
        matchedMainTransitThemes,
        matchedNatalProfileThemes,
        matchedMoodThemes,
        matchedSupportingThemes,
        intentionMatches,
        matchedThemes,
        // Suitability is computed independently from hidden/owned availability.
        suitable: score > 0,
      };
    })
    .filter((candidate) => candidate.suitable && !hidden.has(slugOf(candidate.crystal.name)))
    .sort((first, second) =>
      second.score - first.score
      || second.scoreBreakdown.mainTransit - first.scoreBreakdown.mainTransit
      || second.scoreBreakdown.natalProfile - first.scoreBreakdown.natalProfile
      || first.index - second.index,
    );

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

  const selected = [...selectedOwned, ...selectedOther];
  return selected.map((candidate, index) => {
      const reasons: string[] = [];
      if (candidate.mainAspect && candidate.matchedMainTransitThemes.length) {
        reasons.push(fillCopy(translate(
          'Today’s main chart link (transiting {transitBody}, {aspect}, natal {natalBody}) matches {themes} in this stone’s catalog profile.',
        ), {
          transitBody: translate(candidate.mainAspect.transitBody),
          aspect: translate(candidate.mainAspect.aspect),
          natalBody: translate(candidate.mainAspect.natalBody),
          themes: labelMatchedThemes(candidate.matchedMainTransitThemes, translate),
        }));
      }
      if (candidate.natalRecommendation) {
        reasons.push(fillCopy(translate(
          'This is also one of your eight birth-chart companions, selected for its connection to {element} themes.',
        ), {
          element: translate(candidate.natalRecommendation.element),
        }));
      } else if (candidate.matchedNatalProfileThemes.length) {
        reasons.push(fillCopy(translate(
          'Its themes overlap with those in your birth-chart companions: {themes}.',
        ), {
          themes: labelMatchedThemes(candidate.matchedNatalProfileThemes, translate),
        }));
      }
      if (candidate.supportingAspect && candidate.matchedSupportingThemes.length) {
        reasons.push(fillCopy(translate(
          'A related supporting chart link (transiting {transitBody}, {aspect}, natal {natalBody}) also matches {themes}.',
        ), {
          transitBody: translate(candidate.supportingAspect.transitBody),
          aspect: translate(candidate.supportingAspect.aspect),
          natalBody: translate(candidate.supportingAspect.natalBody),
          themes: labelMatchedThemes(candidate.matchedSupportingThemes, translate),
        }));
      }
      if (selectedFeeling && candidate.matchedMoodThemes.length) {
        reasons.push(fillCopy(translate(
          'Your selected feeling, “{feeling},” also matches {themes}.',
        ), {
          feeling: translate(selectedFeeling.label),
          themes: labelMatchedThemes(candidate.matchedMoodThemes, translate),
        }));
      }
      if (candidate.intentionMatches.length) {
        reasons.push(fillCopy(translate(
          'This also matches your intention: {intentions}.',
        ), {
          intentions: joinCopy(
            candidate.intentionMatches.map((intention) => translate(intention)),
            translate,
          ),
        }));
      }
      const catalogAssociations = crystalMeaning(candidate.crystal.note, translate);
      if (catalogAssociations) {
        reasons.push(fillCopy(translate('Its catalog associations include {themes}.'), {
          themes: catalogAssociations,
        }));
      }
      const actionTheme = candidate.matchedThemes.find((theme) => themeAction[theme]);
      if (actionTheme && themeAction[actionTheme]) {
        reasons.push(fillCopy(translate('A small action for today: {action}.'), {
          action: translate(themeAction[actionTheme]),
        }));
      }
      const priorThemes = new Set(
        selected.slice(0, index).flatMap((item) => item.matchedThemes),
      );
      const distinctTheme = candidate.matchedThemes.find((theme) => !priorThemes.has(theme))
        ?? candidate.matchedThemes[0]
        ?? candidate.crystal.themes[0];
      const selectionReason = index === 0
        ? candidate.owned
          ? translate('Among suitable stones in your collection, this has the strongest combined fit for today.')
          : translate('This has the strongest combined fit among suitable stones outside your collection.')
        : fillCopy(translate('It is one of the next-strongest fits, adding a distinct link to {theme}.'), {
          theme: translate(distinctTheme),
        });
      reasons.push(selectionReason);
      const basis = candidate.matchedMoodThemes.length
        ? 'feeling'
        : candidate.matchedMainTransitThemes.length
          || candidate.matchedNatalProfileThemes.length
          || candidate.natalRecommendation
          || candidate.matchedSupportingThemes.length
          ? 'chart'
          : 'intention';
      return {
        crystal: candidate.crystal,
        basis,
        matchedIntentions: candidate.intentionMatches,
        feelingLabel: selectedFeeling?.label,
        reason: reasons.join(' '),
        score: candidate.score,
        scoreBreakdown: candidate.scoreBreakdown,
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
