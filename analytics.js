// Site analytics for every Arumee page (hub, shop, Market Scout). Both tools set no cookies and store no
// personal data, so no cookie banner is needed. Nothing loads outside arumee.co.in (local previews).
//  - Cloudflare Web Analytics: visits, pages, referrers, countries, devices. It also counts Market Scout's
//    in-page navigation (?market=…) on its own.
//  - GoatCounter (optional): also records actions. Counting starts once GOATCOUNTER is set to the site
//    code of a GoatCounter account (https://<code>.goatcounter.com).
// Pages record actions with window.arumeeTrack('request/singapore'); without GoatCounter it does nothing.
(function () {
  var CLOUDFLARE_TOKEN = 'aee2ed9642d64a40b58e4753e30e39cf';
  var GOATCOUNTER = '';
  var queue = [];
  window.arumeeTrack = function (name) {
    if (!name) return;
    var gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') gc.count({ path: 'event/' + name, title: name, event: true });
    else if (GOATCOUNTER) queue.push(name);
  };
  if (location.hostname !== 'arumee.co.in') return;

  function load(src, attrs, onload) {
    var s = document.createElement('script');
    s.defer = true;
    s.src = src;
    for (var k in attrs) s.setAttribute(k, attrs[k]);
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  }
  if (CLOUDFLARE_TOKEN) load('https://static.cloudflareinsights.com/beacon.min.js', { 'data-cf-beacon': JSON.stringify({ token: CLOUDFLARE_TOKEN }) });
  // Actions recorded before GoatCounter loaded are sent once it is ready.
  if (GOATCOUNTER) load('https://gc.zgo.at/count.js', { 'data-goatcounter': 'https://' + GOATCOUNTER + '.goatcounter.com/count' }, function () {
    var q = queue; queue = []; q.forEach(window.arumeeTrack);
  });
})();
