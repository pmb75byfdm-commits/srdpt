/* =========================================================
   SRDPT® — site interactions
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2800);
  }

  $$('[data-toast]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      toast(el.getAttribute('data-toast'));
    });
  });

  /* ---------- Header ---------- */
  var hdr = $('.hdr');
  var lastY = window.pageYOffset;

  function onScroll() {
    var y = window.pageYOffset;
    if (hdr) {
      hdr.classList.toggle('is-stuck', y > 16);
      if (y > 260 && y > lastY + 4) {
        hdr.classList.add('is-hidden');
      } else if (y < lastY - 4 || y < 120) {
        hdr.classList.remove('is-hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-btn');
  var mnav = $('#mnav');
  var mnavClose = $('.mnav-close');

  function setMenu(open) {
    if (!mnav || !menuBtn) return;
    mnav.classList.toggle('is-open', open);
    mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    document.body.classList.toggle('is-locked', open);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
  if (mnavClose) mnavClose.addEventListener('click', function () { setMenu(false); });
  $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mnav && mnav.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Reveal ---------- */
  var revealTargets = $$('.look-item, .prod, .arc-row, .linesheet-full, .launch-block, .cheer-block, .col-side, .story-inner');
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (n) {
          return n.classList && n.classList.contains('reveal');
        }) : [];
        var idx = siblings.indexOf(el);
        if (idx > 0) el.style.setProperty('--d', Math.min(idx, 5) * 70 + 'ms');
        el.classList.add('in');
        ro.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    revealTargets.forEach(function (el) { ro.observe(el); });

    var heroRv = $$('.rv');
    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); heroObs.unobserve(entry.target); }
      });
    }, { threshold: 0.02 });
    heroRv.forEach(function (el) { heroObs.observe(el); });
    // hero is visible on load: force in state
    window.requestAnimationFrame(function () {
      heroRv.forEach(function (el) { el.classList.add('in'); });
    });
  } else {
    $$('.rv, .reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Lookbook filter ---------- */
  var grid = $('#lookGrid');
  var filterBtns = $$('.filter');
  var lookItems = $$('.look-item');

  lookItems.forEach(function (item) {
    var cat = item.getAttribute('data-cat');
    item.setAttribute('data-cat', cat);
  });

  $$('[data-count]').forEach(function (el) {
    var key = el.getAttribute('data-count');
    var n = key === 'all' ? lookItems.length : lookItems.filter(function (i) { return i.getAttribute('data-cat') === key; }).length;
    el.textContent = ('0' + n).slice(-2);
  });

  function applyFilter(key) {
    filterBtns.forEach(function (b) {
      var on = b.getAttribute('data-filter') === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (grid) grid.classList.toggle('is-flat', key !== 'all');
    lookItems.forEach(function (item) {
      var hide = key !== 'all' && item.getAttribute('data-cat') !== key;
      item.classList.toggle('is-hidden', hide);
      if (!hide) item.classList.add('in');
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.getAttribute('data-filter')); });
  });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCaption');
  var lbCount = $('#lbCount');
  var lbList = [];
  var lbIndex = 0;
  var lastFocus = null;

  function pad(n) { return ('0' + n).slice(-2); }

  function buildGroup(name) {
    var out = [];
    var seen = {};
    if (name === 'cheer') {
      $$('.cheer-img').forEach(function (img) {
        out.push({ src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', caption: '2027 대학생활 응원 프로젝트' });
      });
      return out;
    }
    $$('[data-group="' + name + '"]').forEach(function (btn) {
      var item = btn.closest('.look-item');
      if (item && item.classList.contains('is-hidden')) return;
      var src = btn.getAttribute('data-full');
      if (!src || seen[src]) return;
      seen[src] = true;
      out.push({
        src: src,
        alt: btn.getAttribute('data-alt') || '',
        caption: btn.getAttribute('data-caption') || ''
      });
    });
    return out;
  }

  function renderLB() {
    if (!lbList.length) return;
    var cur = lbList[lbIndex];
    lbImg.setAttribute('src', cur.src);
    lbImg.setAttribute('alt', cur.alt);
    lbCap.textContent = cur.caption;
    lbCount.textContent = pad(lbIndex + 1) + ' / ' + pad(lbList.length);
    lb.classList.toggle('is-single', lbList.length < 2);
  }

  function openLB(name, src) {
    var list = buildGroup(name);
    if (!list.length) return;
    var idx = 0;
    if (src) {
      var found = -1;
      list.forEach(function (o, i) { if (o.src === src) found = i; });
      idx = found > -1 ? found : 0;
    }
    lbList = list;
    lbIndex = idx;
    lastFocus = document.activeElement;
    renderLB();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    var closeBtn = $('.lb-close');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeLB() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function stepLB(dir) {
    if (lbList.length < 2) return;
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
    renderLB();
  }

  $$('[data-group]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.getAttribute('data-group');
      var src = btn.getAttribute('data-full');
      if (group === 'cheer') {
        var imgs = $$('.cheer-img');
        var active = imgs.filter(function (i) { return i.classList.contains('is-active'); })[0] || imgs[0];
        openLB('cheer', active ? active.getAttribute('src') : null);
        return;
      }
      openLB(group, src);
    });
  });

  // cheer stage opens current poster
  var cheerStage = $('#cheerStage');
  if (cheerStage) {
    cheerStage.style.cursor = 'zoom-in';
    cheerStage.addEventListener('click', function () {
      var imgs = $$('.cheer-img');
      var active = imgs.filter(function (i) { return i.classList.contains('is-active'); })[0] || imgs[0];
      openLB('cheer', active ? active.getAttribute('src') : null);
    });
  }

  if (lb) {
    $('.lb-close').addEventListener('click', closeLB);
    $('.lb-prev').addEventListener('click', function () { stepLB(-1); });
    $('.lb-next').addEventListener('click', function () { stepLB(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLB();
    });

    window.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeLB(); }
      else if (e.key === 'ArrowLeft') { stepLB(-1); }
      else if (e.key === 'ArrowRight') { stepLB(1); }
      else if (e.key === 'Tab') {
        var f = $$('.lb button, .lb-stage', lb).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      }
    });
  }

  /* ---------- Campaign tabs ---------- */
  var cheerImgs = $$('.cheer-img');
  var ctabs = $$('.ctab');
  var cdots = $$('.cdot');
  var cheerCount = $('#cheerCount');

  function setCheer(i) {
    cheerImgs.forEach(function (img, idx) { img.classList.toggle('is-active', idx === i); });
    ctabs.forEach(function (t, idx) {
      t.classList.toggle('is-active', idx === i);
      t.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
    cdots.forEach(function (d, idx) {
      d.classList.toggle('is-active', idx === i);
      d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
    if (cheerCount) cheerCount.textContent = pad(i + 1) + ' / ' + pad(cheerImgs.length);
  }
  ctabs.concat(cdots).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = parseInt(btn.getAttribute('data-tab'), 10) || 0;
      setCheer(i);
    });
  });

  /* ---------- Active nav ---------- */
  var sections = ['lookbook', 'collection', 'campaign', 'archive'];
  var navLinks = $$('[data-nav]');
  var navTick = false;

  function updateNav() {
    navTick = false;
    if (!navLinks.length) return;
    var marker = window.pageYOffset + window.innerHeight * 0.4;
    var active = '';
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= marker) active = id;
    });
    var story = document.getElementById('story');
    if (story && story.offsetTop <= marker) active = '';
    navLinks.forEach(function (a) {
      a.classList.toggle('is-current', a.getAttribute('href') === '#' + active);
    });
  }

  window.addEventListener('scroll', function () {
    if (navTick) return;
    navTick = true;
    window.requestAnimationFrame(updateNav);
  }, { passive: true });
  updateNav();

  /* ---------- D-day ---------- */
  var dday = $('#dday');
  if (dday) {
    var end = new Date('2026-12-08T23:59:59+09:00');
    var now = new Date();
    var diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (diff > 0 && diff <= 60) {
      dday.textContent = 'D-' + diff + ' · 12.08 종료';
      dday.hidden = false;
    }
  }

  /* ---------- Newsletter ---------- */
  var form = $('#letterForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#letterEmail');
      var v = input ? input.value.trim() : '';
      if (!v) { toast('이메일 주소를 입력해 주세요.'); return; }
      toast('구독 기능은 준비 중입니다. 첫 드롭 소식은 @srdpt에서 안내드립니다.');
      if (input) input.value = '';
    });
  }
})();
