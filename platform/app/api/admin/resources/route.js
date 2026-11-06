import { NextResponse } from 'next/server';
import { requireAdmin,jsonError } from '../../../../lib/access.js';
import { database } from '../../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  try{
    await requireAdmin();
    const r=await database().query(
      'SELECT r.id,r.title,r.subtitle,r.city,r.area,r.kind,r.price_per_hour,r.review_status,r.active,r.created_at,o.business_name,o.status AS operator_status FROM resources r LEFT JOIN operators o ON o.user_id=r.operator_id ORDER BY CASE WHEN r.review_status=\'pending\' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200');
    return NextResponse.json({resources:r.rows},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return jsonError(e);}
}
