import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdminConfigured, isAuthorizedRequest } from '@/lib/admin-auth';

const TOURS_FILE = path.join(process.cwd(), 'data', 'tours.json');

export const dynamic = 'force-dynamic';

function isTourActive(tour: Record<string, unknown>): boolean {
  const nextDates = Array.isArray(tour.nextDates) ? tour.nextDates : [];
  if (nextDates.length === 0) return true;

  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const todayKey = new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);

  return nextDates.some((date) => {
    if (!date || typeof date !== 'object') return false;
    const d = date as Record<string, unknown>;
    const raw = typeof d.start === 'string' ? d.start.trim().slice(0, 10) : '';
    if (!raw) return false;
    return raw >= todayKey;
  });
}

function filterActiveTours(tours: unknown[]): unknown[] {
  return tours.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const t = item as Record<string, unknown>;
    const isPublished = t.isPublished !== false;
    return isPublished && isTourActive(t);
  });
}

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
    const tours = JSON.parse(raw);
    const url = new URL(req.url);
    if (url.searchParams.get('download') === '1') {
      const activeOnly = url.searchParams.get('activeOnly') === '1';
      const payload = activeOnly && Array.isArray(tours) ? filterActiveTours(tours) : tours;
      const body = `${JSON.stringify(payload, null, 2)}\n`;
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${activeOnly ? 'tours-active.json' : 'tours.json'}"`,
        },
      });
    }

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

