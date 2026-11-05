import { formatBirthDateInput, formatBirthTimeInput } from './birth-input-format';

export type BirthInputKind = 'date' | 'time';
export type InputSelection = { start: number; end: number };

export function formatBirthDigits(value: string, kind: BirthInputKind): string {
  const selection = { start: value.length, end: value.length };
  return (kind === 'date'
    ? formatBirthDateInput(value, selection)
    : formatBirthTimeInput(value, selection)
  ).value;
}

export function formatBirthInputChange(
  previousValue: string,
  nextValue: string,
  previousSelection: InputSelection,
  kind: BirthInputKind,
): { value: string; selection: InputSelection } {
  return kind === 'date'
    ? formatBirthDateInput(nextValue, previousSelection, previousValue)
    : formatBirthTimeInput(nextValue, previousSelection, previousValue);
}
