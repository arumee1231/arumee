/* =====================================================================
   Arumee — motion layer (GSAP + ScrollTrigger + Lenis)
   Purely presentational. Degrades to nothing when:
     - the user prefers reduced motion
     - GSAP failed to load
   Smooth scrolling (Lenis) is only enabled on mouse-driven desktops; touch
   devices keep native scrolling.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function finish() {
    root.classList.add('ed-motion-done');
    root.classList.remove('ed-motion-fallback');
  }

  if (reduce || !window.gsap) {
    root.classList.remove('ed-curtain');
    finish();
    return;
  }

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);

  var EASE = 'power3.out';
  var isHome = document.body.classList.contains('page-our-oils');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isWide = window.innerWidth > 900;

  /* ------------------------------------------------------------------
     1. Lenis smooth scroll (desktop only)
     ------------------------------------------------------------------ */
  var lenis = null;
  if (window.Lenis && finePointer) {
    try {
      // Keep native scrolling inside overlays that scroll on their own.
      ['cartDropdown', 'waChatPanel', 'mobileMenuOverlay', 'cartRestoreItems'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.setAttribute('data-lenis-prevent', '');
      });
      lenis = new window.Lenis({
        lerp: 0.09,
        wheelMultiplier: 0.95,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        allowNestedScroll: true,
        autoRaf: false
      });
      if (ST) lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      window.__arumeeLenis = lenis;
    } catch (e) { lenis = null; }
  }

  /* ------------------------------------------------------------------
     2. Scroll progress hairline under the nav
     ------------------------------------------------------------------ */
  if (ST) {
    var bar = document.createElement('div');
    bar.className = 'ed-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });
  }

  /* ------------------------------------------------------------------
     3. Reveal helper — IntersectionObserver decides *when*, GSAP does
        the tween. Robust against content-visibility:auto sections.
     ------------------------------------------------------------------ */
  var io = null;
  var queued = [];
  function reveal(targets, opts) {
    opts = opts || {};
    var els = typeof targets === 'string' ? Array.prototype.slice.call(document.querySelectorAll(targets)) : targets;
    if (!els || !els.length) return;
    var y = opts.y == null ? 28 : opts.y;
    var stagger = opts.stagger == null ? 0.08 : opts.stagger;
    gsap.set(els, { opacity: 0, y: y });
    var group = { els: els, done: false, run: function () {
      if (group.done) return;
      group.done = true;
      gsap.to(els, {
        opacity: 1, y: 0,
        duration: opts.duration || 1,
        ease: EASE,
        stagger: stagger,
        delay: opts.delay || 0,
        overwrite: 'auto',
        clearProps: 'opacity,transform'
      });
    } };
    if (!('IntersectionObserver' in window)) { group.run(); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          queued.forEach(function (g) {
            if (g.done || g.els.indexOf(entry.target) === -1) return;
            g.run();
            g.els.forEach(function (el) { io.unobserve(el); });
          });
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    }
    queued.push(group);
    // Observe every element: a hash jump can land mid-group, with the first
    // element already above the viewport.
    els.forEach(function (el) { io.observe(el); });
    // Safety net: never leave something invisible if the observer misses.
    setTimeout(group.run, 5000);
  }

  // Run any pending group that is already inside the viewport. Used after
  // hash navigation, when the observer may not have had a chance to fire.
  function revealInView() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    queued.forEach(function (g) {
      if (g.done) return;
      var hit = g.els.some(function (el) {
        var r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh && r.width > 0;
      });
      if (hit) g.run();
    });
  }
  window.addEventListener('hashchange', function () { setTimeout(revealInView, 50); });

  // Coming from another page to index.html#faq, the browser scrolls before
  // content-visibility sections have their real height, so it lands past the
  // target. Re-align once after load, unless the user has already moved.
  var userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
  });
  function alignHash() {
    var id = (location.hash || '').slice(1);
    if (!id || userMoved) return;
    var el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { immediate: true, force: true });
    else el.scrollIntoView({ behavior: 'instant', block: 'start' });
    setTimeout(revealInView, 50);
  }

  /* ------------------------------------------------------------------
     4. HOME — hero entrance + bottle parallax
     ------------------------------------------------------------------ */
  if (isHome) {
    /* Hero curtain (first visit per session; see editorial.css). Columns
       lift left to right: pale gold leads, deeper gold follows 160ms
       behind, uncovering the hero. On-screen movement, so a strong
       ease-in-out; WAAPI keeps it off the main thread. Returns how long
       to hold the hero entrance so copy rises as the columns clear. */
    var curtainLead = (function () {
      var hero = document.querySelector('header.hero');
      if (!root.classList.contains('ed-curtain') || !hero || !Element.prototype.animate) {
        root.classList.remove('ed-curtain');
        return 0;
      }
      var count = window.innerWidth >= 900 ? 5 : window.innerWidth >= 600 ? 4 : 3;
      var wrap = document.createElement('div');
      wrap.className = 'ed-curtain-cols';
      wrap.setAttribute('aria-hidden', 'true');
      var layers = [];
      for (var i = 0; i < count; i++) {
        var col = document.createElement('div');
        var back = document.createElement('span');
        var front = document.createElement('span');
        back.className = 'back';
        front.className = 'front';
        col.appendChild(back);
        col.appendChild(front);
        wrap.appendChild(col);
        layers.push([front, back]);
      }
      hero.appendChild(wrap);
      root.classList.remove('ed-curtain'); // flat cover off, columns now cover identically

      var HOLD = 120, DUR = 760, STEP = 70, TRAIL = 160;
      var EASE_IO = 'cubic-bezier(0.77, 0, 0.175, 1)';
      var last = null;
      layers.forEach(function (pair, i) {
        pair.forEach(function (el, layer) {
          last = el.animate(
            [{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }],
            { duration: DUR, delay: HOLD + i * STEP + layer * TRAIL, easing: EASE_IO, fill: 'forwards' }
          );
        });
      });
      var done = function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
      if (last) last.onfinish = done;
      setTimeout(done, HOLD + (count - 1) * STEP + TRAIL + DUR + 400); // safety
      return (HOLD + DUR * 0.55) / 1000;
    })();

    var copy = document.querySelector('.hero-copy');
    var bottles = document.querySelector('.hero-bottles');
    var bottleImgs = bottles ? bottles.querySelectorAll('.hero-bottle') : [];

    if (copy) {
      var items = Array.prototype.slice.call(copy.children);
      var tl = gsap.timeline({ defaults: { ease: EASE }, onComplete: finish });
      tl.fromTo(items, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, 0.1 + curtainLead);
      if (bottleImgs.length) {
        tl.fromTo(bottleImgs, { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.4, stagger: 0.1, clearProps: 'scale' }, 0.25 + curtainLead);
      }
      // Set final inline opacity so the CSS hook never hides things again.
      tl.set(items, { opacity: 1 });
      if (bottleImgs.length) tl.set(bottleImgs, { opacity: 1 });
    } else {
      finish();
    }

    if (bottles && bottleImgs.length) {
      // Idle float — very slow, different phase per bottle.
      Array.prototype.forEach.call(bottleImgs, function (img, i) {
        gsap.to(img, {
          y: i % 2 ? -8 : -12,
          duration: 3.6 + i * 0.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1.6 + i * 0.3
        });
      });

      // Scroll parallax — the bottles drift slower than the page.
      if (ST && isWide) {
        gsap.to(bottles, {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: { trigger: 'header.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
        if (copy) {
          gsap.to(copy, {
            yPercent: -6,
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: { trigger: 'header.hero', start: 'top top', end: 'bottom top', scrub: true }
          });
        }
      }

      // Pointer parallax on desktop.
      if (finePointer && isWide) {
        var hero = document.querySelector('header.hero');
        var movers = Array.prototype.map.call(bottleImgs, function (img, i) {
          var depth = [0.6, 0.9, 0.75][i] || 0.8;
          return {
            x: gsap.quickTo(img, 'x', { duration: 1.2, ease: 'power3.out' }),
            r: gsap.quickTo(img, 'rotation', { duration: 1.4, ease: 'power3.out' }),
            depth: depth
          };
        });
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width - 0.5;
          movers.forEach(function (m) {
            m.x(nx * 16 * m.depth);
            m.r(nx * 1.6 * m.depth);
          });
        }, { passive: true });
        var resetBottles = function () { movers.forEach(function (m) { m.x(0); m.r(0); }); };
        hero.addEventListener('pointerleave', resetBottles);
        window.addEventListener('blur', resetBottles);
        document.addEventListener('visibilitychange', function () { if (document.hidden) resetBottles(); });
      }
    }

    /* ---- HOME — price swap on pack-size change ----
       app.js rewrites the price's innerHTML; settle the new figure in so
       the change registers. Short and small: this fires on every tap. */
    var grid = document.getElementById('oilsGrid');
    if (grid && Element.prototype.animate) {
      grid.addEventListener('click', function (e) {
        var opt = e.target.closest && e.target.closest('.size-option');
        if (!opt || opt.classList.contains('active')) return;
        var priceEl = document.getElementById(opt.dataset.product + '-price');
        if (!priceEl) return;
        // Capture phase: runs before app.js swaps the price, so the
        // 'active' check above still sees the old state.
        requestAnimationFrame(function () {
          priceEl.animate(
            [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
            { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
          );
        });
      }, true);
    }

    /* ---- HOME — section reveals ---- */
    reveal('#oils .oils-intro h2, #oils .oils-intro p.lead', { y: 24, stagger: 0.12 });
    reveal('#oilsDeliveryInfo', { y: 16 });
    // The oils showcase animates its slides with scroll timelines
    // (editorial.css); reveal the stage as one piece so GSAP never writes
    // transforms onto the slides themselves.
    reveal('#oils .oils-stage', { y: 36, duration: 1.1 });
    reveal('.combo-promo-banner .container > *', { y: 18, stagger: 0.1 });
    reveal('#benefits > .container > h2, #benefits > .container > p.lead', { y: 24, stagger: 0.12 });
    // #benefits has its own scroll-linked story (editorial.css); no per-row reveal.
    reveal('#faq > .container > h2, #faq > .container > p.lead', { y: 24, stagger: 0.12 });
    reveal(Array.prototype.slice.call(document.querySelectorAll('#faq .faq-item')), { y: 14, stagger: 0.05, duration: 0.8 });
  } else {
    /* ---- SUBPAGES — gentle reveals on the existing blocks ---- */
    finish();
    var pageHero = document.querySelector('.page-hero');
    if (pageHero) {
      gsap.fromTo(pageHero.children, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.09, delay: 0.1, clearProps: 'opacity,transform' });
    }
    Array.prototype.forEach.call(document.querySelectorAll('main .section-block'), function (block) {
      reveal([block], { y: 26, duration: 1 });
    });
  }

  /* ------------------------------------------------------------------
     5. Keep ScrollTrigger honest after fonts/images settle
     ------------------------------------------------------------------ */
  function settle() {
    if (ST) ST.refresh();
    alignHash();
    revealInView();
    // The product carousel re-centres itself a couple of frames after load and
    // can drag the window back to the grid. For a short while, if the hash
    // target gets pushed away from the top without the user moving, re-align.
    var id = (location.hash || '').slice(1);
    var target = id && document.getElementById(id);
    if (target && !settle.watching) {
      settle.watching = true;
      var onScroll = function () {
        if (userMoved) return;
        if (Math.abs(target.getBoundingClientRect().top) > 150) alignHash();
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      setTimeout(function () { window.removeEventListener('scroll', onScroll); }, 2500);
    }
  }
  if (document.readyState === 'complete') setTimeout(settle, 0);
  else window.addEventListener('load', function () { setTimeout(settle, 0); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(settle, 0); });
  setTimeout(revealInView, 300);
})();
