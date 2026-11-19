import { NextRequest, NextResponse } from 'next/server';
import { getChartsData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const org = (searchParams.get('org') as any) || 'DEPL';

    const data = await getChartsData(fromDate, toDate, org);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Charts API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics charts data', details: error.message },
      { status: 500 }
    );
  }
}
