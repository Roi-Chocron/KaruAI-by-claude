import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
    deleteCarouselRow, getCarouselRow, insertCarousel, listCarouselRows, updateCarouselRow,
} from '@/lib/db';
import type { CarouselMeta, CarouselRow, HistoryEntry, UndoHistory, User } from '@/types';

export type { CarouselMeta, HistoryEntry, UndoHistory } from '@/types';

// Gallery metadata and ownership live in the database (lib/db). The contents are files:
//   .karu/carousels/<id>/carousel.json      the editor document (slides, both versions, chat log)
//   .karu/carousels/<id>/history.json       the undo history
//   .karu/carousels/<id>/chat_history.json  this carousel's Gemini conversation
//   .karu/carousels/<id>/thumbnail.jpg      the first slide, for the gallery
//   .karu/carousels/<id>/images/<imageId>.<ext>  generated and uploaded images
const CAROUSELS_DIR = path.join(process.cwd(), '.karu', 'carousels');

const ID_PATTERN = /^[a-z0-9-]{8,64}$/;
const IMAGE_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const IMAGE_TYPES: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

// Also used when the carousel belongs to someone else, so other people's ids are indistinguishable
export class CarouselNotFoundError extends Error {
    constructor() {
        super('Carousel not found.');
    }
}

export const isCarouselId = (id: unknown): id is string => typeof id === 'string' && ID_PATTERN.test(id);
export const isImageId = (id: unknown): id is string => typeof id === 'string' && IMAGE_ID_PATTERN.test(id);

// Ids are validated before they are ever joined into a path, so they cannot escape the folder
function carouselDir(id: string): string {
    if (!isCarouselId(id)) throw new CarouselNotFoundError();
    return path.join(CAROUSELS_DIR, id);
}

export const chatHistoryFile = (id: string) => path.join(carouselDir(id), 'chat_history.json');

// The carousel if `user` owns it; throws CarouselNotFoundError otherwise
export function getOwnedCarousel(id: unknown, user: User): CarouselMeta {
    const row = isCarouselId(id) ? getCarouselRow(id) : null;
    if (!row || row.ownerId !== user.id) throw new CarouselNotFoundError();
    return row;
}

// Write to a temp file and rename it over the target, so a crash mid-write never leaves half a file
async function writeAtomic(file: string, data: string | Buffer) {
    const temp = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temp, data);
    await fs.rename(temp, file);
}

async function readJsonIfExists<T>(file: string): Promise<T | null> {
    try {
        return JSON.parse(await fs.readFile(file, 'utf-8')) as T;
    } catch (error: any) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
}

export const listCarousels = (owner: User): CarouselMeta[] => listCarouselRows(owner.id);

export async function createCarousel(owner: User): Promise<CarouselMeta> {
    const id = randomUUID();
    await fs.mkdir(path.join(carouselDir(id), 'images'), { recursive: true });
    return insertCarousel(id, owner.id);
}

export async function readCarouselDocument(id: string): Promise<unknown> {
    return readJsonIfExists(path.join(carouselDir(id), 'carousel.json')); // null for a new carousel
}

export async function saveCarousel(
    id: string,
    update: { title: string; slideCount: number; document: unknown; thumbnail?: Buffer }
): Promise<CarouselMeta> {
    const dir = carouselDir(id);
    await fs.mkdir(dir, { recursive: true });
    await writeAtomic(path.join(dir, 'carousel.json'), JSON.stringify(update.document));
    if (update.thumbnail) await writeAtomic(path.join(dir, 'thumbnail.jpg'), update.thumbnail);
    return updateCarouselRow(id, { title: update.title, slideCount: update.slideCount });
}

export async function deleteCarouselFiles(id: string) {
    await fs.rm(carouselDir(id), { recursive: true, force: true });
}

export async function deleteCarousel(id: string) {
    deleteCarouselRow(id);
    await deleteCarouselFiles(id);
}

export async function readThumbnail(id: string): Promise<Buffer | null> {
    try {
        return await fs.readFile(path.join(carouselDir(id), 'thumbnail.jpg'));
    } catch {
        return null;
    }
}

// --- Undo history ---
// Entries are full snapshots with a sequence number. The editor uploads only the entries the server does not
// have yet plus the list of sequence numbers in order, so a save stays small even with a long history.

export class HistoryOutOfSyncError extends Error {}

export async function readHistory(id: string): Promise<UndoHistory | null> {
    return readJsonIfExists<UndoHistory>(path.join(carouselDir(id), 'history.json'));
}

export async function saveHistory(id: string, update: { seqs: number[]; index: number; entries: HistoryEntry[] }) {
    const file = path.join(carouselDir(id), 'history.json');
    const known = new Map<number, HistoryEntry>();
    (await readHistory(id))?.entries.forEach(entry => known.set(entry.seq, entry));
    update.entries.forEach(entry => known.set(entry.seq, entry));
    const entries = update.seqs.map(seq => known.get(seq)).filter((entry): entry is HistoryEntry => entry !== undefined);
    if (entries.length !== update.seqs.length) throw new HistoryOutOfSyncError('Some history entries are missing.');
    const index = Math.min(Math.max(0, update.index), entries.length - 1);
    await writeAtomic(file, JSON.stringify({ entries, index } satisfies UndoHistory));
}

// --- Images ---

// Decodes a base64 data URL of one of the supported image types
export function decodeImageDataUrl(dataUrl: unknown): { contentType: string; data: Buffer } | null {
    if (typeof dataUrl !== 'string') return null;
    const match = dataUrl.match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || !IMAGE_TYPES[match[1]]) return null;
    return { contentType: match[1], data: Buffer.from(match[2], 'base64') };
}

export async function saveImage(id: string, imageId: string, image: { contentType: string; data: Buffer }) {
    if (!isImageId(imageId)) throw new Error('Invalid image id.');
    const dir = path.join(carouselDir(id), 'images');
    await fs.mkdir(dir, { recursive: true });
    await writeAtomic(path.join(dir, `${imageId}.${IMAGE_TYPES[image.contentType]}`), image.data);
}

export async function readImage(id: string, imageId: string): Promise<{ contentType: string; data: Buffer } | null> {
    if (!isImageId(imageId)) return null;
    for (const [contentType, extension] of Object.entries(IMAGE_TYPES)) {
        try {
            return { contentType, data: await fs.readFile(path.join(carouselDir(id), 'images', `${imageId}.${extension}`)) };
        } catch {
            // try the next extension
        }
    }
    return null;
}
