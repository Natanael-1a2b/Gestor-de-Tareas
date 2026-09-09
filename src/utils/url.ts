const NOTE_LINK_REGEX = /^https?:\/\/\S+$/i;

export function getNoteLinkUrl(content: string): string | null {
  const trimmed = content.trim();
  if (!NOTE_LINK_REGEX.test(trimmed)) return null;
  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
}
