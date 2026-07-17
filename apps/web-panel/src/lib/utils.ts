export function getSchoolBaseUrl() {
  if (typeof window === 'undefined') return '';
  // Check if we are running locally
  if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
    return window.location.origin;
  }
  // In production, force the custom domain
  return 'https://school.parikshaos.com';
}

export function getAdminBaseUrl() {
  if (typeof window === 'undefined') return '';
  // Check if we are running locally
  if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
    return window.location.origin;
  }
  // In production, force the custom domain
  return 'https://admin.parikshaos.com';
}
