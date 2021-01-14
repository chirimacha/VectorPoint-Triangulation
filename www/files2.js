var version = 'v1.4';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(version).then(function(cache) {
      return cache.addAll([
        '/devel/preloader.gif'
      ]);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  var cacheKeeplist = [version];

  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheKeeplist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('openstreetmap'))
    return;
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      if (resp) {
        //console.log("cache: "+event.request.url);
        return resp;
      }
      return fetch(event.request).then(function(response) {
        return caches.open(version).then(function(cache) {
          //console.log("net: "+event.request.url);
          var url = event.request.url;
          var valid = url.includes('.js') || 
                      url.includes('.css') || 
                      url.includes('.png') ||
                      url.includes('.jpg') ||
                      url.includes('.ico') ||
                      url.includes('.gif') ||
                      url.includes('.woff') ||
                      (url.split('/')[3] == 'devel' && url.split('/')[4] == '');
          if (valid)
            cache.put(event.request, response.clone());
          return response;
        });  
      });
    })
  );
});
