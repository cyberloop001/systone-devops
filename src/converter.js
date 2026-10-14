'use strict';

const VALID_UNITS = new Set(['kelvin', 'celsius', 'fahrenheit', 'rankine']);

/**
 * Converts a temperature value to Kelvin from any supported unit.
 * Kelvin is used as the canonical intermediate for all conversions.
 */
function toKelvin(value, unit) {
  switch (unit) {
    case 'kelvin':
      return value;
    case 'celsius':
      return value + 273.15;
    case 'fahrenheit':
      return (value + 459.67) * (5 / 9);
    case 'rankine':
      return value * (5 / 9);
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Converts a Kelvin value to any supported unit.
 */
function fromKelvin(kelvin, unit) {
  switch (unit) {
    case 'kelvin':
      return kelvin;
    case 'celsius':
      return kelvin - 273.15;
    case 'fahrenheit':
      return kelvin * (9 / 5) - 459.67;
    case 'rankine':
      return kelvin * (9 / 5);
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Returns true if the given string is a recognized temperature unit.
 */
function isValidUnit(unit) {
  if (typeof unit !== 'string' || unit.trim() === '') { return false; }
  return VALID_UNITS.has(unit.trim().toLowerCase());
}

/**
 * Converts a numeric value from one temperature unit to another.
 * Assumes both units have already been validated via isValidUnit().
 */
function convert(value, fromUnit, toUnit) {
  const from = fromUnit.trim().toLowerCase();
  const to = toUnit.trim().toLowerCase();
  return fromKelvin(toKelvin(value, from), to);
}

/**
 * Rounds a number to the tenths place (one decimal digit).
 */
function roundToTenths(value) {
  return Math.round(value * 10) / 10;
}

module.exports = { convert, isValidUnit, roundToTenths, VALID_UNITS };
