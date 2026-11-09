import type { HistoryEntry, UndoHistory } from '../../types';

// Carousel contents in R2. Gallery metadata and ownership live in D1 (db.ts).
//   carousels/<id>/carousel.json      the editor document (slides, both versions, chat log)
//   carousels/<id>/history.json       the undo history
//   carousels/<id>/chat_history.json  this carousel's Gemini conversation
//   carousels/<id>/thumbnail.jpg      the first slide, for the gallery
//   carousels/<id>/images/<imageId>   generated and uploaded images (content type in the object's metadata)

const ID_PATTERN = /^[a-z0-9-]{8,64}$/;
const IMAGE_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export const isCarouselId = (id: unknown): id is string => typeof id === 'string' && ID_PATTERN.test(id);
export const isImageId = (id: unknown): id is string => typeof id === 'string' && IMAGE_ID_PATTERN.test(id);

// Ids are validated before they are ever joined into a key, so they cannot reach another carousel's files
function key(id: string, file: string): string {
    if (!isCarouselId(id)) throw new Error('Invalid carousel id.');
    return `carousels/${id}/${file}`;
}

export const chatHistoryKey = (id: string) => key(id, 'chat_history.json');

export async function readJson<T>(bucket: R2Bucket, objectKey: string): Promise<T | null> {
    const object = await bucket.get(objectKey);
    return object ? ((await object.json()) as T) : null;
}

export async function writeJson(bucket: R2Bucket, objectKey: string, value: unknown) {
    await bucket.put(objectKey, JSON.stringify(value), { httpMetadata: { contentType: 'application/json' } });
}

export const readCarouselDocument = (bucket: R2Bucket, id: string) => bucket.get(key(id, 'carousel.json'));

export async function writeCarouselDocument(bucket: R2Bucket, id: string, body: ReadableStream | string) {
    await bucket.put(key(id, 'carousel.json'), body, { httpMetadata: { contentType: 'application/json' } });
}

export const readThumbnail = (bucket: R2Bucket, id: string) => bucket.get(key(id, 'thumbnail.jpg'));

export async function writeThumbnail(bucket: R2Bucket, id: string, body: ReadableStream | ArrayBuffer) {
    await bucket.put(key(id, 'thumbnail.jpg'), body, { httpMetadata: { contentType: 'image/jpeg' } });
}

// Deletes every file of the carousel
export async function deleteCarouselFiles(bucket: R2Bucket, id: string) {
    const prefix = key(id, '');
    let cursor: string | undefined;
    do {
        const page = await bucket.list({ prefix, cursor });
        if (page.objects.length) await bucket.delete(page.objects.map(object => object.key));
        cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
}

// --- Undo history ---
// Entries are full snapshots with a sequence number. The editor uploads only the entries the server does not
// have yet plus the list of sequence numbers in order, so a save stays small even with a long history.

export class HistoryOutOfSyncError extends Error {}

export const readHistory = (bucket: R2Bucket, id: string) => readJson<UndoHistory>(bucket, key(id, 'history.json'));

export async function saveHistory(bucket: R2Bucket, id: string, update: { seqs: number[]; index: number; entries: HistoryEntry[] }) {
    const known = new Map<number, HistoryEntry>();
    (await readHistory(bucket, id))?.entries.forEach(entry => known.set(entry.seq, entry));
    update.entries.forEach(entry => known.set(entry.seq, entry));
    const entries = update.seqs.map(seq => known.get(seq)).filter((entry): entry is HistoryEntry => entry !== undefined);
    if (entries.length !== update.seqs.length) throw new HistoryOutOfSyncError('Some history entries are missing.');
    const index = Math.min(Math.max(0, update.index), entries.length - 1);
    await writeJson(bucket, key(id, 'history.json'), { entries, index } satisfies UndoHistory);
}

// --- Images ---

export async function saveImage(bucket: R2Bucket, id: string, imageId: string, body: ReadableStream | ArrayBuffer, contentType: string) {
    if (!isImageId(imageId)) throw new Error('Invalid image id.');
    await bucket.put(key(id, `images/${imageId}`), body, { httpMetadata: { contentType } });
}

export async function readImage(bucket: R2Bucket, id: string, imageId: string) {
    return isImageId(imageId) ? bucket.get(key(id, `images/${imageId}`)) : null;
}
