import { NextResponse } from 'next/server';
import { deleteUser, getUserById, setUserRole } from '@/lib/db';
import { deleteCarouselFiles } from '@/lib/carousel-store';
import { forbidden, getCurrentUser, unauthorized } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

// Admins manage other accounts only, so nobody can lock the last admin out by accident
async function authorize(params: Context['params']) {
    const admin = await getCurrentUser();
    if (!admin) return { response: unauthorized() };
    if (admin.role !== 'admin') return { response: forbidden() };
    const { id } = await params;
    if (id === admin.id) {
        return { response: NextResponse.json({ error: 'You cannot change or delete your own account here.' }, { status: 400 }) };
    }
    const target = getUserById(id);
    if (!target) return { response: NextResponse.json({ error: 'User not found.' }, { status: 404 }) };
    return { target };
}

export async function PATCH(request: Request, { params }: Context) {
    const { target, response } = await authorize(params);
    if (!target) return response;
    const body: any = await request.json().catch(() => null);
    if (body?.role !== 'user' && body?.role !== 'admin') {
        return NextResponse.json({ error: '`role` must be "user" or "admin".' }, { status: 400 });
    }
    setUserRole(target.id, body.role);
    return NextResponse.json({ user: getUserById(target.id) });
}

export async function DELETE(_request: Request, { params }: Context) {
    const { target, response } = await authorize(params);
    if (!target) return response;
    const carouselIds = deleteUser(target.id);
    await Promise.all(carouselIds.map(id => deleteCarouselFiles(id).catch(() => undefined)));
    return new NextResponse(null, { status: 204 });
}
