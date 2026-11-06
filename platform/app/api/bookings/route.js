
import { NextResponse } from 'next/server';
import { currentUser } from '../../../lib/auth.js';
import { database,configured } from '../../../lib/db.js';
import { parseInterval,totalInPaise } from '../../../lib/booking-rules.mjs';
import { sameOrigin } from '../../../lib/access.js';
export const dynamic='force-dynamic';
export async function GET() {
  if(!configured())return NextResponse.json({error:'Database required.'},{status:503});
  try {
    const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
    const r=await database().query(
     "SELECT b.id,b.start_at,b.end_at,CASE WHEN b.status='requested' AND b.expires_at<=NOW() THEN 'expired' ELSE b.status END AS status,b.expires_at,b.total_paise,b.created_at,r.title,r.city,r.area,r.kind FROM reservations b JOIN resources r ON b.resource_id=r.id WHERE b.user_id=$1 ORDER BY b.created_at DESC LIMIT 100",[user.id]);
    return NextResponse.json({bookings:r.rows},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Could not load bookings.'},{status:503});}
}
export async function POST(req) {
  if(!sameOrigin(req))return NextResponse.json({error:'Request origin not allowed.'},{status:403});
  if(!configured())return NextResponse.json({error:'Bookings are disabled until the database is connected.'},{status:503});
  let data;try{data=await req.json();}catch{return NextResponse.json({error:'Invalid request'},{status:400});}
  const resourceId=String(data.resourceId||'');
  if(!/^[a-f0-9-]{36}$/i.test(resourceId))return NextResponse.json({error:'Invalid inventory item'},{status:400});
  let interval;try{interval=parseInterval(data.start,data.end);}catch(e){return NextResponse.json({error:e.message},{status:400});}
  const user=await currentUser().catch(()=>null);if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
  const client=await database().connect().catch(()=>null);
  if(!client)return NextResponse.json({error:'Reservation service unavailable'},{status:503});
  try {
    await client.query('BEGIN');
    const r=await client.query("SELECT r.id,r.price_per_hour,r.active,r.review_status,o.status AS operator_status FROM resources r LEFT JOIN operators o ON o.user_id=r.operator_id WHERE r.id=$1 FOR UPDATE OF r",[resourceId]);
    if(!r.rows[0]?.active || r.rows[0].review_status!=='approved' || r.rows[0].operator_status!=='approved'){await client.query('ROLLBACK');return NextResponse.json({error:'Item is not currently bookable.'},{status:404});}
    // Resource row lock serializes stale-request expiry against booking creation.
    await client.query("UPDATE reservations SET status='expired',updated_at=NOW() WHERE resource_id=$1 AND status='requested' AND expires_at<=NOW()",[resourceId]);
    const price=totalInPaise(Number(r.rows[0].price_per_hour),interval.hours);
    const row=await client.query(
      "INSERT INTO reservations(resource_id,user_id,start_at,end_at,status,total_paise,expires_at) VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '2 hours') RETURNING id,status,start_at,end_at,total_paise,expires_at",
      [resourceId,user.id,interval.start,interval.end,'requested',price]);
    await client.query('COMMIT');
    return NextResponse.json({booking:row.rows[0],message:'Reservation request recorded. Operator confirmation is required within two hours; no payment taken.'},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(e) {
    await client.query('ROLLBACK').catch(()=>{});
    if(e.code==='23P01')return NextResponse.json({error:'That period has already been reserved. Please choose another.'},{status:409});
    return NextResponse.json({error:'Unable to record reservation.'},{status:503});
  }finally{client.release();}
}
