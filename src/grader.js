'use strict';

const { convert, isValidUnit, roundToTenths } = require('./converter');

/**
 * Grades a student's temperature-conversion response.
 *
 * Rules:
 *  - If either unit of measure is unrecognised  → result: "invalid"
 *  - If the input numerical value is not a finite number → result: "invalid"
 *  - If the student response is not a valid number       → result: "incorrect"
 *  - Otherwise compare both values rounded to the tenths place
 *    → result: "correct" or "incorrect"
 *
 * @param {*} inputValue      Raw input value (may be string or number)
 * @param {string} inputUnit  Source unit of measure
 * @param {string} targetUnit Target unit of measure
 * @param {*} studentResponse Raw student answer (may be string, number, or anything)
 * @returns {{ result: string, authoritative?: number }}
 */
function grade(inputValue, inputUnit, targetUnit, studentResponse) {
  if (!isValidUnit(inputUnit) || !isValidUnit(targetUnit)) {
    return { result: 'invalid' };
  }

  const numericInput = Number(inputValue);
  if (!Number.isFinite(numericInput)) {
    return { result: 'invalid' };
  }

  const studentNum = parseFloat(String(studentResponse));
  if (!Number.isFinite(studentNum)) {
    return { result: 'incorrect' };
  }

  const authoritative = roundToTenths(convert(numericInput, inputUnit, targetUnit));
  const studentRounded = roundToTenths(studentNum);

  return {
    result: studentRounded === authoritative ? 'correct' : 'incorrect',
    authoritative,
  };
}

module.exports = { grade };
