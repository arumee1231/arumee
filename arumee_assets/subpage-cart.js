(function () {
  var STORAGE_KEY = 'arumeeCart';
  var LEGACY_KEYS = ['arumee_cart', 'arumee_chat', 'arumee_delivery'];

  var dom = {
    navCartBtn: document.getElementById('navCartBtn'),
    navCartCount: document.getElementById('navCartCount'),
    mobileNavCart: document.getElementById('mobileNavCart'),
    mncBadge: document.getElementById('mncBadge'),
    cartTab: document.getElementById('cartTab'),
    cartCount: document.getElementById('cartCount'),
    cartDropdown: document.getElementById('cartDropdown'),
    cartContent: document.getElementById('cartContent'),
    cartFooter: document.getElementById('cartFooter'),
    cartTotal: document.getElementById('cartTotal'),
    cartBackdrop: document.getElementById('cartBackdrop'),
    pageToast: document.getElementById('pageToast')
  };

  if (!dom.cartDropdown || !dom.cartContent || !dom.cartFooter || !dom.cartTotal) {
    return;
  }

  var orderItems = [];
  var isCartOpen = false;
  var toastTimer = null;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>\"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function formatCurrency(amount) {
    return 'Rs ' + Number(amount || 0).toLocaleString('en-IN');
  }

  function readCart() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }

    try {
      var parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map(function (item) {
          if (!item || typeof item !== 'object') {
            return null;
          }

          var qty = Math.max(1, Math.min(10, Number(item.qty) || 1));
          var price = Math.max(0, Number(item.price) || 0);

          return {
            itemKey: item.itemKey || '',
            productName: item.productName || item.originalName || 'Arumee Oil',
            originalName: item.originalName || item.productName || 'Arumee Oil',
            size: item.size || '',
            qty: qty,
            price: price,
            total: price * qty,
            isFixedBundle: Boolean(item.isFixedBundle)
          };
        })
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function writeCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderItems));
  }

  function syncCounts() {
    var count = orderItems.length;

    if (dom.navCartCount) {
      dom.navCartCount.textContent = String(count);
    }
    if (dom.navCartBtn) {
      dom.navCartBtn.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (dom.mncBadge) {
      dom.mncBadge.textContent = String(count);
      dom.mncBadge.classList.toggle('has-items', count > 0);
    }
    if (dom.cartCount) {
      dom.cartCount.textContent = String(count);
    }

    document.body.classList.toggle('has-cart-items', count > 0);
  }

  function showToast(message) {
    if (!dom.pageToast) {
      return;
    }

    dom.pageToast.textContent = message;
    dom.pageToast.classList.add('show');

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(function () {
      dom.pageToast.classList.remove('show');
    }, 1800);
  }

  function renderCart() {
    orderItems = readCart();
    syncCounts();

    if (!orderItems.length) {
      dom.cartContent.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      dom.cartFooter.style.display = 'none';
      dom.cartTotal.textContent = formatCurrency(0);
      return;
    }

    var grandTotal = 0;

    var html = orderItems
      .map(function (item, index) {
        var lineTotal = item.price * item.qty;
        grandTotal += lineTotal;
        var details = item.size ? item.size + ' @ ' + formatCurrency(item.price) : formatCurrency(item.price);

        return [
          '<div class="cart-item">',
          '<div class="cart-item-info">',
          '<div class="cart-item-name">' + escapeHtml(item.productName) + '</div>',
          '<div class="cart-item-details">' + escapeHtml(details) + '</div>',
          '<div class="cart-item-price">' + formatCurrency(lineTotal) + '</div>',
          '</div>',
          '<div class="cart-item-controls">',
          '<div class="cart-stepper">',
          '<button type="button" data-cart-action="dec" data-index="' + index + '" aria-label="Decrease quantity">-</button>',
          '<input type="number" value="' + item.qty + '" readonly />',
          '<button type="button" data-cart-action="inc" data-index="' + index + '" aria-label="Increase quantity">+</button>',
          '</div>',
          '<button type="button" class="cart-item-remove" data-cart-action="remove" data-index="' + index + '">Remove</button>',
          '</div>',
          '</div>'
        ].join('');
      })
      .join('');

    dom.cartContent.innerHTML = html;
    dom.cartTotal.textContent = formatCurrency(grandTotal);
    dom.cartFooter.style.display = 'flex';
  }

  function openCart() {
    isCartOpen = true;
    dom.cartDropdown.classList.add('open');
    if (dom.cartBackdrop) {
      dom.cartBackdrop.classList.add('visible');
    }
    document.body.classList.add('cart-open');
    if (dom.cartTab) {
      dom.cartTab.setAttribute('aria-expanded', 'true');
    }
    renderCart();
  }

  function closeCart() {
    isCartOpen = false;
    dom.cartDropdown.classList.remove('open');
    if (dom.cartBackdrop) {
      dom.cartBackdrop.classList.remove('visible');
    }
    document.body.classList.remove('cart-open');
    if (dom.cartTab) {
      dom.cartTab.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleCart(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (isCartOpen) {
      closeCart();
    } else {
      openCart();
    }
  }

  function changeQuantity(index, delta) {
    if (index < 0 || index >= orderItems.length) {
      return;
    }

    var item = orderItems[index];
    item.qty = Math.max(1, Math.min(10, item.qty + delta));
    item.total = item.qty * item.price;

    writeCart();
    renderCart();
  }

  function removeItem(index) {
    if (index < 0 || index >= orderItems.length) {
      return;
    }

    orderItems.splice(index, 1);
    writeCart();
    renderCart();
  }

  function clearCart() {
    orderItems = [];
    writeCart();
    LEGACY_KEYS.forEach(function (key) {
      localStorage.removeItem(key);
    });
    renderCart();
  }

  function mergeOrAddItem(item) {
    var key = item.itemKey || [item.productName, item.size, item.price].join('|');
    var existingIndex = orderItems.findIndex(function (entry) {
      var entryKey = entry.itemKey || [entry.productName, entry.size, entry.price].join('|');
      return entryKey === key;
    });

    if (existingIndex >= 0) {
      orderItems[existingIndex].qty = Math.min(10, orderItems[existingIndex].qty + item.qty);
      orderItems[existingIndex].total = orderItems[existingIndex].qty * orderItems[existingIndex].price;
      return;
    }

    orderItems.push(item);
  }

  window.toggleCart = toggleCart;

  window.clearSubCart = function clearSubCart() {
    clearCart();
    closeCart();
    showToast('Cart cleared.');
  };

  window.proceedToOrder = function proceedToOrder() {
    renderCart();

    if (!orderItems.length) {
      showToast('Your cart is empty.');
      return;
    }

    closeCart();
    window.location.href = 'checkout.html';
  };

  window.subpageCartAddItem = function subpageCartAddItem(input) {
    if (!input || typeof input !== 'object') {
      return;
    }

    renderCart();

    var normalizedItem = {
      itemKey: input.itemKey || '',
      productName: input.productName || 'Arumee Combo',
      originalName: input.originalName || input.productName || 'Arumee Combo',
      size: input.size || '',
      qty: Math.max(1, Math.min(10, Number(input.qty) || 1)),
      price: Math.max(0, Number(input.price) || 0),
      total: 0,
      isFixedBundle: Boolean(input.isFixedBundle)
    };

    normalizedItem.total = normalizedItem.qty * normalizedItem.price;

    mergeOrAddItem(normalizedItem);
    writeCart();
    renderCart();

    showToast((normalizedItem.productName || 'Item') + ' added to cart.');
  };

  if (dom.navCartBtn) {
    dom.navCartBtn.addEventListener('click', toggleCart);
  }

  if (dom.mobileNavCart) {
    dom.mobileNavCart.addEventListener('click', toggleCart);
  }

  if (dom.cartTab) {
    dom.cartTab.addEventListener('click', toggleCart);
  }

  if (dom.cartBackdrop) {
    dom.cartBackdrop.addEventListener('click', closeCart);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;

    var actionButton = target.closest('[data-cart-action]');
    if (actionButton) {
      var index = Number(actionButton.getAttribute('data-index'));
      var action = actionButton.getAttribute('data-cart-action');

      if (action === 'inc') {
        changeQuantity(index, 1);
      } else if (action === 'dec') {
        changeQuantity(index, -1);
      } else if (action === 'remove') {
        removeItem(index);
      }

      return;
    }

    if (!isCartOpen) {
      return;
    }

    if (dom.cartDropdown.contains(target)) {
      return;
    }

    if (dom.navCartBtn && dom.navCartBtn.contains(target)) {
      return;
    }

    if (dom.mobileNavCart && dom.mobileNavCart.contains(target)) {
      return;
    }

    if (dom.cartTab && dom.cartTab.contains(target)) {
      return;
    }

    if (dom.cartBackdrop && dom.cartBackdrop.contains(target)) {
      return;
    }

    closeCart();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isCartOpen) {
      closeCart();
    }
  });

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) {
      renderCart();
    }
  });

  renderCart();
})();
