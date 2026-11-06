import { NextResponse } from 'next/server';
import { requireAdmin,jsonError } from '../../../../lib/access.js';
import { database } from '../../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET(){
  try{
    await requireAdmin();
    const r=await database().query(
      'SELECT o.user_id,o.business_name,o.city,o.contact_email,o.status,o.requested_at,u.email FROM operators o JOIN users u ON u.id=o.user_id ORDER BY o.requested_at DESC LIMIT 200');
    return NextResponse.json({operators:r.rows},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return jsonError(e);}
}
