import { describe, expect, test } from 'vitest';
import { formatBirthDateInput, formatBirthTimeInput } from '../components/birth-input-format';

describe('birth detail input formatting', () => {
  test('formats digits-only date entry and paste as YYYY-MM-DD', () => {
    expect(formatBirthDateInput('19910620', { start: 8, end: 8 })).toEqual({
      value: '1991-06-20',
      selection: { start: 10, end: 10 },
    });
    expect(formatBirthDateInput('1991-06-20', { start: 10, end: 10 }, '')).toEqual({
      value: '1991-06-20',
      selection: { start: 10, end: 10 },
    });
  });

  test('keeps a digit cursor in place when editing the middle of a date', () => {
    expect(formatBirthDateInput('1991-96-20', { start: 5, end: 6 }, '1991-06-20')).toEqual({
      value: '1991-96-20',
      selection: { start: 6, end: 6 },
    });
  });

  test('backspace across an inserted separator removes the adjacent digit', () => {
    const date = formatBirthDateInput('199106-20', { start: 5, end: 5 }, '1991-06-20');
    const time = formatBirthTimeInput('1951', { start: 3, end: 3 }, '19:51');
    expect(date.value.replace(/\D/g, '')).toHaveLength(7);
    expect(date.selection.start).toBe(3);
    expect(time.value.replace(/\D/g, '')).toHaveLength(3);
    expect(time.selection.start).toBe(1);
  });

  test('formats four birth-time digits and caps extra pasted digits', () => {
    expect(formatBirthTimeInput('1951', { start: 4, end: 4 })).toEqual({
      value: '19:51',
      selection: { start: 5, end: 5 },
    });
    expect(formatBirthTimeInput('195199', { start: 6, end: 6 })).toEqual({
      value: '19:51',
      selection: { start: 5, end: 5 },
    });
  });
});
