(function () {
  function setCurrentYear() {
    var nodes = document.querySelectorAll('[data-year]');
    var year = new Date().getFullYear();
    nodes.forEach(function (node) {
      node.textContent = String(year);
    });
  }

  function highlightActiveNav() {
    var active = (document.body.getAttribute('data-active-nav') || '').toLowerCase();
    if (!active) {
      return;
    }

    var links = document.querySelectorAll('.desktop-nav-link[data-nav]');
    links.forEach(function (link) {
      if (link.getAttribute('data-nav') === active) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function watchHeaderScroll() {
    var nav = document.getElementById('stickyNav');
    if (!nav) {
      return;
    }

    var sync = function () {
      if (window.scrollY > 8) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    };

    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  function revealOnScroll() {
    var revealNodes = document.querySelectorAll('.reveal');
    if (!revealNodes.length || !('IntersectionObserver' in window)) {
      revealNodes.forEach(function (node) {
        node.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  setCurrentYear();
  highlightActiveNav();
  watchHeaderScroll();
  revealOnScroll();
})();

function toggleMobileMenu() {
  var overlay = document.getElementById('mobileMenuOverlay');
  var btn = document.getElementById('mobileMenuBtn');
  if (!overlay) return;
  var isOpen = overlay.classList.contains('open');
  overlay.classList.toggle('open', !isOpen);
  if (btn) { btn.classList.toggle('open', !isOpen); btn.setAttribute('aria-expanded', String(!isOpen)); }
  overlay.setAttribute('aria-hidden', String(isOpen));
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeMobileMenu() {
  var overlay = document.getElementById('mobileMenuOverlay');
  var btn = document.getElementById('mobileMenuBtn');
  if (!overlay) return;
  overlay.classList.remove('open');
  if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
