/**
 * Normalize a handle to ensure it starts with @
 */
export const normalizeHandle = (handle: string): string => {
  const trimmed = handle.trim();
  if (trimmed === "") return "@";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

/**
 * Validate and normalize a hex color
 * Returns the normalized color or null if invalid
 */
export const normalizeHexColor = (color: string): string | null => {
  const trimmed = color.trim();

  // Handle empty input
  if (trimmed === "" || trimmed === "#") return null;

  // Add # if missing
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  // Validate hex format (3 or 6 characters)
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(withHash)) return null;

  return withHash.toLowerCase();
};

/**
 * Check if a string is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  return normalizeHexColor(color) !== null;
};
