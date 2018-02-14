// Service worker for offline mode

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('bp').then(function(cache) {
      return cache
        .addAll(['/files', '/files/local/blank', DEPENDENCIES_PLACEHOLDER])
        .then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  console.log(event.request.url);

  if (/\/files\/?$/.test(event.request.url)) {
    event.respondWith(
      caches.match('/files').then(function(response) {
        return response || fetch(event.request);
      })
    );
  } else if (/\/files\/.+/.test(event.request.url)) {
    event.respondWith(
      caches.match('/files/local/blank').then(function(response) {
        return response || fetch(event.request);
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        console.log(event.request.url, response);
        return response || fetch(event.request);
      })
    );
  }
});
