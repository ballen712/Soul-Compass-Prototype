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
  const copy = translations[locale]?.[englishName];
  if (!copy) return null;
  const decode = (value: string) => value
    .replaceAll('&agrave;', 'à')
    .replaceAll('&eacute;', 'é');
  return {
    name: decode(copy.name),
    note: decode(copy.note),
    description: decode(copy.description),
    guideDescription: decode(copy.guideDescription),
    specimenDescription: decode(copy.specimenDescription),
  };
}
