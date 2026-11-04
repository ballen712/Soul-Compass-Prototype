export const dailyReading = {
  label: 'SAMPLE HOROSCOPE · PROTOTYPE',
  title: 'A quieter kind of clarity.',
  body:
    'You do not need to answer every open question at once. Choose the one conversation, task, or feeling that deserves your full attention, and let the rest wait.',
  reflection: 'What deserves my attention without being rushed?',
  focus: 'Steady focus',
};

export type Crystal = {
  name: string;
  note: string;
  description: string;
  image: number;
  imageDescription: string;
};

export const primaryCrystal: Crystal = {
  name: 'Moonstone',
  note: 'Intuition · inner steadiness',
  description:
    'With its soft, pearly glow, moonstone is often associated with reflection and new beginnings. Let it be a small reminder to listen inward before you move forward.',
  image: require('../assets/images/moonstone.png'),
  imageDescription: 'Moonstone resting on warm ivory linen',
};

export const alternativeCrystals: Crystal[] = [
  {
    name: 'Amethyst',
    note: 'Stillness · perspective',
    description:
      'A violet quartz cluster often chosen as a reminder to pause and make space for a wider view.',
    image: require('../assets/images/amethyst.png'),
    imageDescription: 'Violet amethyst crystal cluster on pale stone',
  },
  {
    name: 'Labradorite',
    note: 'Curiosity · change',
    description:
      'A dark stone with flashes of color, associated with curiosity and the possibility in a new chapter.',
    image: require('../assets/images/labradorite.png'),
    imageDescription: 'Labradorite stone with blue-green iridescence',
  },
];
