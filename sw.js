
// Service Worker for MakerLab Connect
// Required for PWA "Add to Home Screen" functionality

const CACHE_NAME = 'makerlab-connect-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Take control immediately
});

// Fetch event
// We must have a fetch handler for PWA criteria, even if it just passes through
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Optional: Return a fallback page if offline
      // For now, just fail gracefully if network is down
      return new Response("Offline");
    })
  );
});
