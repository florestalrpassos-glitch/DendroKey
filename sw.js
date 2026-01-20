// sw.js - Versão 2.0 (Suporte para 400 espécies)

const CACHE_NAME = 'dendrokey-v2'; // Mudei para v2 para forçar a atualização no celular
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './db.js',
    './db_part2.js', // NOVO: Adicionado para garantir o banco completo offline
    './collection.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// Instalação: Salva todos os arquivos essenciais no cache do navegador
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('DendroKey: Cache de arquivos concluído.');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting(); // Força a nova versão a assumir o controle imediatamente
});

// Ativação: Limpa versões antigas do cache para liberar espaço no celular
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('DendroKey: Removendo cache antigo:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Interceptação: Se estiver offline, serve o arquivo do cache. Se online, busca na rede.
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});