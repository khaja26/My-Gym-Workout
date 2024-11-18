/*
  Welcome to our basic Service Worker!
  - This Service Worker offers a basic offline experience and is easily customizable.
  - You can add or modify any functionality you like, such as background sync, push notifications, etc.
  
  Want to learn more about Service Workers? Check out the documentation here:
  - Service Worker Intro: https://docs.pwabuilder.com/#/home/sw-intro
  - Advanced Features: https://docs.pwabuilder.com/#/studio/existing-app?id=add-a-service-worker
*/

const HOSTNAME_WHITELIST = [
    self.location.hostname,
    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net'
  ];
  
  // Util Function to handle URLs of intercepted requests
  const getFixedUrl = (req) => {
    const now = Date.now();
    const url = new URL(req.url);
  
    // Fix protocol to match location.protocol
    url.protocol = self.location.protocol;
  
    // Add cache-busting query param for the same hostname
    if (url.hostname === self.location.hostname) {
      url.searchParams.set('cache-bust', now);
    }
  
    return url.href;
  };
  
  // Activate event listener to claim clients immediately after activation
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  // Install event listener to force the new service worker to take control
  self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
  });
  
  // Fetch event listener to intercept and handle network requests
  self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests that are on the whitelist
    if (HOSTNAME_WHITELIST.includes(new URL(event.request.url).hostname)) {
      const cached = caches.match(event.request);
      const fixedUrl = getFixedUrl(event.request);
      const fetched = fetch(fixedUrl, { cache: 'no-store' });
      const fetchedCopy = fetched.then(resp => resp.clone());
  
      event.respondWith(
        Promise.race([fetched.catch(() => cached), cached])
          .then(resp => resp || fetched)
          .catch(() => { /* Log or handle errors here if necessary */ })
      );
  
      // Update the cache with the latest fetched response (if valid)
      event.waitUntil(
        Promise.all([fetchedCopy, caches.open('pwa-cache')])
          .then(([response, cache]) => {
            if (response.ok) {
              cache.put(event.request, response);
            }
          })
          .catch(() => { /* Log or handle errors here if necessary */ })
      );
    }
  });
  