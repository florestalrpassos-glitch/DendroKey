// sw.js - DendroKey v11 (Suporte para 600 espécies)
const CACHE_NAME = 'dendrokey-v11';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './db.js',
    './db_part2.js',
    './db_part3.js',
    './db_part4.js',
    './collection.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});