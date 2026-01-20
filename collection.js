// collection.js - Gerencia o banco de dados local (IndexedDB)

const DB_NAME = 'DendroKey_DB';
const DB_VERSION = 1;
const STORE_NAME = 'observacoes';

let db = null;

// Inicializa o banco de dados
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => reject('Erro ao abrir o banco local');
    });
};

// Salva uma nova observação (com foto e GPS)
export const saveObservation = (data) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record = {
            ...data,
            timestamp: new Date().toISOString()
        };

        const request = store.add(record);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject('Erro ao salvar no dispositivo');
    });
};

// Recupera todas as observações salvas
export const getAllObservations = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Erro ao carregar acervo');
    });
};