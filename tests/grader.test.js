'use strict';

const { grade } = require('../src/grader');

describe('grade — challenge example scenarios', () => {
  test('84.2 F → R, student: 543.94 → correct', () => {
    expect(grade(84.2, 'fahrenheit', 'rankine', '543.94')).toMatchObject({ result: 'correct' });
  });

  test('317.33 K → F, student: 111.554 → incorrect', () => {
    expect(grade(317.33, 'kelvin', 'fahrenheit', '111.554')).toMatchObject({ result: 'incorrect' });
  });

  test('6.5 F → R, student: "dog" → incorrect', () => {
    expect(grade(6.5, 'fahrenheit', 'rankine', 'dog')).toMatchObject({ result: 'incorrect' });
  });

  test('136.1 dogcow → C, student: 45.32 → invalid', () => {
    expect(grade(136.1, 'dogcow', 'celsius', '45.32')).toMatchObject({ result: 'invalid' });
  });
});

describe('grade — unit validation', () => {
  test('unknown input unit → invalid', () => {
    expect(grade(100, 'widget', 'celsius', '100')).toMatchObject({ result: 'invalid' });
  });

  test('unknown target unit → invalid', () => {
    expect(grade(100, 'celsius', 'widget', '100')).toMatchObject({ result: 'invalid' });
  });

  test('both units unknown → invalid', () => {
    expect(grade(100, 'foo', 'bar', '100')).toMatchObject({ result: 'invalid' });
  });

  test('case-insensitive units → valid', () => {
    const result = grade(0, 'Celsius', 'Fahrenheit', '32');
    expect(result.result).toBe('correct');
  });
});

describe('grade — numeric input validation', () => {
  test('non-numeric inputValue → invalid', () => {
    expect(grade('hot', 'celsius', 'fahrenheit', '100')).toMatchObject({ result: 'invalid' });
  });

  test('numeric string inputValue is accepted', () => {
    expect(grade('100', 'celsius', 'fahrenheit', '212')).toMatchObject({ result: 'correct' });
  });
});

describe('grade — student response validation', () => {
  test('empty string student response → incorrect', () => {
    expect(grade(100, 'celsius', 'fahrenheit', '')).toMatchObject({ result: 'incorrect' });
  });

  test('NaN student response → incorrect', () => {
    expect(grade(100, 'celsius', 'fahrenheit', 'NaN')).toMatchObject({ result: 'incorrect' });
  });

  test('Infinity student response → incorrect', () => {
    expect(grade(100, 'celsius', 'fahrenheit', 'Infinity')).toMatchObject({ result: 'incorrect' });
  });
});

describe('grade — correctness (rounding to tenths)', () => {
  test('0°C → 32°F, student: 32.0 → correct', () => {
    expect(grade(0, 'celsius', 'fahrenheit', '32.0')).toMatchObject({ result: 'correct' });
  });

  test('0°C → 32°F, student: 32.04 → correct (rounds to 32.0)', () => {
    expect(grade(0, 'celsius', 'fahrenheit', '32.04')).toMatchObject({ result: 'correct' });
  });

  test('0°C → 32°F, student: 31.9 → incorrect', () => {
    expect(grade(0, 'celsius', 'fahrenheit', '31.9')).toMatchObject({ result: 'incorrect' });
  });

  test('authoritative value is returned on incorrect', () => {
    const result = grade(317.33, 'kelvin', 'fahrenheit', '111.554');
    expect(result.authoritative).toBe(111.5);
  });

  test('authoritative value is returned on correct', () => {
    const result = grade(84.2, 'fahrenheit', 'rankine', '543.94');
    expect(result.authoritative).toBe(543.9);
  });
});
