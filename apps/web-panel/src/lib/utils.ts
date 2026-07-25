export function getSchoolBaseUrl() {
  if (typeof window === 'undefined') return '';
  // Use current origin for any non-production environment (e.g. localhost, network IP, ngrok)
  if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin;
  }
  // In production, force the custom domain
  return 'https://school.parikshaos.com';
}

export function getAdminBaseUrl() {
  if (typeof window === 'undefined') return '';
  // Use current origin for any non-production environment
  if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin;
  }
  // In production, force the custom domain
  return 'https://admin.parikshaos.com';
}

export function formatDOB(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  if (dateStr.includes('/')) return dateStr; // already formatted or wrong format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}
