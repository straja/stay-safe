/**
 * Formatting utilities for display values.
 */

/**
 * Format a distance in km for display.
 * Under 100 km: show 1 decimal. Otherwise: rounded integer.
 */
export function formatKm(km: number): string {
  if (km < 100) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}

/**
 * Format an ISO timestamp as "HH:MM UTC".
 */
export function formatTimeUTC(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hh}:${mm} UTC`;
  } catch {
    return '—';
  }
}

/**
 * Format an ISO timestamp as "DD MMM YYYY HH:MM UTC".
 */
export function formatDateTimeUTC(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const day = d.getUTCDate().toString().padStart(2, '0');
    const mon = months[d.getUTCMonth()];
    const yr = d.getUTCFullYear();
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    return `${day} ${mon} ${yr} ${hh}:${mm} UTC`;
  } catch {
    return '—';
  }
}

/**
 * Relative time label: "X min ago", "X h ago", "X d ago".
 */
export function relativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    return `${days} d ago`;
  } catch {
    return '—';
  }
}

/**
 * Severity label with neutral language.
 */
export function severityLabel(severity: string): string {
  switch (severity) {
    case 'high': return 'Elevated';
    case 'medium': return 'Moderate';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
}

/**
 * Event type in neutral language.
 */
export function eventTypeLabel(type: string): string {
  switch (type) {
    case 'armed_conflict': return 'Armed conflict';
    case 'civil_unrest': return 'Civil unrest';
    case 'air_strike': return 'Air activity';
    case 'explosion': return 'Explosion reported';
    default: return 'Incident';
  }
}
