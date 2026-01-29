import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const users: any = await prisma.$queryRawUnsafe('SELECT id, email, firstName, lastName, createdAt, updatedAt FROM `User` ORDER BY createdAt DESC');
    return NextResponse.json(Array.isArray(users) ? users : []);
  } catch (e: any) {
    console.error('Error fetching users:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
