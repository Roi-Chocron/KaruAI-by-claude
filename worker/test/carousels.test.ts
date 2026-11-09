import { describe, expect, it } from 'vitest';
import { api, createCarousel, signIn } from './helpers';

const saveDocument = (cookie: string, id: string, document: unknown, title = 'My carousel', slides = 1) =>
    api(`/api/carousels/${id}`, {
        method: 'PUT',
        cookie,
        headers: { 'Content-Type': 'application/json', 'X-Carousel-Title': encodeURIComponent(title), 'X-Slide-Count': String(slides) },
        body: JSON.stringify(document),
    });

describe('carousels', () => {
    it('creates, saves, lists, loads and deletes a carousel', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);

        const saved = await saveDocument(cookie, id, { version: 1, slides: [1, 2] }, 'קרוסלה ראשונה', 2);
        expect(saved.status).toBe(200);
        expect(await saved.json()).toMatchObject({ id, title: 'קרוסלה ראשונה', slideCount: 2 });

        const list = await (await api('/api/carousels', { cookie })).json<any>();
        expect(list.carousels.map((carousel: any) => carousel.id)).toEqual([id]);

        const loaded = await (await api(`/api/carousels/${id}`, { cookie })).json<any>();
        expect(loaded.document).toEqual({ version: 1, slides: [1, 2] });

        expect((await api(`/api/carousels/${id}`, { method: 'DELETE', cookie })).status).toBe(204);
        expect((await api(`/api/carousels/${id}`, { cookie })).status).toBe(404);
    });

    it('loads a new carousel with no document', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        expect((await (await api(`/api/carousels/${id}`, { cookie })).json<any>()).document).toBeNull();
    });

    it("hides other people's carousels", async () => {
        const owner = await signIn();
        const stranger = await signIn();
        const id = await createCarousel(owner.cookie);
        expect((await api(`/api/carousels/${id}`, { cookie: stranger.cookie })).status).toBe(404);
        expect((await saveDocument(stranger.cookie, id, {})).status).toBe(404);
        expect((await api(`/api/carousels/${id}`, { method: 'DELETE', cookie: stranger.cookie })).status).toBe(404);
        expect((await api(`/api/carousels/${id}/images/a1`, { cookie: stranger.cookie })).status).toBe(404);
        expect((await api(`/api/carousels/${id}`, { cookie: owner.cookie })).status).toBe(200);
    });

    it('requires a session', async () => {
        expect((await api('/api/carousels')).status).toBe(401);
    });

    it('refuses a document that is not JSON', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const response = await api(`/api/carousels/${id}`, { method: 'PUT', cookie, headers: { 'Content-Type': 'text/plain' }, body: 'x' });
        expect(response.status).toBe(415);
    });
});

describe('images and thumbnails', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

    it('stores an image and returns the same bytes', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const put = await api(`/api/carousels/${id}/images/img_1`, { method: 'PUT', cookie, headers: { 'Content-Type': 'image/png' }, body: png });
        expect(put.status).toBe(204);
        const get = await api(`/api/carousels/${id}/images/img_1`, { cookie });
        expect(get.headers.get('content-type')).toBe('image/png');
        expect(new Uint8Array(await get.arrayBuffer())).toEqual(png);
    });

    it('refuses other file types and bad ids', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const svg = await api(`/api/carousels/${id}/images/img_1`, { method: 'PUT', cookie, headers: { 'Content-Type': 'image/svg+xml' }, body: '<svg/>' });
        expect(svg.status).toBe(415);
        const badId = await api(`/api/carousels/${id}/images/${encodeURIComponent('../x')}`, { method: 'PUT', cookie, headers: { 'Content-Type': 'image/png' }, body: png });
        expect(badId.status).toBe(400);
    });

    it('stores a JPEG thumbnail', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        expect((await api(`/api/carousels/${id}/thumbnail`, { cookie })).status).toBe(404);
        const put = await api(`/api/carousels/${id}/thumbnail`, { method: 'PUT', cookie, headers: { 'Content-Type': 'image/jpeg' }, body: png });
        expect(put.status).toBe(204);
        expect((await api(`/api/carousels/${id}/thumbnail`, { cookie })).status).toBe(200);
    });
});

describe('undo history', () => {
    it('merges uploads and asks for everything when it lost track', async () => {
        const { cookie } = await signIn();
        const id = await createCarousel(cookie);
        const entry = (seq: number) => ({ seq, snapshot: `s${seq}`, slide: 0 });
        const put = (body: unknown) => api(`/api/carousels/${id}/history`, { method: 'PUT', cookie, json: body });

        expect((await put({ seqs: [1, 2], index: 1, entries: [entry(1), entry(2)] })).status).toBe(204);
        expect((await put({ seqs: [1, 2, 3], index: 2, entries: [entry(3)] })).status).toBe(204);
        const history = await (await api(`/api/carousels/${id}/history`, { cookie })).json<any>();
        expect(history.entries.map((e: any) => e.seq)).toEqual([1, 2, 3]);
        expect(history.index).toBe(2);

        expect((await put({ seqs: [9], index: 0, entries: [] })).status).toBe(409);
    });
});
