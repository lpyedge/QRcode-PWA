export type ShareTextData = {
  title: string;
  text: string;
  url: string;
};

export type ShareMetadata = Partial<{
  title: string;
  text: string;
  url: string;
  filename: string;
  mimetype: string;
}>;

export type ShareRecord =
  | {
      id: string;
      type: 'image';
      timestamp: number;
      data: ArrayBuffer;
      metadata: ShareMetadata;
    }
  | {
      id: string;
      type: 'text';
      timestamp: number;
      data: ShareTextData;
      metadata?: ShareMetadata;
    };

export class ShareDbError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ShareDbError';
    this.cause = cause;
  }
}

const DB_NAME = 'qrcode-share';
const DB_VERSION = 1;
const STORE_NAME = 'shared-data';
const TIMESTAMP_INDEX = 'timestamp';

export function openShareDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new ShareDbError('Open share DB failed', request.error));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(TIMESTAMP_INDEX, TIMESTAMP_INDEX, { unique: false });
      }
    };
  });
}

export function saveShare(db: IDBDatabase, record: ShareRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new ShareDbError('Save share failed', request.error));
    tx.onerror = () => reject(new ShareDbError('Save share transaction failed', tx.error));
  });
}

export function getAndDeleteShare(db: IDBDatabase, id: string): Promise<ShareRecord | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let retrieved: ShareRecord | null = null;

    tx.oncomplete = () => resolve(retrieved);
    tx.onerror = () => reject(new ShareDbError('Get/delete share transaction failed', tx.error));

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      retrieved = (getRequest.result ?? null) as ShareRecord | null;
      if (retrieved) {
        const deleteRequest = store.delete(id);
        deleteRequest.onerror = () => reject(new ShareDbError('Delete share failed', deleteRequest.error));
      }
    };
    getRequest.onerror = () => reject(new ShareDbError('Get share failed', getRequest.error));
  });
}

export function cleanupExpiredShares(db: IDBDatabase, ttlMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(TIMESTAMP_INDEX);
    const range = IDBKeyRange.upperBound(Date.now() - ttlMs);
    let deleted = 0;

    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        cursor.delete();
        deleted += 1;
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };

    request.onerror = () => reject(new ShareDbError('Cleanup expired shares failed', request.error));
    tx.onerror = () => reject(new ShareDbError('Cleanup expired shares transaction failed', tx.error));
  });
}
