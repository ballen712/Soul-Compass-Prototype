export const dailyReading = {
  label: 'SAMPLE REFLECTION',
  title: 'Focus on one thing at a time.',
  body:
    'You do not have to solve everything today. Give one conversation, task, or feeling your attention, and come back to the rest later.',
  favorableFocus: 'Choose one thing that matters and give it your full attention.',
  gentleCaution: 'Try not to rush yourself into answering every open question.',
  reflection: 'What deserves my attention without being rushed?',
  status: 'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.',
};

export type Crystal = {
  name: string;
  note: string;
  description: string;
  image: number;
  imageDescription: string;
};

export const samplePrimaryCrystal: Crystal = {
  name: 'Moonstone',
  note: 'Intuition · inner steadiness',
  description: 'A gentle reminder to pause, notice what you need, and choose what to do next.',
  image: require('../assets/images/moonstone.png'),
  imageDescription: 'Moonstone resting on warm ivory linen',
};

export const alternativeCrystals: Crystal[] = [
  {
    name: 'Amethyst',
    note: 'Stillness · perspective',
    description: 'A reminder to slow down, clear some space, and give one thing your attention.',
    image: require('../assets/images/amethyst.png'),
    imageDescription: 'Violet amethyst crystal cluster on pale stone',
  },
  {
    name: 'Labradorite',
    note: 'Curiosity · change',
    description: 'A reminder to stay curious when plans change or something feels unfamiliar.',
    image: require('../assets/images/labradorite.png'),
    imageDescription: 'Labradorite stone with blue-green iridescence',
  },
];

export const calculatedCrystalCatalog: Record<string, Crystal> = {
  Moonstone: samplePrimaryCrystal,
  Amethyst: alternativeCrystals[0],
  Labradorite: alternativeCrystals[1],
};
