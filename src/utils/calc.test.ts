import { describe, it, expect } from 'vitest';
import { parseTime, formatTime, paceStr } from './calc';

// ---------------------------------------------------------------------------
// parseTime
// ---------------------------------------------------------------------------
describe('parseTime', () => {
  // Empty / whitespace
  it('returns 0 for empty string', () => expect(parseTime('')).toBe(0));
  it('returns 0 for whitespace only', () => expect(parseTime('   ')).toBe(0));

  // mm:ss format
  it('parses "1:30" as 90 seconds', () => expect(parseTime('1:30')).toBe(90));
  it('parses "0:05" as 5 seconds', () => expect(parseTime('0:05')).toBe(5));
  it('parses "45:00" as 2700 seconds', () => expect(parseTime('45:00')).toBe(2700));

  // h:mm:ss format
  it('parses "1:30:00" as 5400 seconds', () => expect(parseTime('1:30:00')).toBe(5400));
  it('parses "0:00:42" as 42 seconds', () => expect(parseTime('0:00:42')).toBe(42));
  it('parses "11:03:42" as 39822 seconds', () => expect(parseTime('11:03:42')).toBe(39822));

  // Dot-separated: m.ss
  it('parses "1.30" as 90 seconds (dot = mm.ss)', () => expect(parseTime('1.30')).toBe(90));
  it('parses "6.55" as 415 seconds', () => expect(parseTime('6.55')).toBe(415));

  // Comma-separated: m,ss
  it('parses "1,30" as 90 seconds (comma = mm,ss)', () => expect(parseTime('1,30')).toBe(90));
  it('parses "6,55" as 415 seconds', () => expect(parseTime('6,55')).toBe(415));

  // Dot/comma h.mm.ss
  it('parses "1.30.00" as 5400 seconds', () => expect(parseTime('1.30.00')).toBe(5400));
  it('parses "1,30,00" as 5400 seconds', () => expect(parseTime('1,30,00')).toBe(5400));

  // Raw numbers: mask input
  it('parses "655" as 415 seconds (6:55)', () => expect(parseTime('655')).toBe(415));
  it('parses "130" as 90 seconds (1:30)', () => expect(parseTime('130')).toBe(90));
  it('parses "13000" as 7800 seconds (130:00 = 2h10m)', () =>
    expect(parseTime('13000')).toBe(7800));
  it('parses "110342" (6 digits, >= 100000) as 11:03:42', () =>
    expect(parseTime('110342')).toBe(11 * 3600 + 3 * 60 + 42));

  // Bare seconds (< 100)
  it('parses "42" as 42 bare seconds', () => expect(parseTime('42')).toBe(42));
  it('parses "5" as 5 bare seconds', () => expect(parseTime('5')).toBe(5));
  it('parses "0" as 0 seconds', () => expect(parseTime('0')).toBe(0));

  // Large numbers (>= 100000)
  it('parses "100000" as 36000 seconds (10:00:00)', () => expect(parseTime('100000')).toBe(36000));
  it('parses "100001" as 36001 seconds', () =>
    expect(parseTime('100001')).toBe(10 * 3600 + 0 * 60 + 1));

  // Edge: colon with 4+ parts
  it('returns 0 for "1:2:3:4" (too many parts)', () => expect(parseTime('1:2:3:4')).toBe(0));
  it('returns 0 for "1.2.3.4" (too many dot parts)', () => expect(parseTime('1.2.3.4')).toBe(0));

  // Numeric NaN parts
  it('returns 0 for ":" (empty parts)', () => expect(parseTime(':')).toBe(0));
  it('returns 0 for "a:bb" (non-numeric)', () => expect(isNaN(parseTime('a:bb'))).toBe(true));

  // Boundary: raw "99" is bare seconds (< 100)
  it('parses "99" as 99 bare seconds', () => expect(parseTime('99')).toBe(99));
  it('parses "100" as 60 seconds (1:00)', () => expect(parseTime('100')).toBe(60));

  // Dot with zero minutes: "0.30" → 30 seconds
  it('parses "0.30" as 30 seconds (0 min 30 sec)', () => expect(parseTime('0.30')).toBe(30));

  // Comma with zero minutes: "0,05" → 5 seconds
  it('parses "0,05" as 5 seconds', () => expect(parseTime('0,05')).toBe(5));

  // Leading/trailing whitespace in formatted input
  it('parses " 1:30 " (with spaces) as 90 seconds', () => expect(parseTime(' 1:30 ')).toBe(90));
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('formats 0 seconds as "0:00:00"', () => expect(formatTime(0)).toBe('0:00:00'));
  it('formats negative as "0:00:00"', () => expect(formatTime(-5)).toBe('0:00:00'));
  it('formats NaN as "0:00:00"', () => expect(formatTime(NaN)).toBe('0:00:00'));

  it('formats 42 seconds as "0:00:42"', () => expect(formatTime(42)).toBe('0:00:42'));
  it('formats 90 seconds as "0:01:30"', () => expect(formatTime(90)).toBe('0:01:30'));
  it('formats 3600 seconds as "1:00:00"', () => expect(formatTime(3600)).toBe('1:00:00'));
  it('formats 5400 seconds as "1:30:00"', () => expect(formatTime(5400)).toBe('1:30:00'));
  it('formats 39822 seconds as "11:03:42"', () => expect(formatTime(39822)).toBe('11:03:42'));
  it('formats 3661 seconds as "1:01:01"', () => expect(formatTime(3661)).toBe('1:01:01'));

  // Fractional seconds are truncated
  it('truncates fractional: 90.9 → "0:01:30"', () => expect(formatTime(90.9)).toBe('0:01:30'));
  it('truncates fractional: 0.5 → "0:00:00"', () => expect(formatTime(0.5)).toBe('0:00:00'));

  // Large hours
  it('formats 24 hours as "24:00:00"', () => expect(formatTime(86400)).toBe('24:00:00'));
});

// ---------------------------------------------------------------------------
// paceStr
// ---------------------------------------------------------------------------
describe('paceStr', () => {
  // Guard clauses
  it('returns empty for 0 seconds', () => expect(paceStr(0, 10)).toBe(''));
  it('returns empty for negative seconds', () => expect(paceStr(-5, 10)).toBe(''));
  it('returns empty for 0 units', () => expect(paceStr(100, 0)).toBe(''));
  it('returns empty for negative units', () => expect(paceStr(100, -1)).toBe(''));

  // Swim pace: 1500m in 25 min → time=1500s, units=15 (100m)
  // pace per 100m = 1500/15 = 100s → "01:40"
  it('calculates swim pace 1500m / 25min → 01:40/100m', () => {
    // 25 min = 1500s, units = 1500/100 = 15
    expect(paceStr(1500, 15)).toBe('01:40');
  });

  // Run pace: 42.2 km in 3h30m → time=12600s, units=42.2
  // pace per km = 12600/42.2 ≈ 298.6s → "04:58"
  it('calculates marathon pace ~4:58/km', () => {
    const result = paceStr(12600, 42.2);
    // 12600/42.2 = 298.578... → 4m 58s
    expect(result).toBe('04:58');
  });

  // Simple: 60 seconds / 1 unit = 1:00 per unit
  it('60s / 1 unit → 01:00', () => expect(paceStr(60, 1)).toBe('01:00'));
  it('120s / 2 units → 01:00', () => expect(paceStr(120, 2)).toBe('01:00'));
  it('30s / 1 unit → 00:30', () => expect(paceStr(30, 1)).toBe('00:30'));

  // High pace: 300s / 10 units = 30s/unit → "00:30"
  it('300s / 10 units → 00:30', () => expect(paceStr(300, 10)).toBe('00:30'));

  // Decimal units
  it('handles decimal units (7.5)', () => expect(paceStr(450, 7.5)).toBe('01:00'));

  // Very high pace: > 60 min/unit
  it('4200s / 1 unit → 70:00', () => expect(paceStr(4200, 1)).toBe('70:00'));

  // Very small pace: sub-minute per unit
  it('15s / 1 unit → 00:15', () => expect(paceStr(15, 1)).toBe('00:15'));
});
