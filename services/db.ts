export const DB_NAME = 'urbanito-offline';
export const DB_VERSION = 1;
export const STORE_ROUTES = 'routes';

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject('Database error: ' + (event.target as any).error);

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_ROUTES)) {
                db.createObjectStore(STORE_ROUTES, { keyPath: 'id' });
            }
        };
    });
};

export const saveToDB = async (storeName: string, item: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Save failed');
    });
};

export const countDB = async (storeName: string): Promise<number> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const t = db.transaction([storeName], 'readonly');
        const store = t.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject('Count failed');
    });
}

export const getAllFromDB = async (storeName: string): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Get all failed');
    });
};

export const getFromDB = async (storeName: string, id: string): Promise<any> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Get failed');
    });
};

export const deleteFromDB = async (storeName: string, id: string) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Delete failed');
    });
};
