import { NextResponse } from 'next/server';
import { requireOperator,requireSameOrigin,jsonError,invalidInput } from '../../../../../lib/access.js';
import { parseResource } from '../../../../../lib/marketplace-rules.mjs';
import { database } from '../../../../../lib/db.js';
const validId=x=>/^[a-f0-9-]{36}$/i.test(x);
export async function PATCH(req,{params}) {
  try{
    requireSameOrigin(req);
    const {user}=await requireOperator();
    const {id}=await params;
    if(!validId(id))return NextResponse.json({error:'Invalid resource.'},{status:400});
    let data;try{data=parseResource(await req.json());}catch(e){return invalidInput(e);}
    const client=await database().connect();
    try{
      await client.query('BEGIN');
      // Lock the resource before inspecting bookings, matching reservation creation lock order.
      const owned=await client.query('SELECT id FROM resources WHERE id=$1 AND operator_id=$2 FOR UPDATE',[id,user.id]);
      if(!owned.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Listing not found.'},{status:404});}
      const future=await client.query("SELECT EXISTS(SELECT 1 FROM reservations WHERE resource_id=$1 AND status IN ('requested','confirmed') AND end_at>NOW()) AS busy",[id]);
      if(future.rows[0].busy){await client.query('ROLLBACK');return NextResponse.json({error:'Resolve outstanding bookings before editing this listing.'},{status:409});}
      const r=await client.query(
        'UPDATE resources SET kind=$1,title=$2,subtitle=$3,city=$4,area=$5,price_per_hour=$6,features=$7,review_status=\'pending\',active=false,updated_at=NOW() WHERE id=$8 AND operator_id=$9 RETURNING id,review_status',
        [data.kind,data.title,data.subtitle,data.city,data.area,data.price_per_hour,JSON.stringify(data.features),id,user.id]);
      if(!r.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Listing not found.'},{status:404});}
      await client.query('INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',
        [user.id,'resource.resubmitted','resource',id]);
      await client.query('COMMIT');
      return NextResponse.json({resource:r.rows[0],message:'Changes sent for re-review. Listing unpublished.'});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  }catch(e){return jsonError(e);}
}
export async function DELETE(req,{params}) {
  try{
    requireSameOrigin(req);
    const {user}=await requireOperator();
    const {id}=await params;
    if(!validId(id))return NextResponse.json({error:'Invalid resource.'},{status:400});
    const client=await database().connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(
        'UPDATE resources SET active=false,updated_at=NOW() WHERE id=$1 AND operator_id=$2 RETURNING id',[id,user.id]);
      if(!r.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Listing not found.'},{status:404});}
      await client.query('INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',
        [user.id,'resource.unpublished','resource',id]);
      await client.query('COMMIT');
      return NextResponse.json({ok:true});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  }catch(e){return jsonError(e);}
}
