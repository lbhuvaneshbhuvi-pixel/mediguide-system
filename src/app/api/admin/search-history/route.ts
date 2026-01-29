import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const items: any = await prisma.$queryRawUnsafe('SELECT id, userId, query, result, time FROM `SearchHistory` ORDER BY time DESC LIMIT 200');
    return NextResponse.json(Array.isArray(items) ? items : []);
  } catch (e: any) {
    console.error('Error fetching search history:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
