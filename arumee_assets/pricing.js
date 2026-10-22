/* =====================================================================
   Arumee — the one pricing rule (all pages)
   Everything that shows or sends a price asks this file: the product
   card, the home cart (app.js), the inner-page cart (subpage-cart.js),
   checkout.html and the WhatsApp order message.

   Rule: 1L bottles of the same oil are charged in pairs at the 2L price
   when that is cheaper than two 1L bottles; an odd bottle pays the 1L
   price. Fixed bundles and other sizes are price x qty, with any
   original price shown struck through.

   The 2L price comes from the live list: oilOptions (home, checkout,
   already patched from the Google Sheet), else the Sheet prices cached
   in localStorage 'arumee_pricing'. With neither, no pair price applies.
   ===================================================================== */
(function () {
  'use strict';

  var OILS = ['coconut', 'groundnut', 'gingelly'];

  function int(v) { return parseInt(v, 10) || 0; }

  function money(v) { return '₹' + Number(v || 0).toLocaleString('en-IN'); }

  // Which oil a cart line is, from whatever the adding script stored.
  function oilOf(item) {
    var text = [item.itemKey, item.id, item.productName, item.originalName].join(' ').toLowerCase();
    if (/sesame/.test(text)) return 'gingelly';
    for (var i = 0; i < OILS.length; i++) if (text.indexOf(OILS[i]) > -1) return OILS[i];
    return null;
  }

  function priceFor(oil, size) {
    try {
      if (typeof oilOptions !== 'undefined' && Array.isArray(oilOptions)) {
        for (var i = 0; i < oilOptions.length; i++) {
          if (oilOptions[i] && oilOptions[i].id === oil + '-' + size) return int(oilOptions[i].price);
        }
      }
    } catch (e) {}
    try {
      var cfg = JSON.parse(localStorage.getItem('arumee_pricing') || 'null');
      var p = cfg && cfg[oil] && cfg[oil].prices && cfg[oil].prices[size];
      if (p) return int(p);
    } catch (e) {}
    return 0;
  }

  /* One cart line (or a card selection shaped like one):
     { itemKey|id|productName, size, price, originalPrice?, qty, isFixedBundle? }
     Returns { qty, unit, now, was, saved } — now is what is charged. */
  function line(item) {
    item = item || {};
    var qty = Math.max(1, int(item.qty) || 1);
    var unit = Math.max(0, int(item.price));
    var now = unit * qty;
    var orig = int(item.originalPrice);
    var was = orig > unit ? orig * qty : now;
    var bundle = item.isFixedBundle || item.id === 'bundle-discount';

    if (!bundle && String(item.size).toUpperCase() === '1L' && qty >= 2) {
      var oil = oilOf(item);
      var pair = oil ? priceFor(oil, '2L') : 0;
      if (pair && pair < 2 * unit) {
        now = Math.floor(qty / 2) * pair + (qty % 2) * unit;
        was = Math.max(was, qty * unit);
      }
    }
    return { qty: qty, unit: unit, now: now, was: was, saved: Math.max(0, was - now) };
  }

  function total(items) {
    var sum = { now: 0, was: 0, saved: 0 };
    (items || []).forEach(function (item) {
      if (!item) return;
      var l = line(item);
      sum.now += l.now; sum.was += l.was; sum.saved += l.saved;
    });
    return sum;
  }

  window.ArumeePricing = { line: line, total: total, priceFor: priceFor, money: money };
})();
