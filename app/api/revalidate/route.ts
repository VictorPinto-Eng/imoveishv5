import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // Proteção básica — use o JWT_SECRET ou defina um REVALIDATE_SECRET no .env
  const expectedSecret = process.env.REVALIDATE_SECRET || process.env.JWT_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get('path') || '/';

  revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    path,
    now: new Date().toISOString(),
  });
}
