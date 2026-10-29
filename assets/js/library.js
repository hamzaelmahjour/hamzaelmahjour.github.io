/* Resources page: instant search + type filters. */
(function () {
  'use strict';
  var tools = document.getElementById('lib-tools');
  if (!tools) return;
  tools.hidden = false;

  var input = document.getElementById('lib-q');
  var buttons = Array.prototype.slice.call(tools.querySelectorAll('[data-filter]'));
  var rows = Array.prototype.slice.call(document.querySelectorAll('.lib-row'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.lib-group'));
  var countEl = document.getElementById('lib-count');
  var emptyEl = document.getElementById('lib-empty');
  var OTHER = ['livre', 'article', 'lien', 'video', 'autre'];
  var filter = 'all';

  function norm(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  rows.forEach(function (r) { r._text = norm(r.getAttribute('data-search')); });

  function apply() {
    var words = norm(input.value).split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (r) {
      var t = r.getAttribute('data-type');
      var typeOk = filter === 'all' || t === filter || (filter === 'other' && OTHER.indexOf(t) !== -1);
      var textOk = words.every(function (w) { return r._text.indexOf(w) !== -1; });
      r.hidden = !(typeOk && textOk);
      if (!r.hidden) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.lib-row:not([hidden])'); });
    countEl.textContent = shown + (shown > 1 ? ' documents' : ' document');
    emptyEl.hidden = shown !== 0;
    var params = new URLSearchParams();
    if (input.value) params.set('q', input.value);
    if (filter !== 'all') params.set('type', filter);
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-filter');
      buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    });
  });
  input.addEventListener('input', apply);

  // Links like /resources/?q=examen&type=exam open pre-filtered: handy to share
  var p = new URLSearchParams(location.search);
  if (p.get('q')) input.value = p.get('q');
  if (p.get('type')) {
    var b = tools.querySelector('[data-filter="' + p.get('type') + '"]');
    if (b) { filter = p.get('type'); buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
  }
  apply();
})();
