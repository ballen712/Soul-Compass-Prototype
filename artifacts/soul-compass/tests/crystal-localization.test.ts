import { expect, test, vi } from 'vitest';
const profileState = vi.hoisted(() => ({ preferences: { language: 'en' } }));
vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => profileState,
}));
import { crystalGuideCopy } from '@/constants/crystal-guide-copy';
import {
  APP_LOCALES,
  translateText,
} from '../localization';
import { getLocalizedCrystalCopy } from '../localization/crystal-copy';
import crystalUiTranslations from '../localization/crystal-ui-translations.json';
import specimenBriefs from '../scripts/crystal-image-briefs.json';

const translatedLocales = APP_LOCALES.filter((locale) => locale !== 'en');

test('all 93 catalog stones have complete translated names and descriptions in every selected language', () => {
  const stoneNames = Object.keys(crystalGuideCopy);
  expect(stoneNames).toHaveLength(93);

  for (const locale of translatedLocales) {
    for (const name of stoneNames) {
      const copy = getLocalizedCrystalCopy(name, locale);
      expect(copy, `${locale}/${name}`).not.toBeNull();
      expect(copy!.name.trim()).not.toBe('');
      expect(copy!.note.trim()).not.toBe('');
      expect(copy!.description.trim()).not.toBe('');
      expect(copy!.guideDescription.trim()).not.toBe('');
      expect(copy!.specimenDescription.trim()).not.toBe('');
      expect(copy!.guideDescription, `${locale}/${name}/guide`).not.toBe(crystalGuideCopy[name as keyof typeof crystalGuideCopy]);
      expect(copy!.specimenDescription, `${locale}/${name}/appearance`)
        .not.toBe(specimenBriefs[name as keyof typeof specimenBriefs]);
    }
  }
});

test('every Crystal screen label and dynamic copy template has a translation in all six languages', () => {
  for (const locale of translatedLocales) {
    const strings = crystalUiTranslations[locale];
    expect(Object.keys(strings).length).toBeGreaterThanOrEqual(222);
    for (const [source, translation] of Object.entries(strings)) {
      expect(translation.trim(), `${locale}/${source}`).not.toBe('');
      const sourceTokens = source.match(/\{[^}]+\}/g) ?? [];
      const translatedTokens = translation.match(/\{[^}]+\}/g) ?? [];
      expect(translatedTokens.sort(), `${locale}/${source} placeholders`).toEqual(sourceTokens.sort());
      expect(translateText(source, locale), `${locale}/${source} lookup`).toBe(translation);
    }
    expect(translateText('Search stones or themes', locale)).not.toBe('Search stones or themes');
    expect(translateText('No clear match today', locale)).not.toBe('No clear match today');
  }
});

