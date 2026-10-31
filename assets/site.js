/* Shared JS: footer year, archived-page forms, and copy buttons. */
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
      // Kit's subscriptions endpoint is a normal form POST. Cross-origin fetch
      // can be blocked or return HTTP 200 with status "failed", so don't intercept.
      if (form.classList.contains('js-signup')) return;
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      fetch(action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          msg.className = 'form-msg ok';
          msg.textContent = "Got it. We'll reply with a quote soon.";
          form.reset();
        })
        .catch(function (err) {
          if (err && /^[0-9]+$/.test(err.message)) {
            msg.className = 'form-msg warn';
            msg.textContent = "Couldn't send that. Try again in a moment.";
            return;
          }
          form.submit();
        })
        .finally(function () { btn.disabled = false; });
    });
  });

  var promo = document.getElementById('home-promo');
  var soundBtn = document.querySelector('.promo-sound');
  if (promo) {
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var holdStill = function () {
      if (!motion.matches) return;
      promo.removeAttribute('autoplay');
      promo.pause();
    };
    holdStill();
    if (motion.addEventListener) motion.addEventListener('change', holdStill);
    var setSoundLabel = function () {
      if (!soundBtn) return;
      var on = !promo.muted;
      soundBtn.textContent = on ? 'Mute' : 'Tap for sound';
      soundBtn.setAttribute('aria-label', on ? 'Mute the promo clip' : 'Tap for sound');
    };
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        if (promo.muted) {
          promo.muted = false;
          var pending = promo.play();
          if (pending && pending.catch) pending.catch(function () {});
        } else {
          promo.muted = true;
        }
        setSoundLabel();
      });
    }
    promo.addEventListener('volumechange', setSoundLabel);
  }

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
