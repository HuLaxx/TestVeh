
import { NextResponse } from 'next/server';
import { configured,database } from '../../../../lib/db.js';
import { currentUser } from '../../../../lib/auth.js';
import { sameOrigin } from '../../../../lib/access.js';
export async function DELETE(req,{params}) {
  if(!sameOrigin(req))return NextResponse.json({error:'Request origin not allowed.'},{status:403});
  if(!configured())return NextResponse.json({error:'Database required'},{status:503});
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Invalid booking'},{status:400});
  try{
    const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
    const r=await database().query(
      'UPDATE reservations SET status=$1,updated_at=NOW() WHERE id=$2 AND user_id=$3 AND status=$4 RETURNING id,status',
      ['cancelled',id,user.id,'requested']);
    if(!r.rowCount)return NextResponse.json({error:'Booking not found or cannot be cancelled online.'},{status:404});
    return NextResponse.json({booking:r.rows[0]},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Cancellation unavailable'},{status:503});}
}
