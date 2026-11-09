import type { HistoryEntry } from '../../../types';
import { deleteCarouselRow, getCarouselRow, insertCarousel, listCarouselRows, updateCarouselRow } from '../db';
import {
    deleteCarouselFiles, HistoryOutOfSyncError, IMAGE_TYPES, isCarouselId, MAX_IMAGE_BYTES, readCarouselDocument,
    readHistory, readImage, readThumbnail, saveHistory, saveImage, writeCarouselDocument, writeThumbnail,
} from '../storage';
import { createApp, errorJson, requireUser, type AppContext } from '../app';

// The gallery and the editor's storage. Request and response bodies that are files (the document, images,
// thumbnails) are streamed between the browser and R2 without being parsed, which keeps the Worker's CPU time low.

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

// The carousel if the signed-in user owns it; other people's carousels look exactly like missing ones
async function ownedCarousel(c: AppContext) {
    const id = c.req.param('id');
    const row = isCarouselId(id) ? await getCarouselRow(c.env.DB, id) : null;
    return row && row.ownerId === c.get('user').id ? row : null;
}

const notFound = (c: AppContext) => errorJson(c, 'Carousel not found.', 404);

// The body's size from Content-Length, or null when it is missing or over `max`
function bodySize(c: AppContext, max: number): number | null {
    const length = Number(c.req.header('content-length'));
    return Number.isInteger(length) && length > 0 && length <= max ? length : null;
}

const carousels = createApp();
carousels.use('*', requireUser);

// The signed-in user's carousels, most recently edited first
carousels.get('/', async c => c.json({ carousels: await listCarouselRows(c.env.DB, c.get('user').id) }));

carousels.post('/', async c => c.json(await insertCarousel(c.env.DB, crypto.randomUUID(), c.get('user').id), 201));

carousels.get('/:id', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    const document = await readCarouselDocument(c.env.FILES, meta.id);
    // The stored document is inserted as is rather than parsed and serialized again
    return c.body(`{"meta":${JSON.stringify(meta)},"document":${document ? await document.text() : 'null'}}`, 200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
    });
});

// Autosave from the editor: the body is the document JSON; the gallery's title and slide count come in headers
carousels.put('/:id', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    if (!c.req.header('content-type')?.startsWith('application/json')) return errorJson(c, 'The document must be JSON.', 415);
    if (!bodySize(c, MAX_DOCUMENT_BYTES) || !c.req.raw.body) return errorJson(c, 'The document is empty or too large.', 413);
    let title = '';
    try {
        title = decodeURIComponent(c.req.header('x-carousel-title') ?? '').trim().slice(0, 200);
    } catch {
        // a malformed title is saved as no title
    }
    const slideCount = Number(c.req.header('x-slide-count'));
    await writeCarouselDocument(c.env.FILES, meta.id, c.req.raw.body);
    return c.json(await updateCarouselRow(c.env.DB, meta.id, {
        title,
        slideCount: Number.isInteger(slideCount) && slideCount >= 0 ? slideCount : 0,
    }));
});

carousels.delete('/:id', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    await deleteCarouselRow(c.env.DB, meta.id);
    c.executionCtx.waitUntil(deleteCarouselFiles(c.env.FILES, meta.id));
    return c.body(null, 204);
});

// --- Thumbnail (a small JPEG of the first slide, for the gallery) ---

carousels.get('/:id/thumbnail', async c => {
    const meta = await ownedCarousel(c);
    const thumbnail = meta ? await readThumbnail(c.env.FILES, meta.id) : null;
    if (!thumbnail) return c.body(null, 404);
    return c.body(thumbnail.body, 200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-cache' });
});

carousels.put('/:id/thumbnail', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    if (c.req.header('content-type') !== 'image/jpeg') return errorJson(c, 'The thumbnail must be a JPEG.', 415);
    if (!bodySize(c, 2 * 1024 * 1024) || !c.req.raw.body) return errorJson(c, 'The thumbnail is empty or too large.', 413);
    await writeThumbnail(c.env.FILES, meta.id, c.req.raw.body);
    return c.body(null, 204);
});

// --- Undo history, so undo/redo keep working after the carousel is closed and opened again ---

const isEntry = (entry: any): entry is HistoryEntry =>
    Number.isInteger(entry?.seq) && typeof entry?.snapshot === 'string' && Number.isInteger(entry?.slide);

carousels.get('/:id/history', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    c.header('Cache-Control', 'no-store');
    return c.json((await readHistory(c.env.FILES, meta.id)) ?? { entries: [], index: -1 });
});

// { seqs: the history in order, index: the current position, entries: those the server does not have yet }
carousels.put('/:id/history', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    const body: any = await c.req.json().catch(() => null);
    if (!Array.isArray(body?.seqs) || !body.seqs.length || !body.seqs.every(Number.isInteger) ||
        !Number.isInteger(body.index) || !Array.isArray(body.entries) || !body.entries.every(isEntry)) {
        return errorJson(c, 'Invalid history.', 400);
    }
    try {
        await saveHistory(c.env.FILES, meta.id, { seqs: body.seqs, index: body.index, entries: body.entries });
    } catch (error) {
        // The editor then sends the full history again
        if (error instanceof HistoryOutOfSyncError) return errorJson(c, error.message, 409);
        throw error;
    }
    return c.body(null, 204);
});

// --- Images, stored once each under the id the editor gave them ---

carousels.get('/:id/images/:imageId', async c => {
    const meta = await ownedCarousel(c);
    const image = meta ? await readImage(c.env.FILES, meta.id, c.req.param('imageId')) : null;
    if (!image) return c.body(null, 404);
    // An image id always points at the same pixels, so it can be cached for good
    return c.body(image.body, 200, {
        'Content-Type': image.httpMetadata?.contentType ?? 'application/octet-stream',
        'Cache-Control': 'private, max-age=31536000, immutable',
    });
});

carousels.put('/:id/images/:imageId', async c => {
    const meta = await ownedCarousel(c);
    if (!meta) return notFound(c);
    const contentType = c.req.header('content-type') ?? '';
    if (!IMAGE_TYPES.includes(contentType)) return errorJson(c, 'Images must be PNG, JPEG, WebP or GIF.', 415);
    if (!bodySize(c, MAX_IMAGE_BYTES) || !c.req.raw.body) return errorJson(c, 'The image is empty or too large.', 413);
    try {
        await saveImage(c.env.FILES, meta.id, c.req.param('imageId'), c.req.raw.body, contentType);
    } catch {
        return errorJson(c, 'The image id is invalid.', 400);
    }
    return c.body(null, 204);
});

export default carousels;
