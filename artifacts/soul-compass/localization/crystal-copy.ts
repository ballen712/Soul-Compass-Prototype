import catalogTranslations from './crystal-catalog-translations.json';

export type CrystalLocale = 'en' | 'hu' | 'it' | 'de' | 'fr' | 'es' | 'ru';

export type LocalizedCrystalCopy = {
  name: string;
  note: string;
  description: string;
  guideDescription: string;
  specimenDescription: string;
};

const translations = catalogTranslations as unknown as Record<
  Exclude<CrystalLocale, 'en'>,
  Record<string, LocalizedCrystalCopy>
>;

export function getLocalizedCrystalCopy(
  englishName: string,
  locale: CrystalLocale,
): LocalizedCrystalCopy | null {
  if (locale === 'en') return null;
  return translations[locale]?.[englishName] ?? null;
}
