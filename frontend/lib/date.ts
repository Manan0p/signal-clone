export function parseUTCDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  // Check if it already has timezone indicator (Z or +XX:XX or -XX:XX)
  const hasTimezone = dateStr.includes('Z') || /[\+\-]\d{2}:\d{2}$/.test(dateStr);
  return new Date(hasTimezone ? dateStr : dateStr + 'Z');
}
