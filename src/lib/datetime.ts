/** Parse API log timestamp (always UTC ISO from server). */
export function parseUtcTimestamp(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalize legacy API values (MySQL datetime strings without Z). */
export function normalizeLogTimestamp(value: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return trimmed;
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) return trimmed;

  const mysql = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/
  );
  if (mysql) {
    const [, y, mo, d, h, mi, se] = mysql;
    return new Date(
      Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se))
    ).toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
}

/** Show log time in the viewer's local timezone. */
export function formatActivityTimestamp(iso: string): string {
  const normalized = normalizeLogTimestamp(iso);
  const d = parseUtcTimestamp(normalized);
  if (!d) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

/** Calendar "today" in the user's local timezone. */
export function isLocalToday(iso: string): boolean {
  const d = parseUtcTimestamp(normalizeLogTimestamp(iso));
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
