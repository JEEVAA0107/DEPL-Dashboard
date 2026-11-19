import { NextRequest, NextResponse } from 'next/server';
import { getDrilldownData } from '@/lib/db';
import { BusinessModuleKey, OrgFilter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleKey = (searchParams.get('module') as BusinessModuleKey) || 'vendor_inward';
    const date = searchParams.get('date') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const org = (searchParams.get('org') as OrgFilter) || 'DEPL';

    const data = await getDrilldownData(moduleKey, date, fromDate, toDate, org);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Drilldown API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve drilldown records', details: error.message },
      { status: 500 }
    );
  }
}
