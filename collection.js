// collection.js - Versão 3 (Auto-Reparo de Esquema)
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DendroKeyDB', 3);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('observations')) {
                db.createObjectStore('observations', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve();
        request.onerror = (err) => reject(err);
    });
}

export function saveObservation(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DendroKeyDB', 3);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readwrite');
            const store = tx.objectStore('observations');
            const addReq = store.add(data);
            addReq.onsuccess = () => resolve();
            addReq.onerror = (err) => reject(err);
        };
    });
}

export function getAllObservations() {
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 3);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readonly');
            tx.objectStore('observations').getAll().onsuccess = (ev) => resolve(ev.target.result);
        };
    });
}

export function deleteObservation(id) {
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 3);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readwrite');
            tx.objectStore('observations').delete(id);
            tx.oncomplete = () => resolve();
        };
    });
}