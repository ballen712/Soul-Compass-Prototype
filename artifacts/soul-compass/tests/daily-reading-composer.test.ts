import { Body } from 'astronomy-engine';
import { describe, expect, test, vi } from 'vitest';
import { formatAppText, translateText, type AppLocale } from '../localization';
import {
  dailyComposerSourceCopyKeys,
  dailyComposerTranslations,
} from '../localization/daily-composer-copy';
import {
  type AnalyzedTransitAspect,
  type CalculatedReading,
  type DailyTransitAnalysis,
} from '../profile/astrology';
import { composeDailyReflection } from '../profile/daily-reading-composer';
import { localDayKey } from '../profile/local';

vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => ({ preferences: { language: 'en' } }),
}));

const baseReading: CalculatedReading = {
  label: 'TODAY’S REFLECTION',
  title: 'Treat tension as information.',
  body: 'Older generic reading.',
  favorableFocus: 'Older focus.',
  gentleCaution: 'Older caution.',
  reflection: 'Where could you pause before responding?',
  factorSummary: 'Mars square natal Moon.',
};

function aspect(
  overrides: Partial<AnalyzedTransitAspect> = {},
): AnalyzedTransitAspect {
  return {
    transitBody: Body.Mars,
    transitSign: 'Gemini',
    natalBody: Body.Moon,
    natalSign: 'Pisces',
    aspect: 'square',
    quality: 'challenging',
    maxOrb: 3,
    angularSeparationDegrees: 90.2,
    separationRangeDegrees: { min: 90.2, max: 90.2 },
    minimumOrb: 0.2,
    motion: 'applying',
    duration: {
      category: 'days',
      estimatedDays: 4,
      minimumObservedDays: 3,
      isLowerBound: false,
      resolutionDays: 1,
    },
    themeTags: ['energy', 'initiative', 'patience', 'boundaries', 'rest', 'connection'],
    reliability: 'high',
    priorityReason: 'applying',
    ...overrides,
  };
}

function analysis(
  main = aspect(),
  supporting = [
    aspect({
      transitBody: Body.Venus,
      transitSign: 'Libra',
      natalBody: Body.Moon,
      natalSign: 'Pisces',
      aspect: 'sextile',
      quality: 'supportive',
      themeTags: ['connection', 'values', 'curiosity', 'opportunity', 'rest', 'reflection'],
    }),
  ],
  reliability: DailyTransitAnalysis['reliability'] = 'high',
): DailyTransitAnalysis {
  return {
    activeAspects: [main, ...supporting],
    dominantAspect: main,
    supportingAspects: supporting,
    longTermAspects: [],
    mainThemes: [...main.themeTags],
    supportingThemes: [...new Set(supporting.flatMap((item) => item.themeTags))],
    longTermThemes: [],
    themeEvidence: [],
    reliability,
  };
}

function compose({
  locale = 'en',
  mood = { selectedMood: null, selectedDay: null },
  currentAnalysis = analysis(),
  now = new Date(2026, 10, 5, 12),
}: {
  locale?: AppLocale;
  mood?: { selectedMood: string | null; selectedDay: string | null };
  currentAnalysis?: DailyTransitAnalysis;
  now?: Date;
} = {}) {
  const translate = (source: string) => translateText(source, locale);
  return composeDailyReflection({
    baseReading,
    analysis: currentAnalysis,
    mood,
    now,
    translate,
    format: (source, values) => formatAppText(source, locale, values),
  })!;
}

describe('daily Cosmos reading composer', () => {
  test('explains the actual transit-to-natal link and adds only a theme-relevant aspect', () => {
    const reading = compose();

    expect(reading.body).toContain('Mars');
    expect(reading.body).toContain('Gemini');
    expect(reading.body).toContain('Moon');
    expect(reading.body).toContain('Pisces');
    expect(reading.body).toContain('forms a square');
    expect(reading.body).toContain('energy and initiative');
    expect(reading.body).toContain('feelings and daily needs');
    expect(reading.body).toContain('Another relevant aspect');

    const unrelatedSupport = aspect({
      transitBody: Body.Jupiter,
      natalBody: Body.Sun,
      aspect: 'trine',
      quality: 'supportive',
      themeTags: ['growth', 'optimism'],
    });
    expect(compose({ currentAnalysis: analysis(aspect(), [unrelatedSupport]) }).body)
      .not.toContain('Another aspect');
  });

  test('uses a selected feeling only on the day it was recorded', () => {
    const now = new Date(2026, 10, 5, 12);
    const today = localDayKey(now);
    const currentMood = compose({
      now,
      mood: { selectedMood: 'tired', selectedDay: today },
    });
    const staleMood = compose({
      now,
      mood: { selectedMood: 'tired', selectedDay: '2026-11-04' },
    });

    expect(currentMood.favorableFocus).toContain('Keep the pace gentle');
    expect(currentMood.gentleCaution).toContain('If your energy is limited');
    expect(staleMood.favorableFocus).not.toContain('Keep the pace gentle');
    expect(staleMood.favorableFocus).toContain('eases the tension');
  });

  test('different synthetic chart patterns produce different personal readings', () => {
    const first = compose();
    const second = compose({
      currentAnalysis: analysis(aspect({
        transitBody: Body.Venus,
        transitSign: 'Cancer',
        natalBody: Body.Saturn,
        natalSign: 'Taurus',
        aspect: 'trine',
        quality: 'supportive',
        themeTags: ['connection', 'values', 'structure', 'patience'],
      }), []),
    });

    expect(second.body).toContain('Venus');
    expect(second.body).toContain('Saturn');
    expect(second.body).toContain('Taurus');
    expect(second.body).not.toBe(first.body);
    expect(second.favorableFocus).not.toBe(first.favorableFocus);
  });

  test('keeps unknown-time analysis usable without implying house precision', () => {
    const limitedMain = aspect({
      reliability: 'limited',
      angularSeparationDegrees: null,
      separationRangeDegrees: { min: 89.8, max: 90.4 },
      motion: 'uncertain',
    });
    const reading = compose({
      currentAnalysis: analysis(limitedMain, [], 'limited'),
    });

    expect(reading.body).toContain('natal Moon');
    expect(reading.body).not.toMatch(/\bhouse\b/i);
  });

  test('provides every new copy template in all six non-English locales', () => {
    for (const locale of ['hu', 'it', 'de', 'fr', 'es', 'ru'] as const) {
      for (const key of dailyComposerSourceCopyKeys) {
        expect(dailyComposerTranslations[locale][key], `${locale}: ${key}`).toBeTruthy();
        expect(dailyComposerTranslations[locale][key]).not.toBe(key);
      }
      const localized = compose({ locale });
      expect(localized.body).not.toContain('{');
      expect(localized.body).not.toContain('forms a square');
      expect(localized.body).not.toContain('energy and initiative');
      expect(localized.body).not.toContain('feelings and daily needs');
      expect(localized.body).not.toContain('Another aspect');
      expect(localized.favorableFocus).not.toContain('{');
      expect(localized.gentleCaution).not.toContain('{');
    }
  });
});
