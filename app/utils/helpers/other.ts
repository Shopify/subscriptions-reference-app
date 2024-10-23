/**
 * Returns an array consisting of elements that are in array1 but not in array2
 * Only works for arrays consisting of primitive values
 */
export function findUniqueElements<T = string>(array1: T[], array2: T[]): T[] {
  const set2 = new Set<T>(array2);
  return array1.filter((x) => !set2.has(x));
}
