'use strict';

const { convert, isValidUnit, roundToTenths } = require('../src/converter');

describe('isValidUnit', () => {
  test.each([
    ['kelvin', true],
    ['celsius', true],
    ['fahrenheit', true],
    ['rankine', true],
    ['Kelvin', true],
    ['FAHRENHEIT', true],
    [' Celsius ', true],
    ['dogcow', false],
    ['', false],
    [null, false],
    [undefined, false],
    [42, false],
  ])('isValidUnit(%s) === %s', (input, expected) => {
    expect(isValidUnit(input)).toBe(expected);
  });
});

describe('roundToTenths', () => {
  test('rounds 543.87 to 543.9', () => expect(roundToTenths(543.87)).toBe(543.9));
  test('rounds 111.524 to 111.5', () => expect(roundToTenths(111.524)).toBe(111.5));
  test('rounds 111.6 to 111.6', () => expect(roundToTenths(111.6)).toBe(111.6));
  test('rounds 0 to 0', () => expect(roundToTenths(0)).toBe(0));
  // JavaScript Math.round(-2731.5) = -2731 (rounds toward +Infinity), so -273.15 → -273.1
  test('rounds negative values', () => expect(roundToTenths(-273.15)).toBe(-273.1));
});

describe('convert — same-unit passthrough', () => {
  test.each([
    ['kelvin', 300],
    ['celsius', 100],
    ['fahrenheit', 32],
    ['rankine', 491.67],
  ])('%s → %s returns the same value', (unit, value) => {
    expect(convert(value, unit, unit)).toBeCloseTo(value, 8);
  });
});

describe('convert — known reference points', () => {
  // Water freezing point
  test('0°C → 32°F', () => expect(convert(0, 'celsius', 'fahrenheit')).toBeCloseTo(32, 5));
  test('32°F → 0°C', () => expect(convert(32, 'fahrenheit', 'celsius')).toBeCloseTo(0, 5));
  test('0°C → 273.15 K', () => expect(convert(0, 'celsius', 'kelvin')).toBeCloseTo(273.15, 5));
  test('273.15 K → 0°C', () => expect(convert(273.15, 'kelvin', 'celsius')).toBeCloseTo(0, 5));

  // Water boiling point
  test('100°C → 212°F', () => expect(convert(100, 'celsius', 'fahrenheit')).toBeCloseTo(212, 5));
  test('212°F → 100°C', () => expect(convert(212, 'fahrenheit', 'celsius')).toBeCloseTo(100, 5));
  test('100°C → 373.15 K', () => expect(convert(100, 'celsius', 'kelvin')).toBeCloseTo(373.15, 5));

  // Absolute zero
  test('0 K → -273.15°C', () => expect(convert(0, 'kelvin', 'celsius')).toBeCloseTo(-273.15, 5));
  test('0 K → -459.67°F', () => expect(convert(0, 'kelvin', 'fahrenheit')).toBeCloseTo(-459.67, 5));
  test('0 K → 0 R', () => expect(convert(0, 'kelvin', 'rankine')).toBeCloseTo(0, 5));
  test('0 R → 0 K', () => expect(convert(0, 'rankine', 'kelvin')).toBeCloseTo(0, 5));

  // Rankine ↔ Fahrenheit
  test('32°F → 491.67 R', () => expect(convert(32, 'fahrenheit', 'rankine')).toBeCloseTo(491.67, 5));
  test('491.67 R → 32°F', () => expect(convert(491.67, 'rankine', 'fahrenheit')).toBeCloseTo(32, 5));
});

describe('convert — challenge example scenarios', () => {
  // 84.2 Fahrenheit → Rankine ≈ 543.87, rounded to 543.9 (student said 543.94 → rounds to 543.9 → correct)
  test('84.2 F → R ≈ 543.87', () =>
    expect(roundToTenths(convert(84.2, 'fahrenheit', 'rankine'))).toBe(543.9));

  // 317.33 Kelvin → Fahrenheit ≈ 111.524, rounded to 111.5 (student said 111.554 → rounds to 111.6 → incorrect)
  test('317.33 K → F ≈ 111.524, rounds to 111.5', () =>
    expect(roundToTenths(convert(317.33, 'kelvin', 'fahrenheit'))).toBe(111.5));
});
