
import { NextResponse } from 'next/server';
import { currentUser } from '../../../lib/auth.js';
import { database,configured } from '../../../lib/db.js';
import { parseInterval,totalInPaise } from '../../../lib/booking-rules.mjs';
export const dynamic='force-dynamic';
export async function GET() {
  if(!configured())return NextResponse.json({error:'Database required.'},{status:503});
  try {
    const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
    const r=await database().query(
     'SELECT b.id,b.start_at,b.end_at,b.status,b.total_paise,b.created_at,r.title,r.city,r.area,r.kind FROM reservations b JOIN resources r ON b.resource_id=r.id WHERE b.user_id=$1 ORDER BY b.created_at DESC LIMIT 100',[user.id]);
    return NextResponse.json({bookings:r.rows},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Could not load bookings.'},{status:503});}
}
export async function POST(req) {
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
    const r=await client.query('SELECT id,price_per_hour,active FROM resources WHERE id=$1 FOR UPDATE',[resourceId]);
    if(!r.rows[0]?.active){await client.query('ROLLBACK');return NextResponse.json({error:'Item is not currently bookable.'},{status:404});}
    const price=totalInPaise(Number(r.rows[0].price_per_hour),interval.hours);
    const row=await client.query(
      'INSERT INTO reservations(resource_id,user_id,start_at,end_at,status,total_paise) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status,start_at,end_at,total_paise',
      [resourceId,user.id,interval.start,interval.end,'requested',price]);
    await client.query('COMMIT');
    return NextResponse.json({booking:row.rows[0],message:'Reservation request recorded. Operator confirmation is still required; no payment taken.'},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(e) {
    await client.query('ROLLBACK').catch(()=>{});
    if(e.code==='23P01')return NextResponse.json({error:'That period has already been reserved. Please choose another.'},{status:409});
    return NextResponse.json({error:'Unable to record reservation.'},{status:503});
  }finally{client.release();}
}
