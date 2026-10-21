/* =====================================================================
   Arumee — cart drawer behaviour (all pages)
   The home cart (app.js) and the inner-page cart (subpage-cart.js) both
   render lines into #cartContent and toggle .open on #cartDropdown. This
   layer only watches those, so neither cart script has to change:
     - header item count and the "You save" summary row
     - two-tap "Clear cart" (first tap arms it for 3s)
     - "Continue shopping" closes the drawer
     - an empty state with a way back to the oils
     - page scroll lock while open, focus returned on close
   ===================================================================== */
(function () {
  'use strict';

  var panel = document.getElementById('cartDropdown');
  var content = document.getElementById('cartContent');
  if (!panel || !content) return;

  var root = document.documentElement;
  var isHome = document.body.classList.contains('page-our-oils');
  var countEl = panel.querySelector('[data-cart-count]');
  var saveRow = panel.querySelector('[data-cart-savings]');
  var saveAmt = panel.querySelector('[data-cart-savings-amount]');

  function num(text) { return parseInt(String(text || '').replace(/[^0-9]/g, ''), 10) || 0; }
  function money(v) { return '₹' + Number(v).toLocaleString('en-IN'); }

  function summarise() {
    var lines = content.querySelectorAll('.order-item, .cart-item').length;
    if (countEl) countEl.textContent = lines ? (lines === 1 ? '1 item' : lines + ' items') : '';

    // Savings = what the lines strike through minus what they charge.
    var saved = 0;
    Array.prototype.forEach.call(content.querySelectorAll('.order-price, .cart-item-info'), function (line) {
      var was = line.querySelector('.old-price');
      var now = line.querySelector('.new-price');
      if (was && now) saved += Math.max(0, num(was.textContent) - num(now.textContent));
    });
    if (saveRow) saveRow.hidden = saved <= 0;
    if (saveAmt) saveAmt.textContent = money(saved);

    var empty = content.querySelector('.empty-cart');
    if (empty && !content.querySelector('.cart-empty-cta')) {
      var cta = document.createElement('a');
      cta.className = 'cart-empty-cta';
      cta.href = isHome ? '#oilsGrid' : 'index.html#oilsGrid';
      cta.textContent = 'Browse our oils';
      if (isHome) {
        cta.addEventListener('click', function () {
          if (panel.classList.contains('open') && typeof window.toggleCart === 'function') window.toggleCart();
        });
      }
      empty.insertAdjacentElement('afterend', cta);
    }
  }

  function disarm(btn) {
    clearTimeout(btn._arumeeTimer);
    btn.removeAttribute('data-armed');
    btn.textContent = 'Clear cart';
  }

  panel.addEventListener('click', function (event) {
    var clear = event.target.closest('[data-cart-clear]');
    if (clear) {
      event.preventDefault();
      event.stopPropagation();
      if (clear.getAttribute('data-armed') === 'true') {
        disarm(clear);
        var fn = window[clear.getAttribute('data-cart-clear')];
        if (typeof fn === 'function') fn();
        return;
      }
      clear.setAttribute('data-armed', 'true');
      clear.textContent = 'Tap again to clear';
      clear._arumeeTimer = setTimeout(function () { disarm(clear); }, 3000);
      return;
    }
    if (event.target.closest('[data-cart-continue]')) {
      event.preventDefault();
      if (typeof window.toggleCart === 'function') window.toggleCart();
    }
  });

  // Open / close side effects.
  var opener = null;
  new MutationObserver(function () {
    var open = panel.classList.contains('open');
    root.classList.toggle('cart-drawer-open', open);
    if (window.__arumeeLenis) { if (open) window.__arumeeLenis.stop(); else window.__arumeeLenis.start(); }
    if (open) {
      if (!panel.contains(document.activeElement)) opener = document.activeElement;
      summarise();
    } else {
      Array.prototype.forEach.call(panel.querySelectorAll('[data-armed]'), disarm);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        try { opener.focus({ preventScroll: true }); } catch (e) {}
      }
      opener = null;
    }
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });

  new MutationObserver(summarise).observe(content, { childList: true, subtree: true, characterData: true });
  summarise();
})();
