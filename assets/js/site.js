/* Site-wide behaviour: mobile menu, theme switch, share buttons, video player, best quiz scores. */
(function () {
  'use strict';

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
      }
    });
  }

  // Light / dark theme
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var root = document.documentElement;
      var current = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Toast
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  }
  window.siteToast = toast;

  // Share: native share sheet on phones (WhatsApp, Telegram…), copy to clipboard elsewhere
  var fr = (document.documentElement.lang || '').indexOf('fr') === 0 || document.querySelector('[lang="fr"]');
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.share-btn');
    if (!btn) return;
    var url = btn.getAttribute('data-share-url') || location.href;
    var title = btn.getAttribute('data-share-title') || document.title;
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && coarse) {
      navigator.share({ title: title, url: url }).catch(function () {});
      return;
    }
    copy(url).then(
      function () { toast(fr ? 'Lien copié' : 'Link copied'); },
      function () { window.prompt(fr ? 'Copiez ce lien :' : 'Copy this link:', url); }
    );
  });

  // Video player (Videos page)
  var dialog = document.getElementById('video-dialog');
  if (dialog && dialog.showModal) {
    var frame = document.getElementById('video-iframe');
    document.querySelectorAll('.video-card').forEach(function (card) {
      card.addEventListener('click', function () {
        frame.src = 'https://player.vimeo.com/video/' + card.getAttribute('data-vimeo') + '?autoplay=1';
        frame.title = card.getAttribute('data-title') || 'Video';
        dialog.showModal();
      });
    });
    dialog.addEventListener('close', function () { frame.src = ''; });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  // Best quiz scores, saved on this device by quiz.js
  document.querySelectorAll('[data-quiz-key]').forEach(function (row) {
    try {
      var saved = JSON.parse(localStorage.getItem('quiz-best:' + row.getAttribute('data-quiz-key')) || 'null');
      if (saved && typeof saved.grade === 'number') {
        var el = row.querySelector('.quiz-best');
        el.textContent = String(saved.grade).replace('.', ',') + '/20';
        el.title = 'Meilleure note sur cet appareil';
        el.hidden = false;
      }
    } catch (e) {}
  });
})();
