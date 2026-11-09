import type { CalculatedReading, DailyTransitAnalysis, PlanetaryBody } from './astrology';
import { localDayKey } from './local';
import { planetDailyThemeCopy } from './transit-themes';

type Translate = (source: string) => string;
type Format = (source: string, values: Record<string, string | number>) => string;

type Mood = {
  selectedMood: string | null;
  selectedDay: string | null;
};

const aspectInsight = {
  conjunction: 'These themes may feel closely connected today. Notice what is drawing your attention before you act.',
  sextile: 'A small opening may help you use both themes. Keep the next step practical.',
  square: 'You may notice friction between these areas. Pause to see what each one needs before responding.',
  trine: 'These areas may work well together. Notice a strength or routine you can already rely on.',
  opposition: 'Two needs may pull in different directions. Give both a fair hearing before choosing what comes next.',
} as const;

const aspectFocus = {
  conjunction: 'Choose one clear first step related to {natalTheme}, then give it your attention.',
  sextile: 'Try one small, practical step that brings {transitTheme} and {natalTheme} together.',
  square: 'Choose one practical action that eases the tension without trying to solve everything at once.',
  trine: 'Use a familiar strength related to {natalTheme} to move one task forward.',
  opposition: 'Make room for both {transitTheme} and {natalTheme} before choosing your next step.',
} as const;

const aspectCaution = {
  conjunction: 'Do not let one strong impulse set the pace for your whole day.',
  sextile: 'Check whether a new opening fits your priorities before saying yes.',
  square: 'Tension is a cue to pause and adjust, not proof that you have to push harder.',
  trine: 'Do not take on extra tasks just because one area feels easier.',
  opposition: 'Avoid taking one side before you understand what the other needs.',
} as const;

const moodGuidance = {
  active: {
    focus: 'Use your energy for one deliberate step connected to {natalTheme}, then see what still needs attention.',
    caution: 'A burst of motivation does not mean you need to take on everything at once.',
  },
  gentle: {
    focus: 'Keep the pace gentle: choose one manageable step connected to {natalTheme}, then give yourself room to pause.',
    caution: 'If your energy is limited, leave optional tasks for another day.',
  },
  pressure: {
    focus: 'Choose one part you can influence around {natalTheme}; let the rest wait until it is clearer.',
    caution: 'Not every demand needs an immediate answer; pause before adding more to your list.',
  },
  open: {
    focus: 'Use your current mood as a clue: make one practical choice around {natalTheme} that feels right to you.',
    caution: 'Stay open to possibilities without acting on every one right away.',
  },
} as const;

function moodCategory(mood: string | null): keyof typeof moodGuidance | null {
  if (!mood) return null;
  if (['energized', 'brave', 'focused'].includes(mood)) return 'active';
  if (['tired', 'easy-day', 'low'].includes(mood)) return 'gentle';
  if (['under-pressure', 'restless'].includes(mood)) return 'pressure';
  if (['steady', 'curious', 'connection', 'reflective'].includes(mood)) return 'open';
  return null;
}

function findMeaningfulSupportingAspect(
  analysis: DailyTransitAnalysis,
  main: DailyTransitAnalysis['dominantAspect'],
) {
  if (!main) return null;
  return analysis.supportingAspects.find((candidate) =>
    candidate.themeTags.some((tag) => main.themeTags.includes(tag)),
  ) ?? null;
}

function translatedBody(planet: PlanetaryBody, translate: Translate): string {
  return translate(planet);
}

/**
 * Composes Cosmos copy from the already-computed local transit analysis.
 * A feeling only affects the practical wording when it was selected today.
 */
export function composeDailyReflection({
  baseReading,
  analysis,
  mood,
  now,
  translate,
  format,
}: {
  baseReading: CalculatedReading;
  analysis: DailyTransitAnalysis | null;
  mood: Mood;
  now: Date;
  translate: Translate;
  format: Format;
}): CalculatedReading | null {
  const main = analysis?.dominantAspect;
  if (!analysis || !main) return null;

  const transitThemeKey = planetDailyThemeCopy[main.transitBody];
  const natalThemeKey = planetDailyThemeCopy[main.natalBody];
  const sharedPlacementTheme = transitThemeKey === natalThemeKey;
  const aspectName = translate(main.aspect);
  const insight = translate(aspectInsight[main.aspect]);
  const body = format(
    sharedPlacementTheme
      ? '{transitBody} in {transitSign} forms a {aspect} with your natal {natalBody} in {natalSign}. Since both placements point to {natalTheme}, that part of your chart may feel more noticeable today. {insight}'
      : '{transitBody} in {transitSign} forms a {aspect} with your natal {natalBody} in {natalSign}. In your chart, this links {transitTheme} with {natalTheme}. {insight}',
    {
      transitBody: translatedBody(main.transitBody, translate),
      transitSign: translate(main.transitSign),
      aspect: aspectName,
      natalBody: translatedBody(main.natalBody, translate),
      natalSign: translate(main.natalSign),
      transitTheme: translate(transitThemeKey),
      natalTheme: translate(natalThemeKey),
      insight,
    },
  );

  const supporting = findMeaningfulSupportingAspect(analysis, main);
  const supportingTheme = supporting?.themeTags.find((tag) => main.themeTags.includes(tag));
  const bodyWithSupport = supporting && supportingTheme
    ? `${body} ${format(
        'Another relevant aspect: {transitBody} — {aspect} — natal {natalBody}. Shared theme: {theme}.',
        {
          transitBody: translatedBody(supporting.transitBody, translate),
          aspect: translate(supporting.aspect),
          natalBody: translatedBody(supporting.natalBody, translate),
          theme: translate(supportingTheme),
        },
      )}`
    : body;

  const moodIsCurrent = mood.selectedDay === localDayKey(now);
  const moodStyle = moodCategory(moodIsCurrent ? mood.selectedMood : null);
  const practicalFocus = moodStyle
    ? moodGuidance[moodStyle].focus
    : aspectFocus[main.aspect];
  const practicalCaution = moodStyle
    ? moodGuidance[moodStyle].caution
    : aspectCaution[main.aspect];
  const practicalValues = {
    transitTheme: translate(transitThemeKey),
    natalTheme: translate(natalThemeKey),
  };

  return {
    ...baseReading,
    body: bodyWithSupport,
    favorableFocus: format(practicalFocus, practicalValues),
    gentleCaution: translate(practicalCaution),
  };
}
