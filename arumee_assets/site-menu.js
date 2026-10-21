/* =====================================================================
   Arumee — phone menu behaviour (all pages)
   The open/close itself stays with the page's toggleMobileMenu() /
   closeMobileMenu(); this layer watches the overlay's .open class and adds:
     - aria-current="page" on the link for the page being viewed
     - Escape closes the menu
     - focus moves to the first link on open, back to the menu button on close
   ===================================================================== */
(function () {
  'use strict';

  var overlay = document.getElementById('mobileMenuOverlay');
  if (!overlay) return;
  var links = Array.prototype.slice.call(overlay.querySelectorAll('.mmo-nav .mmo-link'));
  var button = document.getElementById('mobileMenuBtn');

  // Current page: subpages match by file name; on the home page only
  // "Home" is current (its in-page links are sections, not pages).
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (file === '') file = 'index.html';
  links.forEach(function (a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    var target = href.split('#')[0];
    var isHomeLink = href === '#' || href === 'index.html';
    var current = file === 'index.html' ? isHomeLink : (target === file);
    if (current) a.setAttribute('aria-current', 'page');
  });

  function close() {
    if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });

  var wasOpen = false;
  new MutationObserver(function () {
    var open = overlay.classList.contains('open');
    if (open === wasOpen) return;
    wasOpen = open;
    if (open) {
      setTimeout(function () { if (links[0]) links[0].focus({ preventScroll: true }); }, 80);
    } else if (button && overlay.contains(document.activeElement)) {
      button.focus({ preventScroll: true });
    }
  }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
})();
