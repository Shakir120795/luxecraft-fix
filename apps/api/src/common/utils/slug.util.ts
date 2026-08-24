import slugify from 'slugify';

/**
 * Generate a URL-safe slug from any string.
 * e.g. "Hand Knotted Rugs" → "hand-knotted-rugs"
 */
export function generateSlug(input: string): string {
  return slugify(input, {
    lower: true,
    strict: true,   // removes special characters
    trim: true,
  });
}

/**
 * Generate a unique slug by appending a short timestamp suffix if the
 * desired slug is already taken. The caller passes a uniqueness-check function.
 */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = generateSlug(input);
  if (!(await exists(base))) return base;

  // Append short random suffix
  const suffix = Date.now().toString(36).slice(-4);
  const candidate = `${base}-${suffix}`;
  if (!(await exists(candidate))) return candidate;

  // Last resort: full timestamp
  return `${base}-${Date.now().toString(36)}`;
}
