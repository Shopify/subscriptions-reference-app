/**
 * Parses a semantic version string into major, minor, and patch numbers
 * @param version - Version string (e.g., "10.13.0")
 * @returns Tuple of [major, minor, patch] numbers
 */
function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.');
  const major = parseInt(parts[0], 10) || 0;
  const minor = parseInt(parts[1], 10) || 0;
  const patch = parseInt(parts[2], 10) || 0;

  return [major, minor, patch];
}

/**
 * Checks if a version meets the minimum required version
 * Compares major, minor, and patch versions
 * @param currentVersion - The version to check (e.g., "10.13.0")
 * @param minimumVersion - The minimum required version (e.g., "10.15.0")
 * @returns true if currentVersion >= minimumVersion, false otherwise
 */
export function isVersionSupported(
  currentVersion: string,
  minimumVersion: string,
): boolean {
  const [currentMajor, currentMinor, currentPatch] =
    parseVersion(currentVersion);
  const [minimumMajor, minimumMinor, minimumPatch] =
    parseVersion(minimumVersion);

  // Compare major version
  if (currentMajor > minimumMajor) return true;
  if (currentMajor < minimumMajor) return false;

  // Major versions are equal, compare minor version
  if (currentMinor > minimumMinor) return true;
  if (currentMinor < minimumMinor) return false;

  // Major and minor are equal, compare patch version
  return currentPatch >= minimumPatch;
}
