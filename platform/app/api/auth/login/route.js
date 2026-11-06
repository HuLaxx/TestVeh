
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/access.js';
import { database,configured } from '../../../../lib/db.js';
import { cleanEmail,verifyPassword,issueSession } from '../../../../lib/auth.js';
export async function POST(req) {
  if(!sameOrigin(req))return NextResponse.json({error:'Request origin not allowed.'},{status:403});
  if(!configured())return NextResponse.json({error:'Accounts require a connected database.'},{status:503});
  try {
    const d=await req.json();const email=cleanEmail(d.email),password=String(d.password||'');
    if(email.length>254||password.length>128)return NextResponse.json({error:'Invalid credentials.'},{status:401});
    const r=await database().query('SELECT id,email,display_name,password_hash FROM users WHERE email=$1',[email]);
    const user=r.rows[0];
    if(!user||!await verifyPassword(password,user.password_hash))return NextResponse.json({error:'Invalid credentials.'},{status:401});
    await issueSession(user.id);
    return NextResponse.json({user:{id:user.id,email:user.email,display_name:user.display_name}},{headers:{'Cache-Control':'no-store'}});
  } catch {return NextResponse.json({error:'Authentication unavailable.'},{status:503});}
}
