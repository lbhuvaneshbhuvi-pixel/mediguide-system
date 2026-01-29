import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, latitude, longitude, address, phone, website } = body;
  if (!name) return NextResponse.json({ error: 'Missing provider name' }, { status: 400 });
  try {
    const created = await prisma.providers.create({
      data: { name, type, latitude, longitude, address, phone, website },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const items = await prisma.providers.findMany();
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
