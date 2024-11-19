const CACHE_NAME = 'my-gym-schedule-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/gym.png',
  '/completed.png',
  '/edit.png',
  '/share.png',
  '/delete.png',
  '/alarm.mp3',
];

// Install event: Caching the assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Serve assets from cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response; // Return from cache
        }
        return fetch(event.request); // Fetch from network if not cached
      })
  );
});

// Activate event: Updating cache and removing old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    })
  );
});

// Push Notification event
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/routine2.png',
    badge: '/completed2.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Background sync: Syncing activities to localStorage if needed
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-activities') {
    event.waitUntil(syncActivities());
  }
});

function syncActivities() {
  return new Promise((resolve, reject) => {
    // Sync logic for your activities
    // You can implement any background sync logic here like saving activities to localStorage
    resolve('Activities synced');
  });
}

// Notification click event: Handle the notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('ServiceWorker registration successful:', registration);
    })
    .catch(function(error) {
      console.log('ServiceWorker registration failed:', error);
    });
}

// Request permission for push notifications
if (Notification.permission === "default") {
  Notification.requestPermission().then(function(permission) {
    if (permission === "granted") {
      console.log("Notifications granted.");
    }
  });
}

// Background sync registration
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(function(registration) {
    return registration.sync.register('sync-activities');
  }).then(function() {
    console.log('Background sync registered.');
  }).catch(function(error) {
    console.log('Background sync failed:', error);
  });
}
