// collection.js - Versão Otimizada para Fotos
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DendroKeyDB', 2); // Versão 2 para resetar esquema
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('observations')) {
                db.createObjectStore('observations', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
}

export function saveObservation(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DendroKeyDB', 2);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readwrite');
            const store = tx.objectStore('observations');
            const addReq = store.add(data);
            addReq.onsuccess = () => resolve();
            addReq.onerror = () => reject();
        };
    });
}

export function getAllObservations() {
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 2);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readonly');
            tx.objectStore('observations').getAll().onsuccess = (ev) => resolve(ev.target.result);
        };
    });
}

export function deleteObservation(id) {
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 2);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readwrite');
            tx.objectStore('observations').delete(id);
            tx.oncomplete = () => resolve();
        };
    });
}