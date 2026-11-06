import { NextResponse } from 'next/server';
import { requireOperator,requireSameOrigin,jsonError,invalidInput } from '../../../../lib/access.js';
import { parseResource } from '../../../../lib/marketplace-rules.mjs';
import { database } from '../../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  try{
    const {user}=await requireOperator();
    const r=await database().query(
      'SELECT id,kind,title,subtitle,city,area,price_per_hour,features,active,review_status,created_at FROM resources WHERE operator_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]);
    return NextResponse.json({resources:r.rows},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return jsonError(e);}
}
export async function POST(req) {
  try{
    requireSameOrigin(req);
    const {user}=await requireOperator();
    let data;try{data=parseResource(await req.json());}catch(e){return invalidInput(e);}
    const client=await database().connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(
        'INSERT INTO resources(operator_id,kind,title,subtitle,city,area,price_per_hour,features,active,review_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,false,\'pending\') RETURNING id,review_status',
        [user.id,data.kind,data.title,data.subtitle,data.city,data.area,data.price_per_hour,JSON.stringify(data.features)]);
      await client.query('INSERT INTO audit_events(actor_user_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',
        [user.id,'resource.submitted','resource',r.rows[0].id]);
      await client.query('COMMIT');
      return NextResponse.json({resource:r.rows[0],message:'Submitted for review. Not publicly bookable yet.'},{status:201});
    }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
  }catch(e){return jsonError(e);}
}
