/* Startup error overlay.
 * Runs before the app bundle. If the app throws while booting (for example,
 * an invalid/missing Supabase env var), a white screen would otherwise give no
 * clue. This renders the real error message into #root instead.
 *
 * It only ever paints when the app has NOT mounted yet (root is empty), so a
 * non-fatal background error can never wipe out a working UI.
 */
(function () {
  var shown = false;

  function paint(message) {
    if (shown) return;
    var root = document.getElementById('root');
    if (!root || root.childNodes.length > 0) return;
    shown = true;

    root.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      [
        'max-width:680px',
        'margin:12vh auto',
        'padding:24px',
        'font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif',
        'color:#e5e7eb',
        'background:#111827',
        'border:1px solid #1f2937',
        'border-radius:16px',
        'line-height:1.55',
        'box-shadow:0 10px 30px rgba(0,0,0,0.35)',
      ].join(';'),
    );

    var title = document.createElement('h1');
    title.textContent = 'The app failed to load';
    title.setAttribute(
      'style',
      'font-size:18px;font-weight:700;margin:0 0 8px;letter-spacing:-0.01em',
    );

    var hint = document.createElement('p');
    hint.textContent =
      'This is usually a missing or malformed Supabase environment variable ' +
      '(VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Details:';
    hint.setAttribute('style', 'font-size:13px;color:#9ca3af;margin:0 0 12px');

    var pre = document.createElement('pre');
    pre.textContent = message || 'Unknown error';
    pre.setAttribute(
      'style',
      [
        'white-space:pre-wrap',
        'word-break:break-word',
        'font-size:12.5px',
        'background:#0b1220',
        'color:#fca5a5',
        'padding:12px',
        'border-radius:10px',
        'margin:0',
        'overflow:auto',
      ].join(';'),
    );

    wrap.appendChild(title);
    wrap.appendChild(hint);
    wrap.appendChild(pre);
    root.appendChild(wrap);
  }

  window.addEventListener('error', function (event) {
    var err = event && event.error;
    var message = (err && err.message) || (event && event.message) || 'Unknown error';
    paint(message);
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    var message = (reason && reason.message) || String(reason || 'Unknown promise rejection');
    paint(message);
  });

  // Last resort: if nothing rendered after a few seconds, say so.
  window.setTimeout(function () {
    paint('The application did not start. Check the browser console for errors.');
  }, 5000);
})();
