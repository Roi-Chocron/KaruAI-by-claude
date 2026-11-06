import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

// Every carousel lives in its own folder:
//   .karu/carousels/<id>/meta.json          what the gallery lists (title, dates, slide count)
//   .karu/carousels/<id>/carousel.json      the editor document (slides, both versions, chat log)
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

export interface CarouselMeta {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    slideCount: number;
}

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

export async function assertExists(id: string) {
    try {
        await fs.access(path.join(carouselDir(id), 'meta.json'));
    } catch {
        throw new CarouselNotFoundError();
    }
}

// Write to a temp file and rename it over the target, so a crash mid-write never leaves half a JSON file
async function writeAtomic(file: string, data: string | Buffer) {
    const temp = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temp, data);
    await fs.rename(temp, file);
}

async function readJson<T>(file: string): Promise<T> {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as T;
}

export async function listCarousels(): Promise<CarouselMeta[]> {
    let ids: string[];
    try {
        ids = await fs.readdir(CAROUSELS_DIR);
    } catch (error: any) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
    const metas = await Promise.all(ids.filter(isCarouselId).map(async id => {
        try {
            return await readJson<CarouselMeta>(path.join(carouselDir(id), 'meta.json'));
        } catch {
            return null; // a half-created or foreign folder: skip it
        }
    }));
    return metas
        .filter((meta): meta is CarouselMeta => meta !== null)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCarousel(): Promise<CarouselMeta> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const meta: CarouselMeta = { id, title: '', createdAt: now, updatedAt: now, slideCount: 0 };
    await fs.mkdir(path.join(carouselDir(id), 'images'), { recursive: true });
    await writeAtomic(path.join(carouselDir(id), 'meta.json'), JSON.stringify(meta, null, 2));
    return meta;
}

export async function readCarousel(id: string): Promise<{ meta: CarouselMeta; document: unknown }> {
    await assertExists(id);
    const meta = await readJson<CarouselMeta>(path.join(carouselDir(id), 'meta.json'));
    let document: unknown = null;
    try {
        document = await readJson(path.join(carouselDir(id), 'carousel.json'));
    } catch (error: any) {
        if (error.code !== 'ENOENT') throw error; // a new carousel has no document yet
    }
    return { meta, document };
}

export async function saveCarousel(
    id: string,
    update: { title: string; slideCount: number; document: unknown; thumbnail?: Buffer }
): Promise<CarouselMeta> {
    await assertExists(id);
    const dir = carouselDir(id);
    const previous = await readJson<CarouselMeta>(path.join(dir, 'meta.json'));
    const meta: CarouselMeta = {
        ...previous,
        title: update.title,
        slideCount: update.slideCount,
        updatedAt: new Date().toISOString(),
    };
    await writeAtomic(path.join(dir, 'carousel.json'), JSON.stringify(update.document));
    if (update.thumbnail) await writeAtomic(path.join(dir, 'thumbnail.jpg'), update.thumbnail);
    await writeAtomic(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
    return meta;
}

export async function deleteCarousel(id: string) {
    await assertExists(id);
    await fs.rm(carouselDir(id), { recursive: true, force: true });
}

export async function readThumbnail(id: string): Promise<Buffer | null> {
    try {
        return await fs.readFile(path.join(carouselDir(id), 'thumbnail.jpg'));
    } catch {
        return null;
    }
}

// Decodes a base64 data URL of one of the supported image types
export function decodeImageDataUrl(dataUrl: unknown): { contentType: string; data: Buffer } | null {
    if (typeof dataUrl !== 'string') return null;
    const match = dataUrl.match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || !IMAGE_TYPES[match[1]]) return null;
    return { contentType: match[1], data: Buffer.from(match[2], 'base64') };
}

export async function saveImage(id: string, imageId: string, image: { contentType: string; data: Buffer }) {
    await assertExists(id);
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
