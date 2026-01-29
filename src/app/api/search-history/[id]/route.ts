import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyFirebaseIdToken } from '@/lib/firebaseAdmin';
import { findLocalUserByFirebaseUid } from '@/lib/local-user';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const uid = await verifyFirebaseIdToken(authHeader);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const localUser = await findLocalUserByFirebaseUid(uid);
  if (!localUser) return NextResponse.json({ error: 'No local user' }, { status: 400 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const item = await prisma.searchHistory.findUnique({ where: { id } });
  if (!item || item.userId !== localUser.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.searchHistory.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
