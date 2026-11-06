
import { NextResponse } from 'next/server';
import { currentUser } from '../../../../lib/auth.js';
import { configured } from '../../../../lib/db.js';
export const dynamic='force-dynamic';
export async function GET() {
  if(!configured())return NextResponse.json({user:null});
  try{return NextResponse.json({user:await currentUser()},{headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({error:'Session unavailable'},{status:503});}
}
