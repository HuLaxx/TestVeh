
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/access.js';
import { database,configured } from '../../../../lib/db.js';
import { cleanEmail,validEmail,hashPassword,issueSession } from '../../../../lib/auth.js';
export async function POST(req) {
  if(!sameOrigin(req))return NextResponse.json({error:'Request origin not allowed.'},{status:403});
  if(!configured())return NextResponse.json({error:'Accounts require a connected database.'},{status:503});
  try {
    const data=await req.json();
    const email=cleanEmail(data.email), name=String(data.name||'').trim(),password=String(data.password||'');
    if(!validEmail(email)||name.length<2||name.length>80||password.length<12||password.length>128)
      return NextResponse.json({error:'Use a valid email, name (2–80 characters), and password (12–128 characters).'},{status:400});
    const hash=await hashPassword(password);
    const result=await database().query('INSERT INTO users(email,display_name,password_hash) VALUES($1,$2,$3) RETURNING id,email,display_name',[email,name,hash]);
    const user=result.rows[0];await issueSession(user.id);
    return NextResponse.json({user},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(e) {
    if(e.code==='23505')return NextResponse.json({error:'Account already exists for that email.'},{status:409});
    return NextResponse.json({error:'Unable to create account.'},{status:503});
  }
}
