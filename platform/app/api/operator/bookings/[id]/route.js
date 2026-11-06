import { NextResponse } from 'next/server';
import { requireOperator,requireSameOrigin,jsonError } from '../../../../../lib/access.js';
import { decisionAllowed } from '../../../../../lib/marketplace-rules.mjs';
import { database } from '../../../../../lib/db.js';
export async function PATCH(req,{params}) {
  try{
    requireSameOrigin(req);
    const {user}=await requireOperator();
    const {id}=await params;
    if(!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Invalid reservation.'},{status:400});
    let body;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
    const next=body?.status;
    if(!['confirmed','rejected','completed'].includes(next))return NextResponse.json({error:'Invalid status.'},{status:400});
    const client=await database().connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(
        'SELECT b.id,b.status,b.end_at FROM reservations b JOIN resources r ON b.resource_id=r.id WHERE b.id=$1 AND r.operator_id=$2 FOR UPDATE OF b',[id,user.id]);
      if(!r.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Reservation not found.'},{status:404});}
      if(!decisionAllowed(r.rows[0].status,next,r.rows[0].end_at)){
        await client.query('ROLLBACK');return NextResponse.json({error:'This reservation cannot move to that status.'},{status:409});
      }
      const updated=await client.query('UPDATE reservations SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,status',[next,id]);
      await client.query('INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)',
        [user.id,'booking.'+next,'reservation',id,JSON.stringify({previous:r.rows[0].status})]);
      await client.query('COMMIT');
      return NextResponse.json({booking:updated.rows[0]});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  }catch(e){return jsonError(e);}
}
