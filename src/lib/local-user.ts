import { prisma } from './db';

type CreateOpts = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

async function hasFirebaseUidColumn(): Promise<boolean> {
  try {
    const colRes: any = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'User' AND column_name = 'firebaseUid'"
    );
    const c = Array.isArray(colRes) ? Number(colRes[0]?.c ?? 0) : Number(colRes?.c ?? 0);
    return Boolean(c > 0);
  } catch (e) {
    return false;
  }
}

export async function findLocalUserByFirebaseUid(firebaseUid: string) {
  if (!firebaseUid) return null;

  const hasColumn = await hasFirebaseUidColumn();

  if (hasColumn) {
    try {
      const byFirebase = await prisma.user.findFirst({ where: { firebaseUid } } as any);
      if (byFirebase) return byFirebase;
    } catch (e) {
      // If this fails, fall back to legacy raw SQL path below
    }
  }

  // Legacy/raw fallback: query by primary id using raw SQL to avoid referencing
  // a missing `firebaseUid` column in the Prisma-generated queries.
  try {
    const rows: any = await prisma.$queryRawUnsafe('SELECT id, email, firstName, lastName, createdAt, updatedAt FROM `User` WHERE id = ? LIMIT 1', firebaseUid);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    } as any;
  } catch (e) {
    return null;
  }
}

export async function getOrCreateLocalUserId(firebaseUid: string, opts?: CreateOpts) {
  if (!firebaseUid) throw new Error('firebaseUid required');

  // Try find existing
  const existing = await findLocalUserByFirebaseUid(firebaseUid);
  if (existing) return existing.id;

  // Compute next mediNNN id
  let mediUsers: Array<{ id: string }> = [];
  try {
    const hasColumn = await hasFirebaseUidColumn();
    if (hasColumn) {
      mediUsers = await prisma.user.findMany({ where: { id: { startsWith: 'medi' } }, select: { id: true } });
    } else {
      const rows: any = await prisma.$queryRawUnsafe("SELECT id FROM `User` WHERE id LIKE 'medi%'");
      mediUsers = Array.isArray(rows) ? rows.map((r: any) => ({ id: r.id })) : [];
    }
  } catch (e) {
    mediUsers = [];
  }

  const nums = mediUsers
    .map((u) => {
      const s = u.id.slice(4);
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : NaN;
    })
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 101;
  const newId = `medi${next}`;

  try {
    const hasColumn = await hasFirebaseUidColumn();
    if (hasColumn) {
      const created = await prisma.user.create({ data: { id: newId, firebaseUid, email: opts?.email || null, firstName: opts?.firstName || null, lastName: opts?.lastName || null } as any } as any);
      return created.id;
    }

    // Raw insert without firebaseUid column
    await prisma.$executeRawUnsafe('INSERT INTO `User` (id, email, firstName, lastName, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())', newId, opts?.email || null, opts?.firstName || null, opts?.lastName || null);
    return newId;
  } catch (e: any) {
    // If raw insert fails (e.g. id exists), try to find existing by firebaseUid first using raw SQL
    try {
      const rows: any = await prisma.$queryRawUnsafe('SELECT id FROM `User` WHERE id = ? LIMIT 1', firebaseUid);
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row && row.id) return row.id;
    } catch (_) {}
    // Last resort: try to find by id (for cases where newId may already exist)
    try {
      const rows: any = await prisma.$queryRawUnsafe('SELECT id FROM `User` WHERE id = ? LIMIT 1', newId);
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row && row.id) return row.id;
    } catch (_) {}
    throw e;
  }
}
