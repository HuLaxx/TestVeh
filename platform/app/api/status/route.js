import { NextResponse } from 'next/server';
import { configured,database } from '../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  if(!configured())return NextResponse.json({
    status:'setup_required',mode:'demonstration',reservationsEnabled:false,checkoutEnabled:false,
    realTimeChargerTelemetry:false
  },{headers:{'Cache-Control':'no-store'}});
  try {
    const r=await database().query(
      "SELECT to_regclass('public.resources') IS NOT NULL AND to_regclass('public.operators') IS NOT NULL AND to_regclass('public.auth_rate_limits') IS NOT NULL AS ready");
    const ready=Boolean(r.rows[0]?.ready);
    return NextResponse.json({
      status:ready?'ok':'setup_required',mode:ready?'live':'setup_required',
      reservationsEnabled:ready,checkoutEnabled:false,realTimeChargerTelemetry:false
    },{status:ready?200:503,headers:{'Cache-Control':'no-store'}});
  }catch{
    return NextResponse.json({status:'degraded',mode:'unavailable',reservationsEnabled:false,
      checkoutEnabled:false,realTimeChargerTelemetry:false},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
