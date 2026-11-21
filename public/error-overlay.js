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
    wrap.setAttribute('role', 'alert');
    wrap.setAttribute(
      'style',
      [
        'max-width:440px',
        'margin:14vh 16px 0',
        'margin-left:max(16px, calc(50% - 220px))',
        'margin-right:max(16px, calc(50% - 220px))',
        'padding:28px',
        'font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif',
        'color:#1c1a2e',
        'background:#ffffff',
        'border:1px solid rgba(28,26,46,0.10)',
        'border-radius:16px',
        'line-height:1.55',
        'box-shadow:0 1px 2px rgba(28,26,46,0.06)',
        'text-align:center',
      ].join(';'),
    );
    document.body.style.background = '#faf8f4';

    var title = document.createElement('h1');
    title.textContent = 'Scales.os couldn\u2019t start';
    title.setAttribute(
      'style',
      'font-size:20px;font-weight:700;margin:0 0 8px;letter-spacing:-0.02em',
    );

    var hint = document.createElement('p');
    hint.textContent =
      'Something went wrong while loading. Check your connection and try again \u2014 your practice data is safe.';
    hint.setAttribute('style', 'font-size:14px;color:#6b6880;margin:0 0 20px');

    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reload';
    button.setAttribute(
      'style',
      'font:inherit;font-size:14px;font-weight:600;color:#fff;background:#352e9e;border:0;border-radius:10px;padding:10px 20px;cursor:pointer',
    );
    button.addEventListener('click', function () {
      window.location.reload();
    });

    // Technical details stay available for whoever is debugging, without
    // greeting every visitor with environment-variable jargon.
    var details = document.createElement('details');
    details.setAttribute('style', 'margin-top:20px;text-align:left;font-size:12px;color:#6b6880');
    var summary = document.createElement('summary');
    summary.textContent = 'Technical details';
    summary.setAttribute('style', 'cursor:pointer');
    var pre = document.createElement('pre');
    pre.textContent =
      (message || 'Unknown error') +
      '\n\nIf you run this site: this is usually a missing or malformed ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.';
    pre.setAttribute(
      'style',
      [
        'white-space:pre-wrap',
        'word-break:break-word',
        'font-size:12px',
        'background:#f4f2ee',
        'color:#7a2e2e',
        'padding:12px',
        'border-radius:10px',
        'margin:8px 0 0',
        'overflow:auto',
      ].join(';'),
    );
    details.appendChild(summary);
    details.appendChild(pre);

    wrap.appendChild(title);
    wrap.appendChild(hint);
    wrap.appendChild(button);
    wrap.appendChild(details);
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
