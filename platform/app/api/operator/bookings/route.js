import { NextResponse } from 'next/server';
import { requireOperator,jsonError } from '../../../../lib/access.js';
import { database } from '../../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  try{
    const {user}=await requireOperator();
    const r=await database().query(
      "SELECT b.id,b.resource_id,b.start_at,b.end_at,CASE WHEN b.status='requested' AND b.expires_at<=NOW() THEN 'expired' ELSE b.status END AS status,b.expires_at,b.total_paise,b.created_at,r.title,r.kind,r.city,r.area FROM reservations b JOIN resources r ON r.id=b.resource_id WHERE r.operator_id=$1 ORDER BY b.created_at DESC LIMIT 200",[user.id]);
    return NextResponse.json({bookings:r.rows},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return jsonError(e);}
}
