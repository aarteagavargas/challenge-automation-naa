export function formatCompletionTime(locale = 'es-CO'): string {
  return new Date().toLocaleString(locale, {
    dateStyle: 'full',
    timeStyle: 'long',
  });
}
