import { NextRequest, NextResponse } from 'next/server';
import { getKpiSummaryData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const org = (searchParams.get('org') as any) || 'DEPL';

    const data = await getKpiSummaryData(fromDate, toDate, org);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('KPI API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve KPI metrics', details: error.message },
      { status: 500 }
    );
  }
}
