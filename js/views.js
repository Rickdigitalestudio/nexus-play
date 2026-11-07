/* =========================================================================
   NEXUS PLAY \u2014 8 SE\u00c7\u00d5ES
   Roteador SPA com transi\u00e7\u00e3o 3D, Loja + carrinho, Biblioteca, Downloads,
   Estat\u00edsticas (gr\u00e1ficos SVG), Amigos e Chat. Depende do NX de app.js.
   ========================================================================= */
(function () {
  'use strict';

  var NX = window.NX || {};
  var D = NX.D || {};
  var $ = NX.$, $$ = NX.$$;
  var esc = NX.esc, fmt = NX.fmt, svgUse = NX.svgUse;
  var brl = NX.brl || function (n) { return 'R$ ' + Number(n).toFixed(2).replace('.', ','); };
  var reduced = NX.reduced, toast = NX.toast;

  var catalog = D.catalog || [];
  var byId = {};
  catalog.forEach(function (g) { byId[g.id] = g; });

  var VIEWS = ['inicio', 'jogos', 'loja', 'biblioteca', 'downloads', 'estatisticas', 'amigos', 'chat'];
  var TITLES = {
    inicio: 'In\u00edcio', jogos: 'Jogos', loja: 'Loja', biblioteca: 'Biblioteca',
    downloads: 'Downloads', estatisticas: 'Estat\u00edsticas', amigos: 'Amigos', chat: 'Chat'
  };

  var stage = $('#stage');
  var current = 'inicio';
  var lastQ = '';
  var lojaPreviewId = null;

  /* ------------------------------ utilidades ------------------------------ */
  function off(g) { return g.oldPrice ? Math.round((1 - g.price / g.oldPrice) * 100) : 0; }
  function nowHM() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
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
  function gbLabel(mb) {
    return mb >= 1000 ? (mb / 1000).toFixed(1).replace('.', ',') + ' GB' : Math.round(mb) + ' MB';
  }
  function favSet() {
    try { return new Set(JSON.parse(localStorage.getItem('nexus-favs') || '[]')); }
    catch (e) { return new Set(); }
  }
  function mq(g) {
    if (!lastQ) return true;
    var hay = [g.title, g.genre, g.sub, g.group, (g.tags || []).join(' ')];
    for (var i = 0; i < hay.length; i++) {
      if (hay[i] && String(hay[i]).toLowerCase().indexOf(lastQ) > -1) return true;
    }
    return false;
  }
  function seeded(i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function isOnline(f) { return f.status !== 'offline'; }
  function ownedGames() { return catalog.filter(function (g) { return g.owned; }); }
  function byHoursDesc(a, b) { return (b.hours || 0) - (a.hours || 0); }

  /* ==================================================================
     ROTEADOR + TRANSI\u00c7\u00c3O 3D ENTRE SE\u00c7\u00d5ES
     ================================================================== */
  function navigate(name, opts) {
    opts = opts || {};
    if (VIEWS.indexOf(name) < 0) name = 'inicio';
    if (name === current && !opts.force) return;
    var from = $('#view-' + current), to = $('#view-' + name);
    if (!to) return;

    renderView(name);

    $$('.side-link').forEach(function (l) {
      var on = l.dataset.view === name;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });

    var si = $('#searchInput');
    if (si) si.placeholder = 'Buscar em ' + TITLES[name] + '\u2026';

    var instant = opts.instant || reduced() || !from || from === to;
    var dir = VIEWS.indexOf(name) >= VIEWS.indexOf(current) ? 1 : -1;
    current = name;

    if (location.hash !== '#/' + name) {
      try { location.hash = '#/' + name; } catch (e) {}
    }

    if (instant) {
      $$('.view').forEach(function (v) {
        var on = v === to;
        v.classList.toggle('is-active', on);
        v.hidden = !on;
        if (on) v.removeAttribute('inert'); else v.setAttribute('inert', '');
      });
    } else {
      stage.style.setProperty('--dir', dir);
      stage.classList.add('is-flipping');
      from.classList.add('is-leaving');
      setTimeout(function () {
        from.classList.remove('is-active', 'is-leaving');
        from.hidden = true;
        from.setAttribute('inert', '');
        to.hidden = false;
        to.removeAttribute('inert');
        to.classList.add('is-active', 'is-entering');
        setTimeout(function () {
          to.classList.remove('is-entering');
          stage.classList.remove('is-flipping');
        }, 500);
      }, 320);
    }

    onEnter(name);
    if (!opts.noScroll) window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    document.title = name === 'inicio'
      ? 'Nexus Play \u2014 Seu hub central de jogos'
      : 'Nexus Play \u2014 ' + TITLES[name];
  }
  NX.navigate = navigate;

  function onEnter(name) {
    if (name === 'chat') scrollMsgs();
    if (name === 'downloads') syncDlPage();
  }

  function renderView(name) {
    switch (name) {
      case 'jogos': renderJogos(); break;
      case 'loja': renderLoja(); break;
      case 'biblioteca': renderBiblio(); break;
      case 'downloads': renderDlPage(); break;
      case 'estatisticas': renderStats(); break;
      case 'amigos': renderAmigos(); break;
      case 'chat': renderChat(); break;
    }
  }

  function initRouter() {
    var h = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
    var start = VIEWS.indexOf(h) > -1 ? h : 'inicio';
    $$('.view').forEach(function (v) {
      var on = v.dataset.view === start;
      v.classList.toggle('is-active', on);
      v.hidden = !on;
      if (!on) v.setAttribute('inert', ''); else v.removeAttribute('inert');
    });
    current = start;
    renderView(start);
    $$('.side-link').forEach(function (l) {
      var on = l.dataset.view === start;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    var si = $('#searchInput');
    if (si) si.placeholder = 'Buscar em ' + TITLES[start] + '\u2026';
    window.addEventListener('hashchange', function () {
      var name = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
      if (name && VIEWS.indexOf(name) > -1 && name !== current) navigate(name);
    });
  }

  /* ==================================================================
     BUSCA global (despacha por se\u00e7\u00e3o)
     ================================================================== */
  NX.search = function (q) {
    lastQ = (q || '').trim().toLowerCase();
    if (current === 'estatisticas') { if (lastQ) navigate('jogos'); return; }
    if (current === 'inicio') { NX.setHomeQuery(lastQ); return; }
    renderView(current);
  };
  NX.searchCount = function (q) {
    q = (q || '').toLowerCase();
    if (current === 'amigos') {
      return D.friends.filter(function (f) {
        return (f.name + ' ' + (f.game || '')).toLowerCase().indexOf(q) > -1;
      }).length;
    }
    if (current === 'chat') {
      return convs.filter(function (c) { return convFriend(c).name.toLowerCase().indexOf(q) > -1; }).length;
    }
    if (current === 'downloads') {
      var all = (D.queue || []).concat(NX.dl.state().completed || []);
      return all.filter(function (it) { return String(it.name || '').toLowerCase().indexOf(q) > -1; }).length;
    }
    if (current === 'biblioteca') return ownedGames().filter(mq).length;
    return catalog.filter(mq).length;
  };

  /* ==================================================================
     COMPONENTES compartilhados
     ================================================================== */
  var GROUPS = ['Todos', 'A\u00e7\u00e3o', 'Aventura', 'RPG', 'Corrida', 'Terror', 'Simula\u00e7\u00e3o'];

  function sortGames(arr, mode) {
    var a = arr.slice();
    if (mode === 'az') a.sort(function (x, y) { return x.title.localeCompare(y.title, 'pt-BR'); });
    else if (mode === 'new') a.sort(function (x, y) { return y.year - x.year; });
    else if (mode === 'hours') a.sort(byHoursDesc);
    else if (mode === 'price-asc') a.sort(function (x, y) { return x.price - y.price; });
    else if (mode === 'price-desc') a.sort(function (x, y) { return y.price - x.price; });
    else a.sort(function (x, y) { return y.rating - x.rating; });
    return a;
  }

  function renderChips(host, groups, active, attr, countsFn) {
    if (!host) return;
    host.innerHTML = groups.map(function (gr) {
      var n = countsFn ? countsFn(gr) : null;
      return '<button class="fchip' + (gr === active ? ' is-on' : '') + '" type="button" data-' + attr + '="' + esc(gr) +
        '" aria-pressed="' + (gr === active) + '">' + esc(gr) +
        (n != null ? '<span class="n">' + n + '</span>' : '') + '</button>';
    }).join('');
  }

  function groupCount(gr) {
    return gr === 'Todos' ? catalog.length
      : catalog.filter(function (g) { return g.group === gr; }).length;
  }

  function pcard(g, i, opts) {
    opts = opts || {};
    var isFav = favSet().has(g.id);
    var badges = '';
    if (g.badge) badges += '<span class="pcard-badge">' + esc(g.badge) + '</span>';
    if (g.oldPrice) badges += '<span class="pcard-badge pcard-badge--off">-' + off(g) + '%</span>';

    var foot, acts = '';
    if (opts.mode === 'library') {
      var status = g.installed
        ? '<span class="pcard-own">' + svgUse('ic-check', 'i') + 'Instalado</span>'
        : (g.cloud
          ? '<span class="pcard-own">' + svgUse('ic-cloud', 'i') + 'Na nuvem</span>'
          : '<span class="pcard-own" style="color:#FFC46B;background:rgba(245,166,58,.14)">' + svgUse('ic-download', 'i') + 'Baixar</span>');
      foot = status + '<span class="pcard-rate">' + svgUse('ic-clock', 'i') + (g.hours || 0) + 'h</span>';
      acts = (g.installed || g.cloud)
        ? '<button class="btn btn-primary btn-sm" type="button" data-gp="play" data-id="' + g.id + '">' + svgUse('ic-play', 'i i-sm') + 'Jogar</button>'
        : '<button class="btn btn-primary btn-sm" type="button" data-gp="dl" data-id="' + g.id + '">' + svgUse('ic-download', 'i i-sm') + 'Baixar</button>';
    } else if (g.owned) {
      foot = '<span class="pcard-own">' + svgUse('ic-check', 'i') + 'Na biblioteca</span>' +
        '<span class="pcard-rate">' + svgUse('ic-star', 'i') + esc(g.rating) + '</span>';
      if (opts.mode === 'jogos') {
        acts = '<button class="btn btn-primary btn-sm" type="button" data-gp="play" data-id="' + g.id + '">' + svgUse('ic-play', 'i i-sm') + 'Jogar</button>';
      }
    } else {
      foot = '<span class="pcard-price">' + brl(g.price) +
        (g.oldPrice ? '<s>' + brl(g.oldPrice) + '</s>' : '') + '</span>' +
        '<button class="pcard-cart" type="button" data-add="' + g.id + '" aria-label="Adicionar ' + esc(g.title) + ' ao carrinho">' +
        svgUse('ic-cart', 'i') + '</button>';
    }

    return '<article class="pcard" data-tilt="3" style="--i:' + i + '">' +
      '<a class="pcard-art" href="#" data-open="' + g.id + '" aria-label="Detalhes de ' + esc(g.title) + '">' +
        '<img src="' + g.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
        badges +
        '<span class="pcard-play" aria-hidden="true">' + svgUse('ic-play') + '</span>' +
      '</a>' +
      '<div class="pcard-body">' +
        '<h3>' + esc(g.title) + '</h3>' +
        '<span class="pcard-genre">' + esc(g.genre) + ' \u00b7 ' + g.year + '</span>' +
        '<div class="pcard-foot">' + foot + '</div>' +
        (acts ? '<div class="pcard-acts">' + acts + '</div>' : '') +
      '</div>' +
      '<button class="card-fav' + (isFav ? ' is-on' : '') + '" type="button" data-fav="' + g.id +
        '" aria-pressed="' + isFav + '" aria-label="' + (isFav ? 'Remover ' : 'Favoritar ') + esc(g.title) + '">' +
        svgUse('ic-heart', 'i i-heart') + '</button>' +
    '</article>';
  }

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 JOGOS
     ================================================================== */
  var jogosFilter = 'Todos', jogosSort = 'rating', jogosMode = 'grid';

  function renderJogos() {
    renderChips($('#jogosFilters'), GROUPS, jogosFilter, 'filter', groupCount);
    renderJogosGrid();
    var shelf = $('#jogosShelf');
    if (shelf) {
      var top = ownedGames().filter(function (g) { return g.hours; }).sort(byHoursDesc).slice(0, 6);
      shelf.innerHTML = top.map(function (g) {
        return '<button class="shelf-card" type="button" data-open="' + g.id + '">' +
          '<img src="' + g.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
          '<strong>' + esc(g.title) + '</strong><span>' + fmt(g.hours) + 'h jogadas</span></button>';
      }).join('');
    }
  }
  function renderJogosGrid() {
    var grid = $('#jogosGrid');
    if (!grid) return;
    grid.classList.toggle('is-list', jogosMode === 'list');
    var items = sortGames(catalog.filter(function (g) {
      return mq(g) && (jogosFilter === 'Todos' || g.group === jogosFilter);
    }), jogosSort);
    grid.innerHTML = items.map(function (g, i) { return pcard(g, i, { mode: 'jogos' }); }).join('');
    $('#jogosEmpty').hidden = !!items.length;
    $('#jogosCount').textContent = items.length === catalog.length
      ? catalog.length + ' t\u00edtulos'
      : items.length + ' de ' + catalog.length + ' t\u00edtulos';
  }

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 LOJA
     ================================================================== */
  var lojaFilter = 'Todos', lojaSort = 'featured';
  var flashLeft = 0;

  function flashMax() {
    return (D.flash || []).reduce(function (m, f) { return Math.max(m, f.seconds || 0); }, 0);
  }

  function renderLojaHero() {
    var g = lojaPreviewId ? byId[lojaPreviewId] : (byId[D.storeFeaturedId] || catalog[0]);
    if (!g) return;
    var fo = off(g);
    var hero = $('#storeHero');
    if (!hero) return;
    hero.innerHTML =
      '<div class="sh-info">' +
        '<span class="sh-kicker">' + svgUse('ic-flame', 'i i-sm') + (lojaPreviewId ? 'Pr\u00e9via do jogo' : 'Destaque da semana') + '</span>' +
        '<h3>' + esc(g.title) + '</h3>' +
        '<p>' + esc(g.desc) + '</p>' +
        '<div class="sh-meta">' +
          (fo ? '<span class="sh-off">-' + fo + '%</span>' : '') +
          '<span class="sh-price"><strong>' + brl(g.price) + '</strong>' +
          (g.oldPrice ? '<s>' + brl(g.oldPrice) + '</s>' : '') + '</span>' +
          '<span class="pcard-rate">' + svgUse('ic-star', 'i') + esc(g.rating) + '</span>' +
        '</div>' +
        '<div class="sh-actions">' +
          '<button class="btn btn-primary" type="button" data-add="' + g.id + '">' + svgUse('ic-cart', 'i i-sm') + 'Adicionar ao carrinho</button>' +
          '<button class="btn btn-ghost" type="button" data-open="' + g.id + '">' + svgUse('ic-play', 'i i-sm') + 'Ver detalhes</button>' +
        '</div>' +
      '</div>' +
      '<div class="sh-art"><img src="' + (g.preview || g.cover) + '" width="520" height="500" alt="Pr\u00e9via de ' + esc(g.title) + '" decoding="async"></div>';
  }

  function renderLoja() {
    renderChips($('#lojaFilters'), GROUPS, lojaFilter, 'filter-loja', groupCount);

    var feat = byId[D.storeFeaturedId] || catalog[0];
    if (feat) {
      var fo = off(feat);
      var hero = $('#storeHero');
      if (hero) {
        hero.innerHTML =
          '<div class="sh-info">' +
            '<span class="sh-kicker">' + svgUse('ic-flame', 'i i-sm') + 'Destaque da semana</span>' +
            '<h3>' + esc(feat.title) + '</h3>' +
            '<p>' + esc(feat.desc) + '</p>' +
            '<div class="sh-meta">' +
              (fo ? '<span class="sh-off">-' + fo + '%</span>' : '') +
              '<span class="sh-price"><strong>' + brl(feat.price) + '</strong>' +
              (feat.oldPrice ? '<s>' + brl(feat.oldPrice) + '</s>' : '') + '</span>' +
              '<span class="pcard-rate">' + svgUse('ic-star', 'i') + esc(feat.rating) + '</span>' +
            '</div>' +
            '<div class="sh-actions">' +
              '<button class="btn btn-primary" type="button" data-add="' + feat.id + '">' + svgUse('ic-cart', 'i i-sm') + 'Adicionar ao carrinho</button>' +
              '<button class="btn btn-ghost" type="button" data-open="' + feat.id + '">' + svgUse('ic-play', 'i i-sm') + 'Ver detalhes</button>' +
            '</div>' +
          '</div>' +
          '<div class="sh-art"><img src="' + feat.cover + '" width="520" height="500" alt="Arte de ' + esc(feat.title) + '" decoding="async"></div>';
      }
    }

    var fr = $('#flashRow');
    if (fr) {
      fr.innerHTML = (D.flash || []).map(function (f, i) {
        var g = byId[f.id];
        if (!g) return '';
        var o = off(g);
        return '<div class="fcard" style="--i:' + i + '">' +
          '<img src="' + g.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
          '<div class="fcard-body"><strong>' + esc(g.title) + '</strong>' +
            '<div class="fcard-prices"><b>' + brl(g.price) + '</b>' +
            (g.oldPrice ? '<s>' + brl(g.oldPrice) + '</s>' : '') +
            (o ? '<span class="fcard-off">-' + o + '%</span>' : '') + '</div></div>' +
          '<button class="pcard-cart" type="button" data-add="' + g.id + '" aria-label="Adicionar ' + esc(g.title) + ' ao carrinho">' +
          svgUse('ic-cart', 'i') + '</button></div>';
      }).join('');
    }

    flashLeft = flashMax();
    tickFlash();
    renderLojaGrid();
    renderCart();
  }

  function renderLojaGrid() {
    var grid = $('#lojaGrid');
    if (!grid) return;
    var items = sortGames(catalog.filter(function (g) {
      return mq(g) && (lojaFilter === 'Todos' || g.group === lojaFilter);
    }), lojaSort);
    grid.innerHTML = items.map(function (g, i) { return pcard(g, i, { mode: 'loja' }); }).join('');
    $('#lojaEmpty').hidden = !!items.length;
    $('#lojaCount').textContent = items.length + ' jogo(s) \u00b7 entrega digital instant\u00eanea';
  }

  function tickFlash() {
    var el = $('#flashTimer');
    if (!el) return;
    var m = Math.floor(flashLeft / 60), s = flashLeft % 60;
    el.innerHTML = svgUse('ic-clock', 'i i-sm') + 'Termina em ' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }
  setInterval(function () {
    if (document.hidden) return;
    flashLeft--;
    if (flashLeft < 0) {
      flashLeft = flashMax();
      if (current === 'loja') toast('Ofertas rel\u00e2mpago renovadas!');
    }
    if (current === 'loja') tickFlash();
  }, 1000);

  /* ==================================================================
     CARRINHO
     ================================================================== */
  var cart = [];
  var cartOpen = false, lastCartFocus = null;

  function cartTotal() {
    return cart.reduce(function (s, id) { return s + (byId[id] ? byId[id].price : 0); }, 0);
  }

  function renderCart() {
    var badge = $('#cartBadge');
    if (badge) { badge.hidden = !cart.length; badge.textContent = cart.length; }
    var lb = $('#lojaCartBadge');
    if (lb) { lb.textContent = cart.length; lb.hidden = !cart.length; }
    var cc = $('#cartCount');
    if (cc) cc.textContent = cart.length ? '(' + cart.length + ')' : '';

    var items = $('#cartItems');
    if (items) {
      items.innerHTML = cart.map(function (id) {
        var g = byId[id];
        if (!g) return '';
        return '<li class="cart-item">' +
          '<img src="' + g.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
          '<div class="cart-item-body"><strong>' + esc(g.title) + '</strong><span>' + esc(g.sub) + '</span></div>' +
          '<b>' + brl(g.price) + '</b>' +
          '<button class="cart-rm" type="button" data-cart-remove="' + g.id + '" aria-label="Remover ' + esc(g.title) + ' do carrinho">' +
          svgUse('ic-close', 'i i-sm') + '</button></li>';
      }).join('');
    }
    var empty = $('#cartEmpty');
    if (empty) empty.hidden = !!cart.length;
    var tot = $('#cartTotal');
    if (tot) tot.textContent = brl(cartTotal());
    var co = $('#btnCheckout');
    if (co) co.disabled = !cart.length;
    var cartBtn = document.querySelector('[data-action="cart"]');
    if (cartBtn) cartBtn.setAttribute('aria-label', cart.length ? 'Carrinho (' + cart.length + ' itens)' : 'Carrinho (vazio)');
  }

  function addCart(id) {
    var g = byId[id];
    if (!g) return;
    if (g.owned) { toast('\u201c' + g.title + '\u201d j\u00e1 est\u00e1 na sua biblioteca.'); return; }
    if (cart.indexOf(id) > -1) { toast('\u201c' + g.title + '\u201d j\u00e1 est\u00e1 no carrinho.'); openCart(); return; }
    cart.push(id);
    renderCart();
    toast('\u201c' + g.title + '\u201d adicionado ao carrinho.', 'Ver carrinho', openCart);
  }

  function removeCart(id) {
    var i = cart.indexOf(id);
    if (i < 0) return;
    cart.splice(i, 1);
    renderCart();
    if (current === 'loja') renderLojaGrid();
  }

  function openCart() {
    var dr = $('#cartDrawer');
    if (!dr || cartOpen) return;
    lastCartFocus = document.activeElement;
    dr.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { dr.classList.add('is-open'); });
    cartOpen = true;
    var x = dr.querySelector('.cart-head .icon-btn');
    if (x) x.focus();
  }

  function closeCart() {
    var dr = $('#cartDrawer');
    if (!dr || !cartOpen) return;
    dr.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { dr.hidden = true; }, 360);
    cartOpen = false;
    if (lastCartFocus && lastCartFocus.focus) lastCartFocus.focus();
  }

  function confetti() {
    if (reduced()) return;
    var host = document.createElement('div');
    host.className = 'confetti';
    host.setAttribute('aria-hidden', 'true');
    var colors = ['#E8404A', '#F5A63A', '#C9E8C2', '#A78BFA', '#35D0C5', '#F5EAEC'];
    for (var i = 0; i < 22; i++) {
      var s = document.createElement('span');
      s.style.left = (28 + Math.random() * 44) + '%';
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--dx', (Math.random() * 260 - 130).toFixed(0) + 'px');
      s.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      s.style.animationDelay = (Math.random() * .3).toFixed(2) + 's';
      host.appendChild(s);
    }
    document.body.appendChild(host);
    setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, 2000);
  }

  function checkout() {
    if (!cart.length) return;
    var n = cart.length;
    cart.forEach(function (id) {
      var g = byId[id];
      if (g) { g.owned = true; g.installed = false; g.cloud = true; g.hours = g.hours || 0; g.lastPlayed = 'nunca'; }
    });
    cart = [];
    renderCart();
    closeCart();
    confetti();
    toast('Compra finalizada! ' + n + (n > 1 ? ' jogos adicionados' : ' jogo adicionado') + ' \u00e0 sua biblioteca.');
    renderView('loja');
    if (current === 'biblioteca') renderBiblio();
    if (current === 'jogos') renderJogosGrid();
  }

  NX.openCart = openCart;
  NX.addCart = addCart;

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 BIBLIOTECA
     ================================================================== */
  var biblioTab = 'Todos', biblioSort = 'recent';

  function renderBiblio() {
    var owned = ownedGames();
    renderChips($('#biblioTabs'), ['Todos', 'Instalados', 'Nuvem'], biblioTab, 'tab-biblio', function (t) {
      if (t === 'Instalados') return owned.filter(function (g) { return g.installed; }).length;
      if (t === 'Nuvem') return owned.filter(function (g) { return g.cloud; }).length;
      return owned.length;
    });
    var items = owned.filter(function (g) {
      if (!mq(g)) return false;
      if (biblioTab === 'Instalados') return g.installed;
      if (biblioTab === 'Nuvem') return g.cloud;
      return true;
    });
    if (biblioSort === 'hours') items.sort(byHoursDesc);
    else if (biblioSort === 'az') items.sort(function (a, b) { return a.title.localeCompare(b.title, 'pt-BR'); });

    var sum = owned.reduce(function (s, g) { return s + (g.hours || 0); }, 0);
    $('#biblioCount').textContent = owned.length + ' jogos \u00b7 ' + fmt(sum) + 'h registradas';
    $('#biblioGrid').innerHTML = items.map(function (g, i) { return pcard(g, i, { mode: 'library' }); }).join('');
    $('#biblioEmpty').hidden = !!items.length;
  }

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 DOWNLOADS
     ================================================================== */
  function renderDlPage() {
    var st = NX.dl.state();
    var doneList = st.completed || [];
    var storage = D.storage || { total: 1000, used: 461, categories: [] };
    var total = storage.total;
    var used = storage.used;
    var cats = storage.categories || [];
    var g1 = (cats[0] || {}).value || 360;
    var g2 = (cats[1] || {}).value || 55;
    var g3 = (cats[2] || {}).value || 46;
    var livre = (cats[3] || {}).value || 539;

    var txt = $('#storageTxt');
    if (txt) txt.textContent = used + ' GB de ' + total + ' GB usados';
    var bar = $('#storageBar');
    if (bar) {
      bar.innerHTML =
        '<span class="sg1" style="width:' + (g1 / total * 100).toFixed(1) + '%"></span>' +
        '<span class="sg2" style="width:' + (g2 / total * 100).toFixed(1) + '%"></span>' +
        '<span class="sg3" style="width:' + (g3 / total * 100).toFixed(1) + '%"></span>' +
        '<span class="sfree" style="width:' + Math.max(0, livre / total * 100).toFixed(1) + '%"></span>';
      bar.setAttribute('aria-label', 'Armazenamento: ' + used + ' GB usados de ' + total + ' GB');
    }
    var leg = $('#storageLegend');
    if (leg) {
      leg.innerHTML = cats.map(function (c) {
        return '<span><i style="background:' + c.color + '"></i>' + c.label + ' ' + c.value + ' GB</span>';
      }).join('');
    }
    var btnHost = $('#storageBtns');
    if (btnHost) {
      btnHost.innerHTML = cats.map(function (c) {
        return '<button class="btn btn-ghost btn-sm" type="button" data-storage="' + c.label + '">' +
          svgUse('ic-gauge', 'i i-sm') + ' ' + c.label + ' ' + c.value + ' GB</button>';
      }).join('');
    }
    renderDlActive();
    renderDlQueue();
    renderDlDone();
    updatePauseAll();
  }

  function renderDlActive() {
    var st = NX.dl.state();
    var host = $('#dlpActive');
    if (!host) return;
    var item = st.item;
    if (!item || st.done) {
      host.innerHTML = '<p class="dlp-empty2">Nenhum download ativo no momento.</p>';
      return;
    }
    host.innerHTML =
      '<div class="dlp-main" data-dlp-main>' +
        '<img src="' + item.thumb + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
        '<div class="dlp-info">' +
          '<strong style="display:block;font-size:15px">' + esc(item.name) + '</strong>' +
          '<span class="dlp-speed">' + svgUse('ic-gauge', 'i') + '<span data-dlp-speed>\u2014</span></span>' +
          '<span class="progress" role="progressbar" aria-label="Progresso de ' + esc(item.name) +
            '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span style="width:0%"></span></span>' +
          '<div class="dlp-line"><span data-dlp-size>\u2014</span><span data-dlp-eta>\u2014</span></div>' +
        '</div>' +
        '<div class="dlp-controls">' +
          '<button class="dlp-ctl" type="button" data-dl-page="toggle" aria-label="' + (st.playing ? 'Pausar download' : 'Retomar download') + '">' +
            svgUse(st.playing ? 'ic-pause' : 'ic-play') + '</button>' +
          '<button class="dlp-ctl dlp-ctl--danger" type="button" data-dl-page="cancel" aria-label="Cancelar download">' +
            svgUse('ic-close') + '</button>' +
        '</div>' +
      '</div>';
    syncDlTick();
  }

  function syncDlTick() {
    if (current !== 'downloads') return;
    var host = $('#dlpActive');
    var main = host && host.querySelector('[data-dlp-main]');
    if (!main) return;
    var st = NX.dl.state();
    var item = st.item;
    if (!item) return;
    var pct = st.pct;
    var fill = main.querySelector('.progress span');
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    var pb = main.querySelector('.progress');
    if (pb) pb.setAttribute('aria-valuenow', Math.round(pct));
    var sp = main.querySelector('[data-dlp-speed]');
    if (sp) {
      sp.textContent = st.done ? 'Conclu\u00edo'
        : (st.playing
          ? (12 + 10 * Math.abs(Math.sin(Date.now() / 1400))).toFixed(1).replace('.', ',') + ' MB/s'
          : 'Pausado');
    }
    var sz = main.querySelector('[data-dlp-size]');
    if (sz) sz.textContent = sizeText(item.totalMB * pct / 100, item.totalMB);
    var et = main.querySelector('[data-dlp-eta]');
    if (et) {
      et.textContent = st.done ? 'Instalado'
        : 'Restam ' + etaText(item.eta * 60 * (1 - pct / 100) / (1 - Math.min(99, item.start || 0) / 100));
    }
  }

  function renderDlQueue() {
    var st = NX.dl.state();
    var host = $('#dlpQueue');
    if (!host) return;
    var pend = (D.queue || []).slice(st.idx + 1).filter(function (it) {
      return !lastQ || String(it.name).toLowerCase().indexOf(lastQ) > -1;
    });
    host.innerHTML = pend.length ? pend.map(function (it, i) {
      return '<div class="dlp-row" style="--i:' + i + '">' +
        '<span class="dlp-num">' + (i + 1) + '</span>' +
        '<img src="' + it.thumb + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
        '<div class="dlp-body"><strong>' + esc(it.name) + '</strong><span>' + esc(it.tag) + '</span></div>' +
        '<div class="dlp-meta2"><span>' + gbLabel(it.totalMB) + '</span><span>~' + it.eta + ' min</span></div>' +
      '</div>';
    }).join('') : '<p class="dlp-empty2">Fila vazia.</p>';
  }

  function renderDlDone() {
    var st = NX.dl.state();
    var host = $('#dlpDone');
    if (!host) return;
    var done = (st.completed || []).filter(function (c) {
      return !lastQ || String(c.name).toLowerCase().indexOf(lastQ) > -1;
    });
    host.innerHTML = done.length ? done.slice(0, 8).map(function (c, i) {
      return '<div class="dlp-row dlp-done-row" style="--i:' + i + '">' +
        '<img src="' + c.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
        '<div class="dlp-body"><strong>' + esc(c.name) + '</strong><span>' + esc(c.tag || '') + '</span></div>' +
        '<div class="dlp-meta2"><span>' + gbLabel(c.mb || 0) + '</span><span>' + esc(c.when || '') + '</span>' +
        '<span class="dlp-check">' + svgUse('ic-check', 'i') + '</span></div>' +
      '</div>';
    }).join('') : '<p class="dlp-empty2">Nenhum download conclu\u00edo ainda.</p>';
  }

  function updatePauseAll() {
    var btn = $('#dlPauseAll');
    if (!btn) return;
    var st = NX.dl.state();
    btn.disabled = !(st.item && !st.done);
    btn.innerHTML = svgUse(st.playing ? 'ic-pause' : 'ic-play', 'i i-sm') + '<span>' + (st.playing ? 'Pausar' : 'Retomar') + '</span>';
  }

  function syncDlPage() { if (current === 'downloads') renderDlPage(); }
  NX.on('dlChange', syncDlPage);
  NX.on('dlTick', syncDlTick);

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 ESTAT\u00cdSTICAS
     ================================================================== */
  function renderStats() {
    var owned = ownedGames();
    var list = D.achievements || [];
    var achDone = list.filter(function (a) { return a.pct >= 100; }).length;
    var online = D.friends.filter(isOnline).length;
    var kpis = [
      { ic: 'ic-clock', val: D.stats.total, suf: 'h', label: 'Horas totais de jogo' },
      { ic: 'ic-package', val: owned.length, suf: '', label: 'Jogos na biblioteca' },
      { ic: 'ic-trophy', val: achDone, suf: '', label: 'Conquistas desbloqueadas' },
      { ic: 'ic-users', val: online, suf: '', label: 'Amigos online agora' }
    ];
    $('#statKpis').innerHTML = kpis.map(function (k, i) {
      return '<div class="kpi" style="--i:' + i + '">' +
        '<span class="kpi-ic">' + svgUse(k.ic) + '</span>' +
        '<strong data-kpi="' + i + '">0</strong>' +
        '<span>' + k.label + '</span></div>';
    }).join('');
    kpis.forEach(function (k, i) {
      NX.countUp($('#statKpis [data-kpi="' + i + '"]'), k.val, 1400, k.suf);
    });

    renderTrend();
    renderWeek();
    renderGenreDonut();
    renderHeat();
    renderTop();
    renderAch();
    renderCompare();
  }

  function smoothPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i];
      var mx = (p0[0] + p1[0]) / 2;
      d += ' C' + mx.toFixed(1) + ',' + p0[1].toFixed(1) + ' ' + mx.toFixed(1) + ',' + p1[1].toFixed(1) +
        ' ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1);
    }
    return d;
  }

  function renderTrend() {
    var d = D.trend;
    var host = $('#trendChart');
    if (!host || !d) return;
    var w = 640, h = 180, padX = 26, padY = 22;
    var max = Math.max.apply(null, d.hours) * 1.18;
    var pts = d.hours.map(function (v, i) {
      return [padX + i * (w - padX * 2) / (d.hours.length - 1), h - padY - (v / max) * (h - padY * 2)];
    });
    var line = smoothPath(pts);
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + (h - padY) +
      ' L' + pts[0][0].toFixed(1) + ',' + (h - padY) + ' Z';
    var grid = '';
    for (var gy = 0; gy <= 3; gy++) {
      var y = padY + gy * (h - padY * 2) / 3;
      grid += '<line class="chart-grid" x1="' + padX + '" y1="' + y.toFixed(1) + '" x2="' + (w - padX) + '" y2="' + y.toFixed(1) + '"/>';
    }
    var dots = pts.map(function (p, i) {
      return '<circle class="chart-dot" style="--i:' + i + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '">' +
        '<title>Semana ' + (i + 1) + ': ' + d.hours[i] + 'h</title></circle>' +
        '<text class="chart-val" style="--i:' + i + '" x="' + p[0].toFixed(1) + '" y="' + (p[1] - 9).toFixed(1) + '" text-anchor="middle">' + d.hours[i] + 'h</text>' +
        '<text class="chart-lbl" x="' + p[0].toFixed(1) + '" y="' + (h - 4) + '" text-anchor="middle">' + d.labels[i] + '</text>';
    }).join('');
    host.innerHTML =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Gr\u00e1fico de horas por semana nas \u00faltimas 8 semanas">' +
        '<defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" style="stop-color:var(--accent);stop-opacity:.34"/>' +
          '<stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/>' +
        '</linearGradient></defs>' + grid +
        '<path class="chart-fill" d="' + area + '" fill="url(#trendFill)"/>' +
        '<path class="chart-line" d="' + line + '" pathLength="100"/>' +
        dots + '</svg>';
    var prev = d.hours[d.hours.length - 2] || 1;
    var delta = Math.round((d.hours[d.hours.length - 1] / prev - 1) * 100);
    $('#trendNote').textContent = (delta >= 0 ? '+' : '') + delta + '% vs. semana anterior';
  }

  function renderWeek() {
    var d = D.weekly;
    var host = $('#weekBars');
    if (!host || !d) return;
    var max = Math.max.apply(null, d.hours);
    host.innerHTML = d.hours.map(function (v, i) {
      return '<div class="wbar">' +
        '<span class="wbar-val">' + String(v).replace('.', ',') + 'h</span>' +
        '<span class="wbar-bar" style="--h:' + (v / max * 100).toFixed(1) + ';--i:' + i + '"></span>' +
        '<span class="wbar-lbl">' + d.labels[i] + '</span></div>';
    }).join('');
  }

  function renderGenreDonut() {
    var gs = D.genres;
    var host = $('#genreDonut');
    if (!host || !gs || !gs.length) return;
    var total = gs.reduce(function (s, g) { return s + g.pct; }, 0) || 100;
    var acc = 0;
    host.innerHTML = '<svg viewBox="0 0 150 150" role="img" aria-label="Distribui\u00e7\u00e3o de g\u00eaueros">' +
      gs.map(function (g, i) {
        var len = g.pct / total * 100;
        var seg = '<circle class="gen-seg" cx="75" cy="75" r="56" pathLength="100" stroke="' + g.color +
          '" style="--len:' + len.toFixed(2) + ';--off:' + (-acc).toFixed(2) + ';--i:' + i + '">' +
          '<title>' + esc(g.name) + ': ' + g.pct + '%</title></circle>';
        acc += len;
        return seg;
      }).join('') + '</svg>' +
      '<div class="gen-center"><strong>' + gs[0].pct + '%</strong><span>' + esc(gs[0].name) + '</span></div>';
    $('#genreLegend').innerHTML = gs.map(function (g) {
      return '<li><i style="background:' + g.color + '"></i>' + esc(g.name) + '<b>' + g.pct + '%</b></li>';
    }).join('');
  }

  function renderHeat() {
    var host = $('#heatmap');
    if (!host) return;
    var html = '';
    for (var w = 0; w < 12; w++) {
      html += '<div class="hm-col">';
      for (var d = 0; d < 7; d++) {
        var v = seeded(w * 7 + d);
        var lvl = v < .18 ? 0 : v < .45 ? 1 : v < .72 ? 2 : v < .9 ? 3 : 4;
        html += '<span class="hm-cell l' + lvl + '" style="--i:' + (w * 7 + d) +
          '" title="Semana ' + (w + 1) + ' \u2014 ' + (v * 6.5).toFixed(1).replace('.', ',') + 'h"></span>';
      }
      html += '</div>';
    }
    host.innerHTML = html;
  }

  function renderTop() {
    var host = $('#topGames');
    if (!host) return;
    var rows = (D.topGames || []).map(function (t) {
      return { g: byId[t.id] || { title: t.id, cover: 'assets/cover-eclipse.svg' }, hours: t.hours };
    });
    var max = rows.reduce(function (m, r) { return Math.max(m, r.hours); }, 1);
    host.innerHTML = rows.map(function (r, i) {
      return '<li class="top-row">' +
        '<span class="top-rank">' + (i + 1) + '</span>' +
        '<img src="' + r.g.cover + '" width="520" height="500" alt="" loading="lazy" decoding="async">' +
        '<div class="top-body"><strong>' + esc(r.g.title) + '</strong>' +
          '<span class="top-bar"><span style="--w:' + (r.hours / max * 100).toFixed(1) + ';--i:' + i + '"></span></span></div>' +
        '<span class="top-hours">' + fmt(r.hours) + 'h</span></li>';
    }).join('');
  }

  function renderAch() {
    var host = $('#achievements');
    if (!host) return;
    var list = D.achievements || [];
    var done = list.filter(function (a) { return a.pct >= 100; }).length;
    $('#achNote').textContent = done + ' de ' + list.length + ' desbloqueadas';
    host.innerHTML = list.map(function (a, i) {
      var g = byId[a.game];
      return '<li class="ach-row' + (a.pct >= 100 ? ' is-done' : '') + '">' +
        '<span class="ach-ic">' + svgUse(a.icon) + '</span>' +
        '<div class="ach-body"><strong>' + esc(a.name) + '</strong><span>' + esc(g ? g.title : a.game) + '</span>' +
          '<span class="ach-bar"><span style="--w:' + a.pct + ';--i:' + i + '"></span></span></div>' +
        '<span class="ach-pct">' + a.pct + '%</span></li>';
    }).join('');
  }

  function renderCompare() {
    var host = $('#compareBars');
    if (!host) return;
    var rows = D.compare || [];
    var max = rows.reduce(function (m, r) { return Math.max(m, r.hours); }, 1);
    host.innerHTML = rows.map(function (r, i) {
      return '<li class="cmp-row' + (r.me ? ' is-me' : '') + '">' +
        '<span class="cmp-av">' + esc(r.name.charAt(0)) + '</span>' +
        '<span class="cmp-name">' + esc(r.name) + '</span>' +
        '<span class="cmp-bar"><span style="--w:' + (r.hours / max * 100).toFixed(1) + ';--i:' + i + '"></span></span>' +
        '<span class="cmp-hours">' + r.hours + 'h</span></li>';
    }).join('');
  }

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 AMIGOS
     ================================================================== */
  var amigosTab = 'Todos';
  var invites = (D.invites || []).slice();

  function renderAmigos() {
    renderChips($('#amigosTabs'), ['Todos', 'Online', 'Pedidos'], amigosTab, 'tab-amigos', function (t) {
      if (t === 'Online') return D.friends.filter(isOnline).length;
      if (t === 'Pedidos') return invites.length;
      return D.friends.length;
    });
    var online = D.friends.filter(isOnline).length;
    $('#amigosSub').textContent = D.friends.length + ' amigos \u00b7 ' + online + ' online agora';
    renderAmigosGrid();
    $('#activityFeed').innerHTML = (D.activity || []).map(function (a, i) {
      return '<li style="--i:' + i + '">' +
        '<span class="feed-av"><svg aria-hidden="true"><use href="#' + a.avatar + '"/></svg></span>' +
        '<span class="feed-txt"><strong>' + esc(a.who) + '</strong> ' + esc(a.what) + '</span>' +
        '<span class="feed-ic">' + svgUse(a.icon, 'i i-sm') + '</span>' +
        '<span class="feed-when">' + esc(a.when) + '</span></li>';
    }).join('');
  }

  function renderAmigosGrid() {
    var host = $('#amigosGrid');
    if (!host) return;
    if (amigosTab === 'Pedidos') {
      host.innerHTML = invites.map(function (v, i) {
        return '<div class="fcard2" style="--i:' + i + '">' +
          '<span class="fcard2-av"><svg aria-hidden="true"><use href="#' + v.avatar + '"/></svg></span>' +
          '<div class="fcard2-body"><strong>' + esc(v.name) + '</strong>' +
            '<span class="fcard2-status">' + v.mutual + ' amigo(s) em comum</span>' +
            '<div class="fcard2-acts">' +
              '<button class="btn btn-primary btn-sm" type="button" data-accept="' + i + '">Aceitar</button>' +
              '<button class="btn btn-ghost btn-sm" type="button" data-decline="' + i + '">Recusar</button>' +
            '</div></div></div>';
      }).join('') || '<p class="empty-note" style="grid-column:1/-1">Nenhum pedido pendente.</p>';
      $('#amigosEmpty').hidden = true;
      return;
    }
    var items = D.friends.filter(function (f) {
      if (amigosTab === 'Online' && !isOnline(f)) return false;
      if (lastQ && (f.name + ' ' + (f.game || '')).toLowerCase().indexOf(lastQ) < 0) return false;
      return true;
    });
    host.innerHTML = items.map(function (f) {
      var fi = D.friends.indexOf(f);
      var stTxt = f.status === 'playing' ? 'Jogando <b>' + esc(f.game) + '</b>'
        : isOnline(f) ? (f.status === 'away' ? 'Ausente' : 'Online')
        : 'Offline \u2014 ' + esc(f.game || 'h\u00e1 bastante tempo');
      var dot = f.status === 'offline' ? 'is-offline' : f.status === 'away' ? 'is-away' : 'is-online';
      return '<div class="fcard2" style="--i:' + fi + '">' +
        '<span class="fcard2-av"><svg aria-hidden="true"><use href="#' + f.avatar + '"/></svg>' +
          '<span class="fdot ' + dot + '"></span></span>' +
        '<div class="fcard2-body"><strong>' + esc(f.name) + '</strong>' +
          '<span class="fcard2-status">' + stTxt + '</span>' +
          '<div class="fcard2-acts">' +
            '<button class="btn btn-primary btn-sm" type="button" data-msg="' + fi + '">' + svgUse('ic-chat', 'i i-sm') + 'Mensagem</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-invite="' + fi + '">Convidar</button>' +
          '</div></div></div>';
    }).join('');
    $('#amigosEmpty').hidden = !!items.length;
  }

  /* ==================================================================
     SE\u00c7\u00c3O \u2014 CHAT
     ================================================================== */
  var convs = D.conversations || [];
  var activeConv = convs.length ? 0 : -1;

  function convFriend(c) {
    return D.friends[c.friend] || { name: 'Amigo', avatar: 'av1', status: 'offline' };
  }

  function renderChat() {
    renderChatList();
    renderThread();
  }

  function renderChatList() {
    var host = $('#chatList');
    if (!host) return;
    var on = $('#chatOnline');
    if (on) on.textContent = D.friends.filter(isOnline).length + ' online';
    host.innerHTML = convs.map(function (c, i) {
      var f = convFriend(c);
      if (lastQ && f.name.toLowerCase().indexOf(lastQ) < 0) return '';
      var last = c.messages[c.messages.length - 1];
      var lastTxt = last ? (last.from === 'me' ? 'Voc\u00ea: ' : '') + last.text : 'Conversa vazia';
      return '<li><button class="conv' + (i === activeConv ? ' is-on' : '') + '" type="button" data-conv="' + i + '">' +
        '<span class="conv-av"><svg aria-hidden="true"><use href="#' + f.avatar + '"/></svg></span>' +
        '<span class="conv-body"><strong>' + esc(f.name) + '</strong><span class="conv-last">' + esc(lastTxt) + '</span></span>' +
        '<span class="conv-meta"><span class="conv-time">' + esc(last ? last.time : '') + '</span>' +
        (c.unread ? '<span class="conv-unread">' + c.unread + '</span>' : '') +
        '</span></button></li>';
    }).join('');
  }

  function renderThread() {
    var c = convs[activeConv];
    var box = $('#chatMsgs');
    if (!box) return;
    if (!c) {
      box.innerHTML = '<p class="dlp-empty2" style="margin:auto">Selecione uma conversa.</p>';
      $('#chatHeadName').textContent = 'Chat';
      $('#chatHeadAv').innerHTML = '';
      $('#chatHeadStatus').textContent = '';
      return;
    }
    var f = convFriend(c);
    $('#chatHeadAv').innerHTML = '<svg aria-hidden="true"><use href="#' + f.avatar + '"/></svg>';
    $('#chatHeadName').textContent = f.name;
    var st = $('#chatHeadStatus');
    st.textContent = f.status === 'offline' ? 'Offline'
      : f.status === 'away' ? 'Ausente'
      : (f.game ? 'Jogando ' + f.game : 'Online');
    st.classList.toggle('is-off', f.status === 'offline');
    box.innerHTML = c.messages.map(function (m) {
      return '<div class="msg ' + (m.from === 'me' ? 'msg-me' : 'msg-them') + '">' +
        esc(m.text) + '<span class="msg-time">' + esc(m.time) + '</span></div>';
    }).join('');
    scrollMsgs();
  }

  function scrollMsgs() {
    var box = $('#chatMsgs');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function openConv(i) {
    if (!convs[i]) return;
    activeConv = i;
    convs[i].unread = 0;
    renderChatList();
    renderThread();
    var root = $('#chatRoot');
    if (root) root.classList.add('is-thread');
    var inp = $('#chatInput');
    if (inp && window.matchMedia('(min-width: 769px)').matches) inp.focus();
  }

  function sendMsg(text, convIdx) {
    var idx = convIdx != null ? convIdx : activeConv;
    var c = convs[idx];
    if (!c || !text) return;
    c.messages.push({ from: 'me', text: text, time: nowHM() });
    if (idx === activeConv && current === 'chat') renderThread();
    renderChatList();
    replyLater(idx);
  }

  function replyLater(idx) {
    var c = convs[idx];
    var f = convFriend(c);
    var showTyping = idx === activeConv && current === 'chat';
    var t1 = setTimeout(function () {
      if (showTyping) {
        var box = $('#chatMsgs');
        if (box && !document.getElementById('typingDots')) {
          var t = document.createElement('div');
          t.className = 'msg-typing';
          t.id = 'typingDots';
          t.innerHTML = '<span></span><span></span><span></span>';
          box.appendChild(t);
          scrollMsgs();
        }
      }
    }, 550);
    setTimeout(function () {
      clearTimeout(t1);
      var dots = document.getElementById('typingDots');
      if (dots && dots.parentNode) dots.parentNode.removeChild(dots);
      var pool = (D.replies && (D.replies[f.name] || D.replies['default'])) || ['ok!'];
      c._pi = ((c._pi || 0) + 1) % pool.length;
      c.messages.push({ from: 'them', text: pool[c._pi], time: nowHM() });
      if (idx === activeConv && current === 'chat') renderThread();
      else {
        c.unread = (c.unread || 0) + 1;
        toast('Nova mensagem de ' + f.name + '.', 'Abrir', function () { NX.openChat(idx); });
      }
      renderChatList();
    }, 1400 + Math.random() * 900);
  }

  NX.openChat = function (friendIdx) {
    var idx = -1;
    for (var i = 0; i < convs.length; i++) if (convs[i].friend === friendIdx) { idx = i; break; }
    if (idx < 0 && friendIdx > -1) {
      convs.unshift({ friend: friendIdx, unread: 0, messages: [] });
      idx = 0;
    }
    navigate('chat');
    if (idx > -1) openConv(idx);
  };

  function bindChat() {
    var form = $('#chatForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = $('#chatInput');
        var text = (inp.value || '').trim();
        if (!text) return;
        inp.value = '';
        sendMsg(text);
      });
    }
    var emo = $('#chatEmoji');
    if (emo) {
      emo.addEventListener('click', function (e) {
        var b = e.target.closest('[data-emoji]');
        if (!b) return;
        var inp = $('#chatInput');
        inp.value = (inp.value + (inp.value ? ' ' : '') + b.dataset.emoji).slice(0, 240);
        inp.focus();
      });
    }
    var back = $('#chatBack');
    if (back) {
      back.addEventListener('click', function () {
        var root = $('#chatRoot');
        if (root) root.classList.remove('is-thread');
      });
    }
  }

  /* ==================================================================
     CLIQUES GLOBAIS das se\u00e7\u00f5es
     ================================================================== */
  function bindGlobal() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;

      if (e.target.closest('[data-cart-close]')) { closeCart(); return; }
      if (e.target.closest('#btnCheckout')) { checkout(); return; }

      var add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); addCart(add.dataset.add); return; }

      var rm = e.target.closest('[data-cart-remove]');
      if (rm) { removeCart(rm.dataset.cartRemove); return; }

      var fc = e.target.closest('[data-filter]');
      if (fc) {
        jogosFilter = fc.dataset.filter;
        renderChips($('#jogosFilters'), GROUPS, jogosFilter, 'filter', groupCount);
        renderJogosGrid();
        return;
      }
      var fl = e.target.closest('[data-filter-loja]');
      if (fl) {
        lojaFilter = fl.dataset.filterLoja;
        renderChips($('#lojaFilters'), GROUPS, lojaFilter, 'filter-loja', groupCount);
        renderLojaGrid();
        return;
      }
      var bt = e.target.closest('[data-tab-biblio]');
      if (bt) { biblioTab = bt.dataset.tabBiblio; renderBiblio(); return; }

      var at = e.target.closest('[data-tab-amigos]');
      if (at) { amigosTab = at.dataset.tabAmigos; renderAmigosGrid(); renderChips($('#amigosTabs'), ['Todos', 'Online', 'Pedidos'], amigosTab, 'tab-amigos', function (t) {
        if (t === 'Online') return D.friends.filter(isOnline).length;
        if (t === 'Pedidos') return invites.length;
        return D.friends.length;
      }); return; }

      var seg = e.target.closest('[data-jogos-mode]');
      if (seg) {
        jogosMode = seg.dataset.jogosMode;
        $$('[data-jogos-mode]').forEach(function (b) {
          var on = b.dataset.jogosMode === jogosMode;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderJogosGrid();
        return;
      }

      var gp = e.target.closest('[data-gp]');
      if (gp) {
        var g = byId[gp.dataset.id];
        if (!g) return;
        if (gp.dataset.gp === 'play') {
          g.lastPlayed = 'agora';
          toast('Iniciando \u201c' + g.title + '\u201d\u2026');
          if (current === 'biblioteca') renderBiblio();
        } else if (gp.dataset.gp === 'dl') {
          NX.dl.request(g);
        }
        return;
      }

      var msg = e.target.closest('[data-msg]');
      if (msg) { NX.openChat(+msg.dataset.msg); return; }

      var inv = e.target.closest('[data-invite]');
      if (inv) {
        var fr = D.friends[+inv.dataset.invite];
        toast('Convite enviado para ' + (fr ? fr.name : 'o amigo') + '!');
        inv.disabled = true;
        inv.textContent = 'Enviado';
        return;
      }

      var acc = e.target.closest('[data-accept]');
      if (acc) {
        var v = invites.splice(+acc.dataset.accept, 1)[0];
        if (v) {
          D.friends.push({ avatar: v.avatar, name: v.name, status: 'online', game: '' });
          toast(v.name + ' agora \u00e9 seu amigo!');
        }
        renderAmigos();
        return;
      }
      var dcl = e.target.closest('[data-decline]');
      if (dcl) {
        var v2 = invites.splice(+dcl.dataset.decline, 1)[0];
        if (v2) toast('Pedido de ' + v2.name + ' recusado.');
        renderAmigos();
        return;
      }

      var prv = e.target.closest('[data-open]');
      if (prv && current === 'loja') { e.preventDefault(); lojaPreviewId = prv.dataset.open; renderLojaHero(); return; }

      var sb = e.target.closest('[data-storage]');
      if (sb) {
        var label = sb.dataset.storage;
        var cats = (D.storage || {}).categories || [];
        var cat = cats.filter(function (c) { return c.label === label; })[0];
        if (cat) {
          var pct = Math.round(cat.value / ((D.storage || {}).total || 1000) * 100);
          toast(cat.label + ': ' + cat.value + ' GB \u00b7 ' + pct + '% do total');
          /* destaca a categoria no gr\u00e1fico */
          var bar = $('#storageBar');
          if (bar) {
            var spans = bar.querySelectorAll('span');
            var catIdx = cats.indexOf(cat);
            spans.forEach(function(sp, i) {
              if (i === catIdx) {
                sp.style.opacity = '1';
                sp.style.filter = 'brightness(1.3)';
                sp.style.transform = 'scaleY(1.15)';
              } else {
                sp.style.opacity = '.35';
                sp.style.filter = '';
                sp.style.transform = '';
              }
            });
            /* reset ap\u00f3s 2s */
            clearTimeout(window._storageReset);
            window._storageReset = setTimeout(function() {
              spans.forEach(function(sp) {
                sp.style.opacity = '';
                sp.style.filter = '';
                sp.style.transform = '';
              });
            }, 2000);
          }
        }
        return;
      }

      var conv = e.target.closest('[data-conv]');
      if (conv) { openConv(+conv.dataset.conv); return; }

      if (e.target.closest('#btnInvite')) {
        toast('Link de convite copiado \u2014 compartilhe com seus amigos!');
        return;
      }
      if (e.target.closest('#dlPauseAll')) {
        var st = NX.dl.state();
        if (st.item && !st.done) NX.dl.action('toggle');
        return;
      }
      var dlp = e.target.closest('[data-dl-page]');
      if (dlp) { NX.dl.action(dlp.dataset.dlPage); return; }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cartOpen) closeCart();
    });

    var js = $('#jogosSort');
    if (js) js.addEventListener('change', function () { jogosSort = js.value; renderJogosGrid(); });
    var ls = $('#lojaSort');
    if (ls) ls.addEventListener('change', function () { lojaSort = ls.value; renderLojaGrid(); });
    var bs = $('#biblioSort');
    if (bs) bs.addEventListener('change', function () { biblioSort = bs.value; renderBiblio(); });
  }

  /* ==================================================================
     BOOT
     ================================================================== */
  NX.on('boot', function () {
    var st = NX.dl.state();
    if (st.completed && !st.completed.length) {
      st.completed.push(
        { name: 'C\u00edrculo do \u00c4ther', tag: 'RPG', cover: 'assets/cover-circulo.svg', mb: 32000, when: 'hoje, 14:02' },
        { name: 'Vig\u00edlia Estelar', tag: 'Simula\u00e7\u00e3o', cover: 'assets/cover-aurora.svg', mb: 20000, when: 'ontem' }
      );
    }
    initRouter();
    bindGlobal();
    bindChat();
    renderCart();
  });
})();

