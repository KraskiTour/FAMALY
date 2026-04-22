import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdminConfigured, isAuthorizedRequest } from '@/lib/admin-auth';

const TOURS_FILE = path.join(process.cwd(), 'data', 'tours.json');

export const dynamic = 'force-dynamic';

function unauthorizedResponse() {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD is not configured in environment variables' },
      { status: 500 }
    );
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: Request) {
  if (!isAuthorizedRequest(req)) {
    return unauthorizedResponse();
  }

  try {
    const raw = await fs.readFile(TOURS_FILE, 'utf-8');
    const url = new URL(req.url);
    if (url.searchParams.get('download') === '1') {
      return new NextResponse(raw, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="tours.json"',
        },
      });
    }
    const tours = JSON.parse(raw);
    return NextResponse.json({ tours });
  } catch (error) {
    console.error('Failed to read tours.json', error);
    return NextResponse.json({ error: 'Failed to read tours data' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAuthorizedRequest(req)) {
    return unauthorizedResponse();
  }

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

