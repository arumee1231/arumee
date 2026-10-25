// Site analytics for every Arumee page (hub, shop, Market Scout): GoatCounter, which sets no cookies and
// stores no personal data, so no cookie banner is needed. Counting starts once CODE is set to the site
// code of the GoatCounter account (https://<CODE>.goatcounter.com) and only runs on arumee.co.in.
// Pages can also record actions: window.arumeeTrack('request/singapore').
(function () {
  var CODE = '';
  var queue = [];
  window.arumeeTrack = function (name) {
    if (!name) return;
    var gc = window.goatcounter;
    if (gc && typeof gc.count === 'function') gc.count({ path: 'event/' + name, title: name, event: true });
    else if (CODE) queue.push(name);
  };
  if (!CODE || location.hostname !== 'arumee.co.in') return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + CODE + '.goatcounter.com/count');
  // Actions recorded before the counter loaded are sent once it is ready.
  s.onload = function () { var q = queue; queue = []; q.forEach(window.arumeeTrack); };
  document.head.appendChild(s);
})();
