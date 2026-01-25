// collection.js - Armazenamento Local IndexedDB
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DendroKeyDB', 1);
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
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readwrite');
            tx.objectStore('observations').add(data);
            tx.oncomplete = () => resolve();
        };
    });
}

export function getAllObservations() {
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readonly');
            const store = tx.objectStore('observations');
            store.getAll().onsuccess = (ev) => resolve(ev.target.result);
        };
    });
}

export function deleteObservation(id) {
    return new Promise((resolve) => {
        const request = indexedDB.open('DendroKeyDB', 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('observations', 'readwrite');
            tx.objectStore('observations').delete(id);
            tx.oncomplete = () => resolve();
        };
    });
}