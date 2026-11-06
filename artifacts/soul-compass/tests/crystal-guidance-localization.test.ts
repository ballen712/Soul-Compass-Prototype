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

import { getCrystalSuggestions } from '@/profile/crystal-guidance';
import { translateText } from '../localization';
import { getLocalizedCrystalCopy } from '../localization/crystal-copy';

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
