// Original prompts based on everyday attention practices, not copied exercises.
// Background reading:
// https://www.keepingwellnwl.nhs.uk/self-help-resources/mindfulness-and-relaxation
// https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/
export const dailyRituals = [
  'Before your next task, take three easy breaths and let your shoulders drop.',
  'Write down one thing you want to give your attention today.',
  'Step outside and notice one detail in the sky, air, or sounds around you.',
  'Stretch your hands and shoulders before moving to the next task.',
  'Drink a few sips of water without looking at a screen.',
  'Name the feeling you brought into this moment, without trying to fix it.',
  'Choose one small task you can finish in ten minutes.',
  'Notice five things you can see, then return to what you were doing.',
  'Send a short note to someone whose company you value.',
  'Put one object back where it belongs, and let that be enough tidying.',
  'Pause before opening your next app and ask what you came to do.',
  'Take a short walk and notice how your feet meet the ground.',
  'Make a warm drink and pay attention to its scent and temperature.',
  'Write one sentence about something that went a little better than expected.',
  'Look away from your screen and let your eyes rest on something far away.',
  'Before replying, read the message once more and choose the tone you want.',
  'Pick one thing to leave unfinished for now, on purpose.',
  'Open a window and notice what the air feels like.',
  'Put on a song and listen to one part you usually miss.',
  'Take a moment to unclench your jaw and soften your hands.',
  'Write down a question you are carrying; you do not need to answer it yet.',
  'Make space on one small surface, then stop when that spot is clear.',
  'Notice one color, shape, or texture you have not paid attention to today.',
  'At the start of a conversation, give the other person your full attention.',
  'Choose a simple intention for the next hour, such as patience or curiosity.',
  'Stand up, roll your shoulders, and take a comfortable stretch.',
  'Before a meal, take a moment to notice its color and smell.',
  'Write down one thing you can ask for help with.',
  'Take a quiet minute between two parts of your day instead of rushing through.',
  'Notice what is already done before adding another task to your list.',
  'Put your phone out of reach for five minutes while you do one thing.',
  'End one task by naming the next step, then give yourself a short pause.',
] as const;

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledDeck(seed: number): string[] {
  const random = mulberry32(seed);
  const shuffled = [...dailyRituals];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function getDailyRituals(date: Date, count = 4): string[] {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  const choicesPerDay = 4;
  const daysPerDeck = Math.floor(dailyRituals.length / choicesPerDay);
  const cycle = Math.floor(dayNumber / daysPerDeck);
  const dayWithinCycle = ((dayNumber % daysPerDeck) + daysPerDeck) % daysPerDeck;
  const deck = shuffledDeck(cycle);

  // Keep the new cycle's first choices out of the previous day's final block.
  // Swaps never touch the final block, so the boundary rule remains predictable.
  const previousFinal = new Set(shuffledDeck(cycle - 1).slice(-choicesPerDay));
  for (let index = 0; index < choicesPerDay; index += 1) {
    if (!previousFinal.has(deck[index])) continue;
    const swapIndex = deck.findIndex((ritual, candidate) =>
      candidate >= choicesPerDay &&
      candidate < deck.length - choicesPerDay &&
      !previousFinal.has(ritual),
    );
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  const start = dayWithinCycle * choicesPerDay;
  return deck.slice(start, start + Math.max(0, Math.min(count, choicesPerDay)));
}
