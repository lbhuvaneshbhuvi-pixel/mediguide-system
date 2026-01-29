import { NextRequest } from 'next/server';
import { prisma } from './db';

// Check admin request. First check environment ADMIN_KEY for compatibility,
// then fall back to looking up an Admin record with a matching `apiKey`.
export async function isAdminRequest(req: NextRequest) {
  try {
    const keyHeader = req.headers.get('x-admin-key') || req.headers.get('x-api-key') || '';
    const envKey = process.env.ADMIN_KEY || '';
    if (envKey && keyHeader === envKey) return true;
    if (!keyHeader) return false;
    const admin = await prisma.admin.findFirst({ where: { apiKey: keyHeader } });
    return Boolean(admin);
  } catch (e) {
    return false;
  }
}

export async function requireAdmin(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    throw new Error('Unauthorized');
  }
}
