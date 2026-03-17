/**
 * Get the Apple emoji image URL from the jsdelivr CDN (64px, for picker button).
 */
export function getAppleEmojiUrl(unified: string): string {
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unified}.png`;
}

/**
 * Get a high-resolution Apple emoji image URL from Emojipedia CDN.
 * @param name - Emoji name (e.g. "Party Popper") — will be slugified
 * @param unified - Unified code (e.g. "1f389")
 */
export function getAppleEmojiHQUrl(name: string, unified: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `/api/emoji?name=${encodeURIComponent(slug)}&unified=${encodeURIComponent(unified)}`;
}