import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const items: any = await prisma.$queryRawUnsafe('SELECT id, userId, text, time FROM `Feedback` ORDER BY time DESC LIMIT 100');
    return NextResponse.json(Array.isArray(items) ? items : []);
  } catch (e: any) {
    console.error('Error fetching feedback:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
