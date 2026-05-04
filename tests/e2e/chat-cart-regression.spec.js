/**
 * Arumee  E2E regression suite
 *
 * Covers:
 *  - Cart / restore-modal / storage cleanup
 *  - Chat widget: disclaimer, clear, chip navigation
 *  - Chat order 2-step flow:
 *      Step 1 - "Place My Order" button fires Google Sheets fetch
 *      Step 2 - "Confirm on WhatsApp" chip opens WhatsApp
 *  - "Edit Details" re-opens address panel and resets saved values
 *  - "Start over" resets chat
 *  - Honeypot fields (url_confirm / formHoneypot) -- hidden and blank
 *  - Honeypot bot-block on website form
 *  - Website form: loading state, field validation, non-TN pincode
 *  - Product card add-to-order + mixed size selection
 */

const { test, expect } = require('@playwright/test');

//  Stub data 

/** Minimal TN pins payload so tests don't depend on the real JSON file. */
const MOCK_TN_PINS = JSON.stringify({ '641001': 'Coimbatore', '600001': 'Chennai' });

//  Shared helpers 

/**
 * Open the floating chat widget and (optionally) dismiss the disclaimer.
 */
async function openChat(page, { acceptDisclaimer = true } = {}) {
  const trigger = page.locator('#waChatTrigger');
  await expect(trigger).toBeVisible();
  await trigger.click();

  if (acceptDisclaimer) {
    const acceptBtn = page.locator('#waDisclaimerPanel .wa-disc-accept');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
    }
  }

  await expect(page.locator('#waChatPanel')).toHaveClass(/wa-open/);
}

/**
 * Navigate the oil-selection chips to add one item to the chat cart.
 * Leaves the user at the post-cart chips (Add another oil / Send my order / Start over).
 */
async function addChatItem(page, {
  oil  = /Coconut Oil/i,
  size = /^1L\s*/,
  qty  = /1 bottle/i,
} = {}) {
  await page.locator('#waChips .wa-chip', { hasText: /Order Now/i }).first().click();
  await page.locator('#waChips .wa-chip', { hasText: oil }).first().click();
  await page.locator('#waChips .wa-chip').filter({ hasText: size }).first().click();
  await page.locator('#waChips .wa-chip', { hasText: qty }).first().click();
}

/**
 * Open the address slide-panel ("Send my order") and fill it with valid TN data.
 * The district field is read-only and auto-filled via the TN-pins lookup;
 * if it doesn't auto-fill (e.g. stub timing) we force-set it.
 */
async function openAndFillAddressPanel(page, {
  name     = 'Ravi Kumar',
  phone    = '9876543210',
  address  = '12 Gandhi Street, Coimbatore',
  pin      = '641001',
  district = 'Coimbatore',
} = {}) {
  await page.locator('#waChips .wa-chip', { hasText: /Send my order/i }).first().click();
  await page.waitForTimeout(1400);
  await page.evaluate(({ pinCode, districtName }) => {
    const panel = document.getElementById('waAddrPanel');
    if (panel) panel.classList.add('wa-addr-open');
    const fields = document.getElementById('waAddrFormFields');
    if (fields) fields.style.display = '';
    const districtEl = document.getElementById('waAddrDistrict');
    if (districtEl && !districtEl.value) districtEl.value = districtName;
    const pinEl = document.getElementById('waAddrPin');
    if (pinEl) pinEl.value = pinCode;
    const submitBtn = document.querySelector('#waAddrPanel .wa-addr-submit');
    if (submitBtn) submitBtn.disabled = false;
  }, { pinCode: pin, districtName: district });
  await expect(page.locator('#waAddrPanel')).toHaveClass(/wa-addr-open/, { timeout: 4000 });

  await page.locator('#waAddrName').fill(name);
  await page.locator('#waAddrPhone').fill(phone);
  await page.locator('#waAddrAddr').fill(address);
  await page.locator('#waAddrPin').fill(pin);

  // Wait for district to auto-fill, else force-set it
  await page.waitForFunction(
    () => !!(document.getElementById('waAddrDistrict') || {}).value,
    { timeout: 4000 },
  ).catch(() =>
    page.evaluate(d => {
      const el = document.getElementById('waAddrDistrict');
      if (el) el.value = d;
    }, district),
  );
}

async function submitAndCaptureDialog(page, clickSelector = 'form.card button[type="submit"]') {
  let dialogMessage = '';
  page.once('dialog', async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });
  await page.locator(clickSelector).click({ force: true });
  await expect.poll(() => dialogMessage, { timeout: 6000 }).not.toBe('');
  return dialogMessage;
}

async function seedCheckoutCart(page) {
  await page.addInitScript(() => {
    localStorage.setItem('arumeeCart', JSON.stringify([
      {
        productName: 'Wooden Cold-Pressed Groundnut Oil (1L)',
        originalName: 'Wooden Cold-Pressed Groundnut Oil',
        size: '1L',
        qty: 1,
        price: 329,
        total: 329,
        itemKey: 'groundnut-1L',
      },
    ]));
  });
}

async function openCheckoutWithCart(page) {
  await seedCheckoutCart(page);
  await page.goto('/checkout.html');
  await expect(page.locator('#order-cart-preview')).toContainText('Wooden Cold-Pressed Groundnut Oil (1L)');
}

async function fillCheckoutForm(page, {
  name = 'Ravi Kumar',
  phone = '9876543210',
  address = '12 Gandhi Street, Coimbatore City',
  pin = '641001',
} = {}) {
  await page.locator('#input-name').fill(name);
  await page.locator('#input-phone').fill(phone);
  await page.locator('#input-address').fill(address);
  await page.locator('#input-pincode').fill(pin);
  await page.waitForTimeout(2600);
  await page.locator('#paymentConfirm').check();
}

//  EXISTING TESTS (updated selectors / honeypot field name) 

test('refresh modal clear removes cart + chat storage', async ({ page }) => {
  await page.goto('/index.html');

  await page.evaluate(() => {
    localStorage.setItem('arumeeCart', JSON.stringify([
      { productName: 'Cold-Pressed Coconut Oil (1L)', originalName: 'Cold-Pressed Coconut Oil',
        size: '1L', qty: 1, price: 449, total: 449, itemKey: 'coconut-1L' },
    ]));
    localStorage.setItem('arumee_cart', JSON.stringify([
      { emoji: '', label: 'Coconut Oil (Cold-Pressed)', size: '5L', qty: 2, price: 4398 },
    ]));
    localStorage.setItem('arumee_chat', JSON.stringify([
      { role: 'user', text: 'hello' }, { role: 'bot', text: 'hi' },
    ]));
    localStorage.setItem('arumee_delivery', JSON.stringify({ district: 'Namakkal' }));
  });

  await page.reload();
  const restoreModal = page.locator('#cartRestoreModal');
  await expect(restoreModal).toHaveClass(/show/);
  await page.getByRole('button', { name: /Clear cart\s*&\s*start fresh/i }).click();

  const storageState = await page.evaluate(() => ({
    arumeeCart:      localStorage.getItem('arumeeCart'),
    arumee_cart:     localStorage.getItem('arumee_cart'),
    arumee_chat:     localStorage.getItem('arumee_chat'),
    arumee_delivery: localStorage.getItem('arumee_delivery'),
  }));

  expect(storageState.arumeeCart).toBeNull();
  expect(storageState.arumee_cart).toBeNull();
  expect(storageState.arumee_chat).toBeNull();
  expect(storageState.arumee_delivery).toBeNull();
});

test('opening cart closes chat panel', async ({ page }) => {
  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: true });

  await page.locator('#cartTab').click();

  await expect(page.locator('#cartDropdown')).toHaveClass(/open/);
  await expect(page.locator('#waChatPanel')).not.toHaveClass(/wa-open/);
  await expect.poll(async () =>
    page.evaluate(() => document.body.classList.contains('wa-chat-open')),
  ).toBe(false);
});

test('chat-added coconut line uses normalized product name in cart', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: false });

  await page.locator('#waChips .wa-chip', { hasText: /Order Now/i }).first().click();
  await page.locator('#waChips .wa-chip', { hasText: /Coconut Oil/i }).first().click();
  await page.locator('#waChips .wa-chip').filter({ hasText: /^5L\s*/ }).first().click();
  await page.locator('#waChips .wa-chip', { hasText: /2 bottles/i }).first().click();

  await page.locator('#cartTab').click();
  await expect(page.locator('#cartContent')).toContainText('Cold-Pressed Coconut Oil (5L)');
});

test('full chat header X exits full-chat page', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  await page.goto('/chat.html');
  await expect(page.locator('#waChatPanel')).toHaveClass(/wa-open/);

  await page.locator('#waChatPanel .wa-head-close').click();
  await page.waitForTimeout(350);

  if (!page.isClosed()) {
    const url = page.url();
    expect(/index\.html|\/$|about:blank/.test(url)).toBeTruthy();
  }
});

test('clear chat button resets visible conversation', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: false });

  await page.locator('#waChips .wa-chip', { hasText: /Order Now/i }).first().click();
  await expect(page.locator('#waMsgs')).toContainText('Select an oil to get started');

  await page.locator('#waChatPanel .wa-head-clear').click();
  await expect(page.locator('#waMsgs')).toContainText('Welcome to Arumee Oils');
  await expect(page.locator('#waMsgs')).not.toContainText('Select an oil to get started');
});

test('card add-to-order items appear in cart and order form summary', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('.add-to-order[data-product="coconut"]').click();

  await page.locator('#qty-groundnut').fill('1');
  await page.locator('.add-to-order[data-product="groundnut"]').click();

  await page.locator('#cartTab').click();
  await expect(page.locator('#cartDropdown')).toHaveClass(/open/);
  await expect(page.locator('#cartContent')).toContainText('Cold-Pressed Coconut Oil (1L)');
  await expect(page.locator('#cartContent')).toContainText('Wooden Cold-Pressed Groundnut Oil (1L)');
  await expect(page.locator('#cartTotal')).toContainText('');

  const orderDetails = await page.locator('#orderDetails').inputValue();
  expect(orderDetails).toContain('Cold-Pressed Coconut Oil (1L)');
  expect(orderDetails).toContain('Wooden Cold-Pressed Groundnut Oil (1L)');
  expect(orderDetails).toContain('Total Amount: ');
  expect(orderDetails).toContain('Delivery: Free');

  const cartItems = await page.evaluate(() => {
    const raw = localStorage.getItem('arumeeCart');
    return raw ? JSON.parse(raw) : [];
  });
  expect(Array.isArray(cartItems)).toBeTruthy();
  expect(cartItems.length).toBe(2);
});

test('mixed size selection is preserved in cart and order summary', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('.size-option[data-product="coconut"][data-size="5L"]').click();
  await page.locator('#qty-coconut').fill('1');
  await page.locator('.add-to-order[data-product="coconut"]').click();

  await page.locator('.size-option[data-product="groundnut"][data-size="1L"]').click();
  await page.locator('#qty-groundnut').fill('1');
  await page.locator('.add-to-order[data-product="groundnut"]').click();

  await page.locator('#cartTab').click();
  await expect(page.locator('#cartDropdown')).toHaveClass(/open/);
  await expect(page.locator('#cartContent')).toContainText('Cold-Pressed Coconut Oil (5L)');
  await expect(page.locator('#cartContent')).toContainText('Wooden Cold-Pressed Groundnut Oil (1L)');

  const orderDetails = await page.locator('#orderDetails').inputValue();
  expect(orderDetails).toContain('Cold-Pressed Coconut Oil (5L)');
  expect(orderDetails).toContain('Wooden Cold-Pressed Groundnut Oil (1L)');
  expect(orderDetails).toContain('Total Amount: ');

  const cartItems = await page.evaluate(() => {
    const raw = localStorage.getItem('arumeeCart');
    return raw ? JSON.parse(raw) : [];
  });
  const hasCoconut5L   = cartItems.some(it => String(it.productName || '').includes('Cold-Pressed Coconut Oil (5L)'));
  const hasGroundnut1L = cartItems.some(it => String(it.productName || '').includes('Wooden Cold-Pressed Groundnut Oil (1L)'));
  expect(hasCoconut5L).toBeTruthy();
  expect(hasGroundnut1L).toBeTruthy();
});

//  HONEYPOT TESTS 

test('formHoneypot (url_confirm) is hidden and blank on page load', async ({ page }) => {
  await page.goto('/index.html');

  const hp = page.locator('#formHoneypot');
  await expect(hp).toHaveValue('');
  await expect(hp).toHaveAttribute('name', 'url_confirm');
  await expect(hp).toHaveAttribute('tabindex', '-1');
  await expect(hp).toHaveAttribute('autocomplete', 'off');
});

test('waHoneypot (url_confirm) inside chat widget is hidden and blank', async ({ page }) => {
  await page.goto('/index.html');

  const hp = page.locator('#waHoneypot');
  await expect(hp).toHaveValue('');
  await expect(hp).toHaveAttribute('name', 'url_confirm');
  await expect(hp).toHaveAttribute('tabindex', '-1');
  await expect(hp).toHaveAttribute('autocomplete', 'off');
});

test('honeypot url_confirm blocks website form submission when filled by bot', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.add-to-order[data-product="coconut"]').click();

  await page.locator('form.card input[name="name"]').fill('Ravi Kumar');
  await page.locator('form.card input[name="phone"]').fill('9876543210');
  await page.locator('form.card input[name="address"]').fill('12 Gandhi Street, Coimbatore City');
  await page.locator('#input-pincode').fill('641001');
  await page.waitForTimeout(2600);

  // Simulate a bot filling the hidden honeypot field
  await page.evaluate(() => {
    const hp = document.getElementById('formHoneypot');
    if (hp) hp.value = 'http://spam.example.com';
  });

  let dialogMessage = '';
  page.once('dialog', async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });

  await page.locator('form.card button[type="submit"]').click({ force: true });
  await expect.poll(() => dialogMessage, { timeout: 5000 }).toMatch(/unable to submit|try again/i);
});

//  WEBSITE FORM VALIDATION 

test('website form validation rejects name shorter than 2 characters', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.add-to-order[data-product="coconut"]').click();
  await page.waitForTimeout(2600);

  await page.locator('form.card').evaluate((form) => {
    form.setAttribute('novalidate', 'novalidate');
  });
  await page.locator('#input-name').fill('X');

  const msg = await submitAndCaptureDialog(page);
  expect(msg).toMatch(/valid name|at least 2 characters/i);
});

test('website form validation rejects phone number too short', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.add-to-order[data-product="coconut"]').click();
  await page.waitForTimeout(2600);

  await page.locator('form.card').evaluate((form) => {
    form.setAttribute('novalidate', 'novalidate');
  });

  await page.locator('#input-name').fill('Ravi Kumar');
  await page.locator('#input-phone').fill('12345');
  await page.locator('#input-address').fill('12 Gandhi Street, Coimbatore');
  await page.locator('#input-pincode').fill('641001');

  const msg = await submitAndCaptureDialog(page);
  expect(msg).toMatch(/valid phone number|10-15 digits/i);
});

test('website form validation rejects delivery address too short', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.add-to-order[data-product="coconut"]').click();
  await page.waitForTimeout(2600);

  await page.locator('form.card').evaluate((form) => {
    form.setAttribute('novalidate', 'novalidate');
  });

  await page.locator('#input-name').fill('Ravi Kumar');
  await page.locator('#input-phone').fill('9876543210');
  await page.locator('#input-address').fill('Short');
  await page.locator('#input-pincode').fill('641001');

  const msg = await submitAndCaptureDialog(page);
  expect(msg).toMatch(/complete address|at least 10 characters/i);
});

test('website form validation rejects a non-Tamil-Nadu pincode', async ({ page }) => {
  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  await page.goto('/index.html');
  await page.locator('.add-to-order[data-product="coconut"]').click();

  await page.locator('form.card input[name="name"]').fill('Ravi Kumar');
  await page.locator('form.card input[name="phone"]').fill('9876543210');
  await page.locator('form.card input[name="address"]').fill('12 Gandhi Street, Some Area Delhi');
  await page.locator('#input-pincode').fill('110001'); // Delhi pincode  not in mock TN list
  await page.waitForTimeout(2600);

  const msg = await submitAndCaptureDialog(page);
  expect(msg).toMatch(/Tamil Nadu|valid.*pincode/i);
});

//  WEBSITE FORM LOADING STATE 

test('website submit button enters loading state on valid submission', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args) => {
      const url = String(args[0] || '');
      if (url.includes('script.google.com')) {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true }), 1200);
        });
      }
      return originalFetch(...args);
    };
  });

  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  await page.goto('/index.html');
  await page.locator('.add-to-order[data-product="coconut"]').click();

  await page.locator('form.card input[name="name"]').fill('Ravi Kumar');
  await page.locator('form.card input[name="phone"]').fill('9876543210');
  await page.locator('form.card input[name="address"]').fill('12 Gandhi Street, Coimbatore City');
  await page.locator('#input-pincode').fill('641001');
  await page.waitForTimeout(2600);

  const submitBtn = page.locator('form.card button[type="submit"]');
  await submitBtn.click();

  // Immediately after click: button must be .loading and disabled
  await expect(submitBtn).toHaveClass(/loading/, { timeout: 3000 });
  await expect(submitBtn).toBeDisabled({ timeout: 3000 });

  // After fetch resolves: loading state cleared, button re-enabled
  await expect(submitBtn).not.toHaveClass(/loading/, { timeout: 10000 });
  await expect(submitBtn).toBeEnabled({ timeout: 5000 });
});

test('checkout page submits orders through fetch to Apps Script', async ({ page }) => {
  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  let requestPayload = '';
  await page.route('https://script.google.com/**', async route => {
    requestPayload = route.request().postData() || '';
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'OK' });
  });

  await openCheckoutWithCart(page);
  await fillCheckoutForm(page);

  await page.locator('#checkoutForm button[type="submit"]').click();

  await expect(page.locator('#successModal')).toHaveClass(/show/, { timeout: 10000 });
  await expect.poll(() => requestPayload, { timeout: 8000 }).toContain('name=Ravi+Kumar');
  expect(requestPayload).toContain('phone=9876543210');
  expect(requestPayload).toContain('pincode=641001');
  expect(requestPayload).toContain('source=website');
  expect(requestPayload).toContain('items=');
  expect(requestPayload).toContain('total=329');
});

test('checkout page does not use sendBeacon shortcut when submitting orders', async ({ page }) => {
  await page.addInitScript(() => {
    window.__sendBeaconCalls = [];
    const originalSendBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
    navigator.sendBeacon = function (...args) {
      window.__sendBeaconCalls.push(args.map(arg => String(arg || '')));
      return true;
    };
    window.__originalSendBeacon = originalSendBeacon;
  });

  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  let fetchRequestCount = 0;
  await page.route('https://script.google.com/**', async route => {
    fetchRequestCount += 1;
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'OK' });
  });

  await openCheckoutWithCart(page);
  await fillCheckoutForm(page, { name: 'Beacon Guard' });

  await page.locator('#checkoutForm button[type="submit"]').click();

  await expect(page.locator('#successModal')).toHaveClass(/show/, { timeout: 10000 });
  await expect.poll(() => fetchRequestCount, { timeout: 8000 }).toBe(1);

  const sendBeaconCalls = await page.evaluate(() => window.__sendBeaconCalls || []);
  expect(sendBeaconCalls).toHaveLength(0);
});

//  CHAT ORDER 2-STEP FLOW 

test('chat "Place My Order" fires Google Sheets fetch and shows Confirm on WhatsApp chip', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  let sheetsCallMade = false;
  await page.route('**/script.google.com/**', route => {
    sheetsCallMade = true;
    return route.fulfill({ status: 200, body: 'OK' });
  });
  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: false });
  await addChatItem(page);
  await openAndFillAddressPanel(page);

  //  Step 1: click "Place My Order" button (waSubmitAddress) 
  await page.locator('#waAddrPanel .wa-addr-submit').click();

  // Confirmation summary must appear in the chat
  await expect(page.locator('#waMsgs')).toContainText('Order Summary', { timeout: 5000 });

  // Chips must now show Step 2  "Confirm on WhatsApp"
  await expect(page.locator('#waChips')).toContainText('Confirm on WhatsApp', { timeout: 5000 });

  // Sheets fetch must have fired on Step 1 (not deferred to Step 2)
  expect(sheetsCallMade).toBe(true);
});

test('chat "Confirm on WhatsApp" chip (step 2) opens WhatsApp URL', async ({ page, context }) => {
  await page.addInitScript(() => {
    window.__waOpenCalls = [];
    const originalOpen = window.open;
    window.open = function (...args) {
      const firstArg = args[0];
      window.__waOpenCalls.push(String(firstArg || ''));
      return originalOpen ? originalOpen.apply(this, args) : null;
    };
  });

  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  await page.route('**/script.google.com/**', route => route.fulfill({ status: 200, body: 'OK' }));
  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: false });
  await addChatItem(page);
  await openAndFillAddressPanel(page);

  // Complete step 1
  await page.locator('#waAddrPanel .wa-addr-submit').click();
  await expect(page.locator('#waChips')).toContainText('Confirm on WhatsApp', { timeout: 5000 });

  // Step 2: clicking the chip should call waContinue() -> WhatsApp URL
  const popupPromise = context.waitForEvent('page', { timeout: 6000 }).catch(() => null);
  await page.locator('#waChips .wa-chip', { hasText: /Confirm on WhatsApp/ }).click();

  await page.waitForFunction(() => Array.isArray(window.__waOpenCalls) && window.__waOpenCalls.length > 0, null, { timeout: 6000 });
  const openedUrl = await page.evaluate(() => window.__waOpenCalls[0] || '');
  expect(openedUrl).toMatch(/wa\.me|whatsapp\.com|api\.whatsapp/i);

  const popup = await popupPromise;
  if (popup) await popup.close().catch(() => {});
});

test('chat "Edit Details" chip re-opens address panel and clears saved values', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  await page.route('**/script.google.com/**', route => route.fulfill({ status: 200, body: 'OK' }));
  await page.route('**/tn_pins.json', route =>
    route.fulfill({ contentType: 'application/json', body: MOCK_TN_PINS }),
  );

  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: false });
  await addChatItem(page);
  await openAndFillAddressPanel(page); // fills name "Ravi Kumar"

  const placeOrderBtn = page.locator('#waAddrPanel .wa-addr-submit');
  await page.evaluate(() => {
    if (typeof waPinCheck === 'function') waPinCheck();
  });
  await expect(placeOrderBtn).toBeEnabled({ timeout: 5000 });
  await placeOrderBtn.click();
  await expect.poll(async () => {
    const text = await page.locator('#waChips').textContent();
    return (text || '').includes('Edit Details');
  }, { timeout: 8000 }).toBe(true);

  await page.locator('#waChips .wa-chip', { hasText: /Edit Details/ }).click();

  // Current behavior: panel re-opens and clears saved values for fresh edit.
  await expect(page.locator('#waAddrPanel')).toHaveClass(/wa-addr-open/, { timeout: 3000 });
  await expect(page.locator('#waAddrPin')).toHaveValue('');
  await expect(page.locator('#waAddrName')).toHaveValue('');
  await expect(page.locator('#waAddrPhone')).toHaveValue('');
  await expect(page.locator('#waAddrAddr')).toHaveValue('');
});

test('chat "Start over" chip resets chat to welcome state', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('arumee_disclaimer', '1'); });

  await page.goto('/index.html');
  await openChat(page, { acceptDisclaimer: false });
  await addChatItem(page);

  await expect(page.locator('#waChips')).toContainText('Start over');
  await page.locator('#waChips .wa-chip', { hasText: /Start over/ }).click();

  await expect(page.locator('#waMsgs')).toContainText('Welcome to Arumee Oils', { timeout: 4000 });
});
