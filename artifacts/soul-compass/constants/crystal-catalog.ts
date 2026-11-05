export type StoneTone =
  | 'violet'
  | 'blue'
  | 'green'
  | 'pink'
  | 'red'
  | 'gold'
  | 'clear'
  | 'earth'
  | 'dark';

export type Crystal = {
  name: string;
  note: string;
  description: string;
  themes: readonly string[];
  tone: StoneTone;
  image?: number;
  imageDescription?: string;
};

const meanings = {
  calm: {
    note: 'Stillness · perspective',
    themes: ['calm', 'rest', 'ease', 'reflection'],
    tone: 'violet',
    description: 'Often linked with {note}, {name} can be a reminder to slow down and notice what you need.',
  },
  focus: {
    note: 'Focus · clarity',
    themes: ['focus', 'clarity', 'attention', 'structure'],
    tone: 'blue',
    description: 'In crystal traditions, {name} is associated with {note}. Use it as a cue to give one thing your attention.',
  },
  grounding: {
    note: 'Steadiness · patience',
    themes: ['grounding', 'patience', 'balance', 'resilience'],
    tone: 'earth',
    description: 'Many people choose {name} as a symbol of {note}. Let it remind you to take the next step at your own pace.',
  },
  connection: {
    note: 'Connection · care',
    themes: ['connection', 'communication', 'empathy', 'values'],
    tone: 'pink',
    description: 'Traditionally associated with {note}, {name} can prompt a moment of care for yourself or someone else.',
  },
  courage: {
    note: 'Courage · self-trust',
    themes: ['courage', 'confidence', 'initiative', 'expression'],
    tone: 'red',
    description: '{name} is often used as a symbol of {note}. Keep it as a small prompt to meet one thing honestly.',
  },
  curiosity: {
    note: 'Curiosity · change',
    themes: ['curiosity', 'change', 'learning', 'adaptability'],
    tone: 'green',
    description: 'Crystal guides often connect {name} with {note}. It can be a reminder to stay open when plans shift.',
  },
  creativity: {
    note: 'Imagination · expression',
    themes: ['creativity', 'imagination', 'expression', 'play'],
    tone: 'violet',
    description: 'Linked in traditional symbolism with {note}, {name} can invite you to make room for a fresh idea.',
  },
  renewal: {
    note: 'Renewal · possibility',
    themes: ['renewal', 'change', 'hope', 'adaptability'],
    tone: 'green',
    description: '{name} is traditionally connected with {note}. Treat that meaning as an invitation, not a prediction.',
  },
  clarity: {
    note: 'Perspective · discernment',
    themes: ['clarity', 'perspective', 'learning', 'communication'],
    tone: 'clear',
    description: 'Often chosen for its links with {note}, {name} can be a cue to pause and look at a situation from another angle.',
  },
  energy: {
    note: 'Vitality · initiative',
    themes: ['energy', 'initiative', 'confidence', 'courage'],
    tone: 'gold',
    description: 'In crystal traditions, {name} represents {note}. Use it as a prompt to choose where your effort matters most.',
  },
  boundaries: {
    note: 'Boundaries · resilience',
    themes: ['boundaries', 'resilience', 'grounding', 'self-trust'],
    tone: 'dark',
    description: 'Many crystal guides associate {name} with {note}. Let it remind you that a pause or a clear limit is a choice.',
  },
  joy: {
    note: 'Warmth · optimism',
    themes: ['joy', 'optimism', 'confidence', 'connection'],
    tone: 'gold',
    description: 'Traditionally linked with {note}, {name} can be a small reminder to notice what brings a little brightness.',
  },
  intuition: {
    note: 'Reflection · inner listening',
    themes: ['reflection', 'intuition', 'calm', 'self-trust'],
    tone: 'blue',
    description: '{name} is often chosen as a symbol of {note}. Use it as a prompt to listen before you rush to answer.',
  },
  change: {
    note: 'Change · new perspective',
    themes: ['change', 'adaptability', 'renewal', 'curiosity'],
    tone: 'green',
    description: 'Crystal guides often connect {name} with {note}. It can be a reminder to meet an unfamiliar moment with curiosity.',
  },
  resilience: {
    note: 'Resilience · steadiness',
    themes: ['resilience', 'grounding', 'courage', 'self-trust'],
    tone: 'earth',
    description: 'Traditionally linked with {note}, {name} can remind you that progress can be quiet and gradual.',
  },
  expression: {
    note: 'Expression · clear words',
    themes: ['expression', 'communication', 'creativity', 'clarity'],
    tone: 'blue',
    description: 'Many people associate {name} with {note}. Use it as a cue to say what you mean with care.',
  },
  balance: {
    note: 'Balance · perspective',
    themes: ['balance', 'perspective', 'connection', 'ease'],
    tone: 'green',
    description: 'In traditional crystal symbolism, {name} represents {note}. Let it be a prompt to make room for more than one need.',
  },
  perspective: {
    note: 'Perspective · inner listening',
    themes: ['perspective', 'reflection', 'intuition', 'clarity'],
    tone: 'violet',
    description: '{name} is often chosen for its link with {note}. Pause and ask what else might be true.',
  },
  confidence: {
    note: 'Confidence · optimism',
    themes: ['confidence', 'optimism', 'courage', 'direction'],
    tone: 'gold',
    description: 'Traditionally associated with {note}, {name} can be a small reminder to trust your next considered step.',
  },
  growth: {
    note: 'Growth · possibility',
    themes: ['growth', 'renewal', 'curiosity', 'learning'],
    tone: 'green',
    description: 'Crystal traditions connect {name} with {note}. Let it invite a question about what you would like to learn next.',
  },
  patience: {
    note: 'Patience · steady effort',
    themes: ['patience', 'grounding', 'focus', 'resilience'],
    tone: 'earth',
    description: 'Often used as a symbol of {note}, {name} can remind you that not every answer needs to arrive today.',
  },
} as const;

type MeaningKey = keyof typeof meanings;
type StoneEntry = readonly [name: string, meaning: MeaningKey];

// Names are drawn from common gem and mineral reference lists; meanings are
// presented only as traditional symbols for reflection, not as proven effects.
// Name references:
// https://www.ganoksin.com/article/gemstone-name-reference-list/
// https://gem-a.com/gem-hub/different-types-of-chalcedony
// https://www.mineralminers.com/html/indxpolx.htm
const entries: readonly StoneEntry[] = [
  ['Amethyst', 'calm'],
  ['Moonstone', 'intuition'],
  ['Labradorite', 'curiosity'],
  ['Rose Quartz', 'connection'],
  ['Clear Quartz', 'clarity'],
  ['Smoky Quartz', 'grounding'],
  ['Citrine', 'joy'],
  ['Black Tourmaline', 'boundaries'],
  ['Green Aventurine', 'renewal'],
  ['Carnelian', 'energy'],
  ['Obsidian', 'boundaries'],
  ["Tiger's Eye", 'courage'],
  ['Sodalite', 'focus'],
  ['Lapis Lazuli', 'clarity'],
  ['Fluorite', 'focus'],
  ['Hematite', 'grounding'],
  ['Red Jasper', 'grounding'],
  ['Moss Agate', 'renewal'],
  ['Blue Lace Agate', 'calm'],
  ['Botswana Agate', 'grounding'],
  ['Crazy Lace Agate', 'joy'],
  ['Amazonite', 'boundaries'],
  ['Malachite', 'change'],
  ['Rhodonite', 'connection'],
  ['Rhodochrosite', 'connection'],
  ['Pyrite', 'energy'],
  ['Garnet', 'courage'],
  ['Aquamarine', 'calm'],
  ['Peridot', 'renewal'],
  ['Sunstone', 'joy'],
  ['Apatite', 'curiosity'],
  ['Kyanite', 'clarity'],
  ['Lepidolite', 'calm'],
  ['Celestite', 'calm'],
  ['Selenite', 'clarity'],
  ['Angelite', 'connection'],
  ['Howlite', 'calm'],
  ['Magnesite', 'grounding'],
  ['Onyx', 'boundaries'],
  ['Bloodstone', 'resilience'],
  ['Chrysoprase', 'renewal'],
  ['Chalcedony', 'connection'],
  ['Chrysocolla', 'expression'],
  ['Unakite', 'balance'],
  ['Prehnite', 'intuition'],
  ['Serpentine', 'renewal'],
  ['Shungite', 'grounding'],
  ['Dalmatian Jasper', 'joy'],
  ['Picture Jasper', 'grounding'],
  ['Ocean Jasper', 'balance'],
  ["Red Tiger's Eye", 'courage'],
  ["Blue Tiger's Eye", 'focus'],
  ['Black Spinel', 'resilience'],
  ['Iolite', 'perspective'],
  ['Tanzanite', 'intuition'],
  ['Kunzite', 'connection'],
  ['Morganite', 'connection'],
  ['Topaz', 'confidence'],
  ['Blue Topaz', 'expression'],
  ['Ruby', 'energy'],
  ['Sapphire', 'focus'],
  ['Emerald', 'renewal'],
  ['Chrysoberyl', 'courage'],
  ['Alexandrite', 'change'],
  ['Opal', 'creativity'],
  ['Black Opal', 'creativity'],
  ['Fire Opal', 'energy'],
  ['Spinel', 'resilience'],
  ['Zircon', 'clarity'],
  ['Diamond', 'focus'],
  ['Jadeite', 'balance'],
  ['Nephrite', 'grounding'],
  ['Larimar', 'calm'],
  ['Seraphinite', 'intuition'],
  ['Nuummite', 'intuition'],
  ['Hypersthene', 'intuition'],
  ['Moldavite', 'change'],
  ['Dioptase', 'renewal'],
  ['Azurite', 'clarity'],
  ['Epidote', 'growth'],
  ['Hessonite', 'courage'],
  ['Spessartine', 'energy'],
  ['Pyrope', 'courage'],
  ['Sardonyx', 'boundaries'],
  ['Dendritic Agate', 'patience'],
  ['Fire Agate', 'courage'],
  ['Tree Agate', 'grounding'],
  ['Pink Tourmaline', 'connection'],
  ['Watermelon Tourmaline', 'balance'],
  ['Goshenite', 'clarity'],
  ['Heliodor', 'joy'],
  ['Boulder Opal', 'creativity'],
  ['Black Agate', 'boundaries'],
];

const imageByName: Record<string, number> = {
  Moonstone: require('../assets/images/moonstone.png'),
  Amethyst: require('../assets/images/amethyst.png'),
  Labradorite: require('../assets/images/labradorite.png'),
};

const imageDescriptionByName: Record<string, string> = {
  Moonstone: 'Moonstone resting on warm ivory linen',
  Amethyst: 'Violet amethyst crystal cluster on pale stone',
  Labradorite: 'Labradorite stone with blue-green iridescence',
};

const toneByName: Partial<Record<string, StoneTone>> = {
  Carnelian: 'red',
  "Tiger's Eye": 'gold',
  'Lapis Lazuli': 'blue',
  Hematite: 'dark',
  'Red Jasper': 'red',
  'Blue Lace Agate': 'blue',
  Garnet: 'red',
  Aquamarine: 'blue',
  Apatite: 'blue',
  Kyanite: 'blue',
  Celestite: 'blue',
  Selenite: 'clear',
  Angelite: 'blue',
  Howlite: 'clear',
  Magnesite: 'clear',
  Bloodstone: 'green',
  Chalcedony: 'blue',
  Prehnite: 'green',
  Shungite: 'dark',
  'Dalmatian Jasper': 'earth',
  'Black Spinel': 'dark',
  Ruby: 'red',
  Sapphire: 'blue',
  Chrysoberyl: 'gold',
  'Black Opal': 'dark',
  'Fire Opal': 'red',
  Spinel: 'red',
  Diamond: 'clear',
  Nephrite: 'green',
  Larimar: 'blue',
  Seraphinite: 'green',
  Nuummite: 'dark',
  Hypersthene: 'dark',
  Azurite: 'blue',
  Hessonite: 'gold',
  Spessartine: 'red',
  Pyrope: 'red',
  'Tree Agate': 'green',
  'Boulder Opal': 'earth',
};

export const crystalCatalog: Crystal[] = entries.map(([name, key]) => {
  const meaning = meanings[key];
  const image = imageByName[name];
  return {
    name,
    note: meaning.note,
    description: meaning.description
      .replaceAll('{name}', name)
      .replaceAll('{note}', meaning.note.toLowerCase()),
    themes: meaning.themes,
    tone: toneByName[name] ?? meaning.tone,
    ...(image !== undefined ? { image, imageDescription: imageDescriptionByName[name] } : {}),
  };
});

export const samplePrimaryCrystal =
  crystalCatalog.find((crystal) => crystal.name === 'Moonstone')!;

export const alternativeCrystals = crystalCatalog.filter(
  (crystal) => crystal.name !== samplePrimaryCrystal.name,
);

export const calculatedCrystalCatalog: Record<string, Crystal> =
  Object.fromEntries(crystalCatalog.map((crystal) => [crystal.name, crystal]));
