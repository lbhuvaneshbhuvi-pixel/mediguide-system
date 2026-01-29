import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { getOrCreateLocalUserId, findLocalUserByFirebaseUid } from '@/lib/local-user';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body?.text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  const localId = await getOrCreateLocalUserId(uid);
  const created = await prisma.feedback.create({ data: { userId: localId, text: body.text } });
  return NextResponse.json(created);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const localUser = await findLocalUserByFirebaseUid(uid);
  if (!localUser) return NextResponse.json([], { status: 200 });
  const items = await prisma.feedback.findMany({ where: { userId: localUser.id }, orderBy: { time: 'desc' }, take: 50 });
  return NextResponse.json(items);
}
