
import { NextResponse } from 'next/server';
import { revokeSession } from '../../../../lib/auth.js';
import { configured } from '../../../../lib/db.js';
import { sameOrigin } from '../../../../lib/access.js';
export async function POST(req) {
  if(!sameOrigin(req))return NextResponse.json({error:'Request origin not allowed.'},{status:403});
  if(configured())try{await revokeSession();}catch{return NextResponse.json({error:'Sign-out unavailable.'},{status:503});}
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
