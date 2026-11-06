import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { expect, test, vi } from 'vitest';

const profileState = vi.hoisted(() => ({ preferences: { language: 'en' } }));
vi.mock('@/profile/ProfileContext', () => ({
  useProfile: () => profileState,
}));
import {
  AppLocaleProvider,
  APP_LANGUAGE_LABELS,
  APP_LOCALES,
  normalizeAppLocale,
  translateText,
  useAppText,
} from '../localization';
import { dailyRituals } from '@/constants/daily-rituals';

function LocaleProbe() {
  const t = useAppText();
  return React.createElement('Text', null, t('Choose your language'));
}

function LocaleTree() {
  return React.createElement(
    AppLocaleProvider,
    null,
    React.createElement(LocaleProbe),
  );
}

test('the supported language set matches the seven selected launch languages', () => {
  expect(APP_LOCALES).toEqual(['en', 'hu', 'it', 'de', 'fr', 'es', 'ru']);
  expect(Object.keys(APP_LANGUAGE_LABELS)).toEqual([...APP_LOCALES]);
});

test('local profile deletion and its confirmation are translated in every supported language', () => {
  const deletionCopy = [
    'Delete local profile',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.',
    'Delete my local data',
    'Delete your local data?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.',
    'Keep my data',
    'Delete and start over',
    'Deleting…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.',
  ];

  for (const locale of APP_LOCALES) {
    for (const source of deletionCopy) {
      expect(translateText(source, locale), `${locale}: ${source}`).not.toBe('');
      if (locale !== 'en') {
        expect(translateText(source, locale), `${locale}: ${source}`).not.toBe(source);
      }
    }
  }
});

test('regional language tags resolve to their supported base locale', () => {
  expect(normalizeAppLocale('hu-HU')).toBe('hu');
  expect(normalizeAppLocale('es_MX')).toBe('es');
  expect(normalizeAppLocale('fr')).toBe('fr');
  expect(normalizeAppLocale('pt-BR')).toBe('en');
  expect(normalizeAppLocale(null)).toBe('en');
});

test('the first translated navigation and guide copy exists in all selected languages', () => {
  for (const locale of APP_LOCALES) {
    expect(translateText('COSMOS', locale)).not.toBe('');
    expect(translateText('NATAL CHART', locale)).not.toBe('');
    expect(translateText('A quick guide to Soul Compass', locale)).not.toBe('');
    expect(translateText('App language', locale)).not.toBe('');
    expect(translateText('Explore', locale)).not.toBe('');
  }
  expect(translateText('A quick guide to Soul Compass', 'hu')).not.toBe('A quick guide to Soul Compass');
  expect(translateText('A quick guide to Soul Compass', 'en')).toBe('A quick guide to Soul Compass');
});

test('Explore Life Directions labels and planned-feature copy are translated in all selected languages', () => {
  const exploreCopy = [
    'Life Directions',
    'Explore work styles, strengths, and interests that may feel natural to you.',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.',
  ];

  for (const locale of APP_LOCALES) {
    for (const source of exploreCopy) {
      expect(translateText(source, locale), `${locale}/${source}`).not.toBe('');
      if (locale !== 'en') {
        expect(translateText(source, locale), `${locale}/${source}`).not.toBe(source);
      }
    }
  }
});

test('daily sample reflection copy and every ritual have translations for all six other languages', () => {
  for (const locale of APP_LOCALES.filter((item) => item !== 'en')) {
    expect(translateText('Let one thing be enough today.', locale)).not.toBe(
      'Let one thing be enough today.',
    );
    expect(dailyRituals.every((ritual) => translateText(ritual, locale) !== ritual)).toBe(true);
  }
});

test('language selection and the first profile form are translated in every supported language', () => {
  const firstRunCopy = [
    'Choose your language',
    'Tap a language to continue',
    'A little about you.',
    'DATE OF BIRTH',
    'BIRTH TIME',
    'I don’t know my birth time',
    'Place of Birth',
    'Current Residence',
    'Search cities',
  ];

  for (const locale of APP_LOCALES.filter((item) => item !== 'en')) {
    for (const source of firstRunCopy) {
      expect(translateText(source, locale), `${locale}: ${source}`).not.toBe(source);
    }
  }
});

test('changing the saved language updates app text through the locale provider', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  profileState.preferences.language = 'en';
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(React.createElement(LocaleTree));
  });
  expect(renderer!.root.findAll((node) => String(node.type) === 'Text')[0].props.children)
    .toBe('Choose your language');

  profileState.preferences.language = 'ru';
  await act(async () => {
    renderer!.update(React.createElement(LocaleTree));
  });
  expect(renderer!.root.findAll((node) => String(node.type) === 'Text')[0].props.children)
    .toBe('Выбери язык');
  await act(async () => renderer?.unmount());
});
