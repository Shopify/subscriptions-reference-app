/**
 * Deep compares any two given values, and returns true if they are equal, false otherwise.
 *
 * The comparison is not strict, so `compareValues(1, '1')` will return true.
 */
export function compareValues(value1: any, value2: any) {
  if (value1 && value2) {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return (
        value1.length === value2.length &&
        value1.every((value, index) => compareValues(value, value2[index]))
      );
    } else if (typeof value1 === 'object' && typeof value2 === 'object') {
      return (
        Object.keys(value1).length === Object.keys(value2).length &&
        Object.entries(value1).every(([key, value]) =>
          compareValues(value, value2[key]),
        )
      );
    }
  }

  // In some cases we might have a string and a number that are equal, and we want the form to be clean in that case
  return value1 == value2;
}
