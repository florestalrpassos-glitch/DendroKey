// DendroKey v10 - Gerenciamento de Cache e Modo Offline
const CACHE_NAME = 'dendrokey-v10';

// Lista de arquivos que serão salvos no celular para uso offline
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

// Evento de Instalação: Salva todos os arquivos no cache do navegador
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('DendroKey: Arquivos de sistema e banco de dados cacheados.');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Evento de Ativação: Remove caches de versões antigas para evitar erros de busca
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

// Estratégia de Busca: Tenta o Cache primeiro. Se não houver, tenta a rede.
// Isso garante que o app abra instantaneamente mesmo sem sinal de torre.
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});