
import { NextResponse } from 'next/server';
import { configured,database } from '../../../lib/db.js';
import { samples,normalizeItem } from '../../../lib/catalog.js';
import { parseInterval } from '../../../lib/booking-rules.mjs';
export const dynamic='force-dynamic';
export async function GET(req) {
  if(!configured()) return NextResponse.json({mode:'demonstration',items:samples,disclaimer:'Illustrative inventory. No live reservations or actual charger occupancy.'});
  const url=new URL(req.url);
  const kind=url.searchParams.get('kind');
  const city=url.searchParams.get('city');
  const start=url.searchParams.get('start');
  const end=url.searchParams.get('end');
  if(kind && !['vehicle','parking','charging'].includes(kind)) return NextResponse.json({error:'Invalid service type'},{status:400});
  let interval=null;
  if(start||end) {
    try{interval=parseInterval(start,end);}catch(e){return NextResponse.json({error:e.message},{status:400});}
  }
  try {
    const sql="SELECT r.id,r.kind,r.title,r.subtitle,r.city,r.area,r.price_per_hour,r.features, "+
      "CASE WHEN $3::timestamptz IS NULL THEN NULL ELSE NOT EXISTS("+
      "SELECT 1 FROM reservations b WHERE b.resource_id=r.id AND b.status IN ('requested','confirmed') "+
      "AND b.start_at < $4::timestamptz AND b.end_at > $3::timestamptz) END AS available "+
      "FROM resources r JOIN operators o ON o.user_id=r.operator_id AND o.status='approved' WHERE r.active=true AND r.review_status='approved' AND ($1::text IS NULL OR r.kind=$1) "+
      "AND ($2::text IS NULL OR lower(r.city)=lower($2)) ORDER BY r.created_at DESC LIMIT 150";
    const result=await database().query(sql,[kind,city,interval?.start||null,interval?.end||null]);
    return NextResponse.json({mode:'live',items:result.rows.map(normalizeItem),disclaimer:'Operator-published inventory. EV charger physical status is not live telemetry.'},{headers:{'Cache-Control':'no-store'}});
  } catch {return NextResponse.json({error:'Inventory service temporarily unavailable'},{status:503});}
}
