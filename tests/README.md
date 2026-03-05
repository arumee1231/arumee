# E2E Regression Tests

This project uses Playwright for browser-level regression checks.

## Install

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm run test:e2e
```

## Scope

Current suite covers high-priority chat/cart regressions:
- Refresh modal clear removes cart + chat state
- Opening cart closes chat panel
- Chat-added cart line uses normalized product names
- Full-chat header `X` exits full-chat page
- Clear-chat button resets visible conversation
- Admin mobile swipe gesture switches between Sales Entry and Dashboard tabs
