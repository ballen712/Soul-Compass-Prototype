export type InputSelection = { start: number; end: number };

type FormatResult = { value: string; selection: InputSelection };

function formatGroupedDigits(
  raw: string,
  selection: InputSelection,
  groups: number[],
  separator: string,
  maxDigits: number,
  previousValue = '',
): FormatResult {
  let digits = raw.replace(/\D/g, '').slice(0, maxDigits);
  let separatorBackspace = false;
  if (
    previousValue.length > raw.length &&
    selection.start === selection.end &&
    previousValue[selection.start - 1] === separator
  ) {
    const digitIndex = previousValue.slice(0, selection.start - 1).replace(/\D/g, '').length - 1;
    if (digitIndex >= 0) {
      digits = `${digits.slice(0, digitIndex)}${digits.slice(digitIndex + 1)}`;
      separatorBackspace = true;
    }
  } else if (
    previousValue.length > raw.length &&
    selection.start === selection.end &&
    previousValue[selection.start] === separator
  ) {
    const digitIndex = previousValue.slice(0, selection.start + 1).replace(/\D/g, '').length;
    if (digitIndex < digits.length) {
      digits = `${digits.slice(0, digitIndex)}${digits.slice(digitIndex + 1)}`;
    }
  }
  const previousDigits = previousValue.replace(/\D/g, '');
  const digitsBeforeStart = previousValue.slice(0, selection.start).replace(/\D/g, '').length;
  const removedDigits = previousValue.slice(selection.start, selection.end).replace(/\D/g, '').length;
  const replacementDigits = Math.max(0, digits.length - (previousDigits.length - removedDigits));
  const caretDigits = Math.min(
    digits.length,
    separatorBackspace ? Math.max(0, digitsBeforeStart - 1) : digitsBeforeStart + replacementDigits,
  );
  let value = '';
  let groupEnd = groups[0];
  let groupIndex = 0;

  for (let index = 0; index < digits.length; index += 1) {
    value += digits[index];
    if (index + 1 === groupEnd && index + 1 < maxDigits) {
      value += separator;
      groupIndex += 1;
      groupEnd += groups[groupIndex] ?? maxDigits;
    }
  }

  const positionForDigits = (count: number) => {
    let position = Math.min(count, digits.length);
    let boundary = 0;
    for (const group of groups) {
      boundary += group;
      if (count >= boundary) position += separator.length;
    }
    return Math.min(position, value.length);
  };

  return {
    value,
    selection: {
      start: positionForDigits(caretDigits),
      end: positionForDigits(caretDigits),
    },
  };
}

export function formatBirthDateInput(raw: string, selection: InputSelection, previousValue = ''): FormatResult {
  return formatGroupedDigits(raw, selection, [4, 2], '-', 8, previousValue);
}

export function formatBirthTimeInput(raw: string, selection: InputSelection, previousValue = ''): FormatResult {
  return formatGroupedDigits(raw, selection, [2], ':', 4, previousValue);
}
