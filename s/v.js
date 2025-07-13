importScripts('/s/st/bundle.js');
importScripts('/s/st/config.js');
importScripts('/s/st/sw.js');

const sw = new UVServiceWorker();

self.addEventListener('fetch', (event) => event.respondWith(sw.fetch(event)));
