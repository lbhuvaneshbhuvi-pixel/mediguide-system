import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { getOrCreateLocalUserId, findLocalUserByFirebaseUid } from '@/lib/local-user';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body?.query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  // Map firebase uid to local mediNNN id (create local user if necessary)
  const localId = await getOrCreateLocalUserId(uid);
  const created = await prisma.searchHistory.create({ data: { userId: localId, query: body.query, result: body.result || null } });
  return NextResponse.json(created);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const localUser = await findLocalUserByFirebaseUid(uid);
  if (!localUser) return NextResponse.json([], { status: 200 });
  const items = await prisma.searchHistory.findMany({ where: { userId: localUser.id }, orderBy: { time: 'desc' }, take: 50 });
  return NextResponse.json(items.map((i: any) => ({ id: i.id, query: i.query, result: i.result, time: i.time })));
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const localUser = await findLocalUserByFirebaseUid(uid);
  if (!localUser) return NextResponse.json({ error: 'No local user' }, { status: 400 });
  // Delete all search history for this user
  const r = await prisma.searchHistory.deleteMany({ where: { userId: localUser.id } });
  return NextResponse.json({ deleted: r.count });
}
