import { NextResponse } from 'next/server';
import { isLiveDbConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isConfigured = isLiveDbConfigured();

  return NextResponse.json({
    status: isConfigured ? 'LIVE_DATABASE_CONNECTED' : 'MOCK_DEMO_MODE',
    readOnlySecurity: 'STRICT_SELECT_ONLY',
    message: isConfigured
      ? 'Live SQL Server is connected with read-only SELECT security enforcement.'
      : 'Operating in demonstrator mode. Set credentials in .env.local to enable live database.'
  });
}
