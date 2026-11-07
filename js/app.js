/* ==========================================================================
   Nexus Play \u2014 comportamento 3D, din\u00e2mico e interativo
   Sem depend\u00eancias: coverflow 3D, tilt, slides, campos de estrelas (proje\u00e7\u00e3o
   perspectiva real), downloads ao vivo, busca, favoritos, modal, toasts e paleta.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.NEXUS_DATA || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  function reduced() { return mqReduce.matches; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) { return Number(n).toLocaleString('pt-BR'); }
  function brl(n) {
    return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function svgUse(id, cls) { return '<svg class="' + (cls || 'i') + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  /* ------------------------------ Diagn\u00f3stico silencioso ------------------------------ */
  window.addEventListener('error', function (e) {
    var box = document.getElementById('errlog');
    if (box) {
      box.hidden = false;
      box.textContent = 'Erro de script: ' + (e.message || '') +
        ' \u2014 ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '');
    }
  });

  /* ------------------------------ Toasts ------------------------------ */
  var toastHost = $('#toasts');
  function toast(msg, actionLabel, actionFn) {
    if (!toastHost) return;
    var t = document.createElement('div');
    t.className = 'toast';
    var m = document.createElement('span');
    m.className = 'toast-msg';
    m.textContent = msg;
    t.appendChild(m);
    var timer;
    function dismiss() {
      clearTimeout(timer);
      t.classList.remove('is-on');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }
    if (actionLabel) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'toast-act';
      b.textContent = actionLabel;
      b.addEventListener('click', function () { if (actionFn) actionFn(); dismiss(); });
      t.appendChild(b);
    }
    toastHost.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    timer = setTimeout(dismiss, 4600);
    while (toastHost.children.length > 3) toastHost.removeChild(toastHost.firstChild);
  }

  /* ==================================================================
     RENDER \u2014 rail de amigos
     ================================================================== */
  var railMount = $('#railMount');

  function friendLabel(f) {
    if (f.status === 'playing') return f.name + ' \u2014 jogando ' + f.game;
    if (f.status === 'online') return f.name + ' \u2014 online';
    if (f.status === 'offline') return f.name + ' \u2014 offline';
    return f.name + ' \u2014 ausente';
  }
  function friendBtnHtml(f, i) {
    var cls = f.status === 'online' ? ' is-online' : (f.status === 'offline' ? ' is-offline' : '');
    var badge = f.status === 'playing'
      ? '<span class="badge badge-game" aria-hidden="true">' + svgUse('ic-gamepad', 'i-mini') + '</span>' : '';
    return '<button class="rail-avatar' + cls + '" type="button" data-friend="' + i +
      '" aria-label="' + esc(friendLabel(f)) + '"><svg aria-hidden="true"><use href="#' + f.avatar +
      '"/></svg>' + badge + '</button>';
  }
  function renderRail() { railMount.innerHTML = D.friends.map(friendBtnHtml).join(''); }
  function updateFriend(i) {
    var btn = railMount.querySelector('[data-friend="' + i + '"]');
    if (btn) btn.outerHTML = friendBtnHtml(D.friends[i], i);
  }

  /* ==================================================================
     RENDER \u2014 lista lateral
     ================================================================== */
  var listMount = $('#listMount');
  function visibleList(q) {
    q = (q || '').toLowerCase();
    return D.list.filter(function (g) {
      return !q || g.title.toLowerCase().indexOf(q) > -1 || g.sub.toLowerCase().indexOf(q) > -1 ||
        g.genre.toLowerCase().indexOf(q) > -1;
    });
  }
  function emptyHtml(msg) {
    return '<div class="empty">' + svgUse('ic-search') + '<span>' + esc(msg) + '</span></div>';
  }
  function rowHtml(g) {
    return '<a class="game-row" href="#" data-game="' + g.id + '">' +
      '<img class="row-thumb" src="' + (g.thumb || g.cover) + '" width="64" height="64" alt="" loading="lazy" decoding="async">' +
      '<span class="row-txt"><span class="row-title">' + esc(g.title) + '</span>' +
      '<span class="row-sub">' + esc(g.sub) + '</span></span>' +
      svgUse('ic-chevron', 'i row-chev') + '</a>';
  }
  function renderList(q) {
    var items = visibleList(q);
    listMount.innerHTML = items.length
      ? items.map(rowHtml).join('')
      : emptyHtml(q ? 'Nenhum jogo da sua lista para \u201c' + q + '\u201d.' : 'Sua lista est\u00e1 vazia.');
  }

  /* ==================================================================
     COVERFLOW 3D \u2014 "Novos Jogos"
     ================================================================== */
  var stage = $('#coverflow');
  var arrowNext = $('#carousel-next');
  var cfLive = $('#cfLive');
  var cfItems = [];
  var active = 0;
  var extrasShown = true; /* \u201cVer mais\u201d agora navega para a se\u00e7\u00e3o Jogos */
  var suppressClickUntil = 0;

  function visibleGames() {
    return D.games.filter(function (g) { return !g.extra || extrasShown; });
  }
  function visibleGamesQ(q) {
    q = (q || '').toLowerCase();
    return visibleGames().filter(function (g) {
      return !q || g.title.toLowerCase().indexOf(q) > -1 ||
        g.genre.toLowerCase().indexOf(q) > -1 || g.sub.toLowerCase().indexOf(q) > -1;
    });
  }
  function findGame(id) {
    var all = (D.catalog || []).concat(D.list, D.games);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function cardHtml(g) {
    return '<div class="cf-item" data-id="' + g.id + '">' +
      '<a class="game-card" href="#" data-open="' + g.id + '">' +
        '<img class="card-art" src="' + g.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
        '<span class="card-play" aria-hidden="true">' + svgUse('ic-play') + '</span>' +
        '<span class="card-body"><h3>' + esc(g.title) + '</h3>' +
        '<span class="card-sub">' + esc(g.sub) + '</span>' +
        '<p>' + esc(g.desc) + '</p></span>' +
      '</a>' +
      '<button class="card-fav' + (favs.has(g.id) ? ' is-on' : '') + '" type="button" data-fav="' + g.id +
        '" aria-pressed="' + (favs.has(g.id) ? 'true' : 'false') +
        '" aria-label="Favoritar ' + esc(g.title) + '">' + svgUse('ic-heart', 'i i-heart') + '</button>' +
    '</div>';
  }

  function renderCoverflow(q) {
    var items = visibleGamesQ(q);
    if (!items.length) {
      stage.innerHTML = emptyHtml(q ? 'Nenhum jogo encontrado para \u201c' + q + '\u201d.' : 'Nenhum jogo por aqui.');
      cfItems = [];
      arrowNext.disabled = true;
      return;
    }
    arrowNext.disabled = items.length < 2;
    stage.innerHTML = items.map(cardHtml).join('');
    cfItems = $$('.cf-item', stage);
    active = clamp(active, 0, cfItems.length - 1);
    layout();
  }

  function layout() {
    var n = cfItems.length;
    if (!n) return;
    cfItems.forEach(function (it, i) {
      var off = i - active;
      if (off > n / 2) off -= n;
      else if (off < -n / 2) off += n;
      var a = Math.abs(off);
      var dir = off < 0 ? -1 : 1;
      var tx, tz, ry, sc, br, bl, op, z;

      if (off === 0) {
        tx = '0%'; tz = '64px'; ry = '0deg'; sc = '1';
        br = '1'; bl = '0px'; op = '1'; z = '6';
      } else if (a === 1) {
        tx = (dir * 78) + '%'; tz = '-56px'; ry = (-dir * 34) + 'deg'; sc = '.88';
        br = '.66'; bl = '1.6px'; op = '.95'; z = '5';
      } else {
        var mag = 78 + (a - 1) * 40;
        tx = (dir * mag) + '%'; tz = (-56 - (a - 1) * 96) + 'px'; ry = (-dir * (34 + (a - 1) * 9)) + 'deg';
        sc = String(Math.max(.5, .88 - (a - 1) * .15));
        br = String(Math.max(.28, .66 - (a - 1) * .2));
        bl = (1.6 + (a - 1) * 1.6) + 'px';
        op = String(Math.max(.28, .95 - (a - 1) * .42));
        z = String(Math.max(2, 5 - (a - 1)));
      }

      it.style.setProperty('--tx', tx);
      it.style.setProperty('--tz', tz);
      it.style.setProperty('--ry', ry);
      it.style.setProperty('--sc', sc);
      it.style.setProperty('--br', br);
      it.style.setProperty('--bl', bl);
      it.style.setProperty('--co', op);
      it.style.setProperty('--z', z);
      it.style.setProperty('--dry', '0deg');
      it.style.setProperty('--dtx', '0%');

      var card = it.querySelector('.game-card');
      var isAct = off === 0;
      it.classList.toggle('is-active', isAct);
      card.classList.toggle('is-active', isAct);

      var far = a > 2;
      it.setAttribute('aria-hidden', far ? 'true' : 'false');
      if (far) it.setAttribute('inert', ''); else it.removeAttribute('inert');
      card.setAttribute('aria-current', isAct ? 'true' : 'false');
      card.setAttribute('aria-label', (i + 1) + ' de ' + n + ' \u2014 ' + (it.dataset.id ? (findGame(it.dataset.id) || {}).title : ''));
      if (far) card.setAttribute('tabindex', '-1'); else card.removeAttribute('tabindex');
    });
    if (cfLive) {
      var cur = cfItems[active];
      var g = cur ? findGame(cur.dataset.id) : null;
      if (g) cfLive.textContent = 'Destaque: ' + g.title + ' (' + (active + 1) + ' de ' + n + ')';
    }
  }

  function go(dir) {
    var n = cfItems.length;
    if (n < 2) return;
    active = (active + dir + n) % n;
    layout();
  }

  /* arrasto horizontal com retorno el\u00e1stico */
  var dragging = false, startX = 0, movedDx = 0;
  if (stage) {
    stage.addEventListener('pointerdown', function (e) {
      if (e.button || !cfItems.length) return;
      dragging = true; startX = e.clientX; movedDx = 0;
      stage.classList.add('is-grabbing', 'is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      movedDx = e.clientX - startX;
      var cur = cfItems[active];
      if (cur) {
        cur.style.setProperty('--dry', clamp(movedDx / -14, -16, 16) + 'deg');
        cur.style.setProperty('--dtx', clamp(movedDx * 0.07, -9, 9) + '%');
      }
    }, { passive: true });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (stage) stage.classList.remove('is-grabbing', 'is-drag');
      var cur = cfItems[active];
      if (cur) { cur.style.setProperty('--dry', '0deg'); cur.style.setProperty('--dtx', '0%'); }
      if (Math.abs(movedDx) > 44) go(movedDx < 0 ? 1 : -1);
      if (Math.abs(movedDx) > 7) suppressClickUntil = Date.now() + 250;
      movedDx = 0;
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  }

  /* ==================================================================
     HERO \u2014 slides autom\u00e1ticos
     ================================================================== */
  var hero = $('#hero');
  var slideIdx = 0, heroTimer = null, heroHover = false;

  function applySlide(s) {
    $('[data-hero="title"]').textContent = s.title;
    $('[data-hero="desc"]').textContent = s.desc;
    var use = $('[data-hero="tag"] use'); if (use) use.setAttribute('href', '#' + s.tag.icon);
    $('[data-hero="taglabel"]').textContent = s.tag.label;
    var d0 = $('[data-hero="dot0"] use'), d1 = $('[data-hero="dot1"] use');
    if (d0) d0.setAttribute('href', '#' + s.dots[0]);
    if (d1) d1.setAttribute('href', '#' + s.dots[1]);
    $('[data-hero="stack"]').innerHTML = s.players.map(function (a) {
      return '<span class="av"><svg><use href="#' + a + '"/></svg></span>';
    }).join('');
    $('[data-hero="reviewstxt"]').textContent = s.reviews;
    var art = $('.hero-art');
    art.style.filter = s.art.filter;
    art.style.setProperty('--art-flip', s.art.flip ? 'scaleX(-1)' : 'none');
    art.alt = s.alt;
    hero.style.setProperty('--hero-grad', s.grad);
  }

  function markDots() {
    $$('.hero-dots .dot').forEach(function (d, i) {
      d.classList.toggle('is-active', i === slideIdx);
      d.setAttribute('aria-current', i === slideIdx ? 'true' : 'false');
    });
  }

  function paintSlide(i, animate) {
    var s = D.slides[i];
    if (!s || !hero) return;
    slideIdx = i;
    markDots();
    if (!animate || reduced()) { applySlide(s); scheduleHero(); return; }
    hero.classList.add('is-out');
    setTimeout(function () {
      applySlide(s);
      void hero.offsetWidth;
      hero.classList.remove('is-out');
    }, 270);
    scheduleHero();
  }

  function scheduleHero() {
    clearTimeout(heroTimer);
    if (reduced()) return;
    heroTimer = setTimeout(function tick() {
      if (!heroHover && !document.hidden && modalIsOpen()) {
        scheduleHero(); return;
      }
      if (!heroHover && !document.hidden) paintSlide((slideIdx + 1) % D.slides.length, true);
      else scheduleHero();
    }, 8200);
  }

  /* ==================================================================
     TILT 3D global (aponta \u2192 inclina + brilho)
     ================================================================== */
  var lastTilt = null, tiltRaf = 0, pendingEv = null;
  document.addEventListener('pointermove', function (e) { pendingEv = e; if (!tiltRaf) tiltRaf = requestAnimationFrame(updateTilt); }, { passive: true });

  function resetTilt(node) {
    if (!node) return;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    if (node.id === 'hero') { node.style.setProperty('--art-x', '0px'); node.style.setProperty('--art-y', '0px'); }
  }

  function updateTilt() {
    tiltRaf = 0;
    var e = pendingEv;
    if (!e || !mqFine.matches || reduced()) return;
    var node = e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
    if (node !== lastTilt) { resetTilt(lastTilt); lastTilt = node; }
    if (!node) return;
    var r = node.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var px = clamp((e.clientX - r.left) / r.width, 0, 1);
    var py = clamp((e.clientY - r.top) / r.height, 0, 1);
    var max = parseFloat(node.getAttribute('data-tilt')) || 4;
    node.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
    node.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
    node.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    node.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    if (node.id === 'hero') {
      node.style.setProperty('--art-x', ((0.5 - px) * 14).toFixed(1) + 'px');
      node.style.setProperty('--art-y', ((0.5 - py) * 10).toFixed(1) + 'px');
    }
    /* Sombra dinâmica baseada na inclinação */
    if (node) {
      var rx = Math.abs(parseFloat(node.style.getPropertyValue('--rx')) || 0);
      var ry = Math.abs(parseFloat(node.style.getPropertyValue('--ry')) || 0);
      var shadowIntensity = Math.min((rx + ry) / 8, 0.6);
      node.style.setProperty('--tilt-shadow', '0 20px 40px -15px rgba(0,0,0,' + shadowIntensity + ')');
    }
  }

  function injectGlare() {
    $$('[data-tilt]').forEach(function (n) {
      if (n.querySelector('.tilt-glare')) return;
      var g = document.createElement('span');
      g.className = 'tilt-glare';
      g.setAttribute('aria-hidden', 'true');
      n.appendChild(g);
    });
  }

  /* ==================================================================
     CAMPOS DE ESTRELAS \u2014 proje\u00e7\u00e3o perspectiva 3D em canvas
     ================================================================== */
  function Starfield(canvas, opts) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var W = 0, H = 0, DPR = 1, stars = [];
    var rotX = 0, rotY = 0, tgtX = 0, tgtY = 0, raf = 0, last = 0;
    var F = 460, FAR = 900;

    function resize() {
      var p = canvas.parentElement;
      if (!p) return;
      W = p.clientWidth; H = p.clientHeight;
      if (!W || !H) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      spawn();
      if (reduced()) draw(0, 16);
    }
    function spawn() {
      stars = [];
      var n = Math.max(24, Math.round(opts.count * Math.min(1.25, Math.max(.45, W * H / 640000))));
      for (var i = 0; i < n; i++) {
        stars.push({
          x: (Math.random() - .5) * W * 2.4,
          y: (Math.random() - .5) * H * 2.4,
          z: 40 + Math.random() * (FAR - 40),
          r: .5 + Math.random() * 1.5,
          a: .35 + Math.random() * .55,
          tw: Math.random() * 6.28,
          c: opts.colors[(Math.random() * opts.colors.length) | 0]
        });
      }
    }
    function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);
      rotX += (tgtX - rotX) * .05;
      rotY += (tgtY - rotY) * .05;
      var cX = W / 2, cY = H / 2;
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduced()) s.z -= 30 * dt;
        if (s.z < 40) { s.z = FAR; s.x = (Math.random() - .5) * W * 2.4; s.y = (Math.random() - .5) * H * 2.4; }
        var x1 = s.x * cosY - s.z * sinY;
        var z1 = s.x * sinY + s.z * cosY;
        var y1 = s.y * cosX - z1 * sinX;
        var z2 = s.y * sinX + z1 * cosX;
        if (z2 < 20) continue;
        var k = F / (F + z2);
        var px = cX + x1 * k, py = cY + y1 * k;
        if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
        var depth = clamp((FAR - s.z) / 520, 0, 1);
        var near = clamp((s.z - 40) / 150, 0, 1);
        var tw = .74 + .26 * Math.sin(t * .0021 + s.tw);
        ctx.globalAlpha = s.a * depth * near * tw;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(.4, s.r * k * 1.5), 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) {
      var dt = Math.min(.05, (t - last) / 1000 || .016);
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (raf || reduced() || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement || canvas);
    resize();
    if (reduced()) draw(0, 0); else start();

    return {
      setTarget: function (nx, ny) { tgtY = (nx - .5) * .55; tgtX = -(ny - .5) * .38; }
    };
  }

  /* ==================================================================
     DOWNLOADS ao vivo
     ================================================================== */
  var dlMount = $('#dlMount');
  var dlIdx = 0, dlPct = 0, dlPlaying = true, dlDone = false, dlTimer = null;
  var dlCompleted = []; /* itens j\u00e1 finalizados (hist\u00f3rico da p\u00e1gina Downloads) */

  function dlEmit(evt, data) { if (window.NX && NX.emit) NX.emit(evt, data); }

  function etaText(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.round(sec / 60);
    if (m >= 60) {
      var h = Math.floor(m / 60);
      return h + (h > 1 ? ' horas ' : ' hora ') + (m % 60) + ' min.';
    }
    if (m > 0) return m + ' min. ' + (sec % 60) + ' s';
    return sec + ' s';
  }
  function sizeText(cur, total) {
    if (total >= 1000) {
      var a = (cur / 1000).toFixed(1).replace('.', ','), b = (total / 1000).toFixed(1).replace('.', ',');
      return a + ' GB / ' + b + ' GB';
    }
    return Math.round(cur) + ' MB / ' + Math.round(total) + ' MB';
  }
  function dlRowHtml(item) {
    return '<article class="dl" data-tilt="4" aria-label="Download de ' + esc(item.name) + '">' +
      '<div class="dl-left">' +
        '<img class="dl-thumb" src="' + item.thumb + '" width="76" height="76" alt="" loading="lazy" decoding="async">' +
        '<div class="dl-info"><h3 class="dl-name">' + esc(item.name) + '</h3>' +
        '<span class="dl-tag">' + esc(item.tag) + '</span></div>' +
      '</div>' +
      '<div class="dl-right">' +
        '<div class="dl-meta">' +
          '<span class="dl-time" data-dl="time">\u2014</span>' +
          '<span class="progress" role="progressbar" aria-label="Progresso do download de ' + esc(item.name) +
            '" aria-valuemin="0" aria-valuemax="100"><span style="width:0%"></span></span>' +
          '<span class="dl-size" data-dl="size">\u2014</span>' +
        '</div>' +
        '<div class="dl-actions">' +
          '<button class="dl-btn dl-btn-play" type="button" data-dl-action="toggle" aria-label="Pausar download">' +
            svgUse('ic-play') + '</button>' +
          '<button class="dl-btn dl-btn-close" type="button" data-dl-action="cancel" aria-label="Cancelar download">' +
            svgUse('ic-close') + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderDownload() {
    var item = D.queue[dlIdx];
    if (!item) {
      dlMount.innerHTML = '<div class="dl-empty">' + svgUse('ic-check') +
        '<span>Tudo baixado \u2014 nenhum download pendente.</span></div>';
      stopTick();
      return;
    }
    dlPct = item.start || 0;
    dlPlaying = true;
    dlDone = dlPct >= 100;
    dlMount.innerHTML = dlRowHtml(item);
    updateDl();
    injectGlare();
    if (!dlDone) startTick();
    dlEmit('dlChange');
  }

  function updateDl() {
    var item = D.queue[dlIdx];
    var row = dlMount.querySelector('.dl');
    if (!item || !row) return;
    var bar = row.querySelector('.progress');
    var fill = bar.querySelector('span');
    fill.style.width = dlPct.toFixed(1) + '%';
    bar.setAttribute('aria-valuenow', Math.round(dlPct));
    row.querySelector('[data-dl="time"]').textContent = dlDone
      ? 'Conclu\u00eddo'
      : etaText(item.eta * 60 * (1 - dlPct / 100) / (1 - Math.min(99, item.start || 0) / 100));
    row.querySelector('[data-dl="size"]').textContent = sizeText(item.totalMB * dlPct / 100, item.totalMB);
    row.classList.toggle('is-done', dlDone);
    dlEmit('dlTick');
  }

  function startTick() {
    stopTick();
    dlTimer = setInterval(function () {
      if (!dlPlaying || dlDone || document.hidden) return;
      var item = D.queue[dlIdx];
      if (!item) return;
      dlPct = Math.min(100, dlPct + 100 / (Math.max(20, item.eta || 1) * 4));
      if (dlPct >= 100) {
        dlPct = 100; dlDone = true;
        updateDl();
        var row = dlMount.querySelector('.dl');
        if (row) { var b = row.querySelector('[data-dl-action="toggle"]'); if (b) b.innerHTML = svgUse('ic-check'); }
        stopTick();
        dlCompleted.unshift({ name: item.name, tag: item.tag, cover: item.thumb, mb: item.totalMB, when: 'agora' });
        dlEmit('dlChange');
        toast('\u201c' + item.name + '\u201d conclu\u00eddo.');
        setTimeout(advanceQueue, 2600);
        return;
      }
      updateDl();
    }, 250);
  }
  function stopTick() { if (dlTimer) clearInterval(dlTimer); dlTimer = null; }

  function advanceQueue() {
    var row = dlMount.querySelector('.dl');
    if (row) row.classList.add('is-out');
    setTimeout(function () {
      dlIdx++;
      if (dlIdx >= D.queue.length) {
        dlMount.innerHTML = '<div class="dl-empty">' + svgUse('ic-check') +
          '<span>Tudo baixado \u2014 nenhum download pendente.</span></div>';
        stopTick();
        dlEmit('dlChange');
        return;
      }
      renderDownload();
      var r2 = dlMount.querySelector('.dl');
      if (r2) r2.classList.add('is-in');
      toast('Novo download iniciado: ' + D.queue[dlIdx].name + '.');
    }, 440);
  }

  function dlAction(kind) {
    var item = D.queue[dlIdx];
    var row = dlMount.querySelector('.dl');
    if (!item || !row) return;
    if (kind === 'toggle') {
      if (dlDone) { toast('\u201c' + item.name + '\u201d j\u00e1 est\u00e1 instalado.'); return; }
      dlPlaying = !dlPlaying;
      var b = row.querySelector('[data-dl-action="toggle"]');
      b.innerHTML = svgUse(dlPlaying ? 'ic-play' : 'ic-pause');
      b.setAttribute('aria-label', dlPlaying ? 'Pausar download' : 'Retomar download');
      dlEmit('dlChange');
      toast(dlPlaying ? 'Download retomado.' : 'Download pausado.');
      return;
    }
    if (kind === 'cancel') {
      if (dlDone) { toast('\u201c' + item.name + '\u201d j\u00e1 foi conclu\u00eddo.'); return; }
      stopTick();
      row.classList.add('is-out');
      dlEmit('dlChange');
      var snapshot = { idx: dlIdx, pct: dlPct, item: item };
      setTimeout(function () {
        dlMount.innerHTML = '<div class="dl-empty">' + svgUse('ic-download') +
          '<span>Nenhum download ativo no momento.</span></div>';
      }, 430);
      toast('Download de \u201c' + item.name + '\u201d cancelado.', 'Desfazer', function () {
        if (D.queue[snapshot.idx] !== snapshot.item) { toast('Esse download j\u00e1 foi substitu\u00eddo.'); return; }
        dlIdx = snapshot.idx;
        dlPct = snapshot.pct;
        renderDownload();
        dlPct = snapshot.pct;
        updateDl();
        startTick();
        var r = dlMount.querySelector('.dl');
        if (r) r.classList.add('is-in');
      });
    }
  }

  function requestDownload(g) {
    var gb = parseFloat(String(g.size || '10').replace(',', '.'));
    var item = {
      name: g.title, tag: g.genre,
      thumb: g.thumb || g.cover,
      totalMB: Math.max(4, Math.round((isNaN(gb) ? 10 : gb) * (gb > 100 ? 1 : 1000))),
      start: 0, eta: 45 + Math.round((isNaN(gb) ? 10 : gb) * 3)
    };
    var row = dlMount.querySelector('.dl');
    if (row) {
      D.queue.splice(dlIdx + 1, 0, item);
      toast('\u201c' + g.title + '\u201d entrou na fila de downloads.');
    } else {
      D.queue.splice(Math.min(dlIdx, D.queue.length), 0, item);
      dlIdx = D.queue.indexOf(item);
      renderDownload();
      var r2 = dlMount.querySelector('.dl');
      if (r2) r2.classList.add('is-in');
      toast('Baixando \u201c' + g.title + '\u201d\u2026');
    }
    dlEmit('dlChange');
  }

  /* ==================================================================
     ESTAT\u00cdSTICA \u2014 contadores e foco do anel
     ================================================================== */
  function countUp(node, to, dur, suffix) {
    if (reduced()) { node.textContent = fmt(to) + (suffix || ''); return; }
    var t0 = performance.now();
    (function step(t) {
      var p = clamp((t - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(Math.round(to * e)) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function bindStat() {
    var card = $('.stat-card');
    var donut = $('.donut');
    var valEl = $('.donut-value');
    var labEl = $('.donut-label');
    if (!card || !donut) return;

    var ran = false;
    function run() {
      if (ran) return;
      ran = true;
      countUp(valEl, D.stats.total, 1600, 'h');
      $$('.stat-val').forEach(function (n, i) { countUp(n, D.stats.items[i].value, 1400, 'h'); });
    }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: .4 });
      io.observe(card);
    } else run();

    var baseLab = labEl.textContent, baseVal = valEl.textContent;
    $$('.stat-item').forEach(function (it) {
      it.addEventListener('mouseenter', function () {
        var d = D.stats.items[+it.dataset.stat];
        if (!d) return;
        donut.classList.add('is-focus');
        donut.style.setProperty('--ang', d.angle + 'deg');
        labEl.textContent = d.label;
        valEl.textContent = Math.round(d.value / D.stats.total * 100) + '%';
      });
      it.addEventListener('mouseleave', function () {
        donut.classList.remove('is-focus');
        labEl.textContent = baseLab;
        valEl.textContent = ran ? fmt(D.stats.total) + 'h' : baseVal;
      });
      it.addEventListener('click', function () {
        var d = D.stats.items[+it.dataset.stat];
        if (d) toast(d.label + ': ' + fmt(d.value) + 'h registradas (' + Math.round(d.value / D.stats.total * 100) + '% do total).');
      });
    });
  }

  /* ==================================================================
     BUSCA din\u00e2mica (despacha para a se\u00e7\u00e3o ativa via NX)
     ================================================================== */
  function setHomeQuery(q) {
    renderList(q);
    renderCoverflow(q);
    var countEl = $('#gamesCount');
    if (countEl) {
      countEl.textContent = q
        ? visibleGamesQ(q).length + ' de ' + visibleGames().length + ' jogos'
        : '';
    }
  }

  function bindSearch() {
    var input = $('#searchInput');
    if (!input) return;
    var t;
    input.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var q = input.value.trim();
        if (window.NX && NX.search) NX.search(q);
        else setHomeQuery(q);
      }, 140);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var q = input.value.trim();
        if (!q) { toast('Digite para buscar jogos.'); return; }
        if (window.NX && NX.searchCount) {
          var n = NX.searchCount(q);
          toast(n + ' resultado(s) para \u201c' + q + '\u201d.');
        }
      }
      if (e.key === 'Escape' && input.value) { input.value = ''; input.dispatchEvent(new Event('input')); }
    });
  }

  /* ==================================================================
     FAVORITOS
     ================================================================== */
  var favs = (function () {
    try { return new Set(JSON.parse(localStorage.getItem('nexus-favs') || '[]')); }
    catch (e) { return new Set(); }
  })();

  function saveFavs() { try { localStorage.setItem('nexus-favs', JSON.stringify(Array.prototype.slice.call(favs))); } catch (e) {} }

  function syncFavChip() {
    var chip = $('#favChip');
    if (!chip) return;
    chip.classList.toggle('has-favs', favs.size > 0);
    chip.setAttribute('aria-label', favs.size ? favs.size + ' jogos favoritados' : 'Favoritos (vazio)');
    var c = chip.querySelector('.fav-count');
    if (c) c.textContent = favs.size;
  }

  function toggleFav(id) {
    var g = findGame(id);
    if (!g) return;
    var on;
    if (favs.has(id)) { favs.delete(id); on = false; }
    else { favs.add(id); on = true; }
    saveFavs();
    $$('[data-fav="' + id + '"]').forEach(function (b) {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', (on ? 'Remover ' : 'Favoritar ') + g.title + (on ? ' dos favoritos' : ''));
    });
    var mf = $('#btnFav');
    if (mf && mf.dataset.fav === id) {
      mf.classList.toggle('is-on', on);
      mf.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    syncFavChip();
    toast(on ? '\u201c' + g.title + '\u201d adicionado aos favoritos.' : '\u201c' + g.title + '\u201d removido dos favoritos.');
  }

  /* ==================================================================
     MODAL de detalhe (entrada 3D)
     ================================================================== */
  var modal = $('#modal');
  var modalCard = null, lastFocus = null, modalGame = null;

  function modalIsOpen() { return modal && !modal.hidden; }

  function openModal(id) {
    var g = findGame(id);
    if (!g || !modal) return;
    modalGame = g;
    modalCard = $('.modal-card', modal);
    $('#modalArt').src = g.cover || g.thumb;
    $('#modalArt').alt = 'Arte de ' + g.title;
    $('#modalKicker').textContent = g.genre;
    $('#modalTitle').textContent = g.title;
    $('#modalDesc').textContent = g.desc || g.sub;
    var chipsHtml =
      '<span class="chip">G\u00eanero <strong>' + esc(g.genre) + '</strong></span>' +
      '<span class="chip">Tamanho <strong>' + esc(g.size) + '</strong></span>' +
      '<span class="chip">Nota <strong>' + esc(g.rating) + ' <span aria-hidden="true">\u2605</span></strong></span>';
    if (g.price) {
      chipsHtml += '<span class="chip chip-price"><strong>' + brl(g.price) + '</strong>' +
        (g.oldPrice ? ' <s>' + brl(g.oldPrice) + '</s>' : '') + '</span>';
    }
    $('#modalChips').innerHTML = chipsHtml;

    var bp = $('#btnPlay'), bd = $('#btnDl');
    var canBuy = !!(g.price && !g.owned);
    bp.innerHTML = svgUse('ic-play', 'i i-sm') + (canBuy ? 'Comprar \u2014 ' + brl(g.price) : 'Jogar agora');
    if (bd) bd.hidden = canBuy;
    var mf = $('#btnFav');
    mf.dataset.fav = g.id;
    var on = favs.has(g.id);
    mf.classList.toggle('is-on', on);
    mf.setAttribute('aria-pressed', on ? 'true' : 'false');
    mf.setAttribute('aria-label', (on ? 'Remover ' : 'Favoritar ') + g.title);

    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () {
      modal.classList.add('is-open');
      $('#modalClose').focus();
    });
  }

  function closeModal() {
    if (!modalIsOpen()) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { modal.hidden = true; }, 340);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    modalGame = null;
  }

  function bindModal() {
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeModal(); return; }
      if (e.target.closest('#btnPlay')) {
        var pg = modalGame;
        if (pg && pg.price && !pg.owned && window.NX && NX.addCart) {
          NX.addCart(pg.id);
          closeModal();
          return;
        }
        toast('Iniciando \u201c' + (pg ? pg.title : '') + '\u201d\u2026');
        closeModal();
        return;
      }
      if (e.target.closest('#btnDl')) {
        if (modalGame) requestDownload(modalGame);
        closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (!modalIsOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key === 'Tab' && modalCard) {
        var f = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', modalCard)
          .filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ==================================================================
     POP de amigo
     ================================================================== */
  var pop = $('#friendPop');
  var popFor = -1;

  function statusClass(s) { return s === 'offline' ? 'is-offline' : s === 'playing' ? 'is-playing' : s === 'away' ? 'is-away' : ''; }
  function statusText(f) {
    return f.status === 'playing' ? 'Jogando agora'
      : f.status === 'online' ? 'Online'
      : f.status === 'offline' ? 'Offline' : 'Ausente';
  }

  function openFriend(i, btn) {
    var f = D.friends[i];
    if (!f || !pop) return;
    popFor = i;
    $('.pop-av', pop).innerHTML = '<svg aria-hidden="true"><use href="#' + f.avatar + '"/></svg>';
    $('.pop-name', pop).textContent = f.name;
    var dot = $('.pop-dot', pop);
    dot.className = 'pop-dot ' + statusClass(f.status);
    $('.pop-status-txt', pop).textContent = statusText(f);
    var gameEl = $('.pop-game', pop);
    gameEl.hidden = !(f.status === 'playing' && f.game);
    if (f.game) gameEl.textContent = f.game;

    pop.hidden = false;
    var r = btn.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var rail = railMount.getBoundingClientRect();
    var horizontal = rail.width > rail.height;
    var left, top;
    if (horizontal) {
      left = clamp(r.left + r.width / 2 - pw / 2, 12, window.innerWidth - pw - 12);
      top = r.top - ph - 12;
      if (top < 12) top = Math.min(r.bottom + 12, window.innerHeight - ph - 12);
    } else {
      left = r.left - pw - 14;
      top = clamp(r.top + r.height / 2 - ph / 2, 12, window.innerHeight - ph - 12);
      if (left < 12) left = Math.min(r.right + 14, window.innerWidth - pw - 12);
    }
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    requestAnimationFrame(function () { pop.classList.add('is-open'); });
    var b = pop.querySelector('button');
    if (b) b.focus();
  }

  function closeFriend() {
    if (!pop || pop.hidden) return;
    pop.classList.remove('is-open');
    popFor = -1;
    setTimeout(function () { pop.hidden = true; }, 280);
  }

  function bindPop() {
    if (!pop) return;
    pop.addEventListener('click', function (e) {
      var f = D.friends[popFor];
      if (!f) return;
      if (e.target.closest('#popMsg')) {
        var fi = D.friends.indexOf(f);
        if (window.NX && NX.openChat) NX.openChat(fi, f.name);
        else toast('Conversa com ' + f.name + ' aberta.');
        closeFriend();
      }
      if (e.target.closest('#popInvite')) { toast('Convite enviado para ' + f.name + '!'); closeFriend(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeFriend(); });
  }

  /* amigos mudando de status ao vivo */
  function friendLoop() {
    setInterval(function () {
      if (document.hidden || !D.friends.length) return;
      var i = (Math.random() * D.friends.length) | 0;
      var f = D.friends[i];
      var was = f.status;
      var roll = Math.random();
      if (f.status === 'offline') { f.status = roll < .7 ? 'online' : 'away'; if (f.status === 'online') toast(f.name + ' ficou online.'); }
      else if (f.status === 'playing') { if (roll < .5) f.status = 'online'; }
      else if (f.status === 'away') { if (roll < .6) f.status = 'online'; }
      else { f.status = roll < .35 ? 'playing' : (roll < .7 ? 'offline' : 'away');
        if (f.status === 'playing') { var pool = visibleGames().length ? visibleGames() : D.games; f.game = pool[(Math.random() * pool.length) | 0].title; } }
      if (f.status === was) return;
      updateFriend(i);
      if (popFor === i) closeFriend();
    }, 11000);
  }

  /* ==================================================================
     PALETA DE CORES
     ================================================================== */
  var ACCENTS = [
    { n: 'Vermelho', c: '#E8404A', rgb: '232,64,74' },
    { n: 'Ciano', c: '#35D0C5', rgb: '53,208,197' },
    { n: 'Violeta', c: '#A78BFA', rgb: '167,139,250' },
    { n: '\u00c2mbar', c: '#F5A63A', rgb: '245,166,58' }
  ];

  function applyAccent(a, silent) {
    var root = document.documentElement;
    root.style.setProperty('--accent', a.c);
    root.style.setProperty('--accent-rgb', a.rgb);
    $$('.swatch').forEach(function (s) { s.classList.toggle('is-on', s.dataset.accent === a.c); });
    try { localStorage.setItem('nexus-accent', JSON.stringify(a)); } catch (e) {}
    if (!silent) toast('Cor de destaque: ' + a.n + '.');
  }

  function bindPalette() {
    var pal = $('#palette');
    if (!pal) return;
    try {
      var saved = JSON.parse(localStorage.getItem('nexus-accent') || 'null');
      if (saved && saved.c) applyAccent(saved, true);
    } catch (e) {}
    pal.addEventListener('click', function (e) {
      if (e.target.closest('#paletteBtn')) { pal.classList.toggle('is-open'); return; }
      var sw = e.target.closest('.swatch');
      if (sw) {
        var a = ACCENTS.filter(function (x) { return x.c === sw.dataset.accent; })[0];
        if (a) applyAccent(a);
        pal.classList.remove('is-open');
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#palette')) pal.classList.remove('is-open');
    });
  }

  /* ==================================================================
     BRILHO que segue o cursor
     ================================================================== */
  function bindCursor() {
    var cg = $('#cursorGlow');
    if (!cg || !mqFine.matches || reduced()) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, scale = 1, targetScale = 1, raf = 0, started = false;
    function step() {
      cx += (tx - cx) * .17;
      cy += (ty - cy) * .17;
      scale += (targetScale - scale) * .14;
      cg.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
      raf = (Math.abs(tx - cx) > .3 || Math.abs(ty - cy) > .3 || Math.abs(targetScale - scale) > .01)
        ? requestAnimationFrame(step) : 0;
    }
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!started) { started = true; cx = tx; cy = ty; cg.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest && e.target.closest('a,button,input,.swatch,[data-tilt]');
      targetScale = hot ? 1.5 : 1;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      if (!e.relatedTarget) cg.classList.remove('is-on');
    }, { passive: true });
  }

  /* ==================================================================
     REVELAR ao rolar
     ================================================================== */
  function bindReveal() {
    var targets = $$('.sec, .hero-list, .rail, .topbar');
    if (reduced() || !window.IntersectionObserver) {
      targets.forEach(function (t) { t.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); }
      });
    }, { threshold: .12 });
    targets.forEach(function (t, i) {
      t.classList.add('reveal');
      t.style.transitionDelay = (i * 55) + 'ms';
      io.observe(t);
    });
  }

  /* ==================================================================
     CLIQUES delegados / bot\u00f5es varios
     ================================================================== */
  function nudgeArrow() {
    if (!arrowNext) return;
    arrowNext.classList.remove('is-nudge');
    void arrowNext.offsetWidth;
    arrowNext.classList.add('is-nudge');
  }

  function bindClicks() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;

      var act = e.target.closest('[data-action]');
      if (act) {
        e.preventDefault();
        var a = act.dataset.action;
        if (a === 'cart' || a === 'cart-open') {
          if (window.NX && NX.openCart) NX.openCart();
          else toast('Carrinho vazio \u2014 explore a loja de jogos.');
        }
        else if (a === 'bell') { act.classList.remove('has-dot'); toast('3 amigos entraram no jogo agora.'); }
        else if (a === 'add') toast('Em breve: adicionar jogos manualmente \u00e0 sua lista.');
        else if (a === 'fav') {
          if (!favs.size) toast('Nenhum favorito ainda \u2014 toque no cora\u00e7\u00e3o de um jogo.');
          else {
            var titles = [];
            favs.forEach(function (id) { var g = findGame(id); if (g) titles.push(g.title); });
            toast('Favoritos (' + titles.length + '): ' + titles.slice(0, 3).join(', ') + (titles.length > 3 ? '\u2026' : ''));
          }
        }
        return;
      }

      var dlBtn = e.target.closest('[data-dl-action]');
      if (dlBtn) { dlAction(dlBtn.dataset.dlAction); return; }

      /* links da sidebar navegam via hash (#/secao) \u2014 roteador em views.js */

      var favBtn = e.target.closest('[data-fav]');
      if (favBtn) { e.preventDefault(); e.stopPropagation(); toggleFav(favBtn.dataset.fav); return; }

      var openEl = e.target.closest('[data-open], [data-game]');
      if (openEl) {
        if (Date.now() < suppressClickUntil) { e.preventDefault(); return; }
        e.preventDefault();
        var id = openEl.dataset.open || openEl.dataset.game;
        var item = openEl.closest('.cf-item');
        if (item && !item.classList.contains('is-active')) { active = cfItems.indexOf(item); layout(); return; }
        openModal(id);
        return;
      }

      var fBtn = e.target.closest('[data-friend]');
      if (fBtn) {
        e.preventDefault();
        var fi = +fBtn.dataset.friend;
        if (popFor === fi) closeFriend(); else openFriend(fi, fBtn);
        return;
      }

      if (pop && !pop.hidden && !e.target.closest('#friendPop')) closeFriend();

      var dot = e.target.closest('.hero-dots .dot');
      if (dot) {
        var idx = $$('.hero-dots .dot').indexOf(dot);
        if (idx > -1) paintSlide(idx, true);
      }
    });
  }

  /* ==================================================================
     TECLADO
     ================================================================== */
  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var inField = tag === 'input' || tag === 'textarea';
      if (e.key === '/' && !inField) { e.preventDefault(); var s = $('#searchInput'); if (s) s.focus(); return; }
      if (e.key === 'Escape') {
        var pal = $('#palette'); if (pal) pal.classList.remove('is-open');
        closeFriend();
        return;
      }
      if (inField || modalIsOpen()) return;
      if (e.key === 'ArrowRight') { nudgeArrow(); go(1); }
      else if (e.key === 'ArrowLeft') go(-1);
    });
  }

  /* ==================================================================
     LOGIN
     ================================================================== */
  function getPlayerName() {
    try { return localStorage.getItem('nexus-player') || ''; } catch (e) { return ''; }
  }
  function setPlayerName(name) {
    try { localStorage.setItem('nexus-player', name); } catch (e) {}
  }
  function applyPlayerName(name) {
    var greet = $('.greeting');
    if (greet) {
      var h = new Date().getHours();
      var greeting = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', ';
      /* substitui todo o conte\u00fado por "Sauda\u00e7\u00e3o, Nome" */
      greet.innerHTML = greeting + '<strong>' + name + '</strong>';
    }
    /* atualiza dados do jogador */
    if (window.NEXUS_DATA && window.NEXUS_DATA.user) {
      window.NEXUS_DATA.user.name = name;
    }
  }

  function initLogin() {
    var screen = $('#loginScreen');
    var form = $('#loginForm');
    var nameInput = $('#loginName');
    var guestLink = $('#loginGuest');

    /* modo dev: ?skip ou ?user=Nome pula o login */
    var qs = new URLSearchParams(location.search);
    if (qs.has('skip') || qs.has('user')) {
      var devName = qs.get('user') || 'Rafael';
      setPlayerName(devName);
      if (screen) screen.classList.add('is-hidden');
      applyPlayerName(devName);
      return;
    }

    /* se j\u00e1 tem nome salvo, pula login */
    var saved = getPlayerName();
    if (saved) {
      if (screen) screen.classList.add('is-hidden');
      applyPlayerName(saved);
      return;
    }

    /* sen\u00e3o mostra tela de login */
    if (screen) {
      screen.classList.remove('is-hidden');
      initLoginStars();
      setTimeout(function () { if (nameInput) nameInput.focus(); }, 600);
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (nameInput ? nameInput.value : '').trim();
        if (!name) { if (nameInput) nameInput.focus(); return; }
        setPlayerName(name);
        if (screen) screen.classList.add('is-hidden');
        applyPlayerName(name);
        setTimeout(function () { toast('Bem-vindo ao Nexus Play, ' + name + '!'); }, 700);
      });
    }

    if (guestLink) {
      guestLink.addEventListener('click', function (e) {
        e.preventDefault();
        var guest = 'Convidado_' + Math.floor(1000 + Math.random() * 9000);
        setPlayerName(guest);
        if (screen) screen.classList.add('is-hidden');
        applyPlayerName(guest);
        setTimeout(function () { toast('Bem-vindo como convidado, ' + guest + '!'); }, 700);
      });
    }
  }

  function initLoginStars() {
    var cv = $('#loginStars');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width = cv.offsetWidth * 2;
    var H = cv.height = cv.offsetHeight * 2;
    var stars = [];
    for (var i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + .3,
        s: Math.random() * .4 + .1,
        o: Math.random() * .6 + .2
      });
    }
    var running = true;
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      stars.forEach(function (st) {
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245,234,236,' + st.o + ')';
        ctx.fill();
        st.y -= st.s;
        if (st.y < -4) { st.y = H + 4; st.x = Math.random() * W; }
      });
      requestAnimationFrame(draw);
    }
    draw();
    /* para quando o login some */
    var screen = $('#loginScreen');
    if (screen) {
      var obs = new MutationObserver(function () {
        if (screen.classList.contains('is-hidden')) running = false;
      });
      obs.observe(screen, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ==================================================================
     BOOT
     ================================================================== */
  function boot() {
    initLogin(); /* initLogin j\u00e1 aplica a sauda\u00e7\u00e3o via applyPlayerName */

    renderRail();
    renderList('');
    renderCoverflow('');
    renderDownload();
    paintSlide(0, false);
    syncFavChip();

    injectGlare();
    bindClicks();
    bindKeys();
    bindSearch();
    bindModal();
    bindPop();
    bindPalette();
    bindCursor();
    bindStat();
    bindReveal();
    friendLoop();

    /* hero pausa no hover */
    if (hero) {
      hero.addEventListener('pointerenter', function () { heroHover = true; });
      hero.addEventListener('pointerleave', function () { heroHover = false; });
      $$('.hero-dots .dot').forEach(function (d) { d.setAttribute('type', 'button'); });
      scheduleHero();
    }

    /* setas do carrossel */
    if (arrowNext) {
      arrowNext.addEventListener('click', function () { nudgeArrow(); go(1); });
    }

    /* campos de estrelas: fundo do app + c\u00e9u do hero */
    if (window.Starfield !== false) {
      var appStars = $('#stars');
      var heroStars = $('.hero-stars');
      var fields = [];
      if (appStars) fields.push(Starfield(appStars, {
        count: 60, colors: ['#F5EAEC', '#E8A0B0', 'rgba(232,64,74,.9)', '#C9E8C2']
      }));
      if (heroStars) fields.push(Starfield(heroStars, {
        count: 52, colors: ['#FFFFFF', '#FFD9A8', '#F4A9C4', '#9BE8FF']
      }));
      if (fields.length && mqFine.matches) {
        document.addEventListener('pointermove', function (e) {
          var nx = e.clientX / window.innerWidth, ny = e.clientY / window.innerHeight;
          fields.forEach(function (f) { if (f) f.setTarget(nx, ny); });
        }, { passive: true });
      }
    }
  }

  /* ==================================================================
     API compartilhada \u2014 views.js consome isto (carregado em seguida)
     ================================================================== */
  window.NX = {
    D: D, $: $, $$: $$,
    esc: esc, fmt: fmt, brl: brl, svgUse: svgUse, clamp: clamp, reduced: reduced,
    toast: toast, findGame: findGame, countUp: countUp, setHomeQuery: setHomeQuery,
    openModal: openModal,
    dl: {
      state: function () {
        return {
          idx: dlIdx, item: D.queue[dlIdx] || null, pct: dlPct,
          playing: dlPlaying, done: dlDone, total: D.queue.length,
          completed: dlCompleted
        };
      },
      action: dlAction,
      request: requestDownload
    },
    hooks: {},
    on: function (evt, fn) { (window.NX.hooks[evt] = window.NX.hooks[evt] || []).push(fn); return window.NX; },
    emit: function (evt, data) {
      var hs = window.NX.hooks[evt] || [];
      for (var i = 0; i < hs.length; i++) { try { hs[i](data); } catch (err) {} }
    }
  };

  function onReady() {
    boot();
    window.NX.emit('boot');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
