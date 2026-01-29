import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, recommendedMedicines } = body;
  if (!name) return NextResponse.json({ error: 'Missing symptom name' }, { status: 400 });
  try {
    const created = await prisma.symptoms.create({
      data: { name, description, recommendedMedicines },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const items = await prisma.symptoms.findMany();
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
