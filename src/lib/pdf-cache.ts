import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PDFCacheEntry {
  id: string;
  url: string;
  data: ArrayBuffer;
  pageCount: number;
  title: string;
  cachedAt: number;
  lastAccessed: number;
  size: number;
}

interface PDFCacheDB extends DBSchema {
  pdfCache: {
    key: string;
    value: PDFCacheEntry;
    indexes: { 'by-url': string; 'by-last-accessed': number };
  };
  metadata: {
    key: string;
    value: { key: string; totalSize: number; lastCleanup: number };
    indexes: Record<string, never>;
  };
}

const DB_NAME = 'scales-os-pdf-cache';
const DB_VERSION = 1;
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_ENTRIES = 50;

let dbInstance: IDBPDatabase<PDFCacheDB> | null = null;

async function getDB(): Promise<IDBPDatabase<PDFCacheDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<PDFCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const cacheStore = db.createObjectStore('pdfCache', { keyPath: 'id' });
      cacheStore.createIndex('by-url', 'url', { unique: true });
      cacheStore.createIndex('by-last-accessed', 'lastAccessed');
      db.createObjectStore('metadata', { keyPath: 'key' });
    },
  });
  return dbInstance;
}

export async function cachePDF(
  id: string,
  url: string,
  data: ArrayBuffer,
  pageCount: number,
  title: string
): Promise<void> {
  const db = await getDB();
  const entry: PDFCacheEntry = {
    id,
    url,
    data,
    pageCount,
    title,
    cachedAt: Date.now(),
    lastAccessed: Date.now(),
    size: data.byteLength,
  };
  
  await db.put('pdfCache', entry);
  await updateTotalSize(db);
  await enforceCacheLimits(db);
}

export async function getCachedPDF(id: string): Promise<PDFCacheEntry | undefined> {
  const db = await getDB();
  const entry = await db.get('pdfCache', id);
  if (entry) {
    // Update last accessed time
    entry.lastAccessed = Date.now();
    await db.put('pdfCache', entry);
  }
  return entry;
}

export async function getCachedPDFByUrl(url: string): Promise<PDFCacheEntry | undefined> {
  const db = await getDB();
  const entry = await db.getFromIndex('pdfCache', 'by-url', url);
  if (entry) {
    entry.lastAccessed = Date.now();
    await db.put('pdfCache', entry);
  }
  return entry;
}

export async function removeCachedPDF(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pdfCache', id);
  await updateTotalSize(db);
}

export async function clearPDFCache(): Promise<void> {
  const db = await getDB();
  await db.clear('pdfCache');
  await db.put('metadata', { key: 'totalSize', totalSize: 0, lastCleanup: Date.now() });
}

export async function getCacheInfo(): Promise<{ entries: number; totalSize: number; maxSize: number }> {
  const db = await getDB();
  const entries = await db.getAll('pdfCache');
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  return { entries: entries.length, totalSize, maxSize: MAX_CACHE_SIZE };
}

async function updateTotalSize(db: IDBPDatabase<PDFCacheDB>): Promise<void> {
  const entries = await db.getAll('pdfCache');
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  await db.put('metadata', { key: 'totalSize', totalSize, lastCleanup: Date.now() });
}

async function enforceCacheLimits(db: IDBPDatabase<PDFCacheDB>): Promise<void> {
  const entries = await db.getAllFromIndex('pdfCache', 'by-last-accessed');
  
  // Remove oldest entries if over max entries
  if (entries.length > MAX_ENTRIES) {
    const toRemove = entries.slice(0, entries.length - MAX_ENTRIES);
    for (const entry of toRemove) {
      await db.delete('pdfCache', entry.id);
    }
  }
  
  // Check total size
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  if (totalSize > MAX_CACHE_SIZE) {
    let currentSize = totalSize;
    for (const entry of entries) {
      if (currentSize <= MAX_CACHE_SIZE * 0.8) break; // Leave 20% headroom
      await db.delete('pdfCache', entry.id);
      currentSize -= entry.size;
    }
  }
  
  await updateTotalSize(db);
}

// Generate a cache ID from URL
export function generateCacheId(url: string, title: string): string {
  // Use a hash of the URL for consistent IDs
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `pdf-${Math.abs(hash).toString(36)}-${title.replace(/[^a-z0-9]/gi, '').slice(0, 20)}`;
}

// Load PDF with caching: tries cache first, falls back to network
export async function loadPDFCached(
  url: string,
  title: string,
  fetchFn: () => Promise<ArrayBuffer>
): Promise<{ data: ArrayBuffer; pageCount: number; fromCache: boolean }> {
  const cacheId = generateCacheId(url, title);
  
  // Try cache first
  const cached = await getCachedPDF(cacheId);
  if (cached) {
    return { data: cached.data, pageCount: cached.pageCount, fromCache: true };
  }
  
  // Fetch from network
  const data = await fetchFn();
  
  // We need to get page count - this will be done by the PDF viewer
  // For now, cache with pageCount=0, will be updated when PDF loads
  await cachePDF(cacheId, url, data, 0, title);
  
  return { data, pageCount: 0, fromCache: false };
}

export async function updateCachedPageCount(id: string, pageCount: number): Promise<void> {
  const db = await getDB();
  const entry = await db.get('pdfCache', id);
  if (entry) {
    entry.pageCount = pageCount;
    await db.put('pdfCache', entry);
  }
}