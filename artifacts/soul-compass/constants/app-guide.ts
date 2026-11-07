export const APP_GUIDE_SEEN_KEY = 'soul-compass.app-guide.seen.v1';

export const APP_GUIDE_INTRO =
  'The idea for Soul Compass grew from my own exploration of astrology, crystals, meditation, Tarot, and psychology. I wanted to bring these interests together in a simple place for self-reflection, with daily reflections, a crystal guide, and a birth chart. Take what feels useful and leave the rest.';

export const APP_GUIDE_TABS = [
  {
    title: 'Cosmos',
    description: 'A short daily reflection with a focus and a question.',
    settingsDescription: 'A daily horoscope-style reflection: one theme for the day, something to focus on, something you can leave for later, and a question to think about.',
  },
  {
    title: 'Crystals',
    description: "See today's stone suggestions, browse stones, and track your collection.",
  },
  {
    title: 'Natal Chart',
    description: 'Explore your birth chart in plain language and learn more about yourself.',
    settingsDescription: 'Explore your birth chart in plain language and see how its themes may relate to your life.',
  },
  {
    title: 'Explore',
    description: 'Tarot reflections, longer-term transits, and Life Directions are planned for this space.',
    settingsDescription: 'This space is for optional paid experiences to explore yourself further. New features are still in development; any price will be shown before you choose to buy.',
  },
] as const;
