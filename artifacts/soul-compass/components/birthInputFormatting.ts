export type BirthInputKind = 'date' | 'time';
export type InputSelection = { start: number; end: number };

export function formatBirthDigits(value: string, kind: BirthInputKind): string {
  const maxDigits = kind === 'date' ? 8 : 4;
  const digits = value.replace(/\D/g, '').slice(0, maxDigits);

  if (kind === 'date') {
    return `${digits.slice(0, 4)}${digits.length >= 4 ? '-' : ''}${
      digits.length > 4 ? digits.slice(4, 6) : ''
    }${digits.length >= 6 ? '-' : ''}${digits.length > 6 ? digits.slice(6, 8) : ''}`;
  }
  return `${digits.slice(0, 2)}${digits.length >= 2 ? ':' : ''}${digits.slice(2, 4)}`;
}

function selectionAfterDigits(value: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seen += 1;
      if (seen === digitCount) {
        // Keep the caret after an automatically inserted separator so the
        // next typed digit naturally enters the next date/time group.
        return value[index + 1] === '-' || value[index + 1] === ':'
          ? index + 2
          : index + 1;
      }
    }
  }
  return value.length;
}

export function formatBirthInputChange(
  previousValue: string,
  nextValue: string,
  previousSelection: InputSelection,
  kind: BirthInputKind,
): { value: string; selection: InputSelection } {
  let text = nextValue;
  const start = Math.max(0, Math.min(previousSelection.start, previousValue.length));
  const end = Math.max(start, Math.min(previousSelection.end, previousValue.length));
  const separator = kind === 'date' ? '-' : ':';
  const deletedSeparatorIndex = start === end
    ? (previousValue[start - 1] === separator &&
      `${previousValue.slice(0, start - 1)}${previousValue.slice(start)}` === nextValue
        ? start - 1
        : previousValue[start] === separator &&
          `${previousValue.slice(0, start)}${previousValue.slice(start + 1)}` === nextValue
          ? start
          : -1)
    : -1;

  // Backspacing or forward-deleting an automatically inserted separator
  // also removes the adjacent digit, rather than making the separator reappear
  // and leaving the user unable to edit through it.
  let caret = start + (nextValue.length - previousValue.length) + (end - start);
  if (deletedSeparatorIndex >= 0) {
    const backwards = deletedSeparatorIndex < start;
    const digitIndex = backwards
      ? (() => {
          const match = /\d(?=\D*$)/.exec(text.slice(0, deletedSeparatorIndex));
          return match?.index ?? -1;
        })()
      : (() => {
          const index = text.slice(deletedSeparatorIndex).search(/\d/);
          return index < 0 ? -1 : deletedSeparatorIndex + index;
        })();
    if (digitIndex >= 0) {
      text = `${text.slice(0, digitIndex)}${text.slice(digitIndex + 1)}`;
      caret = digitIndex;
    }
  }

  const rawCaret = Math.max(0, Math.min(caret, text.length));
  const digitsBeforeCaret = text.slice(0, rawCaret).replace(/\D/g, '').length;
  const value = formatBirthDigits(text, kind);
  const position = selectionAfterDigits(
    value,
    Math.min(digitsBeforeCaret, kind === 'date' ? 8 : 4),
  );
  return { value, selection: { start: position, end: position } };
}
