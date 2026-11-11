export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** "desktop/home.png" -> "home.png" */
export function baseName(fileName?: string): string {
  return fileName?.split('/').pop() ?? '';
}
