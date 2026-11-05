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
  guideDescription: string;
  themes: readonly string[];
  tone: StoneTone;
  image?: number;
  imageDescription?: string;
  specimenDescription: string;
};
import specimenBriefs from '../scripts/crystal-image-briefs.json';
import { crystalGuideCopy } from './crystal-guide-copy';

const meanings = {
  calm: {
    note: 'Stillness · perspective',
    themes: ['calm', 'rest', 'ease', 'reflection'],
    tone: 'violet',
    description: '{name} is a good fit when you want more calm, rest, and room to think.',
  },
  focus: {
    note: 'Focus · clarity',
    themes: ['focus', 'clarity', 'attention', 'structure'],
    tone: 'blue',
    description: '{name} is a good fit for clear thinking, steady attention, and sorting out your next step.',
  },
  grounding: {
    note: 'Steadiness · patience',
    themes: ['grounding', 'patience', 'balance', 'resilience'],
    tone: 'earth',
    description: '{name} is a good fit when you want to feel steady, patient, and balanced.',
  },
  connection: {
    note: 'Connection · care',
    themes: ['connection', 'communication', 'empathy', 'values'],
    tone: 'pink',
    description: '{name} is a good fit for care, empathy, and closer communication.',
  },
  courage: {
    note: 'Courage · self-trust',
    themes: ['courage', 'confidence', 'initiative', 'expression'],
    tone: 'red',
    description: '{name} is a good fit when you want to trust yourself and take a first step.',
  },
  curiosity: {
    note: 'Curiosity · change',
    themes: ['curiosity', 'change', 'learning', 'adaptability'],
    tone: 'green',
    description: '{name} is a good fit when you want to stay curious and adjust as plans change.',
  },
  creativity: {
    note: 'Imagination · expression',
    themes: ['creativity', 'imagination', 'expression', 'play'],
    tone: 'violet',
    description: '{name} is a good fit for imagination, self-expression, and playful ideas.',
  },
  renewal: {
    note: 'Renewal · possibility',
    themes: ['renewal', 'change', 'hope', 'adaptability'],
    tone: 'green',
    description: '{name} is a good fit when you want a fresh start or a new point of view.',
  },
  clarity: {
    note: 'Perspective · discernment',
    themes: ['clarity', 'perspective', 'learning', 'communication'],
    tone: 'clear',
    description: '{name} is a good fit for perspective, clear choices, and thoughtful communication.',
  },
  energy: {
    note: 'Vitality · initiative',
    themes: ['energy', 'initiative', 'confidence', 'courage'],
    tone: 'gold',
    description: '{name} is a good fit when you want more initiative and confidence to get started.',
  },
  boundaries: {
    note: 'Boundaries · resilience',
    themes: ['boundaries', 'resilience', 'grounding', 'self-trust'],
    tone: 'dark',
    description: '{name} is a good fit for resilience, steadiness, and protecting your time.',
  },
  joy: {
    note: 'Warmth · optimism',
    themes: ['joy', 'optimism', 'confidence', 'connection'],
    tone: 'gold',
    description: '{name} is a good fit when you want more warmth, optimism, and connection.',
  },
  intuition: {
    note: 'Reflection · inner listening',
    themes: ['reflection', 'intuition', 'calm', 'self-trust'],
    tone: 'blue',
    description: '{name} is a good fit for reflection, calm, and trusting your own judgment.',
  },
  change: {
    note: 'Change · new perspective',
    themes: ['change', 'adaptability', 'renewal', 'curiosity'],
    tone: 'green',
    description: '{name} is a good fit when you want flexibility and a fresh perspective.',
  },
  resilience: {
    note: 'Resilience · steadiness',
    themes: ['resilience', 'grounding', 'courage', 'self-trust'],
    tone: 'earth',
    description: '{name} is a good fit for steadiness, courage, and self-trust during a challenge.',
  },
  expression: {
    note: 'Expression · clear words',
    themes: ['expression', 'communication', 'creativity', 'clarity'],
    tone: 'blue',
    description: '{name} is a good fit when you want to express yourself clearly and creatively.',
  },
  balance: {
    note: 'Balance · perspective',
    themes: ['balance', 'perspective', 'connection', 'ease'],
    tone: 'green',
    description: '{name} is a good fit for seeing more than one side and making room for different needs.',
  },
  perspective: {
    note: 'Perspective · inner listening',
    themes: ['perspective', 'reflection', 'intuition', 'clarity'],
    tone: 'violet',
    description: '{name} is a good fit for inner listening, clear thinking, and considering another view.',
  },
  confidence: {
    note: 'Confidence · optimism',
    themes: ['confidence', 'optimism', 'courage', 'direction'],
    tone: 'gold',
    description: '{name} is a good fit when you want to act with optimism and trust your next step.',
  },
  growth: {
    note: 'Growth · possibility',
    themes: ['growth', 'renewal', 'curiosity', 'learning'],
    tone: 'green',
    description: '{name} is a good fit for learning, curiosity, and exploring new possibilities.',
  },
  patience: {
    note: 'Patience · steady effort',
    themes: ['patience', 'grounding', 'focus', 'resilience'],
    tone: 'earth',
    description: '{name} is a good fit when you want to slow down, stay grounded, and focus on steady progress.',
  },
} as const;

type MeaningKey = keyof typeof meanings;
type StoneEntry = readonly [name: string, meaning: MeaningKey];

// Names are drawn from common gem and mineral reference lists. Guide themes
// connect each stone with the qualities used in daily and chart-based picks.
// Name references:
// https://www.ganoksin.com/article/gemstone-name-reference-list/
// https://gem-a.com/gem-hub/different-types-of-chalcedony
// https://www.mineralminers.com/html/indxpolx.htm
const entries = [
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
] as const satisfies readonly StoneEntry[];
export type CrystalName = (typeof entries)[number][0];

const generatedImageSources: number[] = [
  require('../assets/crystals/amethyst.jpg'),
  require('../assets/crystals/moonstone.jpg'),
  require('../assets/crystals/labradorite.jpg'),
  require('../assets/crystals/rose-quartz.jpg'),
  require('../assets/crystals/clear-quartz.jpg'),
  require('../assets/crystals/smoky-quartz.jpg'),
  require('../assets/crystals/citrine.jpg'),
  require('../assets/crystals/black-tourmaline.jpg'),
  require('../assets/crystals/green-aventurine.jpg'),
  require('../assets/crystals/carnelian.jpg'),
  require('../assets/crystals/obsidian.jpg'),
  require('../assets/crystals/tiger-s-eye.jpg'),
  require('../assets/crystals/sodalite.jpg'),
  require('../assets/crystals/lapis-lazuli.jpg'),
  require('../assets/crystals/fluorite.jpg'),
  require('../assets/crystals/hematite.jpg'),
  require('../assets/crystals/red-jasper.jpg'),
  require('../assets/crystals/moss-agate.jpg'),
  require('../assets/crystals/blue-lace-agate.jpg'),
  require('../assets/crystals/botswana-agate.jpg'),
  require('../assets/crystals/crazy-lace-agate.jpg'),
  require('../assets/crystals/amazonite.jpg'),
  require('../assets/crystals/malachite.jpg'),
  require('../assets/crystals/rhodonite.jpg'),
  require('../assets/crystals/rhodochrosite.jpg'),
  require('../assets/crystals/pyrite.jpg'),
  require('../assets/crystals/garnet.jpg'),
  require('../assets/crystals/aquamarine.jpg'),
  require('../assets/crystals/peridot.jpg'),
  require('../assets/crystals/sunstone.jpg'),
  require('../assets/crystals/apatite.jpg'),
  require('../assets/crystals/kyanite.jpg'),
  require('../assets/crystals/lepidolite.jpg'),
  require('../assets/crystals/celestite.jpg'),
  require('../assets/crystals/selenite.jpg'),
  require('../assets/crystals/angelite.jpg'),
  require('../assets/crystals/howlite.jpg'),
  require('../assets/crystals/magnesite.jpg'),
  require('../assets/crystals/onyx.jpg'),
  require('../assets/crystals/bloodstone.jpg'),
  require('../assets/crystals/chrysoprase.jpg'),
  require('../assets/crystals/chalcedony.jpg'),
  require('../assets/crystals/chrysocolla.jpg'),
  require('../assets/crystals/unakite.jpg'),
  require('../assets/crystals/prehnite.jpg'),
  require('../assets/crystals/serpentine.jpg'),
  require('../assets/crystals/shungite.jpg'),
  require('../assets/crystals/dalmatian-jasper.jpg'),
  require('../assets/crystals/picture-jasper.jpg'),
  require('../assets/crystals/ocean-jasper.jpg'),
  require('../assets/crystals/red-tiger-s-eye.jpg'),
  require('../assets/crystals/blue-tiger-s-eye.jpg'),
  require('../assets/crystals/black-spinel.jpg'),
  require('../assets/crystals/iolite.jpg'),
  require('../assets/crystals/tanzanite.jpg'),
  require('../assets/crystals/kunzite.jpg'),
  require('../assets/crystals/morganite.jpg'),
  require('../assets/crystals/topaz.jpg'),
  require('../assets/crystals/blue-topaz.jpg'),
  require('../assets/crystals/ruby.jpg'),
  require('../assets/crystals/sapphire.jpg'),
  require('../assets/crystals/emerald.jpg'),
  require('../assets/crystals/chrysoberyl.jpg'),
  require('../assets/crystals/alexandrite.jpg'),
  require('../assets/crystals/opal.jpg'),
  require('../assets/crystals/black-opal.jpg'),
  require('../assets/crystals/fire-opal.jpg'),
  require('../assets/crystals/spinel.jpg'),
  require('../assets/crystals/zircon.jpg'),
  require('../assets/crystals/diamond.jpg'),
  require('../assets/crystals/jadeite.jpg'),
  require('../assets/crystals/nephrite.jpg'),
  require('../assets/crystals/larimar.jpg'),
  require('../assets/crystals/seraphinite.jpg'),
  require('../assets/crystals/nuummite.jpg'),
  require('../assets/crystals/hypersthene.jpg'),
  require('../assets/crystals/moldavite.jpg'),
  require('../assets/crystals/dioptase.jpg'),
  require('../assets/crystals/azurite.jpg'),
  require('../assets/crystals/epidote.jpg'),
  require('../assets/crystals/hessonite.jpg'),
  require('../assets/crystals/spessartine.jpg'),
  require('../assets/crystals/pyrope.jpg'),
  require('../assets/crystals/sardonyx.jpg'),
  require('../assets/crystals/dendritic-agate.jpg'),
  require('../assets/crystals/fire-agate.jpg'),
  require('../assets/crystals/tree-agate.jpg'),
  require('../assets/crystals/pink-tourmaline.jpg'),
  require('../assets/crystals/watermelon-tourmaline.jpg'),
  require('../assets/crystals/goshenite.jpg'),
  require('../assets/crystals/heliodor.jpg'),
  require('../assets/crystals/boulder-opal.jpg'),
  require('../assets/crystals/black-agate.jpg'),
];
const imageByName = Object.fromEntries(
  entries.map(([name], index) => [name, generatedImageSources[index]]),
);

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
    guideDescription: crystalGuideCopy[name],
    specimenDescription: specimenBriefs[name as keyof typeof specimenBriefs],
    themes: meaning.themes,
    tone: toneByName[name] ?? meaning.tone,
    ...(image !== undefined ? {
      image,
      imageDescription: `${name} mineral illustration, AI-generated`,
    } : {}),
  };
});

export const samplePrimaryCrystal =
  crystalCatalog.find((crystal) => crystal.name === 'Moonstone')!;

export const alternativeCrystals = crystalCatalog.filter(
  (crystal) => crystal.name !== samplePrimaryCrystal.name,
);

export const calculatedCrystalCatalog: Record<string, Crystal> =
  Object.fromEntries(crystalCatalog.map((crystal) => [crystal.name, crystal]));
