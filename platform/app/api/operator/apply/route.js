import { NextResponse } from 'next/server';
import { requireUser,requireSameOrigin,jsonError,invalidInput } from '../../../../lib/access.js';
import { parseOperatorApplication } from '../../../../lib/marketplace-rules.mjs';
import { database } from '../../../../lib/db.js';
export async function POST(req) {
  try{
    requireSameOrigin(req);
    const user=await requireUser();
    let data;try{data=parseOperatorApplication(await req.json());}catch(e){return invalidInput(e);}
    const result=await database().query(
      'INSERT INTO operators(user_id,business_name,city,contact_email) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO NOTHING RETURNING user_id,status',
      [user.id,data.businessName,data.city,data.contactEmail]);
    if(!result.rowCount) return NextResponse.json({error:'An operator application already exists.'},{status:409});
    return NextResponse.json({operator:result.rows[0],message:'Application submitted for manual review.'},{status:201});
  }catch(e){return jsonError(e);}
}
