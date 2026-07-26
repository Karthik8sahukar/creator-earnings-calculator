/**
 * Inline script that applies the correct theme class to <html> BEFORE
 * the first paint, preventing a theme flash on load.
 *
 * Rules:
 *   1. If the user has an explicit saved preference, use it.
 *   2. Otherwise, default to light mode (do NOT follow OS preference).
 *   3. Never throw — a locked-down browser (localStorage disabled) or
 *      a partial DOM must not break rendering.
 *
 * First-time visitors always see light mode. Users who manually select
 * dark mode have their preference persisted in localStorage and
 * restored on subsequent visits.
 *
 * IMPORTANT: This script is executed inline in <head>, so it must be
 * self-contained (no imports, no external state) and run in ~1ms.
 */
export function ThemeScript() {
  const source = `
(function() {
  try {
    var STORAGE_KEY = 'behumler:theme';
    var saved = null;
    try { saved = window.localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var pref = saved;
    if (pref !== 'light' && pref !== 'dark') {
      pref = 'light';
    }
    var root = document.documentElement;
    if (pref === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = pref;
  } catch (_) { /* fail silent — leave default (light) theme */ }
})();
`;

  return (
    <script
      // Rendered inside <head>. Content is a static compile-time
      // string; no user data flows into it.
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}
