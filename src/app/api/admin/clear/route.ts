import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const scope = body.scope || 'history_and_feedback';
    const confirm = Boolean(body.confirm);

    // Only allow destructive user deletion when explicit confirm flag is true
    const deleteUsers = scope === 'all' && confirm;

    const results: any = {};

    if (scope === 'history' || scope === 'history_and_feedback' || scope === 'all') {
      const r = await prisma.searchHistory.deleteMany({});
      results.searchHistory = r.count;
    }

    if (scope === 'feedback' || scope === 'history_and_feedback' || scope === 'all') {
      const r = await prisma.feedback.deleteMany({});
      results.feedback = r.count;
    }

    if (deleteUsers) {
      // Delete all users (this will remove user profiles). Admins are stored separately in `Admin`.
      const r = await prisma.user.deleteMany({});
      results.users = r.count;
    }

    return NextResponse.json({ message: 'Cleared', results });
  } catch (e: any) {
    console.error('Clear admin data error', e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
