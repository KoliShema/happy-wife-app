/* Self-removing service worker.
   The cache here kept phones on an old copy of the app, so sign-in fixes
   never reached the people who needed them. Caching the whole app was never
   worth that: it is a small page and it must always be current.

   This deletes every cache, unregisters itself, and reloads any open tab so
   the next load comes from the network. Once every device has run it, this
   file can be deleted. */

self.addEventListener('install', function(){ self.skipWaiting(); });

self.addEventListener('activate', function(event){
  event.waitUntil((async function(){
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try {
      var list = await self.clients.matchAll({ type: 'window' });
      list.forEach(function(c){ if (c.navigate) c.navigate(c.url); });
    } catch (e) {}
  })());
});

/* No fetch handler: nothing is served from cache from now on. */
