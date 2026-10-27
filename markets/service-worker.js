self.addEventListener('push',event=>{
 event.waitUntil((async()=>{
  let payload={};try{payload=event.data?.json()||{}}catch{}
  const title=String(payload.title||'Market Scout update'),body=String(payload.body||'A company you follow has new news.'),url=String(payload.url||'/markets/');
  await self.registration.showNotification(title,{body,icon:'/markets/brand/icon-192.png',badge:'/markets/brand/favicon-48.png',tag:String(payload.tag||'market-scout-update'),data:{url},renotify:false});
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
  let target='/markets/';try{const url=new URL(event.notification.data?.url||'/markets/',self.location.origin);if(url.origin===self.location.origin)target=url.href}catch{}
  const clientsList=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of clientsList){if(new URL(client.url).origin===self.location.origin){await client.navigate(target);return client.focus()}}
  return self.clients.openWindow(target);
 })());
});
