import { NextResponse } from 'next/server';
import { requireAdmin,requireSameOrigin,jsonError } from '../../../../../lib/access.js';
import { operatorStatusAllowed } from '../../../../../lib/marketplace-rules.mjs';
import { database } from '../../../../../lib/db.js';
export async function PATCH(req,{params}) {
  try{
    requireSameOrigin(req);
    const admin=await requireAdmin();
    const {id}=await params;
    if(!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({error:'Invalid operator.'},{status:400});
    let body;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
    if(!operatorStatusAllowed(body?.status))return NextResponse.json({error:'Invalid status.'},{status:400});
    const client=await database().connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(
        'UPDATE operators SET status=$1,approved_at=CASE WHEN $1=\'approved\' THEN NOW() ELSE approved_at END WHERE user_id=$2 RETURNING user_id,status',
        [body.status,id]);
      if(!r.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Operator not found.'},{status:404});}
      if(body.status!=='approved') await client.query('UPDATE resources SET active=false,updated_at=NOW() WHERE operator_id=$1',[id]);
      await client.query('INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',
        [admin.id,'operator.'+body.status,'operator',id]);
      await client.query('COMMIT');
      return NextResponse.json({operator:r.rows[0]});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  }catch(e){return jsonError(e);}
}
