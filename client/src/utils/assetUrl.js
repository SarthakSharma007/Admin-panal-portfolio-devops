/**
 * Resolves static asset/upload URLs for both local dev and production (Admin Panel).
 *
 * Production:
 * - If REACT_APP_API_URL is set (Render, Vercel env var), prefixes with that URL.
 * - The Vercel vercel.json rewrite already handles /uploads/:path* → admin backend,
 *   so in most production setups this helper is mainly needed for direct image src.
 *
 * Local Development:
 * - Falls back to http://localhost:5001 (the Admin Panel backend port).
 */
export const getAdminAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (process.env.REACT_APP_API_URL) {
    const base = process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    return `${base}${cleanPath}`;
  }
  return `http://localhost:5001${cleanPath}`;
};

/**
 * Image error handler for Admin Panel.
 * In local dev, if port 5001 is unavailable, tries port 5000 (portfolio backend)
 * since both share the same uploads directory.
 */
export const handleAdminImageError = (e, fallbackImage) => {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isLocalhost && e.target.src) {
    if (e.target.src.includes(':5001')) {
      e.target.src = e.target.src.replace(':5001', ':5000');
      return;
    }
  }

  if (fallbackImage) {
    e.target.src = fallbackImage;
  } else {
    e.target.onerror = null; // Prevent infinite loop
    e.target.style.display = 'none';
  }
};
