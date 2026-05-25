/**
 * Normalize MySQL TIMESTAMP/DATETIME values to UTC ISO-8601.
 * Activity logs are stored in UTC (see db pool session time_zone).
 */
export function toUtcIso(value) {
  if (value == null) return new Date().toISOString();

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  const s = String(value).trim();
  if (!s) return new Date().toISOString();

  // Already ISO with Z or numeric offset
  if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  // MySQL: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss" — UTC when session is +00:00
  const mysqlMatch = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/
  );
  if (mysqlMatch) {
    const [, y, mo, d, h, mi, se] = mysqlMatch;
    return new Date(
      Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se))
    ).toISOString();
  }

  const fallback = new Date(s);
  if (!Number.isNaN(fallback.getTime())) return fallback.toISOString();

  return new Date().toISOString();
}
