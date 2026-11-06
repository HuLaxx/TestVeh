import { NextResponse } from 'next/server';
import { requireAdmin,requireSameOrigin,jsonError } from '../../../../../lib/access.js';
import { reviewStatusAllowed } from '../../../../../lib/marketplace-rules.mjs';
import { database } from '../../../../../lib/db.js';
export async function PATCH(req,{params}) {
  try{
    requireSameOrigin(req);
    const admin=await requireAdmin();
    const {id}=await params;
    if(!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Invalid listing.'},{status:400});
    let body;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
    if(!reviewStatusAllowed(body?.status))return NextResponse.json({error:'Invalid review decision.'},{status:400});
    const client=await database().connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(
        'SELECT r.id,r.review_status,o.status AS operator_status FROM resources r LEFT JOIN operators o ON o.user_id=r.operator_id WHERE r.id=$1 FOR UPDATE OF r',[id]);
      if(!r.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Listing not found.'},{status:404});}
      if(body.status==='approved' && r.rows[0].operator_status!=='approved'){
        await client.query('ROLLBACK');return NextResponse.json({error:'Approve the operator first.'},{status:409});
      }
      const updated=await client.query(
        'UPDATE resources SET review_status=$1,active=$2,updated_at=NOW() WHERE id=$3 RETURNING id,review_status,active',
        [body.status,body.status==='approved',id]);
      await client.query('INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',
        [admin.id,'resource.'+body.status,'resource',id]);
      await client.query('COMMIT');
      return NextResponse.json({resource:updated.rows[0]});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  }catch(e){return jsonError(e);}
}
