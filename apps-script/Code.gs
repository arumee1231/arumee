/**
 * Arumee Order Handler — Google Apps Script Web App
 *
 * HOW TO DEPLOY (one-time):
 *  1. Go to https://script.google.com → New Project
 *  2. Paste this entire file, replacing the default code
 *  3. Update SHEET_ID below with your Google Sheet ID
 *     (the long ID in the Sheet URL: .../spreadsheets/d/SHEET_ID/edit)
 *  4. Click Deploy → New deployment → Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Copy the Web App URL (looks like https://script.google.com/macros/s/AKfy.../exec)
 *  6. Paste it in index.html and chat-widget.js wherever you see:
 *     PASTE_YOUR_WEB_APP_URL_HERE
 */

// ── CONFIG ──────────────────────────────────────────────────────────────────
var SHEET_ID        = '1yp9QEk0nr0f2_QPDQ104l1DLxx9bhWCChyCKHmEQgsI';
var ORDERS_TAB      = 'Orders';       // sheet tab where orders are written
var RATE_LIMIT_TAB  = 'RateLimit';    // sheet tab used for rate limiting
var MAX_PER_HOUR    = 5;              // max submissions per IP per hour
// ────────────────────────────────────────────────────────────────────────────

/**
 * Handles all POST requests from the website order form, chat widget, and sales tracking.
 */
function doPost(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = e.parameter;
    var action = (params.action || 'order').trim();

    // Handle sales tracking action
    if (action === 'recordSale') {
      return handleSaleTracking(e, response);
    }

    // Handle regular order submission (default behavior)
    return handleOrderSubmission(params, response);

  } catch (err) {
    response.setContent(JSON.stringify({ status: 'error', message: 'Server error: ' + err.message }));
  }

  return response;
}

/**
 * Handles sales tracking form submission
 */
function handleSaleTracking(e, response) {
  // e may contain parsed parameters in e.parameter OR raw body in e.postData.contents
  var params = (e && e.parameter) ? e.parameter : {};

  // Log incoming event for debugging
  try { Logger.log('handleSaleTracking called. e.parameter: %s', JSON.stringify(params)); } catch (ignore) {}
  if (e && e.postData && e.postData.contents) {
    try { Logger.log('postData.type=%s contents=%s', e.postData.type, e.postData.contents); } catch (ignore) {}
  }

  // Fallback: if required fields are missing, try to parse raw post body (JSON or urlencoded)
  var product = (params.product || '').trim();
  var amount = parseFloat(params.amount || 0);
  var date = (params.date || '').trim();

  if ((!product || !date || !amount || amount <= 0) && e && e.postData && e.postData.contents) {
    var body = e.postData.contents;
    // Try JSON
    try {
      var j = JSON.parse(body);
      product = product || (j.product || '').trim();
      amount = amount || parseFloat(j.amount || 0);
      date = date || (j.date || '').trim();
    } catch (jsonErr) {
      // Try urlencoded parsing
      try {
        var parts = body.split('&');
        parts.forEach(function(p) {
          var kv = p.split('=');
          if (kv.length >= 2) {
            var k = decodeURIComponent(kv[0]);
            var v = decodeURIComponent(kv.slice(1).join('='));
            if (k === 'product' && !product) product = v.trim();
            if (k === 'amount' && (!amount || amount === 0)) amount = parseFloat(v) || amount;
            if (k === 'date' && !date) date = v.trim();
          }
        });
      } catch (parseErr) {
        // ignore
      }
    }
  }

  if (!product || amount <= 0 || !date) {
    response.setContent(JSON.stringify({ status: 'error', message: 'Missing or invalid fields', debug: { product: product, amount: amount, date: date } }));
    return response;
  }

  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);

    // Ensure Sales sheet exists (creates it if missing)
    var sheet = ensureSalesSheetExists(ss);

    // Append the sale record
    var ts = new Date();
    sheet.appendRow([date, product, amount, ts]);

    // Format the new row with alternating colors
    var lastRow = sheet.getLastRow();
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, 4).setBackground('#f0f4ff');
    }

    response.setContent(JSON.stringify({ status: 'ok', message: 'Sale recorded successfully' }));
  } catch (err) {
    response.setContent(JSON.stringify({ status: 'error', message: 'Error recording sale: ' + err.message }));
  }

  return response;
}

/**
 * Handles regular order submission from website/chat
 */
function handleOrderSubmission(params, response) {
  // 1. Honeypot check — bots fill the 'url_confirm' field, humans don't
  if (params.url_confirm && params.url_confirm.length > 0) {
    response.setContent(JSON.stringify({ status: 'ok' })); // silent reject
    return response;
  }

  // 2. Required field validation
  var name    = (params.name    || '').trim();
  var phone   = (params.phone   || '').trim();
  var address = (params.address || '').trim();
  var pincode = (params.pincode || '').trim();
  var items   = (params.items   || '').trim();
  var total   = (params.total   || '').trim();
  var source  = (params.source  || 'website').trim(); // 'website' or 'chat'

  if (!name || !phone || !address || !pincode || !items) {
    response.setContent(JSON.stringify({ status: 'error', message: 'Missing required fields' }));
    return response;
  }

  // 3. Phone validation — accept 10-digit Indian mobile, strip +91/91 country prefix if present
  var cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.slice(2);
  if (cleanPhone.length === 11 && cleanPhone.startsWith('0'))  cleanPhone = cleanPhone.slice(1);
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    response.setContent(JSON.stringify({ status: 'error', message: 'Invalid phone number' }));
    return response;
  }

  // 4. Pincode validation — must be 6 digits
  if (!/^\d{6}$/.test(pincode)) {
    response.setContent(JSON.stringify({ status: 'error', message: 'Invalid pincode' }));
    return response;
  }

  // 5. Write to Google Sheet
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(ORDERS_TAB);

  // Create the Orders tab if it doesn't exist yet
  if (!sheet) {
    sheet = ss.insertSheet(ORDERS_TAB);
  }

  // Create header row if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'Name', 'Phone', 'Address', 'Pincode',
      'Order Items', 'Total (₹)', 'Source', 'Notes'
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1e4d32').setFontColor('#ffffff');
  }

  var notes = (params.notes || '').trim();
  var ts    = new Date();

  sheet.appendRow([
    ts, name, cleanPhone, address, pincode,
    items, total, source, notes
  ]);

  // Format the new row
  var lastRow = sheet.getLastRow();
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, 9).setBackground('#f0f7ef');
  }

  response.setContent(JSON.stringify({ status: 'ok', message: 'Order received' }));
  return response;
}

/**
 * Returns true if the IP is within rate limit, false if exceeded.
 * Cleans up entries older than 1 hour as it runs.
 */
function checkRateLimit(ip) {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(RATE_LIMIT_TAB);

    // Create the tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(RATE_LIMIT_TAB);
      sheet.appendRow(['IP', 'Timestamp']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    }

    var now     = Date.now();
    var oneHour = 60 * 60 * 1000;
    var data    = sheet.getDataRange().getValues();
    var rowsToDelete = [];
    var recentCount  = 0;

    // Count recent submissions from this IP, mark old rows for deletion
    for (var i = data.length - 1; i >= 1; i--) {
      var rowIp = String(data[i][0]);
      var rowTs = data[i][1] instanceof Date ? data[i][1].getTime() : parseInt(data[i][1], 10);

      if (now - rowTs > oneHour) {
        rowsToDelete.push(i + 1); // 1-based sheet row
      } else if (rowIp === String(ip)) {
        recentCount++;
      }
    }

    // Delete old rows (in reverse order to preserve row numbers)
    rowsToDelete.sort(function(a, b) { return b - a; });
    rowsToDelete.forEach(function(r) { sheet.deleteRow(r); });

    // Reject if over limit
    if (recentCount >= MAX_PER_HOUR) return false;

    // Record this submission
    sheet.appendRow([String(ip), new Date()]);
    return true;

  } catch(err) {
    // If rate limit check itself fails, allow the submission through
    return true;
  }
}

/**
 * GET handler — returns a simple status page so you can verify the deployment is live.
 * Visit your Web App URL in a browser to confirm it's running.
 */
function doGet(e) {
  // If called with ?createSales=true this will create the Sales tab if missing
  try {
    if (e && e.parameter && (e.parameter.createSales === 'true' || e.parameter.setup === 'true')) {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      ensureSalesSheetExists(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Sales sheet ensured' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    // fall through to basic status response
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      service: 'Arumee Order Handler',
      version: '1.0',
      time: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ensure a `Sales` sheet exists in the spreadsheet; if missing, create and initialize it.
 * Returns the sheet instance.
 */
function ensureSalesSheetExists(ss) {
  var sheetName = 'Sales';
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Date', 'Product', 'Amount (₹)', 'Recorded At']);
    try {
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#667eea').setFontColor('#ffffff');
    } catch (ignore) {}
  }
  return sheet;
}
