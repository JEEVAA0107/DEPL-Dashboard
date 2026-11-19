import { NextRequest, NextResponse } from 'next/server';
import { getSummaryTableData } from '@/lib/db';
import { DailyTransactionSummaryRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as keyof DailyTransactionSummaryRow) || 'date';
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc';
    const org = (searchParams.get('org') as any) || 'DEPL';

    const data = await getSummaryTableData(fromDate, toDate, search, sortBy, sortDir, org);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Summary API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transaction summary table', details: error.message },
      { status: 500 }
    );
  }
}
