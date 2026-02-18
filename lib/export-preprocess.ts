/**
 * Pre-processing for html-to-image export.
 * Safari silently fails to fetch background images and fonts inside
 * html-to-image's cloned iframe context. We pre-convert resources
 * to base64 data URLs before calling toJpeg.
 */

/**
 * Convert a URL to a base64 data URL via fetch + blob.
 */
async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Inline background images in a container as base64 data URLs.
 * Returns a cleanup function that restores original URLs.
 */
export async function inlineBackgroundImages(
  container: HTMLElement
): Promise<() => void> {
  const restorers: (() => void)[] = [];

  // Find all elements with background-image
  const allElements = [container, ...Array.from(container.querySelectorAll("*"))] as HTMLElement[];

  for (const el of allElements) {
    const style = getComputedStyle(el);
    const bgImage = style.backgroundImage;

    if (!bgImage || bgImage === "none") continue;

    // Extract URL from url("...")
    const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
    if (!match) continue;

    const url = match[1];

    // Skip already-inlined data URLs
    if (url.startsWith("data:")) continue;

    try {
      const base64 = await urlToBase64(url);
      const original = el.style.backgroundImage;
      el.style.backgroundImage = `url(${base64})`;
      restorers.push(() => {
        el.style.backgroundImage = original;
      });
    } catch {
      // Skip if we can't fetch — the export will just miss this background
    }
  }

  return () => restorers.forEach((r) => r());
}

/**
 * Build fontEmbedCSS with base64-encoded font data.
 *
 * Strategy: parse the raw innerHTML of all <style> tags in the document
 * to extract @font-face blocks. This is more reliable than using the CSSOM
 * API (document.styleSheets / cssRules) which Safari blocks for
 * cross-origin or Next.js-injected stylesheets.
 *
 * Also parses <link> stylesheets that we can fetch same-origin.
 */
export async function buildFontEmbedCSS(): Promise<string> {
  const fontFaceBlocks: string[] = [];

  // 1. Collect raw CSS from all <style> tags
  const styleTags = document.querySelectorAll("style");
  for (const tag of Array.from(styleTags)) {
    const css = tag.textContent || "";
    extractFontFaceBlocks(css, fontFaceBlocks);
  }

  // 2. Also try fetching <link rel="stylesheet"> that are same-origin
  const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
  for (const link of Array.from(linkTags)) {
    const href = (link as HTMLLinkElement).href;
    if (!href) continue;
    try {
      // Only fetch same-origin stylesheets
      const linkUrl = new URL(href);
      if (linkUrl.origin !== window.location.origin) continue;
      const res = await fetch(href);
      const css = await res.text();
      extractFontFaceBlocks(css, fontFaceBlocks);
    } catch {
      // Skip if we can't fetch
    }
  }

  // 3. Try CSSOM as fallback for any rules we might have missed
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        const ruleText = rule.cssText;
        // Avoid duplicates
        if (!fontFaceBlocks.some((b) => b === ruleText)) {
          fontFaceBlocks.push(ruleText);
        }
      }
    }
  }

  // 4. Deduplicate by font-family name (keep first occurrence only)
  const seen = new Set<string>();
  const unique = fontFaceBlocks.filter((block) => {
    const familyMatch = block.match(/font-family:\s*["']?([^"';},]+)/);
    if (!familyMatch) return true;
    const key = familyMatch[1].trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 5. Inline all font URLs as base64 and strip size-adjust
  const inlined = await Promise.all(
    unique.map(async (block) => {
      // Remove size-adjust — Next.js adds it for fallback alignment but
      // it causes oversized text when fonts are inlined for html-to-image
      const cleaned = block.replace(/size-adjust:\s*[^;]+;?\s*/g, "");
      return await inlineFontUrls(cleaned);
    })
  );

  return inlined.join("\n");
}

/**
 * Extract @font-face { ... } blocks from raw CSS text.
 */
function extractFontFaceBlocks(css: string, results: string[]): void {
  const regex = /@font-face\s*\{[^}]*\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const block = match[0];
    // Avoid duplicates (compare by font-family + src pattern)
    if (!results.some((b) => b === block)) {
      results.push(block);
    }
  }
}

/**
 * Replace all url(...) references in a @font-face block with base64 data URLs.
 */
async function inlineFontUrls(block: string): Promise<string> {
  // Match all url() references in the block
  const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
  const replacements: { original: string; replacement: string }[] = [];

  let urlMatch;
  while ((urlMatch = urlRegex.exec(block)) !== null) {
    const fullMatch = urlMatch[0];
    const fontUrl = urlMatch[1];

    // Skip data URLs and local() references
    if (fontUrl.startsWith("data:")) continue;

    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(fontUrl, window.location.origin).href;
      const base64 = await urlToBase64(absoluteUrl);
      replacements.push({ original: fullMatch, replacement: `url(${base64})` });
    } catch {
      // Keep original URL if fetch fails
    }
  }

  let result = block;
  for (const { original, replacement } of replacements) {
    result = result.replace(original, replacement);
  }
  return result;
}
