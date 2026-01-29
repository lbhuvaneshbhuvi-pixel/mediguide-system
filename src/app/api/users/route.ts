import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { findLocalUserByFirebaseUid, getOrCreateLocalUserId } from '@/lib/local-user';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await findLocalUserByFirebaseUid(uid);
  return NextResponse.json(user || null);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  // If user exists (mapped by firebaseUid) update; otherwise create with a mediNNN id
  const existing = await findLocalUserByFirebaseUid(uid);
  if (existing) {
    const updated = await prisma.user.update({ where: { id: existing.id }, data: { email: body.email || null, firstName: body.firstName || null, lastName: body.lastName || null, theme: body.theme || null } });
    return NextResponse.json(updated);
  }

  const newLocalId = await getOrCreateLocalUserId(uid, { email: body.email || null, firstName: body.firstName || null, lastName: body.lastName || null });
  // Use raw SQL to fetch the created user to avoid Prisma column issues
  try {
    const rows: any = await prisma.$queryRawUnsafe('SELECT id, email, firstName, lastName, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', newLocalId);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return NextResponse.json(row || null);
  } catch (e) {
    console.error('Error fetching created user:', e);
    return NextResponse.json({ id: newLocalId }, { status: 200 });
  }
}
