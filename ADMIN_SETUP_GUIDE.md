# Arumee Sales Tracking Admin Panel - Setup Guide

## 🎯 Overview
You now have a **password-protected admin page** where your dad can track sales of 9 products without affecting your public website.

**URL:** `https://yourdomain.com/admin.html`  
**Password:** `Qazwsx123$`

---

## 📋 What's Included

### 1. **Sales Entry Tab** (`📝 Sales Entry`)
- **Form Fields:**
  - Product Selection (dropdown with all 9 products)
  - Quantity (in kg/L)
  - Date picker (defaults to today)
- **Recent Sales Table:** Shows last entries with delete option
- **Data Storage:** Stored in browser localStorage + Google Sheets

### 2. **Dashboard Tab** (`📈 Dashboard`)
- **Statistics Cards:**
  - Total Sales (number of transactions)
  - Total Quantity (sum of all quantities)
  - Unique Products (how many different products sold)
  
- **Sales by Product Table:**
  - Product name
  - Total quantity sold
  - Number of sales
  - Average quantity per sale

### 3. **Security Features**
- Password protection (only for the admin page)
- Session-based login (stays logged in during browser session)
- Logout button
- Does NOT affect public website at all

---

## 📦 Products Being Tracked

1. Coconut Oil
2. Gingelly Oil
3. Groundnut Oil
4. Groundnut Cattle Feed
5. Dosa Batter
6. Chilli Powder
7. Cow Feed
8. Groundnut Breaking

---

## 🚀 How to Deploy

### Step 1: Update Google Apps Script (Optional but Recommended)
To save data to Google Sheets:

1. Open [Google Apps Script Console](https://script.google.com)
2. Open your existing Arumee project
3. **Replace the entire `Code.gs` file** with the updated version from `apps-script/Code.gs`
4. Click **Deploy** → **New deployment**
5. Select **Type: Web app**
6. Set:
   - **Execute as:** Your Google Account
   - **Who has access:** Anyone
7. Copy the new **Web App URL** (looks like `https://script.google.com/macros/s/AKfy.../exec`)
8. Open `admin.html` and find this line:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/...';
   ```
9. **Replace** the old URL with your new URL from step 7

### Step 2: Upload admin.html to Server
- Upload or deploy `admin.html` to your web hosting (same location as your other HTML files)
- Make it accessible at: `yourdomain.com/admin.html`

---

## 📱 How to Use (For Your Dad)

1. Go to: `https://yourdomain.com/admin.html`
2. Enter password: `Qazwsx123$`
3. **To Record a Sale:**
   - Click "📝 Sales Entry" tab (default)
   - Select Product from dropdown
   - Enter Quantity
   - Date is auto-filled with today (can change)
   - Click "💾 Record Sale"
   - Success message appears

4. **To View Dashboard:**
   - Click "📈 Dashboard" tab
   - See total sales, quantity, and breakdown by product
   - Updated in real-time as new sales are added

5. **To Delete a Sale:**
   - On "Sales Entry" tab, find the sale in the table
   - Click "Delete" button

---

## 💾 Data Storage Options

### Option A: Browser Only (Current Setup)
- ✅ Works immediately
- ✅ No setup needed
- ✅ Data persists in browser
- ❌ Data lost if browser cache is cleared
- ❌ Not accessible from other devices

### Option B: Google Sheets (Recommended)
- ✅ Centralized storage
- ✅ Accessible from any device
- ✅ Automatic backups
- ✅ Can view/edit directly in Google Sheets
- ✅ Data never lost
- ⚠️ Requires Apps Script deployment

**To enable Google Sheets storage:** Follow Step 1 in "How to Deploy" above.

---

## 🔐 Changing the Password

1. Open `admin.html` in a text editor
2. Find this line (around line 380):
   ```javascript
   const ADMIN_PASSWORD = 'Qazwsx123$';
   ```
3. Change it to your desired password:
   ```javascript
   const ADMIN_PASSWORD = 'YourNewPassword123$';
   ```
4. Save and re-upload to server

---

## ❓ Frequently Asked Questions

### Q: Will this affect my website?
**A:** No. The admin page is completely separate and doesn't change any existing functionality.

### Q: Can customers access this page?
**A:** No. It's password-protected. Only someone with the password can login.

### Q: Where is the data stored?
**A:** By default, it's stored in the browser's localStorage. If you deploy to Google Sheets, it's stored there too.

### Q: Can I access it on mobile?
**A:** Yes, but Google Sheets sync requires the Apps Script deployment. Browser-only version works on mobile but data won't sync.

### Q: What if I forget the password?
**A:** Edit `admin.html` and change the password (see "Changing the Password" section above).

### Q: Can I export the data?
**A:** If using Google Sheets, you can download it directly from Google Sheets. For browser-only, the data is stored internally.

---

## 🔧 Troubleshooting

### Issue: "Incorrect password" after deployment
- **Check:** Password in HTML matches what you're entering
- **Check:** Browser cookies/cache isn't interfering

### Issue: Data not saving to Google Sheets
- **Check:** Did you deploy the updated Apps Script?
- **Check:** Did you update the Apps Script URL in `admin.html`?
- **Check:** Did you authenticate the Apps Script with your Google account?

### Issue: Page looks broken on mobile
- **Try:** The page is responsive, zoom might be the issue
- **Try:** Refresh the page

### Issue: Lost all data after closing browser
- **Note:** This happens if using browser-only storage
- **Solution:** Use Google Sheets integration (see "How to Deploy")

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12 → Console)
2. Ensure all HTML files are properly uploaded
3. Verify Google Apps Script URL is correct
4. Clear browser cache and try again

---

## 🎉 You're All Set!

Your dad can now:
- ✅ Track sales easily with the form
- ✅ View sales analytics in the dashboard
- ✅ Access it from any device (with Apps Script deployment)
- ✅ Keep the admin page completely hidden from your public website

**Start using it:** Go to `admin.html` and login with the password!
