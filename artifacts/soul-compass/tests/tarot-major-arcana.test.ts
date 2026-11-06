import { expect, test } from 'vitest';
import {
  majorArcanaContent,
  TAROT_CHART_THEMES,
  type TarotTextLocale,
} from '@/constants/tarot-major-arcana';

const locales: TarotTextLocale[] = ['en', 'ru'];
const themeSet = new Set<string>(TAROT_CHART_THEMES);
const copyFields = [
  'title',
  'meaning',
  'everydayExample',
  'chartPrompt',
  'reflectionQuestion',
] as const;

test('the first original Tarot text set contains all 22 Major Arcana in order', () => {
  expect(majorArcanaContent).toHaveLength(22);
  expect(majorArcanaContent.map((card) => card.number)).toEqual(
    Array.from({ length: 22 }, (_, index) => index),
  );
  expect(new Set(majorArcanaContent.map((card) => card.id)).size).toBe(22);
});

test('every Major Arcana has complete English and Russian reflection copy', () => {
  for (const card of majorArcanaContent) {
    expect(card.themes.length, card.id).toBeGreaterThan(0);
    for (const theme of card.themes) {
      expect(themeSet.has(theme), `${card.id}/${theme}`).toBe(true);
    }

    for (const locale of locales) {
      for (const field of copyFields) {
        const value = card.copy[locale][field];
        expect(value.trim(), `${locale}/${card.id}/${field}`).not.toBe('');
      }
    }
  }
});

test('difficult card names are framed as reflection, not literal predictions', () => {
  const death = majorArcanaContent.find((card) => card.id === 'death')!;
  const tower = majorArcanaContent.find((card) => card.id === 'tower')!;

  expect(death.copy.en.meaning).toMatch(/not a literal prediction/i);
  expect(tower.copy.en.meaning).toMatch(/does not predict disaster/i);
  expect(death.copy.ru.meaning).toMatch(/не о буквальном предсказании/);
  expect(tower.copy.ru.meaning).toMatch(/карта не предсказывает катастрофу/);
});
