import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, dosage, sideEffects, precautions, alternatives, description } = body;
  if (!name) return NextResponse.json({ error: 'Missing medicine name' }, { status: 400 });
  try {
    const created = await prisma.medicine.create({
      data: { name, dosage, sideEffects, precautions, alternatives, description },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const items = await prisma.medicine.findMany();
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
