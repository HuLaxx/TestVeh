import { NextResponse } from 'next/server';
import { requireUser,jsonError } from '../../../../lib/access.js';
import { database } from '../../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  try{
    const user=await requireUser();
    const r=await database().query('SELECT user_id,business_name,city,status,requested_at,approved_at FROM operators WHERE user_id=$1',[user.id]);
    return NextResponse.json({user,operator:r.rows[0]||null},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return jsonError(e);}
}
