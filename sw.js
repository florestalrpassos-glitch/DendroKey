// sw.js - DendroKey v5 (Resiliência Offline Total)

const CACHE_NAME = 'dendrokey-v5';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './db.js',
    './db_part2.js',
    './collection.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// Instalação: Salva arquivos no cache
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('DendroKey: Arquivos cacheados com sucesso.');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativação: Limpa versões obsoletas para evitar erro de tela branca
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    return self.clients.claim();
});

// Estratégia de Busca: Cache Primeiro, depois Rede
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        }).catch(() => {
            // Se falhar (offline e sem cache), retorna a página inicial
            return caches.match('./index.html');
        })
    );
});