// Helper function to escape regex special characters
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Helper function to find context for a search term in a text
export function findContextSimple(
  text: string,
  searchTerm: string,
  contextChars = 40
): { prefix: string; match: string; suffix: string } | null {
  if (!text || !searchTerm || searchTerm.trim() === "") return null;

  // Try to match whole word first, case-insensitive
  const wholeWordRegex = new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, 'i');
  let matchResult = wholeWordRegex.exec(text);

  // If not found as whole word, try partial match
  if (!matchResult) {
    const partialRegex = new RegExp(escapeRegExp(searchTerm), 'i');
    matchResult = partialRegex.exec(text);
  }

  if (!matchResult) return null;

  const startIndex = matchResult.index;
  const actualMatch = matchResult[0]; // This captures the casing from the original text

  const prefixStart = Math.max(0, startIndex - contextChars);
  const suffixEnd = Math.min(text.length, startIndex + actualMatch.length + contextChars);

  let prefix = text.substring(prefixStart, startIndex);
  let suffix = text.substring(startIndex + actualMatch.length, suffixEnd);

  if (prefixStart > 0) {
    const spaceBeforePrefix = text.lastIndexOf(' ', prefixStart - 1);
    if (prefixStart > 0 && spaceBeforePrefix !== -1 && spaceBeforePrefix < prefixStart - 1) {
      prefix = text.substring(spaceBeforePrefix + 1, startIndex);
    }
    prefix = "..." + prefix.trimStart();
  }
  if (suffixEnd < text.length) {
    const spaceAfterSuffix = text.indexOf(' ', suffixEnd);
    if (suffixEnd < text.length && spaceAfterSuffix !== -1) {
      // Ensure the suffix substring doesn't start mid-word if possible
      suffix = text.substring(startIndex + actualMatch.length, spaceAfterSuffix);
    }
    suffix = suffix.trimEnd() + "...";
  }

  return { prefix, match: actualMatch, suffix };
}

export const mdBlockquote = (text: string | undefined | null): string => {
  if (!text) return "";
  return text.split('\n').filter(p => p.trim() !== '').map(p => `> ${p.trim()}`).join('\n>\n');
};