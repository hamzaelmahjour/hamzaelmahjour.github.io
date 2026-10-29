/*
 * Quiz engine for hamzaelmahjour.github.io
 *
 * Reads the quiz written in plain text (see GUIDE.md), builds the page,
 * and corrects answers in the browser. No server, no account.
 *
 *   ?  question            +  correct choice      -  wrong choice
 *   =  math answer         ~  text answer(s), separated by |
 *   !  hint                >  explanation         %  comment (hidden)
 */
(function () {
  'use strict';

  /* ======================================================================
     1. Math expressions: tokenizer, parser, evaluator, LaTeX printer
     ====================================================================== */
  var FUNCS = {
    sqrt: Math.sqrt, racine: Math.sqrt, ln: Math.log, log: Math.log, exp: Math.exp,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, sh: Math.sinh, ch: Math.cosh, th: Math.tanh,
    abs: Math.abs
  };
  var TEXF = {
    ln: '\\ln', log: '\\ln', sin: '\\sin', cos: '\\cos', tan: '\\tan',
    arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan', asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan',
    sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh', sh: '\\operatorname{sh}', ch: '\\operatorname{ch}', th: '\\operatorname{th}'
  };
  var CONSTS = { pi: Math.PI, e: Math.E };

  function MathError(msg) { this.message = msg; }

  function normalize(s) {
    return String(s)
      .replace(/[−–—]/g, '-')
      .replace(/[×·⋅∙]/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/\*\*/g, '^')
      .replace(/(\d),(\d)/g, '$1.$2')       // French decimal comma: 0,25
      .replace(/[\[{]/g, '(').replace(/[\]}]/g, ')')
      .trim();
  }

  // Split an identifier like "xexp" or "pix" into known names (x, exp / pi, x).
  function segment(word, vars, discover) {
    var names = Object.keys(FUNCS).concat(Object.keys(CONSTS)).concat(vars);
    names.sort(function (a, b) { return b.length - a.length; });
    var out = [], i = 0;
    while (i < word.length) {
      var hit = null;
      for (var k = 0; k < names.length; k++) {
        if (word.substr(i, names[k].length) === names[k]) { hit = names[k]; break; }
      }
      if (!hit && discover) { hit = word[i]; vars.push(hit); names.push(hit); }
      if (!hit) throw new MathError('« ' + word.slice(i) + ' » n’est pas reconnu.');
      out.push(hit); i += hit.length;
    }
    return out;
  }

  function tokenize(src, vars, discover) {
    var s = normalize(src), toks = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
        if (!m) throw new MathError('Nombre mal écrit.');
        toks.push({ t: 'num', v: parseFloat(m[0]), s: m[0] }); i += m[0].length; continue;
      }
      if (/[a-zA-Z_]/.test(c)) {
        var w = s.slice(i).match(/^[a-zA-Z_]+/)[0];
        var parts;
        try { parts = segment(w, vars, discover); }
        catch (err) { if (w.toLowerCase() === w) throw err; parts = segment(w.toLowerCase(), vars, discover); }
        parts.forEach(function (p) {
          if (FUNCS[p]) toks.push({ t: 'fn', v: p });
          else if (p in CONSTS && vars.indexOf(p) === -1) toks.push({ t: 'const', v: p });
          else toks.push({ t: 'var', v: p });
        });
        i += w.length; continue;
      }
      if ('+-*/^()!%'.indexOf(c) !== -1) { toks.push({ t: 'op', v: c }); i++; continue; }
      throw new MathError('Caractère « ' + c + ' » non accepté.');
    }
    return toks;
  }

  function parse(src, vars, discover) {
    var toks = tokenize(src, vars, discover), p = 0;
    if (!toks.length) throw new MathError('Réponse vide.');
    function peek() { return toks[p]; }
    function isOp(v) { var t = toks[p]; return t && t.t === 'op' && t.v === v; }
    function startsPrimary() {
      var t = toks[p]; if (!t) return false;
      return t.t === 'num' || t.t === 'var' || t.t === 'const' || t.t === 'fn' || (t.t === 'op' && t.v === '(');
    }
    function expr() {
      var n = term();
      while (isOp('+') || isOp('-')) { var o = toks[p++].v; n = { k: 'bin', op: o, a: n, b: term() }; }
      return n;
    }
    function term() {
      var n = unary();
      for (;;) {
        if (isOp('*') || isOp('/')) { var o = toks[p++].v; n = { k: 'bin', op: o, a: n, b: unary() }; }
        else if (startsPrimary()) { n = { k: 'bin', op: '*', a: n, b: power(), implicit: true }; }
        else break;
      }
      return n;
    }
    function unary() {
      if (isOp('-')) { p++; return { k: 'neg', a: unary() }; }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      var base = postfix();
      if (isOp('^')) { p++; return { k: 'bin', op: '^', a: base, b: unary() }; }
      return base;
    }
    function postfix() {
      var n = primary();
      while (isOp('!') || isOp('%')) { n = { k: toks[p++].v === '!' ? 'fact' : 'pct', a: n }; }
      return n;
    }
    function primary() {
      var t = peek();
      if (!t) throw new MathError('Expression incomplète.');
      if (t.t === 'num') { p++; return { k: 'num', v: t.v, s: t.s }; }
      if (t.t === 'var') { p++; return { k: 'var', n: t.v }; }
      if (t.t === 'const') { p++; return { k: 'const', n: t.v }; }
      if (t.t === 'fn') {
        p++;
        var arg;
        if (isOp('(')) { p++; arg = expr(); if (!isOp(')')) throw new MathError('Parenthèse fermante manquante.'); p++; }
        else arg = power();
        return { k: 'fn', f: t.v, a: arg };
      }
      if (isOp('(')) {
        p++; var e = expr();
        if (!isOp(')')) throw new MathError('Parenthèse fermante manquante.');
        p++; return { k: 'par', a: e };
      }
      throw new MathError('« ' + t.v + ' » mal placé.');
    }
    var tree = expr();
    if (p < toks.length) throw new MathError(isOp(')') ? 'Parenthèse fermante en trop.' : 'Expression mal formée.');
    return tree;
  }

  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n || n > 170) return NaN;
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  function evaluate(n, env) {
    switch (n.k) {
      case 'num': return n.v;
      case 'const': return CONSTS[n.n];
      case 'var': return env[n.n];
      case 'par': return evaluate(n.a, env);
      case 'neg': return -evaluate(n.a, env);
      case 'fact': return factorial(evaluate(n.a, env));
      case 'pct': return evaluate(n.a, env) / 100;
      case 'fn': return FUNCS[n.f](evaluate(n.a, env));
      case 'bin':
        var a = evaluate(n.a, env), b = evaluate(n.b, env);
        if (n.op === '+') return a + b;
        if (n.op === '-') return a - b;
        if (n.op === '*') return a * b;
        if (n.op === '/') return a / b;
        if (n.op === '^') return Math.pow(a, b);
    }
    return NaN;
  }

  // LaTeX rendering of a parsed answer, so students see how it was understood.
  function prec(n) {
    if (n.k === 'par') return prec(n.a);
    if (n.k === 'bin') return { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 }[n.op];
    if (n.k === 'neg') return 1.5;
    return 5;
  }
  function wrap(s) { return '\\left(' + s + '\\right)'; }
  function tex(n) {
    switch (n.k) {
      case 'num': return n.s.replace('.', '{,}');
      case 'const': return n.n === 'pi' ? '\\pi' : 'e';
      case 'var': return n.n;
      case 'par': return tex(n.a);
      case 'neg': return '-' + (prec(n.a) <= 1.5 ? wrap(tex(n.a)) : tex(n.a));
      case 'fact': return (prec(n.a) < 5 ? wrap(tex(n.a)) : tex(n.a)) + '!';
      case 'pct': return tex(n.a) + '\\,\\%';
      case 'fn':
        if (n.f === 'sqrt' || n.f === 'racine') return '\\sqrt{' + tex(n.a) + '}';
        if (n.f === 'abs') return '\\left|' + tex(n.a) + '\\right|';
        if (n.f === 'exp') return 'e^{' + tex(n.a) + '}';
        return TEXF[n.f] + (n.a.k === 'var' || n.a.k === 'num' ? ' ' + tex(n.a) : wrap(tex(n.a)));
      case 'bin':
        var a = tex(n.a), b = tex(n.b);
        if (n.op === '/') return '\\dfrac{' + a + '}{' + b + '}';
        if (n.op === '^') {
          var inner = n.a.k === 'par' ? n.a.a : n.a;
          var base = (prec(n.a) < 5 || inner.k === 'fn' || inner.k === 'fact' || inner.k === 'pct' || inner.k === 'num' && /\./.test(inner.s)) ? wrap(a) : a;
          return base + '^{' + b + '}';
        }
        if (n.op === '+') return a + '+' + b;
        if (n.op === '-') return a + '-' + (prec(n.b) <= 1.5 ? wrap(b) : b);
        // multiplication
        if (prec(n.a) < 2) a = wrap(a);
        if (prec(n.b) <= 2) b = wrap(b);
        if (/^[-\d]/.test(b)) return a + ' \\times ' + b;
        if (/\d$/.test(a) && /^[a-zA-Z\\]/.test(b)) return a + b;
        return a + '\\,' + b;
    }
    return '?';
  }

  /* ----- Comparing a student's answer with the expected one ----- */
  function compileAnswer(raw) {
    var s = raw.trim(), tol = null, upToConstant = false;
    var pm = s.split(/±|\+\/-/);
    if (pm.length > 1) { s = pm[0]; tol = Math.abs(evaluate(parse(pm[1], [], false), {})); }
    if (/\+\s*C\s*$/.test(s)) { upToConstant = true; s = s.replace(/\+\s*C\s*$/, ''); }
    var vars = [];
    var tree = parse(s, vars, true);
    return { tree: tree, vars: vars, tol: tol, upToConstant: upToConstant };
  }

  function sampleEnvs(vars, count) {
    var envs = [];
    for (var i = 0; i < count; i++) {
      var env = {};
      vars.forEach(function (v) { env[v] = 0.35 + Math.random() * 2.3; });
      envs.push(env);
    }
    return envs;
  }

  function checkMath(answer, input) {
    var s = input;
    if (answer.upToConstant) s = s.replace(/\+\s*[cCkK]\s*$/, '');
    var tree = parse(s, answer.vars.slice(), false);
    if (!answer.vars.length) {
      var got = evaluate(tree, {}), want = evaluate(answer.tree, {});
      if (!isFinite(got)) return false;
      var tol = answer.tol !== null ? answer.tol : 1e-9 + 5e-3 * Math.abs(want);
      return Math.abs(got - want) <= tol + 1e-12;
    }
    var envs = sampleEnvs(answer.vars, 24), diffs = [];
    envs.forEach(function (env) {
      var g = evaluate(tree, env), w = evaluate(answer.tree, env);
      if (isFinite(g) && isFinite(w)) diffs.push({ d: g - w, w: w });
    });
    if (diffs.length < 4) return false;
    var ref = answer.upToConstant ? diffs[0].d : 0;
    return diffs.every(function (x) { return Math.abs(x.d - ref) <= 1e-6 * (1 + Math.abs(x.w) + Math.abs(ref)); });
  }

  function normText(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[’`]/g, "'")
      .replace(/[^a-z0-9' ]+/g, ' ')
      .replace(/^(le|la|les|l'|un|une|des)\s*/, '')
      .replace(/\s+/g, ' ').trim();
  }

  /* ======================================================================
     2. Parsing the plain-text quiz
     ====================================================================== */
  function parseQuiz(src) {
    var lines = src.replace(/\r\n?/g, '\n').split('\n');
    var intro = [], questions = [], q = null, last = null;
    lines.forEach(function (line) {
      if (/^\s*%/.test(line)) return;                                  // comment
      var m = line.match(/^([?+\-=~!>])\s(.*)$/) || line.match(/^([?+\-=~!>])$/);
      if (m) {
        var mark = m[1], text = m[2] || '';
        if (mark === '?') { q = { text: text, choices: [], hints: [], expl: [], math: null, words: null }; questions.push(q); last = { kind: 'text' }; return; }
        if (!q) { intro.push(line); return; }
        if (mark === '+' || mark === '-') { q.choices.push({ text: text, ok: mark === '+' }); last = { kind: 'choice', i: q.choices.length - 1 }; return; }
        if (mark === '=') { q.math = text; last = null; return; }
        if (mark === '~') { q.words = text.split('|').map(function (x) { return x.trim(); }).filter(Boolean); last = null; return; }
        if (mark === '!') { q.hints.push(text); last = { kind: 'hint' }; return; }
        if (mark === '>') { q.expl.push(text); last = { kind: 'expl' }; return; }
      }
      if (!q) { intro.push(line); return; }
      if (!last) return;
      if (last.kind === 'text') q.text += '\n' + line;
      else if (last.kind === 'choice') q.choices[last.i].text += '\n' + line;
      else if (last.kind === 'hint') q.hints[q.hints.length - 1] += '\n' + line;
      else if (last.kind === 'expl' && line.trim() !== '') q.expl.push(line);
    });
    questions.forEach(function (x) {
      x.type = x.choices.length ? (x.choices.filter(function (c) { return c.ok; }).length > 1 ? 'multi' : 'single')
        : x.math !== null ? 'math' : x.words ? 'text' : 'none';
      if (x.type === 'math') {
        try { x.answer = compileAnswer(x.math); }
        catch (e) { x.type = 'broken'; x.error = 'Réponse « = ' + x.math + ' » illisible : ' + e.message; }
      }
    });
    return { intro: intro.join('\n').trim(), questions: questions };
  }

  /* ----- Tiny Markdown: paragraphs, **bold**, *italic*, `code`, links, images.
           Math between $…$ is left untouched for MathJax. ----- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inline(s) {
    var parts = s.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/);
    return parts.map(function (part, i) {
      if (i % 2) return esc(part);
      return part
        .replace(/`([^`]+)`/g, function (_, c) { return '<code>' + esc(c) + '</code>'; })
        .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    }).join('');
  }
  function md(s) {
    return s.trim().split(/\n\s*\n/).map(function (p) { return '<p>' + inline(p.replace(/\n/g, ' ')) + '</p>'; }).join('');
  }
  function mdLines(arr) { return arr.map(function (l) { return '<p>' + inline(l) + '</p>'; }).join(''); }

  /* ======================================================================
     3. User interface
     ====================================================================== */
  var root = document.getElementById('quiz');
  var srcEl = document.getElementById('quiz-source');
  if (!root || !srcEl) return;

  var mjQueue = Promise.resolve();
  function typeset(el) {
    mjQueue = mjQueue.then(function () {
      if (!window.MathJax || !MathJax.startup || !MathJax.startup.promise) return waitForMathJax().then(function () { return typeset(el); });
      return MathJax.startup.promise.then(function () {
        if (MathJax.typesetClear) MathJax.typesetClear([el]);
        return MathJax.typesetPromise([el]);
      });
    }).catch(function () {});
    return mjQueue;
  }
  function waitForMathJax() {
    return new Promise(function (resolve) {
      var n = 0, t = setInterval(function () {
        if ((window.MathJax && MathJax.typesetPromise) || ++n > 100) { clearInterval(t); resolve(); }
      }, 100);
    });
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var quiz = parseQuiz(srcEl.textContent);
  var storeKey = 'quiz-best:' + location.pathname;
  var bar = document.getElementById('quiz-bar');
  var state;

  function build() {
    root.innerHTML = '';
    state = { items: [], done: 0 };
    if (quiz.intro) root.appendChild(el('div', 'quiz-intro', md(quiz.intro)));

    var qs = quiz.questions.slice();
    if (root.getAttribute('data-shuffle-questions') === 'true') shuffle(qs);
    qs.forEach(function (q, i) { state.items.push(buildQuestion(q, i + 1)); });

    var result = el('div', 'quiz-result'); result.hidden = true; result.id = 'quiz-result';
    root.appendChild(result);
    if (bar) bar.hidden = false;
    updateBar();
    typeset(root);
  }

  function buildQuestion(q, num) {
    var item = { q: q, first: null, solved: false };
    var box = el('section', 'q'); box.id = 'q' + num;
    box.setAttribute('aria-labelledby', 'q' + num + '-t');
    box.appendChild(el('span', 'q-num', num + ')'));
    var mark = el('span', 'q-mark'); mark.setAttribute('aria-hidden', 'true'); box.appendChild(mark);
    var text = el('div', 'q-text', md(q.text)); text.id = 'q' + num + '-t';
    box.appendChild(text);

    if (q.type === 'broken' || q.type === 'none') {
      box.appendChild(el('p', 'q-preview is-error', q.type === 'broken' ? esc(q.error) : 'Question sans réponse : ajoutez des lignes « + », « - », « = » ou « ~ ».'));
      root.appendChild(box);
      item.solved = true; item.first = true; item.skip = true;
      return item;
    }

    var inputs = [], textInput = null, preview = null;
    if (q.type === 'single' || q.type === 'multi') {
      if (q.type === 'multi') box.appendChild(el('p', 'q-help', 'Plusieurs réponses possibles.'));
      var fs = el('fieldset', 'q-choices');
      var legend = el('legend', 'sr-only', 'Choix pour la question ' + num); fs.appendChild(legend);
      var order = q.choices.map(function (c, i) { return i; });
      var vf = q.choices.length === 2 && q.choices.every(function (c) { return /^(vrai|faux)$/i.test(c.text.trim()); });
      if (vf) fs.classList.add('inline');
      if (root.getAttribute('data-shuffle-choices') === 'true' && !vf) shuffle(order);
      order.forEach(function (ci) {
        var lab = el('label', 'choice');
        var inp = document.createElement('input');
        inp.type = q.type === 'multi' ? 'checkbox' : 'radio';
        inp.name = 'q' + num; inp.value = ci;
        lab.appendChild(inp);
        lab.appendChild(el('span', null, inline(q.choices[ci].text.replace(/\n/g, ' '))));
        fs.appendChild(lab);
        inputs.push(inp);
      });
      box.appendChild(fs);
    } else {
      var wrapEl = el('div', 'q-input');
      textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.setAttribute('autocomplete', 'off');
      textInput.setAttribute('autocapitalize', 'off');
      textInput.setAttribute('spellcheck', 'false');
      textInput.setAttribute('aria-label', 'Votre réponse à la question ' + num);
      textInput.placeholder = q.type === 'math' ? (q.answer.vars.length ? 'Ex. : 2x^2 + 1' : 'Ex. : 1/4 ou 0,25') : 'Votre réponse';
      wrapEl.appendChild(textInput);
      if (q.type === 'math') {
        preview = el('div', 'q-preview'); preview.setAttribute('aria-live', 'polite');
        wrapEl.appendChild(preview);
        var timer;
        textInput.addEventListener('input', function () {
          clearTimeout(timer);
          timer = setTimeout(function () { renderPreview(q, textInput.value, preview); }, 250);
        });
      }
      box.appendChild(wrapEl);
      textInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); if (!checkBtn.hidden && !checkBtn.disabled) checkBtn.click(); }
      });
    }

    var actions = el('div', 'q-actions');
    var checkBtn = el('button', 'btn btn-primary', 'Vérifier'); checkBtn.type = 'button';
    var retryBtn = el('button', 'btn', 'Réessayer'); retryBtn.type = 'button'; retryBtn.hidden = true;
    var showBtn = el('button', 'btn', 'Voir la correction'); showBtn.type = 'button'; showBtn.hidden = true;
    var hintBtn = null;
    actions.appendChild(checkBtn); actions.appendChild(retryBtn); actions.appendChild(showBtn);
    var hintBox = null;
    if (q.hints.length) {
      hintBtn = el('button', 'btn', 'Indice'); hintBtn.type = 'button';
      actions.appendChild(hintBtn);
      hintBox = el('div', 'q-hint-text', mdLines(q.hints)); hintBox.hidden = true;
      hintBtn.addEventListener('click', function () {
        hintBox.hidden = false; hintBtn.hidden = true; typeset(hintBox);
      });
    }
    box.appendChild(actions);
    if (hintBox) box.appendChild(hintBox);
    var fb = el('div', 'q-feedback'); fb.hidden = true; fb.setAttribute('role', 'status');
    box.appendChild(fb);
    root.appendChild(box);

    function hasAnswer() {
      if (textInput) return textInput.value.trim() !== '';
      return inputs.some(function (i) { return i.checked; });
    }
    function setEnabled() { checkBtn.disabled = !hasAnswer(); }
    setEnabled();
    (textInput ? [textInput] : inputs).forEach(function (i) {
      i.addEventListener(textInput ? 'input' : 'change', setEnabled);
    });

    function lock(on) {
      box.classList.toggle('is-locked', on);
      inputs.forEach(function (i) { i.disabled = on; });
      if (textInput) textInput.readOnly = on;
    }

    function grade() {
      if (q.type === 'single' || q.type === 'multi') {
        return inputs.every(function (i) { return i.checked === q.choices[+i.value].ok; });
      }
      if (q.type === 'text') {
        var v = normText(textInput.value);
        return q.words.some(function (w) { return normText(w) === v; });
      }
      return checkMath(q.answer, textInput.value);
    }

    function expectedHtml() {
      if (q.type === 'math') {
        var t = tex(q.answer.tree) + (q.answer.upToConstant ? '+C' : '');
        return '<p>Réponse attendue : $' + t + '$' + (q.answer.upToConstant ? ' (C constante quelconque)' : '') + '</p>';
      }
      if (q.type === 'text') return '<p>Réponse attendue : <strong>' + esc(q.words[0]) + '</strong></p>';
      return '';
    }

    function showFeedback(ok, revealed) {
      fb.hidden = false;
      fb.className = 'q-feedback ' + (ok ? 'ok' : 'ko');
      var verdict = ok ? (item.first === true ? 'Juste !' : 'Juste, cette fois !') : (revealed ? 'Correction' : 'Faux');
      var html = '<span class="q-verdict">' + verdict + '</span>';
      if (!ok && !revealed) html += '<p>Réessayez, ou affichez la correction.</p>';
      if (ok || revealed) {
        if (!ok) html += expectedHtml();
        if (q.expl.length) html += mdLines(q.expl);
      }
      fb.innerHTML = html;
      typeset(fb);
    }

    function markChoices() {
      inputs.forEach(function (i) {
        var lab = i.closest('.choice');
        lab.classList.toggle('is-right', q.choices[+i.value].ok);
        lab.classList.toggle('is-wrong', i.checked && !q.choices[+i.value].ok);
      });
    }

    checkBtn.addEventListener('click', function () {
      var ok;
      try { ok = grade(); }
      catch (e) {
        if (preview) { preview.className = 'q-preview is-error'; preview.textContent = e.message || 'Réponse illisible.'; }
        return;
      }
      if (item.first === null) { item.first = ok; state.done++; }
      var anchor = box.querySelector('.q-choices, .q-input');
      if (anchor) mark.style.top = (anchor.offsetTop + 4) + 'px';
      mark.textContent = ok ? '✓' : '✗';
      mark.className = 'q-mark ' + (ok ? 'ok' : 'ko');
      if (textInput) textInput.className = ok ? 'is-right' : 'is-wrong';
      if (ok) {
        item.solved = true; lock(true);
        if (inputs.length) markChoices();
        checkBtn.hidden = true; retryBtn.hidden = true; showBtn.hidden = true;
        if (hintBtn) hintBtn.hidden = true;
      } else {
        lock(true);
        if (inputs.length) inputs.forEach(function (i) { if (i.checked) i.closest('.choice').classList.add('is-wrong'); });
        checkBtn.hidden = true; retryBtn.hidden = false; showBtn.hidden = false;
      }
      showFeedback(ok, false);
      updateBar();
    });

    retryBtn.addEventListener('click', function () {
      lock(false);
      inputs.forEach(function (i) { i.checked = false; i.closest('.choice').classList.remove('is-wrong', 'is-right'); });
      if (textInput) { textInput.className = ''; textInput.select(); }
      mark.textContent = ''; fb.hidden = true;
      retryBtn.hidden = true; showBtn.hidden = true; checkBtn.hidden = false;
      setEnabled();
      (textInput || inputs[0]).focus();
    });

    showBtn.addEventListener('click', function () {
      item.solved = true; lock(true);
      if (inputs.length) markChoices();
      retryBtn.hidden = true; showBtn.hidden = true;
      if (hintBtn) hintBtn.hidden = true;
      showFeedback(false, true);
      updateBar();
    });

    return item;
  }

  function renderPreview(q, value, preview) {
    if (!value.trim()) { preview.innerHTML = ''; preview.className = 'q-preview'; return; }
    try {
      var s = value;
      if (q.answer.upToConstant) s = s.replace(/\+\s*[cCkK]\s*$/, '');
      var tree = parse(s, q.answer.vars.slice(), false);
      preview.className = 'q-preview';
      preview.innerHTML = 'Compris comme : \\(' + tex(tree) + '\\)';
      typeset(preview);
    } catch (e) {
      preview.className = 'q-preview is-error';
      preview.textContent = e.message || 'Réponse illisible.';
    }
  }

  function updateBar() {
    var real = state.items.filter(function (i) { return !i.skip; });
    var answered = real.filter(function (i) { return i.first !== null; }).length;
    var total = real.length;
    var count = document.getElementById('quiz-count');
    var fill = document.getElementById('quiz-fill');
    if (count) count.textContent = answered + ' / ' + total + ' questions';
    if (fill) fill.style.width = (total ? (100 * answered / total) : 0) + '%';
    if (total && real.every(function (i) { return i.solved; })) showResult(real);
  }

  function showResult(real) {
    var result = document.getElementById('quiz-result');
    if (!result || !result.hidden) return;
    var right = real.filter(function (i) { return i.first === true; }).length;
    var g = Math.round(right / real.length * 40) / 2;   // /20, rounded to half points
    var gs = String(g).replace('.', ',');
    var msg = g >= 16 ? 'Excellent travail.' :
      g >= 12 ? 'Bien. Relisez les explications des questions manquées.' :
      g >= 10 ? 'C’est la moyenne. Revoyez les corrections, puis recommencez.' :
      'À retravailler : relisez le cours, puis recommencez le quiz.';
    var best = null;
    try {
      best = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (!best || g > best.grade) {
        localStorage.setItem(storeKey, JSON.stringify({ grade: g, date: new Date().toISOString().slice(0, 10) }));
      }
    } catch (e) {}
    result.innerHTML =
      '<div class="grade" aria-hidden="true"><span>' + gs + '<small>/20</small></span></div>' +
      '<div><h2>Note : ' + gs + ' sur 20</h2>' +
      '<p>' + right + ' bonne' + (right > 1 ? 's' : '') + ' réponse' + (right > 1 ? 's' : '') + ' du premier coup sur ' + real.length + '. ' + msg +
      (best && best.grade > g ? ' Votre meilleure note reste ' + String(best.grade).replace('.', ',') + '/20.' : '') + '</p>' +
      '<p class="actions"><button class="btn btn-primary" type="button" id="quiz-restart">Recommencer le quiz</button></p></div>';
    result.hidden = false;
    document.getElementById('quiz-restart').addEventListener('click', function () {
      build();
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
    });
  }

  // Exposed for testing in the browser console
  window.QuizEngine = { parse: parse, evaluate: evaluate, tex: tex, compileAnswer: compileAnswer, checkMath: checkMath, parseQuiz: parseQuiz, normText: normText };

  build();
})();
