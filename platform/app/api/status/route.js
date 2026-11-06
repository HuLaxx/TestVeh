
import { NextResponse } from 'next/server';
import { configured } from '../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  return NextResponse.json({status:'ok',mode:configured()?'live':'demonstration',reservationsEnabled:configured(),checkoutEnabled:false,realTimeChargerTelemetry:false});
}
