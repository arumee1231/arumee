/* arumee Chat Widget — self-injecting, cross-page, localStorage-persistent
   Include on any page: <script src="arumee_assets/chat-widget.js"></script>  */
(function () {
  'use strict';

  // ── 1. Inject CSS ──────────────────────────────────────────────────────
  var _st = document.createElement('style');
  _st.textContent = `
    /* WHATSAPP CHAT WIDGET */
    body.wa-chat-open { overflow: hidden; }
    #waWidget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10005;
      font-family: 'Inter', sans-serif;
    }
    /* ── CSS isolation: neutralise any page-level button/element resets ── */
    #waWidget * { box-sizing: border-box !important; }
    #waWidget button {
      all: unset;
      box-sizing: border-box !important;
      cursor: pointer;
      line-height: 1;
    }
    #waWidget #waChatTrigger {
      position: relative;
      width: 60px; height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e4d32, #0d2b1e);
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,.25);
      transition: all .3s ease;
      color: #fff;
    }
    #waWidget #waChatTrigger:hover { transform: scale(1.1); box-shadow: 0 6px 22px rgba(0,0,0,.32); }
    .wa-unread-dot {
      position: absolute; top: 2px; right: 2px;
      width: 14px; height: 14px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid #fff;
      display: none;
    }
    .wa-unread-dot.show { display: block; }
    /* ── Panel: slides up from bottom, hides trigger beneath it ── */
    #waChatPanel {
      position: fixed;
      bottom: 0;
      right: 20px;
      width: 390px;
      max-height: 88vh;
      background: #fff;
      border-radius: 18px 18px 0 0;
      box-shadow: 0 -4px 32px rgba(0,0,0,.18);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
      z-index: 10006;
    }
    #waChatPanel.wa-open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    /* Hide trigger when panel is open so panel appears to rise over it */
    #waWidget.wa-active #waChatTrigger {
      opacity: 0;
      pointer-events: none;
      transform: scale(0.7);
      transition: opacity 0.2s ease, transform 0.25s ease;
    }
    #waWidget #waChatTrigger {
      transition: opacity 0.2s ease, transform 0.25s ease, box-shadow .3s ease;
    }
    /* Header */
    .wa-head {
      background: linear-gradient(135deg, #0d2b1e, #1e4d32);
      padding: 13px 14px;
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    .wa-head-logo { width: 38px; height: 38px; border-radius: 50%; border: 2px solid rgba(255,255,255,.5); object-fit: contain; background: #fff; padding: 3px; flex-shrink: 0; box-sizing: border-box; }
    .wa-head-info { flex: 1; min-width: 0; }
    .wa-head-name { display: block; color: #fff; font-weight: 700; font-size: 14px; line-height: 1.2; }
    .wa-head-sub  { display: block; color: rgba(255,255,255,.72); font-size: 11px; margin-top: 2px; }
    #waWidget .wa-head-close, #waWidget .wa-head-clear {
      background: rgba(255,255,255,.15); border: none; color: #fff;
      width: 27px; height: 27px; border-radius: 50%;
      cursor: pointer; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s; flex-shrink: 0; line-height: 1;
    }
    #waWidget .wa-head-close:hover, #waWidget .wa-head-clear:hover { background: rgba(255,255,255,.3); }
    /* Messages area */
    .wa-msgs {
      flex: 1;
      overflow-y: auto;
      padding: 14px 12px 18px;
      background: #e5ede8;
      display: flex; flex-direction: column; gap: 8px;
      scroll-behavior: smooth;
      min-height: 200px;
      max-height: 380px;
    }
    .wa-msgs::-webkit-scrollbar { width: 4px; }
    .wa-msgs::-webkit-scrollbar-thumb { background: rgba(30,77,50,.22); border-radius: 4px; }
    /* Bubbles */
    .wa-msg { max-width: 92%; animation: waPop .22s ease both; }
    @keyframes waPop {
      from { opacity:0; transform: translateY(7px) scale(0.97); }
      to   { opacity:1; transform: translateY(0)   scale(1); }
    }
    .wa-msg.bot  { align-self: flex-start; display: flex; align-items: flex-end; gap: 7px; }
    .wa-msg.user { align-self: flex-end; }
    .wa-msg-inner { display: flex; flex-direction: column; min-width: 0; }
    /* Bot avatar circle */
    .wa-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #1e4d32, #0d2b1e);
      color: #fff; font-size: 11px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-bottom: 18px; letter-spacing: -.5px;
    }
    .wa-msg-bubble {
      padding: 8px 11px;
      border-radius: 13px;
      font-size: 12.5px; line-height: 1.55;
      box-shadow: 0 1px 3px rgba(0,0,0,.07);
      white-space: pre-line;
    }
    .wa-msg.bot  .wa-msg-bubble { background:#fff; color:#1a3d2b; border-bottom-left-radius:3px; }
    .wa-msg.user .wa-msg-bubble { background:#d2f2de; color:#0d2b1e; border-bottom-right-radius:3px; text-align:right; }
    .wa-msg-time { font-size:10px; color:rgba(0,0,0,.3); margin-top:3px; padding:0 3px; }
    .wa-msg.user .wa-msg-time { text-align:right; }
    /* Typing dots */
    .wa-typing {
      align-self: flex-start;
      display: none; flex-direction: row; align-items: flex-end; gap: 7px;
    }
    .wa-typing.show { display: flex; }
    .wa-typing-dots {
      background: #fff; border-radius: 13px 13px 13px 3px;
      padding: 10px 14px;
      display: flex; gap: 5px; align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,.07);
    }
    .wa-dot {
      width: 7px; height: 7px; background: #aaa; border-radius: 50%;
      animation: waBounce 1.2s infinite;
    }
    .wa-dot:nth-child(2) { animation-delay:.2s; }
    .wa-dot:nth-child(3) { animation-delay:.4s; }
    @keyframes waBounce {
      0%,60%,100% { transform:translateY(0); }
      30%          { transform:translateY(-5px); }
    }
    /* Quick-reply chips */
    .wa-chips {
      padding: 8px 10px 0;
      display: flex; flex-wrap: wrap; gap: 6px;
      background: #e5ede8;
      flex-shrink: 0;
      min-height: 0;
      border-top: 1px solid rgba(30,77,50,.08);
      margin-top: 2px;
      position: relative;
      z-index: 1;
    }
    #waWidget .wa-chip {
      background: #fff;
      border: 1.5px solid rgba(30,77,50,.22);
      border-radius: 18px;
      padding: 5px 11px;
      font-size: 11.5px; color: #1a4230; font-weight: 600;
      cursor: pointer;
      transition: all .18s ease;
      font-family: 'Inter', sans-serif;
      animation: waPop .22s ease both;
      white-space: nowrap;
    }
    #waWidget .wa-chip:hover { background:#1e4d32; color:#fff; border-color:#1e4d32; transform:translateY(-1px); }
    /* Footer */
    .wa-foot {
      padding: 8px 12px 10px;
      background: #fff;
      border-top: 1px solid rgba(30,77,50,.08);
      flex-shrink: 0;
    }
    #waWidget .wa-hint {
      font-size: 11px; color: rgba(0,0,0,.38);
      text-align: center; margin: 0 0 7px; padding: 0;
      font-style: italic;
    }
    .wa-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    #waWidget .wa-text-input {
      flex: 1;
      min-width: 0;
      border: 1.5px solid rgba(30,77,50,.2);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 13px;
      color: #1a4230;
      font-family: 'Inter', sans-serif;
      outline: none;
      background: #fff;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    #waWidget .wa-text-input:focus {
      border-color: #1e4d32;
      box-shadow: 0 0 0 3px rgba(30,77,50,.12);
    }
    #waWidget .wa-send-btn {
      border: none;
      border-radius: 10px;
      padding: 10px 12px;
      min-width: 44px;
      min-height: 40px;
      background: #1e4d32;
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      transition: background .2s ease, transform .15s ease;
    }
    #waWidget .wa-send-btn:hover { background: #153d28; transform: translateY(-1px); }
    #waWidget .wa-wa-btn {
      display: flex; align-items: center; gap: 8px; justify-content: center;
      background: #25D366; color: #fff; border: none;
      border-radius: 10px; padding: 9px 14px;
      font-size: 13px; font-weight: 700; width: 100%;
      cursor: pointer;
      transition: background .2s, transform .2s, box-shadow .2s;
      font-family: 'Inter', sans-serif;
      position: relative;
    }
    #waWidget .wa-wa-btn:hover { background:#1aae55; transform:translateY(-1px); }
    #waWidget .wa-wa-btn.wa-btn-active {
      animation: waGlow 1.6s ease-in-out infinite;
    }
    #waWidget .wa-wa-btn.wa-btn-active::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 13px;
      border: 2px solid rgba(37,211,102,.6);
      animation: waRing 1.6s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes waGlow {
      0%,100% { box-shadow: 0 0 0 0 rgba(37,211,102,.55); }
      50%      { box-shadow: 0 0 0 7px rgba(37,211,102,.0); }
    }
    @keyframes waRing {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:0; transform:scale(1.06); }
    }
    /* Address slide panel */
    #waAddrPanel {
      position: absolute;
      inset: 0;
      background: #fff;
      display: flex;
      flex-direction: column;
      transform: translateX(105%);
      transition: transform .32s cubic-bezier(.4,0,.2,1);
      z-index: 2;
      border-radius: 16px;
      overflow: hidden;
    }
    #waAddrPanel.wa-addr-open { transform: translateX(0); }
    .wa-addr-panel-head {
      background: linear-gradient(135deg, #0d2b1e, #1e4d32);
      padding: 13px 14px;
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    #waWidget .wa-addr-panel-back {
      all: unset;
      background: rgba(255,255,255,.15);
      color: #fff;
      width: 27px; height: 27px; border-radius: 50%;
      cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s; flex-shrink: 0;
      box-sizing: border-box;
    }
    #waWidget .wa-addr-panel-back:hover { background: rgba(255,255,255,.3); }
    .wa-addr-panel-title { color: #fff; font-weight: 700; font-size: 14px; flex:1; }
    .wa-addr-order-mini {
      background: #e5ede8; border-radius: 10px;
      padding: 10px 12px; margin-bottom: 14px;
      font-size: 12px; color: #1a3d2b; line-height: 1.6;
    }
    .wa-addr-panel-body {
      flex: 1; overflow-y: auto;
      padding: 14px 14px 0;
    }
    .wa-addr-panel-body::-webkit-scrollbar { width: 4px; }
    .wa-addr-panel-body::-webkit-scrollbar-thumb { background: rgba(30,77,50,.22); border-radius: 4px; }
    .wa-addr-panel-foot {
      padding: 8px 14px 12px;
      border-top: 1px solid rgba(30,77,50,.08);
      background: #fff; flex-shrink: 0;
    }
    #waWidget .wa-addr-lbl {
      display: block; font-size: 10.5px; font-weight: 700;
      color: #1e4d32; margin: 12px 0 4px;
      text-transform: uppercase; letter-spacing: .4px;
    }
    #waWidget .wa-addr-lbl:first-child { margin-top: 0; }
    #waWidget .wa-addr-input {
      width: 100%; border: 1.5px solid rgba(30,77,50,.22);
      border-radius: 8px; padding: 8px 10px;
      font-size: 13px; font-family: 'Inter', sans-serif;
      color: #0a2817; background: #faf8f5;
      outline: none; box-sizing: border-box;
      transition: border-color .2s;
    }
    #waWidget .wa-addr-textarea {
      width: 100%; border: 1.5px solid rgba(30,77,50,.22);
      border-radius: 8px; padding: 8px 10px;
      font-size: 13px; font-family: 'Inter', sans-serif;
      color: #0a2817; background: #faf8f5;
      outline: none; box-sizing: border-box;
      resize: none !important; height: 72px !important;
      min-height: unset !important;
      transition: border-color .2s;
    }
    #waWidget .wa-addr-input:focus, #waWidget .wa-addr-textarea:focus { border-color: #1e4d32; }
    .wa-addr-row { display: flex; gap: 8px; }
    .wa-addr-row > div { flex: 1; }
    #waWidget .wa-addr-submit {
      width: 100%; background: #25D366; color: #fff;
      border: none; border-radius: 10px; padding: 10px 14px;
      font-size: 13px; font-weight: 700; font-family: 'Inter', sans-serif;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 8px; box-sizing: border-box;
      transition: background .2s, transform .2s;
    }
    #waWidget .wa-addr-submit:hover { background: #1aae55; transform: translateY(-1px); }
    #waWidget .wa-addr-err {
      font-size: 11px; color: #c0392b;
      margin: 0 0 7px; padding: 0; display: none;
    }
    /* ── Pincode validation status ── */
    #waWidget .wa-pin-status {
      font-size: 12px; border-radius: 7px;
      padding: 0; margin: 4px 0 6px;
      line-height: 1.45; transition: all .22s ease;
    }
    #waWidget .wa-pin-ok {
      color: #1a6e3c; background: #e3f5ea;
      padding: 8px 11px; font-weight: 600;
    }
    #waWidget .wa-pin-err {
      color: #b03020; background: #fdf0ee;
      padding: 8px 11px; font-weight: 500;
    }
    #waWidget .wa-pin-loading {
      color: #6b7c74; background: #f3f3f3;
      padding: 8px 11px;
    }
    /* ── Disclaimer overlay ── */
    #waDisclaimerPanel {
      position: absolute;
      inset: 0;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 4;
      border-radius: 18px 18px 0 0;
      overflow: hidden;
      padding: 28px 22px 24px;
      text-align: center;
      transition: opacity 0.28s ease, transform 0.28s ease;
    }
    #waDisclaimerPanel.wa-disc-hiding {
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
    }
    .wa-disc-icon {
      font-size: 42px;
      margin-bottom: 10px;
      line-height: 1;
    }
    .wa-disc-title {
      font-size: 15px;
      font-weight: 800;
      color: #0d2b1e;
      margin: 0 0 10px;
      padding: 0;
    }
    .wa-disc-body {
      font-size: 13px;
      color: #3a5a47;
      line-height: 1.6;
      margin: 0 0 8px;
      padding: 0;
    }
    .wa-disc-highlight {
      display: inline-block;
      background: #e5ede8;
      color: #0d2b1e;
      font-weight: 700;
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 13px;
      margin: 4px 0 12px;
    }
    .wa-disc-note {
      font-size: 11px;
      color: #7a9a88;
      margin: 0 0 20px;
      padding: 0;
      line-height: 1.5;
    }
    #waWidget .wa-disc-accept {
      width: 100%;
      background: #25D366;
      color: #fff;
      border: none;
      border-radius: 11px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      margin-bottom: 8px;
      transition: background .2s, transform .15s;
      box-sizing: border-box;
    }
    #waWidget .wa-disc-accept:hover { background: #1aae55; transform: translateY(-1px); }
    #waWidget .wa-disc-decline {
      width: 100%;
      background: transparent;
      color: #7a9a88;
      border: 1.5px solid rgba(30,77,50,.18);
      border-radius: 11px;
      padding: 10px 16px;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      box-sizing: border-box;
      transition: background .2s;
    }
    #waWidget .wa-disc-decline:hover { background: #f5f5f5; }
    @media (max-width: 480px) {
      #waChatPanel {
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 100vh !important;
        height: 100dvh !important;
        max-height: none !important;
        border-radius: 0 !important;
      }
      .wa-msgs { max-height: none !important; min-height: 0 !important; flex: 1; }
      .wa-chips { padding: 8px 10px 10px !important; gap: 8px !important; }
      #waWidget .wa-chip {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 44px !important;
        padding: 10px 12px !important;
        font-size: 12px !important;
        border-radius: 18px !important;
        white-space: normal !important;
        line-height: 1.25 !important;
        touch-action: manipulation !important;
      }
      .wa-hint { display: none; }
      #waWidget .wa-head-full { display: none !important; }
    }
    /* ── Refresh Confirmation Modal ── */
    #waRefreshModal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(10,20,14,.58);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', sans-serif;
    }
    #waRefreshModal.wa-rm-visible { display: flex; animation: waRmFadeIn .2s ease; }
    @keyframes waRmFadeIn { from { opacity: 0; } to { opacity: 1; } }
    #waRefreshModalCard {
      background: #fff;
      border-radius: 20px;
      padding: 32px 24px 24px;
      max-width: 340px;
      width: 100%;
      text-align: center;
      box-shadow: 0 12px 56px rgba(0,0,0,.26);
      animation: waRmSlideUp .28s cubic-bezier(0.4,0,0.2,1);
    }
    @keyframes waRmSlideUp { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    #waRefreshModalCard .wa-rm-icon { font-size: 46px; line-height: 1; margin-bottom: 4px; position: relative; display: inline-block; }
    #waRefreshModalCard .wa-rm-badge {
      position: absolute; top: -4px; right: -12px;
      background: #ef4444; color: #fff;
      border-radius: 50%; width: 22px; height: 22px;
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff; font-family: 'Inter', sans-serif;
    }
    #waRefreshModalCard .wa-rm-title { font-size: 19px; font-weight: 700; color: #1a2e1f; margin: 14px 0 8px; }
    #waRefreshModalCard .wa-rm-body  { font-size: 13.5px; color: #4a5e50; line-height: 1.6; margin-bottom: 4px; }
    #waRefreshModalCard .wa-rm-items {
      background: #f5faf7; border: 1px solid #c8e2d0; border-radius: 10px;
      padding: 10px 14px; margin: 12px 0 20px;
      text-align: left; font-size: 12.5px; color: #2a5038; line-height: 1.75;
    }
    #waRefreshModalCard .wa-rm-total { font-weight: 700; color: #1a6e3c; border-top: 1px solid #c8e2d0; margin-top: 6px; padding-top: 6px; }
    #waRefreshModalCard .wa-rm-btns  { display: flex; gap: 10px; }
    #waRefreshModalCard .wa-rm-cancel {
      flex: 1; padding: 13px 0; border-radius: 12px;
      border: 2px solid #1e4d32; background: transparent; color: #1e4d32;
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background .18s, transform .12s;
    }
    #waRefreshModalCard .wa-rm-cancel:hover  { background: #f0f7ef; transform: translateY(-1px); }
    #waRefreshModalCard .wa-rm-proceed {
      flex: 1; padding: 13px 0; border-radius: 12px;
      background: #ef4444; color: #fff; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: background .18s, transform .12s;
    }
    #waRefreshModalCard .wa-rm-proceed:hover { background: #dc2626; transform: translateY(-1px); }

    #waWidget .wa-head-full {
      background: rgba(255,255,255,.15);
      border: none;
      color: #fff;
      height: 27px;
      border-radius: 999px;
      padding: 0 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .01em;
      line-height: 1;
      transition: background .2s;
      flex-shrink: 0;
    }
    #waWidget .wa-head-full:hover { background: rgba(255,255,255,.3); }
    body.wa-full-page #waWidget .wa-head-full { display: none; }

    /* honeypot field – hidden from real users */
    .wa-hp { position:absolute; left:-9999px; top:-9999px; width:0; height:0; overflow:hidden; }

    body.wa-full-page {
      background: #e5ede8;
      min-height: 100vh;
    }
    body.wa-full-page #waWidget {
      position: fixed;
      inset: 0;
      z-index: 10005;
      right: 0;
      bottom: 0;
    }
    body.wa-full-page #waChatTrigger {
      display: none !important;
    }
    body.wa-full-page #waChatPanel {
      position: fixed;
      inset: 0;
      width: 100vw;
      max-height: 100vh;
      border-radius: 0;
      right: 0;
      bottom: 0;
      transform: none !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      box-shadow: none;
    }
    body.wa-full-page .wa-msgs {
      max-height: none;
      padding-bottom: 20px;
    }
    body.wa-full-page .wa-chips {
      padding: 10px 14px 12px;
      gap: 8px;
    }
    body.wa-full-page #waWidget .wa-chip {
      min-height: 40px;
      padding: 9px 14px;
      font-size: 13px;
      border-radius: 20px;
    }
    body.wa-full-page #waAddrPanel {
      border-radius: 0;
      max-height: 100vh;
    }
`;
  document.head.appendChild(_st);

  // ── 2. Inject HTML ─────────────────────────────────────────────────────
  var _wrap = document.createElement('div');
  _wrap.innerHTML = `<div id="waWidget">
  <!-- Fixed chat panel -->
  <div aria-label="Arumee Chat Assistant" aria-modal="true" id="waChatPanel" role="dialog">
    <div class="wa-head">
      <img alt="Arumee" class="wa-head-logo" src="arumee_assets/logo.webp"/>
      <div class="wa-head-info">
        <span class="wa-head-name">Arumee Oils</span>
        <span class="wa-head-sub">&#x25CF; Online &middot; Replies instantly</span>
      </div>
      <button aria-label="Open full chat" class="wa-head-full" onclick="openFullChat()" title="Open full-page chat">Full Chat</button>
      <button aria-label="Clear chat history" class="wa-head-clear" onclick="clearChat()" title="Clear chat"><svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
      <button aria-label="Close chat" class="wa-head-close" onclick="waCloseChat()">&#x2715;</button>
    </div>
    <div class="wa-msgs" id="waMsgs">
      <div class="wa-typing" id="waTyping">
        <div class="wa-avatar">A</div>
        <div class="wa-typing-dots">
          <div class="wa-dot"></div>
          <div class="wa-dot"></div>
          <div class="wa-dot"></div>
        </div>
      </div>
    </div>
    <div class="wa-chips" id="waChips"></div>
    <div class="wa-foot">
      <p class="wa-hint">Tap a question or continue on WhatsApp</p>
      <div class="wa-input-row">
        <input aria-label="Type your message" class="wa-text-input" id="waTextInput" maxlength="180" placeholder="Type your question or order request..." type="text"/>
        <button aria-label="Send message" class="wa-send-btn" id="waSendBtn" onclick="waSendText()">Send</button>
      </div>
      <button class="wa-wa-btn" onclick="waContinue()">
        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.882l6.19-1.624A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.658-.514-5.168-1.411l-.371-.22-3.835 1.006 1.022-3.73-.242-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
        <span class="wa-btn-text">Continue on WhatsApp</span>
      </button>
    </div>
    <!-- Address slide panel -->
    <div id="waAddrPanel">
      <div class="wa-addr-panel-head">
        <button class="wa-addr-panel-back" onclick="closeAddressPanel()" title="Back to chat">&#8592;</button>
        <span class="wa-addr-panel-title">&#128205; Delivery Details</span>
      </div>
      <div class="wa-addr-panel-body">
        <div class="wa-addr-order-mini" id="waAddrOrderMini"></div>
        <label class="wa-addr-lbl">&#128205; Delivery Pincode</label>
        <input class="wa-addr-input" id="waAddrPin" inputmode="numeric" maxlength="6" placeholder="Enter your 6-digit pincode" type="text" oninput="waPinCheck()"/>
        <div class="wa-pin-status" id="waPinStatus"></div>
        <div id="waAddrFormFields" style="display:none">
          <label class="wa-addr-lbl">Full Name</label>
          <input class="wa-addr-input" id="waAddrName" maxlength="80" type="text"/>
          <label class="wa-addr-lbl">WhatsApp / Phone</label>
          <input class="wa-addr-input" id="waAddrPhone" inputmode="numeric" maxlength="15" placeholder="e.g. 9876543210" type="tel"/>
          <label class="wa-addr-lbl">Full Address</label>
          <textarea class="wa-addr-textarea" id="waAddrAddr" maxlength="250" placeholder="Door No, Street, Area"></textarea>
          <label class="wa-addr-lbl">District <span style="font-size:11px;opacity:.7;">(auto-filled from pincode)</span></label>
          <input class="wa-addr-input" id="waAddrDistrict" readonly style="background:#f0f7ef;color:#1a6e3c;font-weight:700;cursor:default;" placeholder="Auto-filled when valid pincode is entered" type="text"/>
        </div>
      </div>
      <div class="wa-addr-panel-foot">
        <p class="wa-addr-err" id="waAddrErr"></p>
        <!-- honeypot: bots fill this, humans don't -->
        <div class="wa-hp" aria-hidden="true"><input type="text" name="url_confirm" id="waHoneypot" tabindex="-1" autocomplete="off"/></div>
        <button class="wa-addr-submit" onclick="waSubmitAddress()">
          <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.882l6.19-1.624A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.658-.514-5.168-1.411l-.371-.22-3.835 1.006 1.022-3.73-.242-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Place My Order
        </button>
      </div>
    </div>
    <!-- Disclaimer overlay -->
    <div id="waDisclaimerPanel">
      <div class="wa-disc-icon">&#128688;</div>
      <p class="wa-disc-title">Delivery Notice</p>
      <p class="wa-disc-body">Currently, we deliver only within</p>
      <span class="wa-disc-highlight">&#127470;&#127475;&nbsp; Tamil Nadu, India</span>
      <p class="wa-disc-note">If you are outside Tamil Nadu, we regret that we cannot process your order at this time. We are working to expand delivery soon!</p>
      <button class="wa-disc-accept" onclick="acceptDisclaimer()">&#9989;&nbsp; I Understand &mdash; Start Chat</button>
      <button class="wa-disc-decline" onclick="declineDisclaimer()">&#10005;&nbsp; Close</button>
    </div>
  </div>
  <!-- Trigger button -->
  <button aria-expanded="false" aria-label="Chat with Arumee" id="waChatTrigger" onclick="waToggle()">
    <span class="wa-unread-dot" id="waUnreadDot"></span>
    <svg fill="none" height="28" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24" width="28" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" fill="currentColor" r="1" stroke="none"/><circle cx="12" cy="10" fill="currentColor" r="1" stroke="none"/><circle cx="15" cy="10" fill="currentColor" r="1" stroke="none"/></svg>
  </button>
</div>`;
  document.body.appendChild(_wrap.firstChild);

  // ── Refresh confirmation modal ─────────────────────────────────────────
  var _rmEl = document.createElement('div');
  _rmEl.innerHTML = `<div id="waRefreshModal" role="dialog" aria-modal="true" aria-labelledby="waRmTitle">
  <div id="waRefreshModalCard">
    <div class="wa-rm-icon">🛒<span class="wa-rm-badge" id="waRmBadge">0</span></div>
    <div class="wa-rm-title" id="waRmTitle">Refresh Page?</div>
    <div class="wa-rm-body" id="waRmBody">You have items in your cart.<br>Refreshing will clear your cart and chat history.</div>
    <div class="wa-rm-items" id="waRmItems"></div>
    <div class="wa-rm-btns">
      <button class="wa-rm-cancel"  onclick="window.waHideRefreshModal()">✕ &nbsp;Stay on Page</button>
      <button class="wa-rm-proceed" onclick="window.waConfirmRefresh()">🗑️ &nbsp;Clear &amp; Refresh</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(_rmEl.firstChild);

  // ── 3. Widget Logic ────────────────────────────────────────────────────
(function () {
  var IS_FULL_CHAT = /(^|\/)chat\.html$/i.test(String(location.pathname || '')) || /(?:\?|&)fullchat=1(?:&|$)/i.test(String(location.search || ''));
  var WA = '918925295844';
  var history = JSON.parse(localStorage.getItem('arumee_chat') || '[]');
  var orderCart = JSON.parse(localStorage.getItem('arumee_cart') || '[]');
  var deliveryInfo = JSON.parse(localStorage.getItem('arumee_delivery') || 'null');
  var disclaimerAccepted = !!localStorage.getItem('arumee_disclaimer');
  var pendingOil = null;
  var pendingSize = null;
  var _tnPins = null;
  var _tnPinsLoading = false;
  var __lastTypedAt = 0;
  var __typedTs = [];

  function saveHistory(){ try{ localStorage.setItem('arumee_chat', JSON.stringify(history)); }catch(e){} }
  function saveCart(){
    try{ localStorage.setItem('arumee_cart', JSON.stringify(orderCart)); }catch(e){}
    try{ syncSiteCartBadges(); }catch(e){}
  }
  function saveDelivery(){ try{ localStorage.setItem('arumee_delivery', JSON.stringify(deliveryInfo)); }catch(e){} }
  function clearStorage(){
    try{
      localStorage.removeItem('arumee_chat');
      localStorage.removeItem('arumee_cart');
      localStorage.removeItem('arumee_delivery');
      pruneChatMirrorsFromPageCart(true);
    }catch(e){}
  }

  function openFullChat() {
    try {
      if (window.matchMedia && window.matchMedia('(max-width: 480px)').matches) return;
    } catch(e) {}
    try {
      var target = (location.origin && location.origin !== 'null') ? (location.origin + '/chat.html') : 'chat.html';
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch(e) {
      window.open('chat.html', '_blank', 'noopener,noreferrer');
    }
  }

  /* honeypot check – returns true if the submission looks like a bot */
  function isHoneypotTripped() {
    var hp = document.getElementById('waHoneypot');
    return hp && hp.value.length > 0;
  }

  function initFullPageMode() {
    if (!IS_FULL_CHAT) return;
    try {
      document.body.classList.add('wa-full-page');
      var panel = document.getElementById('waChatPanel');
      var widget = document.getElementById('waWidget');
      if (panel) panel.classList.add('wa-open');
      if (widget) widget.classList.add('wa-active');
      if (!disclaimerAccepted) {
        try { acceptDisclaimer(); } catch(e) {}
      } else {
        setTimeout(function(){ hydrateChatFromStorage(); }, 120);
      }

    } catch(e) {}
  }
  // Hide disclaimer panel immediately if already accepted
  (function(){ if (disclaimerAccepted) { var d = document.getElementById('waDisclaimerPanel'); if(d) d.style.display='none'; } }());

  // ── Oil catalogue (for in-chat ordering) ──
  var OILS = {
    '🥥 Coconut Oil':   { label: 'Coconut Oil (Cold-Pressed)',    sizes: {'1L': 449,  '5L': 2199} },
    '🥜 Groundnut Oil': { label: 'Groundnut Oil (Wooden-Pressed)', sizes: {'1L': 329,  '5L': 1549} },
    '🌿 Gingelly Oil':  { label: 'Gingelly Oil (Wooden-Pressed)',  sizes: {'1L': 499,  '5L': 2395} }
  };
  var OIL_COMBOS = {
    '🥥 Coconut Oil':   { twoL: 869,  save2L: 29,  save5L: 86  },
    '🥜 Groundnut Oil': { twoL: 639,  save2L: 19,  save5L: 96  },
    '🌿 Gingelly Oil':  { twoL: 969,  save2L: 29,  save5L: 100 }
  };

  function detectOilLabel(textLower) {
    if (!textLower) return null;
    if (/coconut|copra|தேங்காய்/.test(textLower)) return '🥥 Coconut Oil';
    if (/groundnut|ground\s*nut|groi?und\s*nut|peanut|verkadalai|வேர்க்கடலை/.test(textLower)) return '🥜 Groundnut Oil';
    if (/gingelly|sesame|nallennai|எள்ளெண்ணெய்|sesam/.test(textLower)) return '🌿 Gingelly Oil';
    return null;
  }

  function detectOilLabels(textLower) {
    if (!textLower) return [];
    var found = [];
    if (/coconut|copra|தேங்காய்/.test(textLower)) found.push('🥥 Coconut Oil');
    if (/groundnut|ground\s*nut|groi?und\s*nut|peanut|verkadalai|வேர்க்கடலை/.test(textLower)) found.push('🥜 Groundnut Oil');
    if (/gingelly|sesame|nallennai|எள்ளெண்ணெய்|sesam/.test(textLower)) found.push('🌿 Gingelly Oil');
    return found;
  }

  function getStarterChips() {
    return ['🛍️ Order Now', '💰 Prices & sizes', '🎁 Combo offers', '🚚 Delivery info', '🌿 About the oils', '✅ Quality & FSSAI'];
  }

  function getOilSizeChips(oilLabel) {
    var oil = OILS[oilLabel];
    if (!oil) return [];
    var chips = Object.keys(oil.sizes).map(function (s) {
      return s + ' – ' + inr(oil.sizes[s]);
    });
    chips.push('↩️ Choose different oil');
    return chips;
  }

  function parseSizeFromText(textLower, oilLabel) {
    var oil = OILS[oilLabel];
    if (!oil) return null;
    var normalized = String(textLower || '').replace(/\s+/g, '');
    var keys = Object.keys(oil.sizes);
    for (var i = 0; i < keys.length; i++) {
      var size = keys[i];
      var num = size.replace(/[^0-9]/g, '');
      if (!num) continue;
      var re = new RegExp('(^|[^0-9])' + num + '(\\s*(l|lt|ltr|liter|litre))?([^0-9]|$)');
      if (re.test(textLower) || normalized.indexOf(num + 'l') > -1) return size;
    }
    return null;
  }

  function parseQtyFromText(textLower) {
    if (!textLower) return null;
    var words = {
      'one': 1,
      'two': 2,
      'three': 3,
      'four': 4,
      'five': 5
    };
    for (var key in words) {
      if (Object.prototype.hasOwnProperty.call(words, key) && new RegExp('\\b' + key + '\\b').test(textLower)) {
        return words[key];
      }
    }
    var m = textLower.match(/\b([1-9])\b/);
    if (m) return parseInt(m[1], 10);
    if (/\ba\b|\ban\b|\bone\b/.test(textLower)) return 1;
    return null;
  }

  function addPendingOilToCart(qty) {
    if (!pendingOil || !pendingSize) return false;
    var safeQty = Number(qty);
    if (!Number.isFinite(safeQty) || safeQty < 1) safeQty = 1;
    if (safeQty > 5) safeQty = 5;
    var linePrice = safeQty * pendingSize.priceEach;
    orderCart.push({
      emoji: pendingOil.split(' ')[0],
      label: OILS[pendingOil].label,
      size: pendingSize.size,
      qty: safeQty,
      price: linePrice
    });
    try { syncChatLineToPageCart(OILS[pendingOil].label, pendingSize.size, pendingSize.priceEach, safeQty); } catch(e) {}
    saveCart();
    pendingOil = null;
    pendingSize = null;
    var cartLines = orderCart.map(function (i) {
      return '  ' + i.emoji + ' ' + i.label + ' ' + i.size + (i.qty > 1 ? ' × ' + i.qty : '') + ' — ' + inr(i.price);
    }).join('\n');
    var total = orderCart.reduce(function (s, i) { return s + i.price; }, 0);
    botReply({
      text: '✅ Added!\n\n🛒 Your cart:\n' + cartLines + '\n\n  Total: ' + inr(total) + ' + free delivery\n\nAdd more oils or send your order?',
      chips: ['➕ Add another oil', '📦 Send my order', '🗑️ Start over']
    });
    setTimeout(updateWaBtn, 900);
    return true;
  }

  function isOrderIntent(textLower) {
    return /(buy|order|purchase|get|want|need|book|add\s+to\s+cart|place\s+order|checkout)/.test(textLower);
  }

  function isOfferIntent(textLower) {
    return /(offer|combo|discount|deal|save|price|rate|cost|size|pack|litre|liter|1l|2l|5l)/.test(textLower);
  }

  function buildOilOfferText(oilLabel) {
    var oil = OILS[oilLabel];
    var combo = OIL_COMBOS[oilLabel] || {};
    if (!oil) return 'I can help you choose an oil and pack size.';
    var oneL = oil.sizes['1L'];
    var fiveL = oil.sizes['5L'];
    return 'Great choice! ' + oilLabel + ' 👍\n\n' +
      'Available offers:\n' +
      '• 1L → ' + inr(oneL) + '\n' +
      '• 2L Combo → ' + inr(combo.twoL || (oneL * 2)) + (combo.save2L ? (' (Save ' + inr(combo.save2L) + ')') : '') + '\n' +
      '• 5L Family Pack → ' + inr(fiveL) + (combo.save5L ? (' (Save ' + inr(combo.save5L) + ')') : '') + '\n\n' +
      'What would you like to do next?';
  }

  function handleTypedMessage(rawText) {
    var text = String(rawText || '').trim();
    if (!text) return;
    var t = text.toLowerCase();

    addMsg('user', escapeHtml(text));
    setChips([]);

    var oilLabels = detectOilLabels(t);
    var hasExplicitOilMention = oilLabels.length > 0;

    // Explicit multi-oil message should always win over any pending step state.
    if (oilLabels.length >= 2 && (isOrderIntent(t) || isOfferIntent(t) || /\band\b|,|\+/.test(t))) {
      pendingOil = null;
      pendingSize = null;
      botReply({
        text: 'Nice picks 👍 I can add one oil at a time. Which one should we start with?',
        chips: oilLabels.concat(['↩️ Back to menu'])
      });
      return;
    }

    // If user explicitly names an oil, do not treat the message as qty/size reply
    // for an older pending oil context.
    if (hasExplicitOilMention && pendingOil && oilLabels.indexOf(pendingOil) === -1) {
      pendingOil = null;
      pendingSize = null;
    }

    if (pendingOil && !pendingSize && !hasExplicitOilMention) {
      var typedSize = parseSizeFromText(t, pendingOil);
      if (typedSize) {
        var priceEach2 = OILS[pendingOil].sizes[typedSize];
        pendingSize = { size: typedSize, priceEach: priceEach2 };
        var typedQty2 = parseQtyFromText(t);
        if (typedQty2) {
          addPendingOilToCart(typedQty2);
          return;
        }
        botReply({
          text: 'Perfect — ' + pendingOil + ' ' + typedSize + '. How many bottles would you like?',
          chips: ['1 bottle', '2 bottles', '3 bottles', '4 bottles', '5 bottles', '↩️ Choose different oil']
        });
        return;
      }
    }

    if (pendingOil && pendingSize && !hasExplicitOilMention) {
      var typedQty = parseQtyFromText(t);
      if (typedQty) {
        addPendingOilToCart(typedQty);
        return;
      }
    }

    var oilLabel = oilLabels.length ? oilLabels[0] : detectOilLabel(t);
    if (oilLabel && (isOrderIntent(t) || isOfferIntent(t))) {
      pendingOil = oilLabel;
      pendingSize = null;
      botReply({ text: buildOilOfferText(oilLabel), chips: getOilSizeChips(oilLabel) });
      return;
    }

    if (oilLabel) {
      pendingOil = oilLabel;
      pendingSize = null;
      botReply({ text: 'Great choice! Select your size for ' + oilLabel + ':', chips: getOilSizeChips(oilLabel) });
      return;
    }

    if (isOrderIntent(t)) {
      botReply({ text: 'Awesome! Let\'s place your order. Which oil do you want?', chips: ['🥥 Coconut Oil', '🥜 Groundnut Oil', '🌿 Gingelly Oil', '↩️ Back to menu'] });
      return;
    }

    if (/combo|offer|discount|save/.test(t)) { botReply(KB['🎁 Combo offers']); return; }
    if (/price|cost|rate|size|pack/.test(t)) { botReply(KB['💰 Prices & sizes']); return; }
    if (/delivery|shipping|ship|pincode|pin code|when/.test(t)) { botReply(KB['🚚 Delivery info']); return; }
    if (/quality|fssai|certified|pure|chemical/.test(t)) { botReply(KB['✅ Quality & FSSAI']); return; }
    if (/about|oil|benefit|healthy|cold\s*pressed|marachekku/.test(t)) { botReply(KB['🌿 About the oils']); return; }

    botReply({
      text: 'I can help with prices, offers, delivery, and placing an order in real-time.\nTry: "I want coconut oil" or "show groundnut offers".',
      chips: ['🛍️ Order Now', '💰 Prices & sizes', '🎁 Combo offers', '🚚 Delivery info']
    });
  }

  function waSendText() {
    var input = document.getElementById('waTextInput');
    if (!input) return;
    var text = input.value;
    var nowTs = Date.now();
    __typedTs = __typedTs.filter(function(ts){ return (nowTs - ts) < 20000; });
    if (__typedTs.length >= 8) {
      botReply({ text: 'Too many messages quickly. Please wait a few seconds and continue.', chips: ['🛍️ Order Now', '💰 Prices & sizes', '🎁 Combo offers'] });
      return;
    }
    if (nowTs - __lastTypedAt < 700) {
      return;
    }
    __lastTypedAt = nowTs;
    __typedTs.push(nowTs);
    input.value = '';
    handleTypedMessage(text);
  }
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function escapeHtml(str){
    return String(str).replace(/[&<>\"]/g, function (s) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[s];
    });
  }

  function _readJsonArray(key){
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch(e) {
      return [];
    }
  }

  function _sumQty(arr){
    try {
      return (Array.isArray(arr) ? arr : []).reduce(function(sum, item){
        var q = (item && item.qty != null) ? Number(item.qty) : 1;
        q = (Number.isFinite(q) && q > 0) ? q : 1;
        return sum + q;
      }, 0);
    } catch(e) {
      return 0;
    }
  }

  function pruneChatMirrorsFromPageCart(forceAll) {
    try {
      var pageCart = _readJsonArray('arumeeCart');
      if (!pageCart.length) return;
      var hasChatCart = Array.isArray(orderCart) && orderCart.length > 0;
      if (!forceAll && hasChatCart) return;
      var filtered = pageCart.filter(function(it){
        if (!it) return false;
        var key = String(it.itemKey || '');
        var isMirror = !!it.fromChat || key.indexOf('chat:') === 0;
        return !isMirror;
      });
      if (filtered.length !== pageCart.length) {
        localStorage.setItem('arumeeCart', JSON.stringify(filtered));
      }
    } catch(e) {}
  }

  function syncChatLineToPageCart(label, size, unitPrice, qty){
    try {
      var pageCart = _readJsonArray('arumeeCart');
      var cleanLabel = label ? String(label) : 'Item';
      var cleanSize = size ? String(size) : '';
      var normalizedLabel = cleanLabel;
      if (/^\s*Coconut Oil\s*\(Cold-Pressed\)\s*$/i.test(cleanLabel)) normalizedLabel = 'Cold-Pressed Coconut Oil';
      if (/^\s*Groundnut Oil\s*\(Wooden-Pressed\)\s*$/i.test(cleanLabel)) normalizedLabel = 'Wooden-Pressed Groundnut Oil';
      if (/^\s*Gingelly Oil\s*\(Wooden-Pressed\)\s*$/i.test(cleanLabel)) normalizedLabel = 'Wooden-Pressed Gingelly Oil';
      var q = (qty != null) ? Number(qty) : 1;
      q = (Number.isFinite(q) && q > 0) ? q : 1;
      var up = (unitPrice != null) ? Number(unitPrice) : 0;
      up = (Number.isFinite(up) && up >= 0) ? up : 0;
      var itemKey = 'chat:' + normalizedLabel + ':' + cleanSize;
      var productName = normalizedLabel + (cleanSize ? (' (' + cleanSize + ')') : '');

      var idx = -1;
      for (var i = 0; i < pageCart.length; i++) {
        var it = pageCart[i];
        if (!it) continue;
        if (it.itemKey && String(it.itemKey) === itemKey) { idx = i; break; }
        if (String(it.originalName || '') === cleanLabel && String(it.size || '') === cleanSize) { idx = i; break; }
        if (String(it.originalName || '') === normalizedLabel && String(it.size || '') === cleanSize) { idx = i; break; }
        if (String(it.productName || '') === productName && String(it.size || '') === cleanSize) { idx = i; break; }
      }

      if (idx > -1) {
        var ex = pageCart[idx] || {};
        var exQty = (ex.qty != null) ? Number(ex.qty) : 1;
        exQty = (Number.isFinite(exQty) && exQty > 0) ? exQty : 1;
        ex.qty = exQty + q;
        if (up > 0) ex.price = up;
        ex.size = cleanSize;
        ex.productName = ex.productName || productName;
        ex.originalName = ex.originalName || normalizedLabel;
        ex.itemKey = ex.itemKey || itemKey;
        ex.fromChat = true;
        ex.total = (Number(ex.price) || 0) * (Number(ex.qty) || 1);
        pageCart[idx] = ex;
      } else {
        pageCart.push({
          productName: productName,
          originalName: normalizedLabel,
          size: cleanSize,
          price: up,
          qty: q,
          total: up * q,
          itemKey: itemKey,
          fromChat: true
        });
      }

      localStorage.setItem('arumeeCart', JSON.stringify(pageCart));
    } catch(e) {}
  }

  function bootstrapChatCartIntoPageCart(){
    try {
      var chat = Array.isArray(orderCart) ? orderCart : _readJsonArray('arumee_cart');
      if (!chat.length) return;
      var pageCart = _readJsonArray('arumeeCart');
      var keys = {};
      for (var i = 0; i < pageCart.length; i++) {
        if (pageCart[i] && pageCart[i].itemKey) keys[String(pageCart[i].itemKey)] = true;
      }
      for (var j = 0; j < chat.length; j++) {
        var c = chat[j];
        if (!c) continue;
        var label = c.label ? String(c.label) : 'Item';
        var size = c.size ? String(c.size) : '';
        var qty = (c.qty != null) ? Number(c.qty) : 1;
        qty = (Number.isFinite(qty) && qty > 0) ? qty : 1;
        var lineTotal = (c.price != null) ? Number(c.price) : 0;
        lineTotal = (Number.isFinite(lineTotal) && lineTotal >= 0) ? lineTotal : 0;
        var unit = qty > 0 ? (lineTotal / qty) : lineTotal;
        var key = 'chat:' + label + ':' + size;
        if (keys[key]) continue;
        syncChatLineToPageCart(label, size, unit, qty);
        keys[key] = true;
      }
    } catch(e) {}
  }

  function syncSiteCartBadges(){
    var pageCart = _readJsonArray('arumeeCart');
    var totalUnits = _sumQty(pageCart);
    var el1 = document.getElementById('navCartCount');
    if (el1) el1.textContent = String(totalUnits);
    var el2 = document.getElementById('cartCount');
    if (el2) el2.textContent = String(totalUnits);

    try {
      var nodes = document.querySelectorAll('.nav-cart-count, .cart-count');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].textContent = String(totalUnits);
      }
    } catch(e) {}

    // Notify the page so sticky nav + cart icon update when chatbot adds items
    try {
      document.body.classList.toggle('has-cart-items', totalUnits > 0);
      window.dispatchEvent(new CustomEvent('arumee-cart-updated'));
    } catch(e) {}
  }

  function syncFromStorageOnExternalCartUpdate() {
    try {
      var raw = localStorage.getItem('arumee_cart');
      var parsed = raw ? JSON.parse(raw) : [];
      orderCart = Array.isArray(parsed) ? parsed : [];

      var rawHistory = localStorage.getItem('arumee_chat');
      var parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      history = Array.isArray(parsedHistory) ? parsedHistory : [];

      var rawDelivery = localStorage.getItem('arumee_delivery');
      deliveryInfo = rawDelivery ? JSON.parse(rawDelivery) : null;

      if (!orderCart.length) {
        pendingOil = null;
        pendingSize = null;
      }
      updateWaBtn();

      if (!history.length) {
        var msgs = document.getElementById('waMsgs');
        if (msgs) {
          var nodes = msgs.querySelectorAll('.wa-msg');
          nodes.forEach(function(n) { n.remove(); });
        }
        var addrPanel = document.getElementById('waAddrPanel');
        if (addrPanel) addrPanel.classList.remove('wa-addr-open');
        setChips(getStarterChips());

        var panel = document.getElementById('waChatPanel');
        var isOpen = IS_FULL_CHAT || (panel && panel.classList.contains('wa-open'));
        if (isOpen && disclaimerAccepted) {
          botReply(KB.greeting);
        }
      }
    } catch(e) {}
  }

  try { if (!orderCart || !orderCart.length) pruneChatMirrorsFromPageCart(false); } catch(e) {}
  // Ensure main page cart badges reflect chatbot cart too
  try { bootstrapChatCartIntoPageCart(); } catch(e) {}
  try { syncSiteCartBadges(); } catch(e) {}

  // ── Knowledge base ──
  var KB = {
    greeting: {
      text: 'Hi there! 👋 Welcome to Arumee Oils!\nI can answer questions about our oils, prices, combos, delivery & more.\nWhat would you like to know?',
      chips: ['🛍️ Order Now', '💰 Prices & sizes', '🎁 Combo offers', '🚚 Delivery info', '🌿 About the oils', '✅ Quality & FSSAI']
    },
    '🛒 How to order': {
      text: 'Ordering is simple! 🛒\n\n1️⃣ Add oils to your cart on this page\n2️⃣ Fill in your name, phone & address\n3️⃣ Submit — we’ll WhatsApp you to confirm\n4️⃣ Pay upfront via UPI — we pack & dispatch! 🚀\n\n🚚 Free delivery on all orders across India.',
      chips: ['💰 See prices', '🎁 Combo packs', '🚚 Delivery time', '📞 Chat on WhatsApp']
    },
    '💰 Prices & sizes': {
      text: 'Our current prices 💰\n\n🥥 Coconut Oil (Cold-Pressed)\n  1L → ₹449  |  5L → ₹2,199\n\n🥜 Groundnut Oil (Wooden-Pressed)\n  1L → ₹329  |  5L → ₹1,549\n\n🌿 Gingelly Oil (Wooden-Pressed)\n  1L → ₹499  |  5L → ₹2,395\n\n🚚 Free delivery included on all orders!',
      chips: ['🎁 Combo discounts', '🛒 How to order', '🌿 About the oils', '📞 Chat on WhatsApp']
    },
    '💰 See prices': {
      text: 'Our current prices 💰\n\n🥥 Coconut Oil (Cold-Pressed)\n  1L → ₹449  |  5L → ₹2,199\n\n🥜 Groundnut Oil (Wooden-Pressed)\n  1L → ₹329  |  5L → ₹1,549\n\n🌿 Gingelly Oil (Wooden-Pressed)\n  1L → ₹499  |  5L → ₹2,395\n\n🚚 Free delivery included on all orders!',
      chips: ['🎁 Combo discounts', '🛒 How to order', '📞 Chat on WhatsApp']
    },
    '🎁 Combo offers': {
      text: 'Save more with bigger packs! 🎁\n\n🥥 Coconut Oil\n  2L → ₹869 (Save ₹29)\n  5L → ₹2,199 (Save ₹86)\n\n🥜 Groundnut Oil\n  2L → ₹639 (Save ₹19)\n  5L → ₹1,549 (Save ₹96)\n\n🌿 Gingelly Oil\n  2L → ₹969 (Save ₹29)\n  5L → ₹2,395 (Save ₹100)\n\n🚚 Free delivery on all packs!',
      chips: ['🛒 How to order', '💰 Single bottle prices', '📞 Chat on WhatsApp']
    },
    '🎁 Combo packs': {
      text: 'Save more with bigger packs! 🎁\n\n🥥 Coconut Oil\n  2L → ₹869 (Save ₹29)\n  5L → ₹2,199 (Save ₹86)\n\n🥜 Groundnut Oil\n  2L → ₹639 (Save ₹19)\n  5L → ₹1,549 (Save ₹96)\n\n🌿 Gingelly Oil\n  2L → ₹969 (Save ₹29)\n  5L → ₹2,395 (Save ₹100)\n\n🚚 Free delivery on all packs!',
      chips: ['🛒 How to order', '💰 Single bottle prices', '📞 Chat on WhatsApp']
    },
    '🎁 Combo discounts': {
      text: 'Save more with bigger packs! 🎁\n\n🥥 Coconut Oil\n  2L → ₹869 (Save ₹29)\n  5L → ₹2,199 (Save ₹86)\n\n🥜 Groundnut Oil\n  2L → ₹639 (Save ₹19)\n  5L → ₹1,549 (Save ₹96)\n\n🌿 Gingelly Oil\n  2L → ₹969 (Save ₹29)\n  5L → ₹2,395 (Save ₹100)\n\n🚚 Free delivery on all packs!',
      chips: ['🛒 How to order', '💰 Single bottle prices', '📞 Chat on WhatsApp']
    },
    '💰 Single bottle prices': {
      text: 'Our current prices 💰\n\n🥥 Coconut Oil (Cold-Pressed)\n  1L → ₹449  |  5L → ₹2,199\n\n🥜 Groundnut Oil (Wooden-Pressed)\n  1L → ₹329  |  5L → ₹1,549\n\n🌿 Gingelly Oil (Wooden-Pressed)\n  1L → ₹499  |  5L → ₹2,395\n\n🚚 Free delivery included!',
      chips: ['🎁 Combo discounts', '🛒 How to order', '📞 Chat on WhatsApp']
    },
    '🚚 Delivery info': {
      text: 'Delivery details 🚚\n\n📍 Dispatched from: Namakkal, Tamil Nadu\n⏱️ Delivery time: 3–5 business days\n🚚 Delivery charge: FREE on all orders\n💳 Payment: UPI upfront after WhatsApp confirmation\n📦 Packed fresh from the mill for every order.',
      chips: ['🛒 How to order', '💰 Prices & sizes', '📞 Chat on WhatsApp']
    },
    '🚚 Delivery time': {
      text: 'Delivery details 🚚\n\n📍 Dispatched from: Namakkal, Tamil Nadu\n⏱️ Delivery time: 3–5 business days\n🚚 Delivery charge: FREE on all orders\n💳 Payment: UPI upfront after WhatsApp confirmation\n📦 Packed fresh from the mill for every order.',
      chips: ['🛒 How to order', '💰 Prices & sizes', '📞 Chat on WhatsApp']
    },
    '🌿 About the oils': {
      text: 'About our oils 🌿\n\n🥥 Cold-Pressed Coconut Oil\n  Pure, no heat, full lauric acid retained\n\n🥜 Wooden-Pressed Groundnut Oil\n  Traditional marachekku method, rich aroma\n\n🌿 Wooden-Pressed Gingelly Oil\n  Marachekku extracted, rich in sesamol & Vitamin E\n\nAll oils: no chemicals, no preservatives, no bleaching. ✅',
      chips: ['💰 Prices & sizes', '✅ Quality & FSSAI', '🛒 How to order', '📞 Chat on WhatsApp']
    },
    '✅ Quality & FSSAI': {
      text: 'Quality you can trust ✅\n\n🏛️ FSSAI Certified\n   Licence: 22425133000137\n\n🏭 Produced at Mani Flour & Oil Mill,\n   Namakkal, Tamil Nadu\n\n🚫 No artificial colours\n🚫 No chemical solvents\n🚫 No preservatives\n✅ 100% natural, pure oils',
      chips: ['🌿 About the oils', '💰 Prices & sizes', '🛒 How to order', '📞 Chat on WhatsApp']
    }
  };

  // ── Apply admin-set prices from Google Sheet (localStorage cache + fresh fetch) ──
  (function () {
    var PRICE_URL = 'https://script.google.com/macros/s/AKfycbzUPnEWOz5ToHLwlSd-MGsEGw2_K7mmw9vKzrrl1pEv_n1FExmsNrCqYzkEADS_6BWbvQ/exec?action=getPrices';
    var OIL_MAP = {
      '🥥 Coconut Oil':   'coconut',
      '🥜 Groundnut Oil': 'groundnut',
      '🌿 Gingelly Oil':  'gingelly'
    };

    function fmt(n) { return Number(n).toLocaleString('en-IN'); }

    function applyPriceCfg(cfg) {
      if (!cfg) return;
      // Patch OILS sizes and OIL_COMBOS from the config
      Object.keys(OIL_MAP).forEach(function (key) {
        var oil = OIL_MAP[key];
        var prices = cfg[oil] && cfg[oil].prices;
        if (!prices) return;
        if (prices['1L'] > 0) OILS[key].sizes['1L'] = prices['1L'];
        if (prices['5L'] > 0) OILS[key].sizes['5L'] = prices['5L'];
        if (OIL_COMBOS[key]) {
          if (prices['2L'] > 0) {
            OIL_COMBOS[key].twoL = prices['2L'];
            if (prices['1L'] > 0) OIL_COMBOS[key].save2L = Math.max(0, prices['1L'] * 2 - prices['2L']);
          }
          if (prices['5L'] > 0 && prices['1L'] > 0) {
            OIL_COMBOS[key].save5L = Math.max(0, prices['1L'] * 5 - prices['5L']);
          }
        }
      });

      // Rebuild KB price text entries from updated OILS/OIL_COMBOS
      var c = OILS['🥥 Coconut Oil'].sizes;
      var g = OILS['🥜 Groundnut Oil'].sizes;
      var s = OILS['🌿 Gingelly Oil'].sizes;
      var cc = OIL_COMBOS['🥥 Coconut Oil'];
      var gc = OIL_COMBOS['🥜 Groundnut Oil'];
      var sc = OIL_COMBOS['🌿 Gingelly Oil'];

      var priceText = 'Our current prices 💰\n\n🥥 Coconut Oil (Cold-Pressed)\n  1L → ₹' + fmt(c['1L']) + '  |  5L → ₹' + fmt(c['5L']) + '\n\n🥜 Groundnut Oil (Wooden-Pressed)\n  1L → ₹' + fmt(g['1L']) + '  |  5L → ₹' + fmt(g['5L']) + '\n\n🌿 Gingelly Oil (Wooden-Pressed)\n  1L → ₹' + fmt(s['1L']) + '  |  5L → ₹' + fmt(s['5L']) + '\n\n🚚 Free delivery included on all orders!';

      var comboText = 'Save more with bigger packs! 🎁\n\n🥥 Coconut Oil\n  2L → ₹' + fmt(cc.twoL) + ' (Save ₹' + fmt(cc.save2L) + ')\n  5L → ₹' + fmt(c['5L']) + ' (Save ₹' + fmt(cc.save5L) + ')\n\n🥜 Groundnut Oil\n  2L → ₹' + fmt(gc.twoL) + ' (Save ₹' + fmt(gc.save2L) + ')\n  5L → ₹' + fmt(g['5L']) + ' (Save ₹' + fmt(gc.save5L) + ')\n\n🌿 Gingelly Oil\n  2L → ₹' + fmt(sc.twoL) + ' (Save ₹' + fmt(sc.save2L) + ')\n  5L → ₹' + fmt(s['5L']) + ' (Save ₹' + fmt(sc.save5L) + ')\n\n🚚 Free delivery on all packs!';

      ['💰 Prices & sizes', '💰 See prices', '💰 Single bottle prices'].forEach(function (k) {
        if (KB[k]) KB[k].text = priceText;
      });
      ['🎁 Combo offers', '🎁 Combo packs', '🎁 Combo discounts'].forEach(function (k) {
        if (KB[k]) KB[k].text = comboText;
      });
    }

    // 1. Apply cached prices immediately (no flicker)
    try {
      var cached = JSON.parse(localStorage.getItem('arumee_pricing') || 'null');
      if (cached) applyPriceCfg(cached);
    } catch (e) {}

    // 2. Fetch fresh prices from Google Sheet and re-apply if changed
    fetch(PRICE_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.prices && Object.keys(data.prices).length) {
          var cfg = {};
          ['coconut', 'groundnut', 'gingelly'].forEach(function (oil) {
            if (data.prices[oil]) cfg[oil] = { prices: data.prices[oil] };
          });
          try { localStorage.setItem('arumee_pricing', JSON.stringify(cfg)); } catch (e) {}
          applyPriceCfg(cfg);
        }
      })
      .catch(function () {});
  })();

  function now() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function addMsg(role, text) {
    var msgs = document.getElementById('waMsgs');
    var typing = document.getElementById('waTyping');
    if (!msgs) return;
    var wrap = document.createElement('div');
    wrap.className = 'wa-msg ' + role;

    if (role === 'bot') {
      var av = document.createElement('div');
      av.className = 'wa-avatar';
      av.textContent = 'A';
      wrap.appendChild(av);
    }

    var inner = document.createElement('div');
    inner.className = 'wa-msg-inner';
    var bubble = document.createElement('div');
    bubble.className = 'wa-msg-bubble';
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    var t = document.createElement('div');
    t.className = 'wa-msg-time';
    t.textContent = now();
    inner.appendChild(bubble);
    inner.appendChild(t);
    wrap.appendChild(inner);
    msgs.insertBefore(wrap, typing);
    msgs.scrollTop = msgs.scrollHeight;
    history.push({ role: role, text: text });
    saveHistory();
  }

  function setChips(chips) {
    var c = document.getElementById('waChips');
    if (!c) return;
    c.innerHTML = '';
    var list = chips || [];
    // Prepend "Order Now" only when NOT inside the order flow.
    // Order-flow is detected by the presence of oil names, size options,
    // cart-action chips, or back-navigation chips.
    var orderFlowChip = list.some(function(l) {
      return l === '🥥 Coconut Oil' || l === '🥜 Groundnut Oil' || l === '🌿 Gingelly Oil' ||
             l === '➕ Add another oil' || l === '📦 Send my order' || l === '🗑️ Start over' ||
             l === '↩️ Back to menu' || l === '↩️ Choose different oil' ||
             /^[0-9]+L\s*–/.test(l) || /^\d+ bottles?$/.test(l);
    });
    if (list.length > 0 && !orderFlowChip && list.indexOf('🛍️ Order Now') === -1) {
      list = ['🛍️ Order Now'].concat(list);
    }
    list.forEach(function (label) {
      var btn = document.createElement('button');
      btn.className = 'wa-chip';
      btn.textContent = label;
      btn.onclick = function (e) { e.stopPropagation(); pick(label); };
      c.appendChild(btn);
    });

    try {
      var msgs = document.getElementById('waMsgs');
      if (msgs) {
        requestAnimationFrame(function() {
          msgs.scrollTop = msgs.scrollHeight;
        });
        setTimeout(function(){
          msgs.scrollTop = msgs.scrollHeight;
        }, 40);
      }
    } catch(e) {}
  }

  function hydrateChatFromStorage() {
    var msgs = document.getElementById('waMsgs');
    var typing = document.getElementById('waTyping');
    if (!msgs || !typing) return;

    if (history.length === 0) {
      setChips(getStarterChips());
      botReply(KB.greeting);
      return;
    }

    if (!document.querySelector('#waMsgs .wa-msg')) {
      history.forEach(function(m) {
        var d = document.createElement('div');
        d.className = 'wa-msg ' + m.role;
        d.innerHTML = m.role === 'bot'
          ? '<span class="wa-avatar">A</span><div class="wa-msg-bubble">' + m.text + '</div>'
          : '<div class="wa-msg-bubble">' + m.text + '</div>';
        msgs.insertBefore(d, typing);
      });
      msgs.scrollTop = msgs.scrollHeight;
    }

    if (orderCart.length > 0) {
      setChips(['➕ Add another oil', '📦 Send my order', '🗑️ Start over']);
      updateWaBtn();
    } else {
      setChips(getStarterChips());
    }
  }

  function showTyping() {
    var t = document.getElementById('waTyping');
    var m = document.getElementById('waMsgs');
    if (t) { t.classList.add('show'); if (m) m.scrollTop = m.scrollHeight; }
  }
  function hideTyping() {
    var t = document.getElementById('waTyping');
    if (t) t.classList.remove('show');
  }

  function botReply(entry) {
    setChips([]);
    showTyping();
    setTimeout(function () {
      hideTyping();
      addMsg('bot', entry.text);
      setChips(entry.chips || []);
      try {
        var msgs = document.getElementById('waMsgs');
        if (msgs) {
          requestAnimationFrame(function() {
            msgs.scrollTop = msgs.scrollHeight;
          });
          setTimeout(function(){
            msgs.scrollTop = msgs.scrollHeight;
          }, 40);
        }
      } catch(e) {}
    }, 750);
  }


  function updateWaBtn() {
    var span = document.querySelector('.wa-btn-text');
    var btn  = document.querySelector('.wa-wa-btn');
    if (!span || !btn) return;
    if (orderCart.length) {
      span.textContent = 'Send Order on WhatsApp';
      btn.classList.add('wa-btn-active');
    } else {
      span.textContent = 'Continue on WhatsApp';
      btn.classList.remove('wa-btn-active');
    }
  }

  // TN pincode data embedded inline – no fetch needed
  _tnPins = {"632204":"Vellore","632104":"Vellore","641201":"Coimbatore","641006":"Coimbatore","641105":"Coimbatore","641107":"Coimbatore","641101":"Coimbatore","641114":"Coimbatore","641022":"Coimbatore","641010":"Coimbatore","641108":"Coimbatore","641109":"Coimbatore","636704":"Dharmapuri","636705":"Dharmapuri","635201":"Krishnagiri","636813":"Dharmapuri","635301":"Dharmapuri","635302":"Dharmapuri","636902":"Krishnagiri","636903":"Dharmapuri","636803":"Dharmapuri","635303":"Dharmapuri","635202":"Dharmapuri","636804":"Dharmapuri","636904":"Dharmapuri","635305":"Dharmapuri","636807":"Dharmapuri","636808":"Dharmapuri","636905":"Dharmapuri","636809":"Dharmapuri","636810":"Dharmapuri","635205":"Dharmapuri","636811":"Dharmapuri","636906":"Dharmapuri","638311":"Erode","638501":"Erode","638504":"Erode","638312":"Erode","638116":"Erode","638107":"Erode","638314":"Erode","638052":"Erode","638315":"Erode","638057":"Erode","638751":"Erode","638056":"Tiruppur","638115":"Erode","638007":"Namakkal","638151":"Erode","638104":"Erode","638154":"Erode","638109":"Erode","638009":"Erode","638112":"Erode","638502":"Erode","638503":"Erode","638110":"Erode","638476":"Erode","638505":"Erode","638453":"Erode","638454":"Erode","638455":"Erode","638456":"Erode","638103":"Tiruppur","638458":"Erode","638506":"Erode","638055":"Erode","638462":"Erode","635104":"Krishnagiri","635105":"Krishnagiri","635106":"Dharmapuri","635107":"Krishnagiri","635108":"Krishnagiri","635304":"Krishnagiri","635111":"Dharmapuri","635112":"Krishnagiri","635113":"Krishnagiri","635002":"Krishnagiri","635101":"Krishnagiri","635203":"Krishnagiri","635204":"Krishnagiri","635123":"Krishnagiri","635206":"Krishnagiri","635115":"Krishnagiri","635116":"Krishnagiri","635307":"Krishnagiri","635118":"Krishnagiri","635119":"Krishnagiri","635207":"Krishnagiri","635120":"Krishnagiri","635121":"Krishnagiri","637002":"Namakkal","637014":"Namakkal","637015":"Namakkal","637003":"Namakkal","637018":"Namakkal","637019":"Namakkal","637411":"Namakkal","637409":"Namakkal","637021":"Namakkal","637212":"Namakkal","637201":"Namakkal","637202":"Namakkal","637101":"Salem","637213":"Namakkal","638183":"Namakkal","637102":"Salem","637214":"Namakkal","637205":"Namakkal","637103":"Salem","637503":"Namakkal","637206":"Namakkal","638008":"Namakkal","637207":"Namakkal","637208":"Namakkal","637302":"Namakkal","637301":"Salem","637209":"Namakkal","637210":"Namakkal","637304":"Namakkal","637104":"Salem","637105":"Salem","638182":"Namakkal","643102":"The Nilgiris","643214":"The Nilgiris","643216":"The Nilgiris","643217":"The Nilgiris","643219":"The Nilgiris","643221":"The Nilgiris","643238":"The Nilgiris","643209":"The Nilgiris","643004":"The Nilgiris","643212":"The Nilgiris","643211":"The Nilgiris","643005":"The Nilgiris","643224":"The Nilgiris","643237":"The Nilgiris","643002":"The Nilgiris","642101":"Coimbatore","642106":"Coimbatore","642202":"Coimbatore","642130":"Coimbatore","642109":"Coimbatore","642110":"Coimbatore","642002":"Coimbatore","642117":"Coimbatore","642001":"Coimbatore","642120":"Coimbatore","642123":"Coimbatore","642134":"Coimbatore","642127":"Coimbatore","642105":"Coimbatore","642005":"Coimbatore","642007":"Coimbatore","642154":"Tiruppur","642107":"Coimbatore","642201":"Tiruppur","642203":"Tiruppur","642112":"Tiruppur","642205":"Tiruppur","642207":"Tiruppur","636101":"Salem","636104":"Salem","636105":"Salem","636107":"Salem","636142":"Namakkal","636108":"Salem","636141":"Salem","636119":"Salem","636112":"Salem","636114":"Salem","636121":"Salem","636115":"Salem","636116":"Salem","636117":"Salem","637501":"Salem","636201":"Salem","636138":"Salem","636015":"Salem","636010":"Salem","636139":"Salem","636203":"Salem","636602":"Salem","636006":"Salem","636111":"Salem","636122":"Salem","636308":"Salem","636601":"Salem","637401":"Namakkal","636451":"Salem","636354":"Salem","637502":"Salem","636404":"Salem","636011":"Salem","637403":"Namakkal","636302":"Salem","636501":"Salem","636351":"Salem","636309":"Salem","636012":"Salem","636303":"Salem","636009":"Salem","636452":"Salem","636458":"Salem","636202":"Namakkal","636453":"Salem","636304":"Salem","637406":"Namakkal","636305":"Salem","636306":"Salem","636307":"Salem","636502":"Salem","635802":"Tirupathur","632601":"Vellore","635803":"Vellore","635804":"Vellore","635808":"Vellore","635809":"Vellore","635810":"Vellore","632209":"Vellore","635814":"Tirupathur","635811":"Tirupathur","635812":"Tirupathur","635813":"Vellore","635701":"Tirupathur","635801":"Tirupathur","635702":"Tirupathur","635754":"Tirupathur","635703":"Tiruvannamalai","635851":"Tirupathur","635901":"Tirupathur","635807":"Tirupathur","635710":"Tirupathur","635852":"Tirupathur","635752":"Tirupathur","635854":"Tirupathur","635651":"Tirupathur","635655":"Tirupathur","635602":"Tirupathur","635751":"Tirupathur","635653":"Tirupathur","635652":"Tirupathur","638657":"Tiruppur","638701":"Tiruppur","638661":"Tiruppur","638673":"Tiruppur","638702":"Tiruppur","638106":"Tiruppur","638108":"Tiruppur","641665":"Tiruppur","638111":"Tiruppur","641653":"Coimbatore","641103":"Coimbatore","641104":"Coimbatore","641659":"Coimbatore","641305":"Coimbatore","638459":"Erode","638401":"Erode","638460":"Tiruppur","641113":"Coimbatore","641302":"Coimbatore","641668":"Coimbatore","638461":"Erode","641654":"Tiruppur","641655":"Tiruppur","641603":"Tiruppur","641687":"Tiruppur","641658":"Tiruppur","641671":"Coimbatore","641662":"Tiruppur","641663":"Tiruppur","641664":"Tiruppur","641666":"Tiruppur","641669":"Coimbatore","641604":"Tiruppur","641602":"Tiruppur","641605":"Tiruppur","624005":"Dindigul","624703":"Dindigul","624705":"Dindigul","624711":"Dindigul","624706":"Dindigul","624003":"Dindigul","624401":"Dindigul","624620":"Dindigul","624622":"Dindigul","624402":"Dindigul","624304":"Dindigul","624403":"Dindigul","624306":"Dindigul","624709":"Dindigul","624802":"Dindigul","624710":"Dindigul","624308":"Dindigul","624201":"Dindigul","624202":"Dindigul","624103":"Dindigul","624101":"Dindigul","624206":"Dindigul","624212":"Dindigul","624215":"Dindigul","624708":"Dindigul","624216":"Dindigul","624219":"Dindigul","624220":"Dindigul","624612":"Dindigul","624613":"Dindigul","624614":"Dindigul","624615":"Dindigul","624616":"Dindigul","624617":"Dindigul","624618":"Dindigul","624619":"Dindigul","624621":"Dindigul","629204":"Kanniyakumari","629201":"Kanniyakumari","629851":"Kanniyakumari","629001":"Kanniyakumari","629251":"Kanniyakumari","629501":"Kanniyakumari","629702":"Kanniyakumari","629703":"Kanniyakumari","629252":"Kanniyakumari","629403":"Kanniyakumari","629802":"Kanniyakumari","629601":"Kanniyakumari","629704":"Kanniyakumari","629901":"Kanniyakumari","629302":"Kanniyakumari","629180":"Kanniyakumari","629152":"Kanniyakumari","629153":"Kanniyakumari","629101":"Kanniyakumari","629158":"Kanniyakumari","629160":"Kanniyakumari","629161":"Kanniyakumari","629163":"Kanniyakumari","629164":"Kanniyakumari","629166":"Kanniyakumari","629167":"Kanniyakumari","629168":"Kanniyakumari","629170":"Kanniyakumari","629171":"Kanniyakumari","631004":"Ranipet","631003":"Ranipet","631051":"Ranipet","632531":"Ranipet","631002":"Ranipet","631052":"Ranipet","604302":"Villupuram","632514":"Ranipet","631102":"Ranipet","631151":"Ranipet","632501":"Ranipet","632509":"Ranipet","632506":"Ranipet","632507":"Ranipet","632508":"Ranipet","632517":"Ranipet","632511":"Tiruvannamalai","632512":"Ranipet","632513":"Ranipet","603301":"Chengalpattu","603101":"Chengalpattu","603302":"Chengalpattu","603313":"Chengalpattu","603401":"Chengalpattu","603201":"Chengalpattu","603202":"Chengalpattu","603102":"Chengalpattu","603303":"Chengalpattu","603304":"Chengalpattu","603305":"Chengalpattu","603306":"Chengalpattu","603104":"Chengalpattu","603105":"Chengalpattu","603106":"Kanchipuram","603312":"Chengalpattu","603309":"Chengalpattu","603405":"Chengalpattu","603107":"Kanchipuram","603108":"Chengalpattu","603204":"Chengalpattu","603310":"Chengalpattu","603109":"Chengalpattu","603004":"Chengalpattu","603110":"Chengalpattu","603210":"Chengalpattu","604206":"Villupuram","603003":"Chengalpattu","631601":"Kanchipuram","631502":"Kanchipuram","631553":"Kanchipuram","631561":"Kanchipuram","603402":"Kanchipuram","631603":"Kanchipuram","603403":"Kanchipuram","631606":"Kanchipuram","602108":"Kanchipuram","602105":"Kanchipuram","631604":"Kanchipuram","603406":"Kanchipuram","631605":"Kanchipuram","631301":"Thiruvallur","631302":"Thiruvallur","602021":"Thiruvallur","631203":"Thiruvallur","631204":"Thiruvallur","631205":"Thiruvallur","602002":"Thiruvallur","631207":"Thiruvallur","601102":"Thiruvallur","602023":"Thiruvallur","631303":"Thiruvallur","602024":"Thiruvallur","602025":"Thiruvallur","631209":"Thiruvallur","631210":"Thiruvallur","602026":"Thiruvallur","601103":"Thiruvallur","605101":"Villupuram","605104":"Villupuram","605106":"Villupuram","605501":"Villupuram","605109":"Villupuram","607403":"Cuddalore","604151":"Villupuram","604201":"Villupuram","604301":"Villupuram","604202":"Villupuram","604210":"Villupuram","604102":"Villupuram","604304":"Villupuram","604303":"Villupuram","604204":"Villupuram","604203":"Villupuram","604306":"Villupuram","604307":"Villupuram","604305":"Villupuram","604153":"Villupuram","604208":"Villupuram","604207":"Villupuram","604154":"Villupuram","605201":"Villupuram","605403":"Villupuram","605203":"Villupuram","605402":"Villupuram","605103":"Villupuram","605651":"Villupuram","605108":"Villupuram","605502":"Villupuram","605652":"Villupuram","601201":"Thiruvallur","600019":"Thiruvallur","601206":"Thiruvallur","601202":"Thiruvallur","600103":"Thiruvallur","600053":"Thiruvallur","601203":"Thiruvallur","601205":"Thiruvallur","600052":"Thiruvallur","600067":"Thiruvallur","600069":"Kanchipuram","600095":"Thiruvallur","600072":"Thiruvallur","600124":"Thiruvallur","603112":"Chengalpattu","600127":"Chengalpattu","600048":"Chengalpattu","600132":"Kanchipuram","604401":"Tiruvannamalai","632316":"Tiruvannamalai","604501":"Tiruvannamalai","606903":"Tiruvannamalai","632319":"Vellore","632311":"Tiruvannamalai","604403":"Tiruvannamalai","632313":"Tiruvannamalai","632314":"Tiruvannamalai","604502":"Tiruvannamalai","606807":"Tiruvannamalai","632315":"Tiruvannamalai","604503":"Tiruvannamalai","632317":"Tiruvannamalai","604406":"Tiruvannamalai","604504":"Tiruvannamalai","604407":"Tiruvannamalai","604409":"Tiruvannamalai","604505":"Tiruvannamalai","604408":"Tiruvannamalai","604410":"Tiruvannamalai","606755":"Tiruvannamalai","606701":"Tiruvannamalai","606902":"Tiruvannamalai","606908":"Tiruvannamalai","606751":"Tiruvannamalai","606702":"Tiruvannamalai","606808":"Tiruvannamalai","604601":"Tiruvannamalai","606904":"Tiruvannamalai","606703":"Tiruvannamalai","606802":"Tiruvannamalai","606704":"Tiruvannamalai","606806":"Tiruvannamalai","606803":"Tiruvannamalai","606705":"Tiruvannamalai","606905":"Tiruvannamalai","606611":"Tiruvannamalai","606707":"Tiruvannamalai","606708":"Tiruvannamalai","606709":"Tiruvannamalai","606601":"Tiruvannamalai","606907":"Tiruvannamalai","606753":"Tiruvannamalai","606754":"Tiruvannamalai","632101":"Vellore","632102":"Tiruvannamalai","632202":"Vellore","632103":"Vellore","632106":"Vellore","632011":"Vellore","629177":"Kanniyakumari","630303":"Sivaganga","630302":"Sivaganga","630311":"Sivaganga","630312":"Sivaganga","630501":"Sivaganga","630106":"Sivaganga","630307":"Sivaganga","630207":"Sivaganga","630108":"Sivaganga","630309":"Sivaganga","630410":"Sivaganga","628902":"Tuticorin","627713":"Virudhunagar","628503":"Tuticorin","628714":"Tuticorin","628952":"Tuticorin","628908":"Tuticorin","628903":"Tuticorin","628502":"Tuticorin","628904":"Tuticorin","628716":"Tuticorin","628718":"Tuticorin","628905":"Tuticorin","627719":"Tenkasi","628720":"Tuticorin","628907":"Tuticorin","627951":"Tenkasi","627753":"Tenkasi","627754":"Tenkasi","627953":"Tenkasi","627755":"Tenkasi","627761":"Tenkasi","627855":"Tenkasi","627857":"Tenkasi","627757":"Tenkasi","627860":"Tenkasi","627862":"Tenkasi","627851":"Tenkasi","627803":"Tenkasi","627814":"Tenkasi","627853":"Tenkasi","627854":"Tenkasi","627808":"Tenkasi","627813":"Tenkasi","627859":"Tenkasi","627861":"Tenkasi","625501":"Madurai","625514":"Madurai","625016":"Madurai","625207":"Madurai","625214":"Madurai","625019":"Madurai","625503":"Madurai","625021":"Madurai","625221":"Madurai","625234":"Madurai","625218":"Madurai","625008":"Madurai","625703":"Madurai","625022":"Madurai","625702":"Madurai","625708":"Madurai","625704":"Madurai","625005":"Madurai","625706":"Madurai","625301":"Madurai","625017":"Madurai","625020":"Madurai","625102":"Madurai","625103":"Madurai","625009":"Madurai","625014":"Madurai","625104":"Madurai","625105":"Madurai","625201":"Madurai","625122":"Madurai","625110":"Madurai","625109":"Madurai","623601":"Ramanathapuram","623527":"Ramanathapuram","623701":"Ramanathapuram","623703":"Ramanathapuram","623603":"Ramanathapuram","623135":"Ramanathapuram","623604":"Ramanathapuram","623704":"Ramanathapuram","623705":"Ramanathapuram","623707":"Ramanathapuram","623608":"Ramanathapuram","623708":"Ramanathapuram","623120":"Ramanathapuram","623711":"Ramanathapuram","623402":"Ramanathapuram","623515":"Ramanathapuram","623516":"Ramanathapuram","623517":"Ramanathapuram","623403":"Ramanathapuram","623523":"Ramanathapuram","623537":"Ramanathapuram","623525":"Ramanathapuram","623526":"Ramanathapuram","623538":"Ramanathapuram","623528":"Ramanathapuram","623406":"Ramanathapuram","623532":"Ramanathapuram","623407":"Ramanathapuram","623533":"Ramanathapuram","623504":"Ramanathapuram","623315":"Ramanathapuram","630702":"Sivaganga","630551":"Sivaganga","630709":"Sivaganga","630609":"Sivaganga","630710":"Sivaganga","630411":"Sivaganga","630610":"Virudhunagar","630611":"Sivaganga","630305":"Sivaganga","630203":"Sivaganga","630204":"Sivaganga","630553":"Sivaganga","630555":"Sivaganga","630313":"Sivaganga","630562":"Sivaganga","630211":"Sivaganga","625552":"Theni","625515":"Theni","625520":"Theni","625540":"Theni","625528":"Theni","625582":"Theni","625530":"Theni","625512":"Theni","625602":"Theni","625527":"Madurai","625529":"Madurai","625536":"Theni","625605":"Theni","625531":"Theni","625532":"Madurai","625537":"Madurai","625535":"Madurai","627413":"Tenkasi","627414":"Tirunelveli","627415":"Tenkasi","627416":"Tirunelveli","627602":"Tirunelveli","627423":"Tenkasi","627426":"Tirunelveli","627351":"Tirunelveli","627102":"Tirunelveli","627651":"Tirunelveli","627652":"Tirunelveli","627501":"Tirunelveli","627133":"Tirunelveli","627106":"Tirunelveli","627355":"Tirunelveli","627152":"Tirunelveli","627108":"Tirunelveli","627502":"Tirunelveli","627109":"Tirunelveli","627114":"Tirunelveli","627657":"Tirunelveli","627116":"Tirunelveli","627117":"Tirunelveli","627352":"Tuticorin","627201":"Tirunelveli","627357":"Tirunelveli","627358":"Tirunelveli","627202":"Tirunelveli","628701":"Tuticorin","628801":"Tuticorin","628702":"Tuticorin","628616":"Tuticorin","628617":"Tuticorin","628619":"Tuticorin","628703":"Tuticorin","628751":"Tuticorin","628620":"Tuticorin","628621":"Tuticorin","628704":"Tuticorin","628809":"Tuticorin","628802":"Tuticorin","628622":"Tuticorin","628201":"Tuticorin","628151":"Tuticorin","628205":"Tuticorin","628207":"Tuticorin","628218":"Tuticorin","628210":"Tuticorin","628152":"Tuticorin","628219":"Tuticorin","628216":"Tuticorin","628851":"Tuticorin","628301":"Tuticorin","628002":"Tuticorin","628102":"Tuticorin","628251":"Tuticorin","628304":"Tuticorin","628252":"Tuticorin","626104":"Virudhunagar","626106":"Virudhunagar","626118":"Virudhunagar","626607":"Virudhunagar","626114":"Virudhunagar","626115":"Virudhunagar","626612":"Virudhunagar","626102":"Virudhunagar","626136":"Virudhunagar","626133":"Virudhunagar","626110":"Virudhunagar","626121":"Virudhunagar","626142":"Virudhunagar","626127":"Virudhunagar","626138":"Virudhunagar","626141":"Virudhunagar","626137":"Virudhunagar","626189":"Virudhunagar","626202":"Virudhunagar","626204":"Virudhunagar","626203":"Virudhunagar","626002":"Virudhunagar","608002":"Cuddalore","608501":"Cuddalore","608601":"Cuddalore","608301":"Cuddalore","608602":"Cuddalore","608102":"Cuddalore","608302":"Cuddalore","608303":"Cuddalore","607802":"Cuddalore","608201":"Cuddalore","608701":"Cuddalore","608502":"Cuddalore","608704":"Cuddalore","608304":"Cuddalore","608702":"Cuddalore","607101":"Cuddalore","607102":"Cuddalore","607003":"Cuddalore","607112":"Cuddalore","607301":"Cuddalore","607302":"Cuddalore","607104":"Cuddalore","607105":"Cuddalore","607108":"Cuddalore","607205":"Cuddalore","607401":"Cuddalore","607303":"Cuddalore","639201":"Karur","639202":"Tiruppur","639203":"Karur","639136":"Karur","639205":"Karur","639004":"Karur","639113":"Karur","639114":"Karur","639206":"Karur","639003":"Karur","639116":"Karur","639117":"Karur","639118":"Karur","621301":"Karur","621305":"Pudukkottai","639102":"Karur","639104":"Karur","639105":"Karur","621306":"Tiruchirappalli","621307":"Tiruchirappalli","639107":"Karur","639108":"Karur","621308":"Tiruchirappalli","639119":"Karur","621312":"Tiruchirappalli","621313":"Karur","621314":"Tiruchirappalli","639120":"Karur","621315":"Tiruchirappalli","612101":"Thanjavur","612702":"Thanjavur","609501":"Thiruvarur","612601":"Thiruvarur","612203":"Thanjavur","613703":"Thiruvarur","612001":"Thanjavur","612202":"Thanjavur","609802":"Thanjavur","612402":"Thanjavur","612603":"Thiruvarur","612604":"Thiruvarur","612605":"Thanjavur","612501":"Thanjavur","609806":"Mayiladuthurai","612503":"Thanjavur","612302":"Thanjavur","612504":"Thanjavur","612105":"Thanjavur","609301":"Mayiladuthurai","609304":"Mayiladuthurai","609403":"Thiruvarur","609202":"Mayiladuthurai","609404":"Mayiladuthurai","609003":"Mayiladuthurai","609306":"Mayiladuthurai","609203":"Mayiladuthurai","609405":"Thiruvarur","609307":"Mayiladuthurai","609503":"Thiruvarur","609308":"Mayiladuthurai","609309":"Mayiladuthurai","609118":"Mayiladuthurai","609312":"Mayiladuthurai","609101":"Mayiladuthurai","609104":"Mayiladuthurai","609105":"Mayiladuthurai","609106":"Mayiladuthurai","609107":"Mayiladuthurai","609108":"Mayiladuthurai","609109":"Mayiladuthurai","609111":"Mayiladuthurai","609310":"Mayiladuthurai","609113":"Mayiladuthurai","609115":"Mayiladuthurai","611102":"Nagapattinam","609608":"Thiruvarur","611105":"Nagapattinam","611106":"Nagapattinam","611002":"Nagapattinam","611108":"Nagapattinam","611109":"Nagapattinam","609702":"Nagapattinam","611111":"Nagapattinam","611112":"Nagapattinam","609701":"Nagapattinam","610102":"Thiruvarur","610101":"Thiruvarur","610104":"Thiruvarur","609502":"Thiruvarur","610105":"Thiruvarur","610203":"Nagapattinam","610001":"Thiruvarur","610207":"Nagapattinam","614615":"Thanjavur","614623":"Thanjavur","614902":"Thanjavur","614802":"Thanjavur","614903":"Thanjavur","614723":"Thanjavur","614904":"Thanjavur","614602":"Thanjavur","614625":"Thanjavur","614626":"Thanjavur","614612":"Thanjavur","614613":"Thanjavur","614628":"Thanjavur","614614":"Thanjavur","614707":"Nagapattinam","614806":"Nagapattinam","614716":"Thiruvarur","614703":"Thiruvarur","614808":"Nagapattinam","614704":"Thiruvarur","614711":"Nagapattinam","614714":"Nagapattinam","614712":"Nagapattinam","614715":"Thiruvarur","622301":"Pudukkottai","614616":"Pudukkottai","614801":"Pudukkottai","622201":"Pudukkottai","614630":"Pudukkottai","622501":"Pudukkottai","613301":"Pudukkottai","622302":"Pudukkottai","614624":"Pudukkottai","622502":"Pudukkottai","622202":"Pudukkottai","622503":"Pudukkottai","622401":"Pudukkottai","614619":"Pudukkottai","622402":"Pudukkottai","614620":"Pudukkottai","622403":"Sivaganga","622203":"Pudukkottai","622004":"Pudukkottai","622506":"Pudukkottai","614805":"Pudukkottai","622507":"Pudukkottai","614618":"Pudukkottai","622303":"Pudukkottai","622304":"Pudukkottai","622104":"Pudukkottai","621316":"Pudukkottai","622204":"Pudukkottai","621103":"Perambalur","621106":"Perambalur","621708":"Perambalur","621107":"Perambalur","621108":"Perambalur","621109":"Perambalur","621110":"Perambalur","621113":"Perambalur","621220":"Perambalur","621117":"Perambalur","621115":"Perambalur","621116":"Perambalur","621717":"Perambalur","621219":"Perambalur","621216":"Tiruchirappalli","621207":"Tiruchirappalli","621208":"Tiruchirappalli","621005":"Tiruchirappalli","621209":"Tiruchirappalli","621211":"Tiruchirappalli","621111":"Tiruchirappalli","621112":"Tiruchirappalli","621215":"Tiruchirappalli","621001":"Tiruchirappalli","621205":"Tiruchirappalli","621002":"Tiruchirappalli","621014":"Tiruchirappalli","621006":"Tiruchirappalli","621008":"Tiruchirappalli","621114":"Perambalur","621217":"Tiruchirappalli","621012":"Tiruchirappalli","614717":"Thiruvarur","614013":"Thiruvarur","614101":"Thiruvarur","614708":"Thiruvarur","614001":"Thiruvarur","614710":"Thiruvarur","614404":"Thiruvarur","614020":"Thiruvarur","614014":"Thiruvarur","614705":"Thiruvarur","612803":"Thiruvarur","614018":"Thiruvarur","610206":"Thiruvarur","614019":"Thiruvarur","614401":"Thanjavur","612701":"Thiruvarur","612802":"Thiruvarur","614203":"Thanjavur","614403":"Thiruvarur","614205":"Thanjavur","614206":"Thanjavur","614208":"Thiruvarur","614302":"Thanjavur","614303":"Thanjavur","612804":"Thiruvarur","613601":"Thanjavur","613602":"Thanjavur","613009":"Thanjavur","613101":"Thanjavur","613502":"Thanjavur","613504":"Thanjavur","613402":"Thanjavur","613004":"Thanjavur","613006":"Thanjavur","613204":"Thanjavur","613104":"Thanjavur","613003":"Thanjavur","621701":"Ariyalur","621801":"Ariyalur","621704":"Ariyalur","612901":"Ariyalur","621802":"Ariyalur","621653":"Tiruchirappalli","621651":"Tiruchirappalli","621803":"Ariyalur","621706":"Tiruchirappalli","621707":"Ariyalur","612902":"Ariyalur","621709":"Ariyalur","612903":"Ariyalur","621710":"Ariyalur","621711":"Tiruchirappalli","621712":"Tiruchirappalli","621713":"Perambalur","621714":"Ariyalur","621851":"Ariyalur","621715":"Ariyalur","621804":"Ariyalur","621218":"Tiruchirappalli","621805":"Ariyalur","621806":"Ariyalur","621722":"Tiruchirappalli","639101":"Tiruchirappalli","620012":"Tiruchirappalli","620010":"Tiruchirappalli","639103":"Karur","620011":"Tiruchirappalli","620016":"Tiruchirappalli","639112":"Tiruchirappalli","620102":"Tiruchirappalli","620013":"Tiruchirappalli","620007":"Tiruchirappalli","639115":"Tiruchirappalli","606305":"Kallakurichi","606201":"Kallakurichi","607202":"Kallakurichi","606102":"Kallakurichi","606213":"Kallakurichi","606208":"Kallakurichi","606301":"Kallakurichi","606204":"Kallakurichi","606401":"Kallakurichi","606206":"Kallakurichi","606107":"Kallakurichi","606207":"Kallakurichi","606209":"Kallakurichi","605751":"Kallakurichi","605701":"Villupuram","605754":"Kallakurichi","605755":"Villupuram","607107":"Villupuram","607209":"Villupuram","605766":"Kallakurichi","605803":"Villupuram","607204":"Kallakurichi","607203":"Villupuram","606003":"Cuddalore","606104":"Cuddalore","606109":"Cuddalore","606302":"Cuddalore","606111":"Cuddalore","606105":"Cuddalore","606106":"Cuddalore","606303":"Cuddalore","606304":"Cuddalore","631006":"Ranipet","632516":"Vellore","631005":"Ranipet","632318":"Ranipet","632521":"Ranipet","603211":"Chengalpattu","603001":"Chengalpattu","603314":"Chengalpattu","600005":"Chennai","600018":"Chennai","600006":"Chennai","600017":"Chennai","600034":"Chennai","600106":"Chennai","600031":"Chennai","600010":"Chennai","600082":"Chennai","600011":"Chennai","600039":"Chennai","600016":"Chennai","600115":"Chennai","600078":"Chennai","600097":"Chennai","600013":"Chennai","600081":"Chennai","600021":"Chennai","631501":"Kanchipuram","631206":"Thiruvallur","605202":"Villupuram","605602":"Villupuram","600058":"Chennai","600118":"Chennai","600099":"Chennai","600068":"Chennai","600050":"Chennai","600049":"Thiruvallur","600055":"Thiruvallur","600054":"Thiruvallur","600125":"Chennai","600062":"Thiruvallur","600064":"Chengalpattu","600126":"Chengalpattu","600043":"Chengalpattu","600073":"Chengalpattu","632301":"Tiruvannamalai","606901":"Tiruvannamalai","606603":"Tiruvannamalai","606804":"Tiruvannamalai","606811":"Tiruvannamalai","632010":"Vellore","632004":"Vellore","632006":"Vellore","632107":"Vellore","632001":"Vellore","632057":"Vellore","632012":"Vellore","632115":"Vellore","632002":"Vellore","632014":"Vellore","641112":"Coimbatore","641018":"Coimbatore","641045":"Coimbatore","641036":"Coimbatore","641004":"Coimbatore","641062":"Coimbatore","641024":"Coimbatore","641111":"Coimbatore","641051":"Coimbatore","641063":"Coimbatore","641046":"Coimbatore","641047":"Coimbatore","641026":"Coimbatore","641043":"Coimbatore","638011":"Erode","638001":"Erode","638005":"Erode","638054":"Erode","635102":"Krishnagiri","635109":"Krishnagiri","635114":"Krishnagiri","637402":"Namakkal","637405":"Namakkal","637001":"Namakkal","637215":"Namakkal","637107":"Salem","637303":"Salem","643218":"The Nilgiris","643203":"The Nilgiris","643006":"The Nilgiris","643215":"The Nilgiris","642133":"Coimbatore","641202":"Coimbatore","642102":"Tiruppur","642114":"Coimbatore","636102":"Salem","636109":"Salem","636003":"Salem","636103":"Salem","636008":"Salem","637504":"Salem","635806":"Vellore","638451":"Erode","641401":"Coimbatore","641670":"Tiruppur","641402":"Coimbatore","641667":"Tiruppur","624001":"Dindigul","624302":"Dindigul","624707":"Dindigul","624610":"Dindigul","624601":"Dindigul","629301":"Kanniyakumari","629162":"Kanniyakumari","629169":"Kanniyakumari","629174":"Kanniyakumari","629178":"Kanniyakumari","630101":"Sivaganga","630314":"Sivaganga","630003":"Sivaganga","630001":"Sivaganga","630206":"Sivaganga","630212":"Sivaganga","628906":"Tuticorin","627758":"Tenkasi","627812":"Tenkasi","625015":"Madurai","625101":"Madurai","625001":"Madurai","625002":"Madurai","623502":"Ramanathapuram","623522":"Ramanathapuram","623536":"Ramanathapuram","630602":"Sivaganga","630612":"Sivaganga","630561":"Sivaganga","630558":"Sivaganga","625522":"Theni","625525":"Theni","625533":"Theni","625203":"Theni","625579":"Theni","625523":"Theni","625604":"Theni","625562":"Theni","627421":"Tirunelveli","627452":"Tirunelveli","627427":"Tirunelveli","627111":"Tirunelveli","627002":"Tirunelveli","627012":"Tirunelveli","627005":"Tirunelveli","627007":"Tirunelveli","627009":"Tirunelveli","627003":"Tirunelveli","628615":"Tuticorin","628623":"Tuticorin","628211":"Tuticorin","628229":"Tuticorin","628203":"Tuticorin","628005":"Tuticorin","628006":"Tuticorin","628001":"Tuticorin","628003":"Tuticorin","626101":"Virudhunagar","626107":"Virudhunagar","626117":"Virudhunagar","626140":"Virudhunagar","626124":"Virudhunagar","626135":"Virudhunagar","626130":"Virudhunagar","626005":"Virudhunagar","626201":"Virudhunagar","626109":"Virudhunagar","626001":"Virudhunagar","608306":"Cuddalore","607803":"Cuddalore","608001":"Cuddalore","608305":"Cuddalore","607001":"Cuddalore","607106":"Cuddalore","607002":"Cuddalore","621311":"Karur","612401":"Thanjavur","612104":"Thanjavur","609801":"Mayiladuthurai","609808":"Mayiladuthurai","609204":"Mayiladuthurai","609001":"Mayiladuthurai","609102":"Mayiladuthurai","609205":"Mayiladuthurai","611104":"Nagapattinam","611001":"Nagapattinam","610201":"Thiruvarur","610204":"Nagapattinam","614804":"Thanjavur","614905":"Thanjavur","622504":"Pudukkottai","622001":"Pudukkottai","622407":"Pudukkottai","622005":"Pudukkottai","622411":"Pudukkottai","621133":"Perambalur","621212":"Perambalur","621119":"Perambalur","621204":"Tiruchirappalli","621105":"Tiruchirappalli","620005":"Tiruchirappalli","620006":"Tiruchirappalli","612801":"Thiruvarur","614017":"Thiruvarur","613201":"Thanjavur","613202":"Thanjavur","613001":"Thanjavur","613203":"Thanjavur","613007":"Thanjavur","621719":"Ariyalur","621652":"Tiruchirappalli","608901":"Ariyalur","620008":"Tiruchirappalli","620025":"Tiruchirappalli","620020":"Tiruchirappalli","620009":"Tiruchirappalli","620002":"Tiruchirappalli","620003":"Tiruchirappalli","607201":"Kallakurichi","605702":"Kallakurichi","606203":"Kallakurichi","606205":"Kallakurichi","605759":"Kallakurichi","606103":"Cuddalore","606110":"Cuddalore","602001":"Thiruvallur","641002":"Coimbatore","638301":"Erode","643101":"The Nilgiris","636001":"Salem","627756":"Tenkasi","627811":"Tenkasi","626123":"Virudhunagar","639001":"Karur","621010":"Tiruchirappalli","621601":"Tiruchirappalli","620001":"Tiruchirappalli","606001":"Cuddalore","607402":"Cuddalore","605111":"Villupuram","604101":"Villupuram","604205":"Villupuram","604152":"Villupuram","605301":"Villupuram","605102":"Villupuram","605601":"Villupuram","605107":"Villupuram","601204":"Thiruvallur","601101":"Thiruvallur","600122":"Kanchipuram","600077":"Thiruvallur","603103":"Chengalpattu","600130":"Chengalpattu","631701":"Tiruvannamalai","606801":"Tiruvannamalai","604404":"Tiruvannamalai","631702":"Tiruvannamalai","604405":"Tiruvannamalai","606752":"Tiruvannamalai","606710":"Tiruvannamalai","606604":"Tiruvannamalai","606906":"Tiruvannamalai","632055":"Vellore","632113":"Vellore","632007":"Vellore","632058":"Vellore","632105":"Vellore","641021":"Coimbatore","641032":"Coimbatore","641028":"Coimbatore","641019":"Coimbatore","641007":"Coimbatore","641020":"Coimbatore","641017":"Coimbatore","636806":"Dharmapuri","636907":"Dharmapuri","638752":"Tiruppur","638101":"Erode","638051":"Erode","638002":"Erode","638153":"Erode","638152":"Erode","638004":"Erode","635122":"Krishnagiri","635103":"Krishnagiri","635110":"Krishnagiri","635117":"Krishnagiri","637013":"Namakkal","637404":"Namakkal","637017":"Namakkal","637020":"Namakkal","637410":"Namakkal","643213":"The Nilgiris","643242":"The Nilgiris","643240":"The Nilgiris","643206":"The Nilgiris","643007":"The Nilgiris","643003":"The Nilgiris","643226":"The Nilgiris","642108":"Coimbatore","642004":"Coimbatore","642129":"Coimbatore","642206":"Tiruppur","636110":"Salem","636113":"Salem","636118":"Namakkal","636106":"Salem","636030":"Salem","636455":"Salem","637407":"Namakkal","637412":"Namakkal","636503":"Salem","635805":"Vellore","632203":"Vellore","632603":"Vellore","632502":"Ranipet","632505":"Ranipet","631101":"Ranipet","632520":"Vellore","632510":"Ranipet","632503":"Ranipet","632404":"Ranipet","632405":"Ranipet","632518":"Ranipet","632519":"Vellore","603002":"Chengalpattu","603308":"Chengalpattu","603111":"Chengalpattu","603311":"Chengalpattu","631551":"Kanchipuram","631552":"Kanchipuram","631202":"Thiruvallur","631208":"Thiruvallur","631213":"Thiruvallur","635853":"Tirupathur","638660":"Tiruppur","638105":"Tiruppur","638706":"Tiruppur","638703":"Tiruppur","641697":"Coimbatore","638402":"Erode","641607":"Tiruppur","641606":"Tiruppur","624801":"Dindigul","624002":"Dindigul","639005":"Karur","624307":"Dindigul","624204":"Dindigul","624704":"Dindigul","629701":"Kanniyakumari","629401":"Kanniyakumari","629852":"Kanniyakumari","629402":"Kanniyakumari","629202":"Kanniyakumari","629003":"Kanniyakumari","629154":"Kanniyakumari","629157":"Kanniyakumari","629193":"Kanniyakumari","629165":"Kanniyakumari","629175":"Kanniyakumari","630306":"Sivaganga","630103":"Sivaganga","630205":"Sivaganga","630405":"Sivaganga","630208":"Sivaganga","630502":"Sivaganga","628901":"Tuticorin","628722":"Tuticorin","628721":"Tuticorin","627760":"Tenkasi","628552":"Tuticorin","627764":"Tenkasi","627852":"Tenkasi","627751":"Tenkasi","627856":"Tenkasi","625205":"Madurai","625402":"Madurai","625018":"Madurai","625701":"Madurai","625003":"Madurai","625006":"Madurai","625707":"Madurai","625106":"Madurai","625107":"Madurai","625108":"Madurai","623401":"Ramanathapuram","623706":"Ramanathapuram","623115":"Ramanathapuram","623712":"Ramanathapuram","623512":"Ramanathapuram","623513":"Ramanathapuram","623514":"Ramanathapuram","623404":"Ramanathapuram","623524":"Ramanathapuram","623503":"Ramanathapuram","623529":"Ramanathapuram","623531":"Ramanathapuram","623409":"Ramanathapuram","623530":"Ramanathapuram","623534":"Ramanathapuram","630554":"Sivaganga","630559":"Sivaganga","630713":"Sivaganga","630408":"Sivaganga","630321":"Sivaganga","630566":"Sivaganga","630556":"Sivaganga","630552":"Sivaganga","630210":"Sivaganga","625521":"Theni","625524":"Theni","625526":"Theni","625705":"Madurai","625603":"Theni","625534":"Theni","627417":"Tirunelveli","627601":"Tirunelveli","627453":"Tirunelveli","627425":"Tirunelveli","627101":"Tirunelveli","627103":"Tirunelveli","627104":"Tirunelveli","627127":"Tirunelveli","627151":"Tirunelveli","627356":"Tirunelveli","627010":"Tirunelveli","627011":"Tirunelveli","627604":"Tirunelveli","627006":"Tirunelveli","628612":"Tuticorin","628613":"Tuticorin","628653":"Tuticorin","628008":"Tuticorin","628303":"Tuticorin","628401":"Tuticorin","628302":"Tuticorin","628402":"Tuticorin","628103":"Tuticorin","628105":"Tuticorin","626004":"Virudhunagar","626112":"Virudhunagar","626129":"Virudhunagar","626111":"Virudhunagar","626125":"Virudhunagar","626126":"Virudhunagar","626128":"Virudhunagar","626103":"Virudhunagar","626149":"Virudhunagar","626205":"Virudhunagar","607805":"Cuddalore","608703":"Cuddalore","608401":"Cuddalore","608801":"Cuddalore","607103":"Cuddalore","607005":"Cuddalore","607004":"Cuddalore","607109":"Cuddalore","639007":"Karur","639207":"Karur","639111":"Karur","639002":"Karur","639006":"Karur","621302":"Tiruchirappalli","639110":"Karur","621310":"Tiruchirappalli","612201":"Mayiladuthurai","612610":"Thiruvarur","612602":"Thanjavur","612703":"Thanjavur","613705":"Thiruvarur","612204":"Thanjavur","610107":"Thiruvarur","612106":"Thanjavur","609811":"Mayiladuthurai","612502":"Thanjavur","609807":"Thanjavur","609804":"Thanjavur","612102":"Thanjavur","609302":"Mayiladuthurai","609201":"Mayiladuthurai","609311":"Mayiladuthurai","609112":"Mayiladuthurai","609114":"Mayiladuthurai","609117":"Mayiladuthurai","609116":"Mayiladuthurai","611103":"Nagapattinam","609603":"Thiruvarur","609604":"Nagapattinam","611110":"Nagapattinam","609703":"Nagapattinam","611101":"Thiruvarur","613701":"Thiruvarur","610202":"Thiruvarur","610106":"Thiruvarur","609704":"Nagapattinam","610004":"Thiruvarur","614701":"Thanjavur","614901":"Thanjavur","614906":"Thanjavur","614803":"Thanjavur","614702":"Thiruvarur","614809":"Nagapattinam","622101":"Pudukkottai","622102":"Pudukkottai","622209":"Pudukkottai","622515":"Pudukkottai","614621":"Pudukkottai","622404":"Pudukkottai","622505":"Pudukkottai","622409":"Pudukkottai","614622":"Pudukkottai","622422":"Pudukkottai","622002":"Pudukkottai","621101":"Perambalur","621102":"Perambalur","621716":"Perambalur","621202":"Tiruchirappalli","621203":"Tiruchirappalli","621213":"Tiruchirappalli","621009":"Tiruchirappalli","621206":"Tiruchirappalli","621003":"Tiruchirappalli","621004":"Tiruchirappalli","621210":"Tiruchirappalli","621118":"Perambalur","621007":"Tiruchirappalli","621214":"Tiruchirappalli","621011":"Tiruchirappalli","614015":"Thanjavur","614016":"Thiruvarur","614202":"Thanjavur","614402":"Thanjavur","614204":"Thanjavur","612301":"Thanjavur","613303":"Thanjavur","613105":"Thanjavur","613102":"Thanjavur","613403":"Thanjavur","621702":"Tiruchirappalli","621703":"Tiruchirappalli","621730":"Ariyalur","621705":"Ariyalur","621718":"Ariyalur","612904":"Ariyalur","620021":"Tiruchirappalli","620015":"Tiruchirappalli","606115":"Kallakurichi","606402":"Kallakurichi","605752":"Villupuram","605801":"Kallakurichi","605756":"Villupuram","605758":"Villupuram","606108":"Cuddalore","607804":"Cuddalore","600002":"Chennai","631001":"Ranipet","632403":"Ranipet","600004":"Chennai","600014":"Chennai","600033":"Chennai","600040":"Chennai","600038":"Chennai","600036":"Chennai","600091":"Chennai","600096":"Chennai","600089":"Chennai","600042":"Chennai","600113":"Chennai","600001":"Chennai","602003":"Thiruvallur","605105":"Villupuram","600076":"Chennai","600060":"Chennai","600128":"Kanchipuram","600044":"Chengalpattu","600117":"Chengalpattu","600100":"Chengalpattu","601301":"Kanchipuram","600074":"Chengalpattu","600045":"Chengalpattu","600131":"Chengalpattu","632312":"Tiruvannamalai","632009":"Vellore","641014":"Coimbatore","641023":"Coimbatore","641009":"Coimbatore","641035":"Coimbatore","641044":"Coimbatore","641040":"Coimbatore","641039":"Coimbatore","638053":"Erode","638060":"Erode","638316":"Erode","635001":"Krishnagiri","635130":"Krishnagiri","637211":"Namakkal","643204":"The Nilgiris","643231":"The Nilgiris","643207":"The Nilgiris","643001":"The Nilgiris","643241":"The Nilgiris","642003":"Coimbatore","642128":"Tiruppur","636004":"Salem","636016":"Salem","636007":"Salem","636005":"Salem","636457":"Salem","641407":"Coimbatore","624701":"Dindigul","624301":"Dindigul","624210":"Dindigul","629203":"Kanniyakumari","629502":"Kanniyakumari","629602":"Kanniyakumari","629151":"Kanniyakumari","630105":"Sivaganga","630107":"Sivaganga","630201":"Sivaganga","630002":"Sivaganga","627804":"Tenkasi","627818":"Tenkasi","627807":"Tenkasi","627809":"Tenkasi","625012":"Madurai","625011":"Madurai","623605":"Ramanathapuram","604001":"Villupuram","641001":"Coimbatore","638656":"Tiruppur","627401":"Tirunelveli","628601":"Tuticorin","614713":"Thiruvarur","606202":"Kallakurichi","623308":"Ramanathapuram","630606":"Sivaganga","625516":"Theni","627428":"Tirunelveli","627603":"Tirunelveli","627120":"Tirunelveli","627110":"Tirunelveli","627112":"Tirunelveli","628614":"Tuticorin","628753":"Tuticorin","628212":"Tuticorin","628155":"Tuticorin","626139":"Virudhunagar","626116":"Virudhunagar","626119":"Virudhunagar","607801":"Cuddalore","607006":"Cuddalore","639109":"Karur","612103":"Thanjavur","609805":"Mayiladuthurai","609103":"Mayiladuthurai","613704":"Thiruvarur","614103":"Thiruvarur","613401":"Thanjavur","613205":"Thanjavur","621729":"Ariyalur","620024":"Tiruchirappalli","620018":"Tiruchirappalli","620022":"Tiruchirappalli","641008":"Coimbatore","641110":"Coimbatore","641029":"Coimbatore","641030":"Coimbatore","641025":"Coimbatore","636701":"Dharmapuri","636805":"Dharmapuri","636352":"Dharmapuri","638313":"Erode","638457":"Erode","635126":"Krishnagiri","637203":"Namakkal","643202":"The Nilgiris","643223":"The Nilgiris","643225":"The Nilgiris","642103":"Coimbatore","642104":"Coimbatore","642125":"Coimbatore","642204":"Tiruppur","642113":"Dindigul","642122":"Tiruppur","636204":"Salem","636301":"Namakkal","636454":"Salem","636403":"Salem","637408":"Namakkal","637505":"Namakkal","632201":"Vellore","632604":"Vellore","635654":"Tirupathur","641652":"Tiruppur","624702":"Dindigul","624303":"Dindigul","624211":"Dindigul","624712":"Dindigul","629809":"Kanniyakumari","629004":"Kanniyakumari","629803":"Kanniyakumari","629804":"Kanniyakumari","629173":"Kanniyakumari","632504":"Ranipet","603203":"Chengalpattu","603307":"Chengalpattu","602106":"Kanchipuram","631201":"Thiruvallur","631402":"Thiruvallur","631212":"Thiruvallur","631211":"Thiruvallur","631304":"Thiruvallur","605014":"Villupuram","605302":"Villupuram","600120":"Thiruvallur","600071":"Thiruvallur","604402":"Tiruvannamalai","606706":"Tiruvannamalai","606805":"Tiruvannamalai","632059":"Vellore","614706":"Thiruvarur","614810":"Nagapattinam","614617":"Pudukkottai","622103":"Pudukkottai","614629":"Pudukkottai","622003":"Pudukkottai","622412":"Pudukkottai","621104":"Perambalur","614210":"Thanjavur","613501":"Thanjavur","613005":"Thanjavur","613103":"Thanjavur","612905":"Ariyalur","620101":"Tiruchirappalli","605802":"Kallakurichi","629176":"Kanniyakumari","630202":"Sivaganga","628712":"Tuticorin","627806":"Tenkasi","623519":"Ramanathapuram","630557":"Sivaganga","625517":"Theni","627412":"Tenkasi","627418":"Tirunelveli","627353":"Tirunelveli","627107":"Tirunelveli","627113":"Tirunelveli","627115":"Tirunelveli","627118":"Tirunelveli","627008":"Tirunelveli","627359":"Tirunelveli","628618":"Tuticorin","628202":"Tuticorin","628206":"Tuticorin","628213":"Tuticorin","628104":"Tuticorin","626134":"Virudhunagar","626105":"Virudhunagar","626113":"Virudhunagar","626131":"Virudhunagar","626003":"Virudhunagar","639008":"Karur","609402":"Mayiladuthurai","610103":"Thiruvarur","610205":"Thiruvarur","610005":"Thiruvarur","600008":"Chennai","631152":"Ranipet","632401":"Ranipet","603127":"Chengalpattu","603209":"Chengalpattu","600107":"Chennai","600035":"Chennai","600084":"Chennai","600030":"Chennai","600088":"Chennai","600083":"Chennai","600025":"Chennai","600061":"Chennai","602117":"Kanchipuram","602118":"Kanchipuram","600051":"Chennai","600037":"Chennai","600110":"Thiruvallur","600056":"Thiruvallur","600133":"Thiruvallur","600075":"Chengalpattu","600063":"Chengalpattu","632326":"Tiruvannamalai","604411":"Tiruvannamalai","641049":"Coimbatore","641016":"Coimbatore","641015":"Coimbatore","641012":"Coimbatore","641003":"Coimbatore","641041":"Coimbatore","641011":"Coimbatore","641034":"Coimbatore","638102":"Erode","638003":"Erode","638012":"Erode","643201":"The Nilgiris","643103":"The Nilgiris","642126":"Tiruppur","636014":"Salem","636017":"Salem","636406":"Salem","636402":"Salem","636401":"Salem","636013":"Salem","638812":"Tiruppur","629155":"Kanniyakumari","629172":"Kanniyakumari","630102":"Sivaganga","628501":"Tuticorin","627802":"Tenkasi","625007":"Madurai","623566":"Ramanathapuram","623518":"Ramanathapuram","623806":"Ramanathapuram","625601":"Theni","627424":"Tenkasi","627354":"Tirunelveli","627119":"Tirunelveli","627001":"Tirunelveli","628656":"Tuticorin","628004":"Tuticorin","626108":"Virudhunagar","609314":"Mayiladuthurai","611003":"Nagapattinam","609504":"Nagapattinam","613010":"Thanjavur","620026":"Tiruchirappalli","620014":"Tiruchirappalli","620004":"Tiruchirappalli","620027":"Tiruchirappalli","605757":"Kallakurichi","638452":"Erode","641601":"Tiruppur","625513":"Theni","612002":"Thanjavur","609110":"Mayiladuthurai","636140":"Salem","624004":"Dindigul","629801":"Kanniyakumari","629002":"Kanniyakumari","629159":"Kanniyakumari","630104":"Sivaganga","627805":"Tenkasi","632515":"Vellore","603319":"Chengalpattu","605007":"Cuddalore","605110":"Cuddalore","600057":"Thiruvallur","600116":"Chennai","632114":"Vellore","641031":"Coimbatore","635306":"Krishnagiri","637204":"Namakkal","638181":"Namakkal","643236":"The Nilgiris","643220":"The Nilgiris","642111":"Tiruppur","628204":"Tuticorin","626132":"Virudhunagar","609303":"Mayiladuthurai","609313":"Mayiladuthurai","610003":"Thiruvarur","614211":"Thanjavur","613002":"Thanjavur","600003":"Chennai","632602":"Vellore","635601":"Tirupathur","641301":"Coimbatore","624208":"Dindigul","614601":"Thanjavur","632406":"Ranipet","600094":"Chennai","600093":"Chennai","600102":"Chennai","600023":"Chennai","600012":"Chennai","600041":"Chennai","600090":"Chennai","600020":"Chennai","600119":"Chennai","600009":"Chennai","600104":"Chennai","600066":"Chennai","600046":"Chengalpattu","600047":"Chengalpattu","632013":"Vellore","641042":"Coimbatore","641050":"Coimbatore","641037":"Coimbatore","641005":"Coimbatore","641013":"Coimbatore","641038":"Coimbatore","638006":"Namakkal","635124":"Krishnagiri","637415":"Namakkal","637216":"Namakkal","643105":"The Nilgiris","643233":"The Nilgiris","643243":"The Nilgiris","643270":"The Nilgiris","642132":"Tiruppur","636456":"Salem","635815":"Tirupathur","638672":"Tiruppur","629179":"Kanniyakumari","630301":"Sivaganga","630005":"Sivaganga","625023":"Madurai","623520":"Ramanathapuram","625518":"Theni","627451":"Tirunelveli","627105":"Tirunelveli","627654":"Tirunelveli","627004":"Tirunelveli","628217":"Tuticorin","628007":"Tuticorin","626122":"Virudhunagar","607807":"Cuddalore","607308":"Cuddalore","613702":"Thiruvarur","609810":"Mayiladuthurai","610109":"Thiruvarur","614738":"Thiruvarur","614201":"Thanjavur","614301":"Thanjavur","614207":"Thanjavur","621731":"Ariyalur","620019":"Tiruchirappalli","620017":"Tiruchirappalli","623521":"Ramanathapuram","600123":"Thiruvallur","600059":"Chengalpattu","641048":"Coimbatore","636812":"Krishnagiri","643205":"The Nilgiris","643239":"The Nilgiris","628208":"Tuticorin","628215":"Tuticorin","628101":"Tuticorin","612303":"Thanjavur","609401":"Mayiladuthurai","614807":"Nagapattinam","614102":"Thiruvarur","623501":"Ramanathapuram","600086":"Chennai","600028":"Chennai","600087":"Chennai","600024":"Chennai","600015":"Chennai","600026":"Chennai","600092":"Chennai","600101":"Chennai","600007":"Chennai","600032":"Chennai","600085":"Chennai","600022":"Chennai","605401":"Villupuram","600070":"Chengalpattu","600129":"Chengalpattu","632008":"Vellore","641033":"Coimbatore","641027":"Coimbatore","638010":"Namakkal","643253":"The Nilgiris","642006":"Coimbatore","636002":"Salem","629810":"Kanniyakumari","629156":"Kanniyakumari","629102":"Kanniyakumari","627759":"Tenkasi","627858":"Tenkasi","625004":"Madurai","625556":"Theni","627420":"Tirunelveli","627422":"Tirunelveli","628752":"Tuticorin","628209":"Tuticorin","626161":"Virudhunagar","626188":"Virudhunagar","609803":"Mayiladuthurai","609305":"Mayiladuthurai","613503":"Thanjavur","613008":"Thanjavur","620023":"Tiruchirappalli"};
  function loadTnPins(cb) { cb(_tnPins); }

  function waPinCheck() {
    var pin = ((document.getElementById('waAddrPin') || {}).value || '').replace(/\D/g, '');
    var statusEl  = document.getElementById('waPinStatus');
    var fieldsEl  = document.getElementById('waAddrFormFields');
    var submitBtn = document.querySelector('#waAddrPanel .wa-addr-submit');
    if (!statusEl) return;
    if (pin.length < 6) {
      statusEl.className = 'wa-pin-status';
      statusEl.innerHTML = '';
      var distEl0 = document.getElementById('waAddrDistrict');
      if (distEl0) distEl0.value = '';
      if (fieldsEl)  fieldsEl.style.display  = 'none';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }
    statusEl.className = 'wa-pin-status wa-pin-loading';
    statusEl.innerHTML = '&#9203; Checking pincode...';
    loadTnPins(function(pins) {
      var district = pins[pin];
      var districtEl = document.getElementById('waAddrDistrict');
      if (district) {
        statusEl.className = 'wa-pin-status wa-pin-ok';
        statusEl.innerHTML = '&#10003; ' + district + ', Tamil Nadu &mdash; Delivery available!';
        if (districtEl) districtEl.value = district;
        if (fieldsEl)  fieldsEl.style.display  = '';
        if (submitBtn) submitBtn.disabled = false;
      } else {
        statusEl.className = 'wa-pin-status wa-pin-err';
        statusEl.innerHTML = '&#10007; Sorry, we currently deliver only within Tamil Nadu. Please enter a Tamil Nadu pincode.';
        if (districtEl) districtEl.value = '';
        if (fieldsEl)  fieldsEl.style.display  = 'none';
        if (submitBtn) submitBtn.disabled = true;
      }
    });
  }

  function showAddressForm() {
    // Populate order mini-summary
    var mini = document.getElementById('waAddrOrderMini');
    if (mini) {
      var lines = orderCart.map(function(i){ return i.emoji + ' ' + i.label + ' ' + i.size + (i.qty > 1 ? ' × ' + i.qty : '') + ' — ' + inr(i.price); });
      var total = orderCart.reduce(function(s,i){ return s + i.price; }, 0);
      mini.innerHTML = '<strong>Your order:</strong><br>' + lines.join('<br>') + '<br><strong>Total: ' + inr(total) + ' + free delivery</strong>';
    }
    // Pre-fill saved values if returning user
    var pre = deliveryInfo || {};
    var pinEl = document.getElementById('waAddrPin');
    if (pinEl) pinEl.value = pre.pincode || '';
    var other = [
      ['waAddrName',  pre.name    || ''],
      ['waAddrPhone', pre.phone   || ''],
      ['waAddrAddr',  pre.address || ''],
      ['waAddrDistrict', pre.district || pre.city || '']
    ];
    other.forEach(function(f) { var el = document.getElementById(f[0]); if (el) el.value = f[1]; });
    var err = document.getElementById('waAddrErr');
    if (err) err.style.display = 'none';
    // Reset pin status & gate, then re-validate if pin already filled
    var statusEl = document.getElementById('waPinStatus');
    var fieldsEl = document.getElementById('waAddrFormFields');
    var submitBtn = document.querySelector('#waAddrPanel .wa-addr-submit');
    if (statusEl) { statusEl.className = 'wa-pin-status'; statusEl.innerHTML = ''; }
    if (fieldsEl) fieldsEl.style.display = pre.pincode ? '' : 'none';
    if (submitBtn) submitBtn.disabled = !pre.pincode;
    // Kick off pin validation if we have a saved pincode
    if (pre.pincode) {
      loadTnPins(function(pins) {
        var district = pins[pre.pincode];
        var districtEl2 = document.getElementById('waAddrDistrict');
        if (statusEl) {
          if (district) {
            statusEl.className = 'wa-pin-status wa-pin-ok';
            statusEl.innerHTML = '&#10003; ' + district + ', Tamil Nadu &mdash; Delivery available!';
            if (districtEl2) districtEl2.value = district;
            if (submitBtn) submitBtn.disabled = false;
          } else {
            statusEl.className = 'wa-pin-status wa-pin-err';
            statusEl.innerHTML = '&#10007; Saved pincode is outside Tamil Nadu. Please update.';
            if (fieldsEl) fieldsEl.style.display = 'none';
            if (submitBtn) submitBtn.disabled = true;
          }
        }
      });
    }
    // Preload pin data in background so first-time check is instant
    else { loadTnPins(function(){}); }
    // Slide panel in
    var panel = document.getElementById('waAddrPanel');
    if (panel) setTimeout(function(){ panel.classList.add('wa-addr-open'); }, 20);
    setChips([]);
  }

  function waSubmitAddress() {
    var name  = ((document.getElementById('waAddrName')  || {}).value || '').trim();
    var phone = ((document.getElementById('waAddrPhone') || {}).value || '').trim();
    var addr  = ((document.getElementById('waAddrAddr')  || {}).value || '').trim();
    var pin   = ((document.getElementById('waAddrPin')   || {}).value || '').trim();
    var district = ((document.getElementById('waAddrDistrict') || {}).value || '').trim();
    var err   = document.getElementById('waAddrErr');
    var phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\s/g,''));
    var pinOk   = /^\d{6}$/.test(pin);
    var tnOk    = !!(_tnPins && _tnPins[pin]);
    if (!name || !phoneOk || !addr || !pinOk || !tnOk) {
      if (err) {
        err.textContent = !name ? 'Please enter your full name.' :
                          !phoneOk ? 'Enter a valid 10-digit mobile number.' :
                          !addr ? 'Please enter your delivery address.' :
                          (!pinOk ? 'Enter a valid 6-digit pincode.' :
                          'Sorry, we only deliver within Tamil Nadu.');
        err.style.display = 'block';
      }
      return;
    }
    deliveryInfo = { name: name, phone: phone, address: addr, pincode: pin, city: district, district: district };
    saveDelivery();
    // Slide panel out
    var panel = document.getElementById('waAddrPanel');
    if (panel) panel.classList.remove('wa-addr-open');
    // Confirmation bubble
    addMsg('user', '📍 ' + name + ', ' + addr + ', ' + district + ' (' + pin + ')  |  📞 ' + phone);
    setChips([]); showTyping();
    setTimeout(function() {
      hideTyping();
      // Build order summary confirmation message
      var total = orderCart.reduce(function(s, i) { return s + i.price; }, 0);
      var cartLines = orderCart.map(function(i) {
        return '&bull; ' + i.label + ' ' + i.size + (i.qty > 1 ? ' &times; ' + i.qty : '') + ' &mdash; &#8377;' + i.price.toLocaleString('en-IN');
      }).join('<br>');
      var confirmHtml =
        '<strong>✅ Order Summary</strong><br><br>' +
        cartLines + '<br><br>' +
        '<strong>Total: &#8377;' + total.toLocaleString('en-IN') + '</strong> &nbsp;<span style="font-size:11px;opacity:0.75;">(Free delivery)</span><br><br>' +
        '📍 <strong>' + name + '</strong><br>' +
        addr + ', ' + district + ' ' + pin + '<br>' +
        '📞 ' + phone + '<br><br>' +
        '<span style="background:#fff8e1;padding:4px 8px;border-radius:5px;font-size:12px;color:#78350f;">⚠️ Tap <strong>Confirm on WhatsApp</strong> below to discuss pricing &amp; finalise your order.</span>';
      addMsg('bot', confirmHtml);

      // ── Submit order to Google Sheets on "Place My Order" click ──
      // (No honeypot check here — user passed form validation, they're real.)
      try {
        var _total = orderCart.reduce(function(s, i) { return s + i.price; }, 0);
        var _orderLines = orderCart.map(function(i) {
          return i.label + ' ' + i.size + (i.qty > 1 ? ' \u00d7 ' + i.qty : '') + ' \u2014 \u20b9' + i.price.toLocaleString('en-IN');
        }).join('\n');
        var _addrFull = addr + (district ? ', ' + district : '') + ' ' + pin;
        var _ENDPOINT = 'https://script.google.com/macros/s/AKfycbyVXRfITudWEyii7rQxbNakPJ-TmK3Tq-0-RGjoqcHtjKTRNEXEJ_Xn-fUQ199VKJsE3w/exec';
        var _fd = new URLSearchParams();
        _fd.append('name',    name);
        _fd.append('phone',   phone);
        _fd.append('address', _addrFull);
        _fd.append('pincode', pin);
        _fd.append('items',   _orderLines + '\n\nTotal: \u20b9' + _total.toLocaleString('en-IN'));
        _fd.append('total',   String(_total));
        _fd.append('source',  'chat');
        _fd.append('url_confirm', ''); // honeypot — always blank for real users
        fetch(_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: _fd.toString() }).catch(function(){});
      } catch(gsErr) {}

      setChips(['📲 Confirm on WhatsApp', '✏️ Edit Details', '🗑️ Start over']);
      updateWaBtn();
    }, 750);
  }

  // ── Refresh guard functions ──────────────────────────────────────────
  function showRefreshModal() {
    var modal  = document.getElementById('waRefreshModal');
    var badge  = document.getElementById('waRmBadge');
    var items  = document.getElementById('waRmItems');
    var title  = document.getElementById('waRmTitle');
    var body   = document.getElementById('waRmBody');
    if (!modal) return;
    var pageCart = [];
    try {
      var saved = localStorage.getItem('arumeeCart');
      if (saved) {
        var arr = JSON.parse(saved);
        if (Array.isArray(arr)) pageCart = arr;
      }
    } catch(e) {}
    // Avoid duplicating chat items (chat lines are mirrored into arumeeCart with fromChat=true)
    try { pageCart = pageCart.filter(function(i){ return !(i && i.fromChat); }); } catch(e) {}
    var chatCart = _readJsonArray('arumee_cart');
    var lineCount = (pageCart.length || 0) + (chatCart.length || 0);
    var totalUnits = 0;
    try {
      totalUnits += pageCart.reduce(function(s, i){
        var q = (i && i.qty != null) ? Number(i.qty) : 1;
        return s + ((Number.isFinite(q) && q > 0) ? q : 1);
      }, 0);
    } catch(e) {}
    try {
      totalUnits += chatCart.reduce(function(s, i){
        var q = (i && i.qty != null) ? Number(i.qty) : 1;
        return s + ((Number.isFinite(q) && q > 0) ? q : 1);
      }, 0);
    } catch(e) {}
    if (badge) badge.textContent = String(totalUnits);

    if (title) title.textContent = 'You Refreshed the Page';
    if (body)  body.innerHTML = 'Your cart is still saved \u2014 don\u2019t worry!<br>Do you want to keep it or clear everything?';
    var cancelBtn = modal.querySelector('.wa-rm-cancel');
    var proceedBtn = modal.querySelector('.wa-rm-proceed');
    if (cancelBtn)  cancelBtn.innerHTML = '\uD83D\uDED2\u00A0 Keep My Cart';
    if (proceedBtn) proceedBtn.innerHTML = '\uD83D\uDDD1\uFE0F\u00A0 Clear &amp; Start Fresh';

    if (items) {
      if (lineCount > 0) {
        var html = '';
        var total = 0;

        if (pageCart.length) {
          html += '<div style="font-weight:800; margin: 2px 0 6px;">Page Cart</div>';
          html += pageCart.map(function(i) {
            var name = (i && (i.productName || i.originalName || i.name)) ? String(i.productName || i.originalName || i.name) : 'Item';
            var qty = (i && i.qty != null) ? Number(i.qty) : 1;
            qty = (Number.isFinite(qty) && qty > 0) ? qty : 1;
            var price = (i && i.price != null) ? Number(i.price) : 0;
            price = (Number.isFinite(price) && price >= 0) ? price : 0;
            var lineTotal = (i && i.total != null) ? Number(i.total) : (price * qty);
            lineTotal = (Number.isFinite(lineTotal) && lineTotal >= 0) ? lineTotal : (price * qty);
            total += lineTotal;
            return '<span>' + escapeHtml(name) + ' &times; ' + qty + ' &mdash; ' + inr(lineTotal) + '</span>';
          }).join('');
        }

        if (chatCart.length) {
          html += (pageCart.length ? '<div style="height:8px"></div>' : '');
          html += '<div style="font-weight:800; margin: 2px 0 6px;">Chat Order</div>';
          html += chatCart.map(function(i) {
            var emoji = (i && i.emoji) ? i.emoji : '🛒';
            var label = (i && i.label) ? i.label : 'Item';
            var size  = (i && i.size)  ? i.size  : '';
            var qty2  = (i && i.qty != null) ? Number(i.qty) : 1;
            qty2 = (Number.isFinite(qty2) && qty2 > 0) ? qty2 : 1;
            var line2 = (i && i.price != null) ? Number(i.price) : 0;
            line2 = (Number.isFinite(line2) && line2 >= 0) ? line2 : 0;
            total += line2;
            return '<span>' + escapeHtml(emoji + ' ' + label + (size ? (' ' + size) : '')) + ' &times; ' + qty2 + ' &mdash; ' + inr(line2) + '</span>';
          }).join('');
        }

        items.innerHTML = html + '<div class="wa-rm-total">Total: ' + inr(total) + '</div>';
        items.style.display = '';
      } else {
        items.style.display = 'none';
      }
    }
    modal.classList.add('wa-rm-visible');
    var btn = modal.querySelector('.wa-rm-cancel');
    if (btn) setTimeout(function(){ btn.focus(); }, 60);
  }
  function hideRefreshModal() {
    var modal = document.getElementById('waRefreshModal');
    if (modal) modal.classList.remove('wa-rm-visible');
  }
  function confirmRefreshAction() {
    clearStorage();
    try { localStorage.removeItem('arumeeCart'); } catch(e) {}
    history = []; orderCart = []; pendingOil = null; pendingSize = null; deliveryInfo = null;
    updateWaBtn();
    window.name = '';  // clear so next fresh open won't trigger modal
    location.reload();
  }

  function closeAddressPanel() {
    var panel = document.getElementById('waAddrPanel');
    if (panel) panel.classList.remove('wa-addr-open');
    setChips(['➕ Add another oil', '📦 Send my order', '🗑️ Start over']);
  }

  function clearChat() {
    history = []; orderCart = []; pendingOil = null; pendingSize = null; deliveryInfo = null;
    clearStorage();
    // Close address panel if open
    var addrPanel = document.getElementById('waAddrPanel');
    if (addrPanel) addrPanel.classList.remove('wa-addr-open');
    var msgs = document.getElementById('waMsgs');
    if (msgs) {
      var nodes = msgs.querySelectorAll('.wa-msg');
      nodes.forEach(function(n) { n.remove(); });
    }
    setChips([]);
    updateWaBtn();
    setTimeout(function() { botReply(KB.greeting); }, 350);
  }

  function pick(label) {
    if (label === '📞 Chat on WhatsApp') { waContinue(); return; }
    if (label === '📲 Confirm on WhatsApp') { addMsg('user', label); setChips([]); waContinue(); return; }
    if (label === '✏️ Edit Details') {
      addMsg('user', label); setChips([]);
      deliveryInfo = null;
      saveDelivery();
      showAddressForm();
      return;
    }

    if (label === '🛍️ Order Now') {
      addMsg('user', label); setChips([]);
      botReply({ text: 'Let\'s build your order 🛍️\nSelect an oil to get started:', chips: ['🥥 Coconut Oil', '🥜 Groundnut Oil', '🌿 Gingelly Oil', '↩️ Back to menu'] });
      return;
    }
    if (OILS[label]) {
      pendingOil = label;
      addMsg('user', label); setChips([]);
      var sChips = Object.keys(OILS[label].sizes).map(function (s) { return s + ' – ' + inr(OILS[label].sizes[s]); });
      sChips.push('↩️ Choose different oil');
      botReply({ text: 'Choose a size for ' + label + ':', chips: sChips });
      return;
    }
    if (pendingOil && /^[0-9]+L\s*–/.test(label)) {
      var parts     = label.split('–');
      var size      = parts[0].trim();
      var priceEach = parseInt(parts[1].replace(/[^0-9]/g, ''), 10);
      pendingSize   = { size: size, priceEach: priceEach };
      addMsg('user', label); setChips([]);
      botReply({
        text: 'How many *' + size + '* bottles of ' + pendingOil + ' would you like?\n(Each bottle: ' + inr(priceEach) + ')',
        chips: ['1 bottle', '2 bottles', '3 bottles', '4 bottles', '5 bottles', '↩️ Choose different oil']
      });
      return;
    }
    if (pendingOil && pendingSize && /^\d+ bottles?$/.test(label)) {
      var qty        = parseInt(label, 10);
      var linePrice  = qty * pendingSize.priceEach;
      orderCart.push({ emoji: pendingOil.split(' ')[0], label: OILS[pendingOil].label, size: pendingSize.size, qty: qty, price: linePrice });
      try { syncChatLineToPageCart(OILS[pendingOil].label, pendingSize.size, pendingSize.priceEach, qty); } catch(e) {}
      saveCart();
      pendingOil = null; pendingSize = null;
      addMsg('user', label); setChips([]);
      var cartLines = orderCart.map(function (i) {
        return '  ' + i.emoji + ' ' + i.label + ' ' + i.size + (i.qty > 1 ? ' × ' + i.qty : '') + ' — ' + inr(i.price);
      }).join('\n');
      var total = orderCart.reduce(function (s, i) { return s + i.price; }, 0);
      botReply({
        text: '✅ Added!\n\n🛒 Your cart:\n' + cartLines + '\n\n  Total: ' + inr(total) + ' + free delivery\n\nAdd more oils or send your order?',
        chips: ['➕ Add another oil', '📦 Send my order', '🗑️ Start over']
      });
      setTimeout(updateWaBtn, 900);
      return;
    }
    if (label === '➕ Add another oil' || label === '↩️ Choose different oil') {
      pendingOil = null; pendingSize = null;
      addMsg('user', label); setChips([]);
      botReply({ text: 'Which oil would you like to add?', chips: ['🥥 Coconut Oil', '🥜 Groundnut Oil', '🌿 Gingelly Oil', '↩️ Back to menu'] });
      return;
    }
    if (label === '📦 Send my order') {
      addMsg('user', label); setChips([]);
      if (!orderCart.length) {
        botReply({ text: 'Your cart is empty. Lets add an oil first!', chips: ['🥥 Coconut Oil', '🥜 Groundnut Oil', '🌿 Gingelly Oil'] });
        return;
      }
      var cartLines2 = orderCart.map(function (i) { return '  ' + i.emoji + ' ' + i.label + ' ' + i.size + (i.qty > 1 ? ' × ' + i.qty : '') + ' — ' + inr(i.price); }).join('\n');
      var total2 = orderCart.reduce(function (s, i) { return s + i.price; }, 0);
      setChips([]); showTyping();
      setTimeout(function() {
        hideTyping();
        addMsg('bot', '📦 Order summary:\n\n' + cartLines2 + '\n\n  Total: ' + inr(total2) + ' + free delivery');
        setTimeout(showAddressForm, 400);
      }, 750);
      return;
    }
    if (label === '🗑️ Start over') {
      orderCart = []; pendingOil = null; clearStorage();
      addMsg('user', label); setChips([]);
      botReply(KB.greeting);
      setTimeout(updateWaBtn, 900);
      return;
    }
    if (label === '↩️ Back to menu') {
      addMsg('user', label); setChips([]);
      botReply(KB.greeting);
      return;
    }

    addMsg('user', label);
    setChips([]);
    var entry = KB[label];
    botReply(entry || {
      text: 'I do not have a specific answer for that. Our team can help right away!',
      chips: ['📞 Chat on WhatsApp', '🛍️ Order Now', '💰 Prices & sizes']
    });
  }

  function waContinue() {
    var nowTs = Date.now();
    var lastSubmit = 0;
    try { lastSubmit = parseInt(localStorage.getItem('arumee_chat_submit_ts') || '0', 10) || 0; } catch(e) {}
    if (lastSubmit && (nowTs - lastSubmit) < 30000) {
      // Clear the throttle so re-attempts always go through (order placed in same session)
      try { localStorage.removeItem('arumee_chat_submit_ts'); } catch(e) {}
    }
    // If cart has items but delivery info not yet collected, show address panel first
    if (orderCart.length && !deliveryInfo) {
      showAddressForm();
      return;
    }
    var msg;
    if (orderCart.length) {
      // Honeypot bot check — silently abort if the hidden field was filled
      if (isHoneypotTripped()) { return; }
      var total = orderCart.reduce(function (s, i) { return s + i.price; }, 0);
      msg = 'Hi Arumee! I would like to place this order:\n\n';
      orderCart.forEach(function (i) { msg += '• ' + i.label + ' ' + i.size + (i.qty > 1 ? ' × ' + i.qty : '') + ' — ₹' + i.price.toLocaleString('en-IN') + '\n'; });
      msg += '\nTotal: \u20b9' + total.toLocaleString('en-IN') + ' (free delivery included)';
      if (deliveryInfo) {
        msg += '\n\n\uD83D\uDCCD Delivery Details:\n';
        msg += 'Name: ' + deliveryInfo.name + '\n';
        msg += 'Phone: ' + deliveryInfo.phone + '\n';
        msg += 'Address: ' + deliveryInfo.address + '\n';
        msg += 'City: ' + (deliveryInfo.city || '') + '\n';
        msg += 'Pincode: ' + deliveryInfo.pincode;
      }
      msg += '\n\nKindly confirm and share UPI payment details. Thank you!';

      // Google Sheets submission already done in waSubmitAddress() on first "Place My Order" click.
      // waContinue() only opens WhatsApp so the customer can discuss pricing & confirm.
    } else {
      var userMsgs = history.filter(function (m) { return m.role === 'user'; });
      if (userMsgs.length) {
        msg = 'Hi Arumee! I had some questions via your website chat:\n\n';
        userMsgs.forEach(function (m) { msg += '• ' + m.text + '\n'; });
        msg += '\nCan you help me continue from here?';
      } else {
        msg = 'Hi! I would like to know more about Arumee oils and place an order.';
      }
    }
    window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');

  }

  function acceptDisclaimer() {
    disclaimerAccepted = true;
    try { localStorage.setItem('arumee_disclaimer', '1'); } catch(e) {}
    var d = document.getElementById('waDisclaimerPanel');
    if (d) {
      d.classList.add('wa-disc-hiding');
      setTimeout(function() { d.style.display = 'none'; }, 300);
    }
    // Now start the chat
    setTimeout(function() {
      hydrateChatFromStorage();
    }, 320);
  }

  function declineDisclaimer() {
    waToggle();
  }

  function waToggle() {
    var panel = document.getElementById('waChatPanel');
    var widget = document.getElementById('waWidget');
    var trigger = document.getElementById('waChatTrigger');
    var dot = document.getElementById('waUnreadDot');
    if (!panel) return;
    var opening = !panel.classList.contains('wa-open');
    panel.classList.toggle('wa-open');
    if (widget) widget.classList.toggle('wa-active', opening);
    if (trigger) trigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if (document.body) document.body.classList.toggle('wa-chat-open', opening);
    if (opening) {
      if (dot) dot.classList.remove('show');
      // Only start chat if disclaimer has been accepted
      if (!disclaimerAccepted) return;
      hydrateChatFromStorage();
    }
  }

  function waCloseChat() {
    var panel = document.getElementById('waChatPanel');
    var widget = document.getElementById('waWidget');
    var trigger = document.getElementById('waChatTrigger');

    if (IS_FULL_CHAT) {
      try { window.close(); } catch(e) {}
      setTimeout(function(){
        try {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = 'index.html';
          }
        } catch(e2) {}
      }, 80);
      return;
    }

    if (panel) panel.classList.remove('wa-open');
    if (widget) widget.classList.remove('wa-active');
    if (document.body) document.body.classList.remove('wa-chat-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  // Close on outside click
  document.addEventListener('click', function (e) {
    var panel = document.getElementById('waChatPanel');
    var widget = document.getElementById('waWidget');
    if (!panel || !panel.classList.contains('wa-open')) return;
    if (widget && widget.contains(e.target)) return;
    panel.classList.remove('wa-open');
    if (widget) widget.classList.remove('wa-active');
    if (document.body) document.body.classList.remove('wa-chat-open');
    var trigger = document.getElementById('waChatTrigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var panel = document.getElementById('waChatPanel');
    var widget = document.getElementById('waWidget');
    var trigger = document.getElementById('waChatTrigger');
    if (panel && panel.classList.contains('wa-open')) {
      panel.classList.remove('wa-open');
      if (widget) widget.classList.remove('wa-active');
      if (document.body) document.body.classList.remove('wa-chat-open');
      if (trigger) { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
    }
  });

  // Show red dot after 3s if panel not yet opened
  setTimeout(function () {
    var panel = document.getElementById('waChatPanel');
    var dot = document.getElementById('waUnreadDot');
    if (dot && panel && !panel.classList.contains('wa-open')) dot.classList.add('show');
  }, 3000);

  window.waToggle = waToggle;
  window.waCloseChat = waCloseChat;
  window.waContinue = waContinue;
  window.clearChat = clearChat;
  window.waSubmitAddress = waSubmitAddress;
  window.closeAddressPanel = closeAddressPanel;
  window.acceptDisclaimer = acceptDisclaimer;
  window.declineDisclaimer = declineDisclaimer;
  window.waPinCheck = waPinCheck;
  window.waSendText = waSendText;
  window.openFullChat = openFullChat;
  window.waHideRefreshModal  = hideRefreshModal;
  window.waConfirmRefresh    = confirmRefreshAction;

  try {
    window.addEventListener('arumee-cart-updated', syncFromStorageOnExternalCartUpdate);
  } catch(e) {}

  try {
    var _textInput = document.getElementById('waTextInput');
    if (_textInput) {
      _textInput.addEventListener('keydown', function(e){
        if (e.key === 'Enter') {
          e.preventDefault();
          waSendText();
        }
      });
    }
  } catch(e) {}

  // ── On-load init: call AFTER all functions are defined ────────────────────
  // Fix cart-count=0 after refresh: update the WA button to reflect loaded cart
  initFullPageMode();
  updateWaBtn();

  // Detect true page refresh only (F5 / refresh button).
  // IMPORTANT: window.name persists across normal navigation too, so we
  // combine it with Navigation Timing API and a last-URL fallback.
  (function() {
    var TAB = 'arumee_session';
    var curUrl = String(location.href || '');

    // Determine whether any cart has items
    var hasPageCart = false;
    try {
      var saved = localStorage.getItem('arumeeCart');
      if (saved) {
        var arr = JSON.parse(saved);
        hasPageCart = Array.isArray(arr) && arr.length > 0;
      }
    } catch(e) {}
    var hasChatCart = false;
    try {
      var savedChat = localStorage.getItem('arumee_cart');
      if (savedChat) {
        var chatArr = JSON.parse(savedChat);
        hasChatCart = Array.isArray(chatArr) && chatArr.length > 0;
      }
    } catch(e) {}
    var hasAnyCart  = hasPageCart || hasChatCart;

    // First visit in this tab: mark and store URL, never prompt
    if (window.name !== TAB) {
      window.name = TAB;
      try { localStorage.setItem('arumee_last_url', curUrl); } catch(e) {}
      return;
    }

    // Prefer browser-provided navigation type when available
    var navType = null;
    try {
      var nav = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0];
      if (nav && nav.type) navType = nav.type; // 'navigate' | 'reload' | 'back_forward'
      else if (window.performance && window.performance.navigation) {
        navType = (window.performance.navigation.type === 1) ? 'reload' : 'navigate';
      }
    } catch(e) {}

    // Fallback: if navType is unknown, only treat as reload when URL is unchanged
    var lastUrl = '';
    try { lastUrl = localStorage.getItem('arumee_last_url') || ''; } catch(e) {}

    var isReload = (navType === 'reload') || (!navType && lastUrl === curUrl);

    // Update last URL for the next load
    try { localStorage.setItem('arumee_last_url', curUrl); } catch(e) {}

    // Refresh prompt handled by cartRestoreModal in index.html — skip here.
    // if (isReload && hasAnyCart) { setTimeout(function() { showRefreshModal(); }, 250); }
  }());
}());
}());
