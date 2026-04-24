import { NextRequest, NextResponse } from 'next/server';
import { searchTickers } from '@/lib/edgar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json([]);
  try {
    const results = await searchTickers(q, 8);
    return NextResponse.json(
      results.map((r) => ({ ticker: r.ticker, title: r.title }))
    );
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}
