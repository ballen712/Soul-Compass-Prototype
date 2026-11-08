import { expect, test, vi } from 'vitest';

const profileState = vi.hoisted(() => ({ preferences: { language: 'en' } }));
const catalogState = vi.hoisted(() => [{
  name: 'Amethyst',
  note: 'Stillness · perspective',
  description: 'Amethyst is a clear test crystal.',
  guideDescription: 'A short guide description.',
  specimenDescription: 'A purple crystal cluster.',
  themes: ['calm', 'rest', 'ease', 'reflection'],
  tone: 'violet',
  image: undefined,
}]);

vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => profileState,
}));
vi.mock('@/constants/content', () => ({
  crystalCatalog: catalogState,
}));

import { getCrystalSuggestions, getNatalCrystalSuggestions } from '@/profile/crystal-guidance';
import { translateText } from '../localization';
import { getLocalizedCrystalCopy } from '../localization/crystal-copy';
import guidanceTranslations from '../localization/crystal-guidance-translations.json';

test('daily crystal recommendation copy localizes without changing which stone matches', () => {
  const options = { feeling: 'tired', dateKey: '2026-11-06' };
  const english = getCrystalSuggestions(undefined, options, 1);
  const russian = getCrystalSuggestions(
    undefined,
    options,
    1,
    (source) => translateText(source, 'ru'),
    (name) => getLocalizedCrystalCopy(name, 'ru')?.name ?? name,
  );

  expect(russian.map(({ crystal }) => crystal.name)).toEqual(
    english.map(({ crystal }) => crystal.name),
  );
  expect(russian[0].reason).toMatch(/[а-яё]/i);
  expect(russian[0].reason).not.toContain('You chose');
});

test('all crystal guidance labels and sentence templates have translations in every supported locale', () => {
  const locales = ['hu', 'it', 'de', 'fr', 'es', 'ru'] as const;
  const russianKeys = Object.keys(guidanceTranslations.ru).sort();

  for (const locale of locales) {
    expect(Object.keys(guidanceTranslations[locale]).sort()).toEqual(russianKeys);
    for (const source of russianKeys) {
      expect(translateText(source, locale)).not.toBe(source);
    }
  }
  expect(translateText('Birth details and places', 'ru')).toBe('Данные рождения и места');
  const collectionPriorityCopy = 'The guide checks stones in Your Collection first. When one matches your birth chart or today’s themes, it gets priority. If there are not enough suitable stones in your collection, the guide considers matching stones from the full catalog. If nothing fits, it leaves the suggestion empty.';
  for (const locale of locales) {
    expect(translateText(collectionPriorityCopy, locale)).not.toBe(collectionPriorityCopy);
  }
});

test('birth-chart companion reasons explain the element match and a practical step in every language', () => {
  const original = catalogState[0];
  catalogState[0] = {
    ...original,
    name: 'Epidote',
    note: 'Curiosity · learning',
    themes: ['curiosity', 'learning'],
  };
  const balance = {
    status: 'calculated' as const,
    counts: { Fire: 5, Air: 1, Water: 2, Earth: 2 },
    total: 10,
    dominant: ['Fire'] as Array<'Fire' | 'Air' | 'Water' | 'Earth'>,
    leastRepresented: ['Air'] as Array<'Fire' | 'Air' | 'Water' | 'Earth'>,
    preciseBirthMoment: true,
  };

  try {
    const englishReason = getNatalCrystalSuggestions(balance, [], 1)[0].reason;
    expect(englishReason).not.toContain('Crystal theme:');
    expect(englishReason).toContain('Air is less prominent in your chart.');
    expect(englishReason).toContain('curiosity and learning');
    expect(englishReason).toContain('For example: ask one open question before settling on an answer.');

    for (const locale of ['hu', 'it', 'de', 'fr', 'es', 'ru'] as const) {
      const reason = getNatalCrystalSuggestions(
        balance,
        [],
        1,
        (source) => translateText(source, locale),
        (name) => getLocalizedCrystalCopy(name, locale)?.name ?? name,
      )[0].reason;

      expect(reason).toContain(translateText('Air is less prominent in your chart.', locale));
      expect(reason).toContain(translateText('ask one open question before settling on an answer', locale));
      expect(reason).not.toMatch(/Crystal theme:|This stone is linked|small practice|less prominent in your chart/i);
    }

    catalogState[0] = {
      ...catalogState[0],
      themes: ['creativity', 'initiative'],
    };
    const strongFireReason = getNatalCrystalSuggestions({
      ...balance,
      dominant: ['Fire'],
      leastRepresented: ['Air'],
    }, [], 1)[0].reason;
    expect(strongFireReason).toContain('Fire is one of the stronger elements in your chart.');
    expect(strongFireReason).not.toContain('Crystal theme:');
    expect(strongFireReason.match(/creative ideas/gu)).toHaveLength(1);
  } finally {
    catalogState[0] = original;
  }
});

test('daily stone reasons keep theme phrases in the selected language and use natural Russian case', () => {
  const original = catalogState[0];
  catalogState[0] = {
    ...original,
    name: 'Carnelian',
    note: 'Vitality · initiative',
    themes: ['grounding', 'rest', 'ease', 'reflection', 'focus'],
  };

  try {
    for (const locale of ['hu', 'it', 'de', 'fr', 'es', 'ru'] as const) {
      const recommendation = getCrystalSuggestions(
        undefined,
        { feeling: 'tired', dateKey: '2026-11-06' },
        1,
        (source) => translateText(source, locale),
        (name) => getLocalizedCrystalCopy(name, locale)?.name ?? name,
      )[0];

      expect(recommendation).toBeDefined();
      expect(recommendation.reason).not.toMatch(/steady, practical steps|keeping going through difficulty/i);
      expect(recommendation.reason).not.toContain("Today's planetary connection");
    }

    const russian = getCrystalSuggestions(
      undefined,
      { intentions: ['focus'], dateKey: '2026-11-06' },
      1,
      (source) => translateText(source, 'ru'),
      (name) => getLocalizedCrystalCopy(name, 'ru')?.name ?? name,
    )[0].reason;
    expect(russian).toContain('Основные темы камня «Сердолик»: жизненная сила и инициатива.');
    expect(russian).not.toContain('для жизненная сила');
  } finally {
    catalogState[0] = original;
  }
});

test('Italian catalog notes display accented characters instead of HTML entities', () => {
  expect(getLocalizedCrystalCopy('Carnelian', 'it')?.note).toBe('Vitalità · iniziativa');
});
