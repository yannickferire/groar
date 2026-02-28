/**
 * Returns Monday 00:00:00 of the current week (ISO standard).
 * Matches PostgreSQL date_trunc('week', CURRENT_DATE) behavior.
 */
export function getStartOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = (day + 6) % 7; // Monday = 0, Sunday = 6
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
