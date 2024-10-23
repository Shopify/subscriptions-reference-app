export function formStringToArray(str?: string): string[] {
  return !str ? [] : str.split(',');
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
