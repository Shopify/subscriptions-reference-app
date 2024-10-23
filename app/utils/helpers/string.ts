export function convertPascalToSnakeCase(value: string): string {
  return value
    .replace(/([A-Z])/g, (_, group) => `_${group.toLowerCase()}`)
    .replace(/^_/, '');
}

export function sanitize(value: string): string {
  let matches = value.match(/^'(.+)$/);
  matches = matches || value.match(/^="(.+)"$/);
  if (matches) {
    return matches[1];
  } else {
    return value;
  }
}
