// Applies theme and text size before first paint (no flash). Mirrors store/prefs.js applyPrefs().
(function () {
  try {
    var p = JSON.parse(localStorage.getItem('fq.prefs') || '{}');
    var r = document.documentElement;
    if (p.theme === 'light' || p.theme === 'dark') r.dataset.theme = p.theme;
    if (p.textScale) r.style.setProperty('--text-scale', p.textScale);
    if (p.motion === 'reduce') r.dataset.motion = 'reduce';
  } catch (e) { /* storage unavailable */ }
})();
