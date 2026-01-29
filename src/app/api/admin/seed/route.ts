import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    // Clear existing data
    await prisma.searchHistory.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: 'user_001',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          theme: 'light',
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_002',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          theme: 'dark',
        },
      }),
      prisma.user.create({
        data: {
          id: 'user_003',
          email: 'mike@example.com',
          firstName: 'Mike',
          lastName: 'Johnson',
          theme: 'system',
        },
      }),
    ]);

    // Create test feedback
    const feedbackData = [
      { userId: 'user_001', text: 'Great app! Very helpful for understanding medicines.' },
      { userId: 'user_002', text: 'The AI recommendations are accurate. Would like more details on side effects.' },
      { userId: 'user_003', text: 'Love the voice input feature. Makes it easy to search while busy.' },
      { userId: 'user_001', text: 'UI is clean and user-friendly. Recommend to everyone!' },
      { userId: 'user_002', text: 'Could add more alternative medicines for each condition.' },
    ];

    const feedback = await Promise.all(
      feedbackData.map(f => prisma.feedback.create({ data: f }))
    );

    // Create test search history
    const searchData = [
      { userId: 'user_001', query: 'headache', result: 'Paracetamol 500mg, 2 tablets every 4-6 hours' },
      { userId: 'user_001', query: 'cold and cough', result: 'Cough syrup with honey, antihistamine for allergies' },
      { userId: 'user_002', query: 'fever', result: 'Ibuprofen 400mg, rest and hydration' },
      { userId: 'user_002', query: 'stomach ache', result: 'Antacid tablet, avoid spicy food' },
      { userId: 'user_003', query: 'headache', result: 'Paracetamol 500mg, 2 tablets every 4-6 hours' },
      { userId: 'user_003', query: 'migraine', result: 'Sumatriptan 50mg, dark room and rest' },
      { userId: 'user_001', query: 'allergies', result: 'Antihistamine like Cetirizine 10mg daily' },
      { userId: 'user_002', query: 'headache', result: 'Paracetamol 500mg, 2 tablets every 4-6 hours' },
      { userId: 'user_003', query: 'cold and cough', result: 'Cough syrup with honey, antihistamine for allergies' },
      { userId: 'user_001', query: 'fever', result: 'Ibuprofen 400mg, rest and hydration' },
    ];

    const history = await Promise.all(
      searchData.map(s => prisma.searchHistory.create({ data: s }))
    );

    // Ensure an Admin record exists for the env ADMIN_KEY (convenience for local dev)
    const adminKey = process.env.ADMIN_KEY || '';
    if (adminKey) {
      await prisma.admin.upsert({
        where: { apiKey: adminKey },
        update: {},
        create: {
          id: 'admin_001',
          email: 'admin@example.com',
          name: 'Admin',
          apiKey: adminKey,
          role: 'owner',
        },
      });
    }

    return NextResponse.json({
      message: 'Seed data created successfully',
      users: users.length,
      feedback: feedback.length,
      searches: history.length,
    });
  } catch (e: any) {
    console.error('Seed error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
