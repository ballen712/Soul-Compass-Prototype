export const dailyReading = {
  label: 'SAMPLE REFLECTION',
  title: 'A quieter kind of clarity.',
  body:
    'You do not need to answer every open question at once. Choose the one conversation, task, or feeling that deserves your full attention, and let the rest wait.',
  reflection: 'What deserves my attention without being rushed?',
  status: 'A sample reflection. Review your saved details in Settings for personal daily guidance.',
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
  description: 'A symbolic prompt to pause, notice what you need, and choose a response with care.',
  image: require('../assets/images/moonstone.png'),
  imageDescription: 'Moonstone resting on warm ivory linen',
};

export const alternativeCrystals: Crystal[] = [
  {
    name: 'Amethyst',
    note: 'Stillness · perspective',
    description: 'A symbolic reminder to make room for stillness, perspective, and thoughtful attention.',
    image: require('../assets/images/amethyst.png'),
    imageDescription: 'Violet amethyst crystal cluster on pale stone',
  },
  {
    name: 'Labradorite',
    note: 'Curiosity · change',
    description: 'A symbolic prompt to meet change with curiosity and openness to new possibilities.',
    image: require('../assets/images/labradorite.png'),
    imageDescription: 'Labradorite stone with blue-green iridescence',
  },
];

export const calculatedCrystalCatalog: Record<string, Crystal> = {
  Moonstone: samplePrimaryCrystal,
  Amethyst: alternativeCrystals[0],
  Labradorite: alternativeCrystals[1],
};
