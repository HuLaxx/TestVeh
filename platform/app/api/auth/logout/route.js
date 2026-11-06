
import { NextResponse } from 'next/server';
import { revokeSession } from '../../../../lib/auth.js';
import { configured } from '../../../../lib/db.js';
export async function POST() {
  if(configured())try{await revokeSession();}catch{return NextResponse.json({error:'Sign-out unavailable.'},{status:503});}
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
