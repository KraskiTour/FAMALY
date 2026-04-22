import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const TOURS_FILE = path.join(process.cwd(), 'data', 'tours.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const raw = await fs.readFile(TOURS_FILE, 'utf-8');
    const tours = JSON.parse(raw);
    return NextResponse.json({ tours });
  } catch (error) {
    console.error('Failed to read tours.json', error);
    return NextResponse.json({ error: 'Failed to read tours data' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const tours = body?.tours;

    if (!Array.isArray(tours)) {
      return NextResponse.json({ error: '`tours` must be an array' }, { status: 400 });
    }

    await fs.writeFile(TOURS_FILE, `${JSON.stringify(tours, null, 2)}\n`, 'utf-8');
    return NextResponse.json({ ok: true, count: tours.length });
  } catch (error) {
    console.error('Failed to write tours.json', error);
    return NextResponse.json({ error: 'Failed to save tours data' }, { status: 500 });
  }
}

