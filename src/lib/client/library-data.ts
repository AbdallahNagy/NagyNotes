import type { LibraryData } from '@/lib/content/types';

const LIBRARY_URL = '/library.json';

let request: Promise<LibraryData> | undefined;

const isLibraryData = (value: unknown): value is LibraryData =>
  typeof value === 'object' &&
  value !== null &&
  'tree' in value &&
  Array.isArray(value.tree) &&
  'index' in value &&
  Array.isArray(value.index);

async function fetchLibrary(): Promise<LibraryData> {
  const response = await fetch(LIBRARY_URL);
  if (!response.ok) throw new Error(`${LIBRARY_URL} responded ${response.status}`);
  const data: unknown = await response.json();
  if (!isLibraryData(data)) throw new Error(`${LIBRARY_URL} is malformed`);
  return data;
}

/** The library, fetched once per page load and shared; a failed request is retried next time. */
export function loadLibrary(): Promise<LibraryData> {
  request ??= fetchLibrary().catch((error: unknown) => {
    request = undefined;
    throw error;
  });
  return request;
}
