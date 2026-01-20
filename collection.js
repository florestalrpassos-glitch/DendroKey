const DB_NAME = 'DendroKey_DB';
const DB_VERSION = 1;
const STORE_NAME = 'observacoes';

let db = null;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = () => reject('Erro no banco local');
    });
};

export const saveObservation = (data) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const request = transaction.objectStore(STORE_NAME).add({ ...data, timestamp: new Date().toISOString() });
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject('Erro ao salvar');
    });
};

export const getAllObservations = () => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const request = transaction.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Erro ao carregar');
    });
};

// NOVA FUNÇÃO: Deletar registro
export const deleteObservation = (id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const request = transaction.objectStore(STORE_NAME).delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject('Erro ao deletar');
    });
};