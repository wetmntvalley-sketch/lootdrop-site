/* Loot Drop shared JS: footer year, Kit/Formspree form handling, copy buttons. */
(function () {
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  document.querySelectorAll('form.js-signup, form.js-intake').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var msg = form.querySelector('.form-msg');
      var action = form.getAttribute('action') || '';
      if (action.indexOf('YOUR_') !== -1) {
        e.preventDefault();
        msg.className = 'form-msg warn';
        msg.textContent = "This form isn't connected yet. Endpoint coming soon.";
        return;
      }
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      fetch(action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          msg.className = 'form-msg ok';
          msg.textContent = form.classList.contains('js-intake') ? "Got it. We'll reply with a quote soon." : "You're in. Watch your inbox for loot.";
          form.reset();
        })
        .catch(function () { form.submit(); })
        .finally(function () { btn.disabled = false; });
    });
  });

  document.querySelectorAll('button.copy[data-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-target'));
      if (!el) return;
      var text = el.textContent;
      var done = function () {
        btn.textContent = 'Copied';
        btn.classList.add('done');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
      } else { fallback(text); done(); }
    });
  });
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
})();
