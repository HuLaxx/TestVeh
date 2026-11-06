import { NextResponse } from 'next/server';
import { currentUser } from './auth.js';
import { configured,database } from './db.js';

export class ApiError extends Error {
  constructor(message,status=400) {super(message);this.status=status;}
}
export function sameOrigin(req) {
  const origin=req.headers.get('origin');
  const host=req.headers.get('host')||req.headers.get('x-forwarded-host');
  try{
    if(!origin || !host || new URL(origin).host.toLowerCase()!==host.toLowerCase()) return false;
    return new URL(origin).protocol==='https:' || (new URL(origin).protocol==='http:' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host));
  }catch{return false;}
}
export function requireSameOrigin(req) {
  if(!sameOrigin(req)) throw new ApiError('Request origin not allowed.',403);
}
export async function requireUser() {
  if(!configured()) throw new ApiError('Accounts require a connected database.',503);
  const user=await currentUser();
  if(!user) throw new ApiError('Sign in required.',401);
  return user;
}
export async function requireOperator() {
  const user=await requireUser();
  const r=await database().query(
    'SELECT user_id,business_name,city,status FROM operators WHERE user_id=$1',[user.id]);
  if(r.rows[0]?.status!=='approved') throw new ApiError('Approved operator account required.',403);
  return {user,operator:r.rows[0]};
}
export async function requireAdmin() {
  const user=await requireUser();
  const r=await database().query('SELECT user_id FROM platform_admins WHERE user_id=$1',[user.id]);
  if(!r.rowCount) throw new ApiError('Administrator access required.',403);
  return user;
}
export function jsonError(e) {
  if(e instanceof ApiError)return NextResponse.json({error:e.message},{status:e.status});
  return NextResponse.json({error:'Service temporarily unavailable.'},{status:503});
}
export function invalidInput(e) {
  return NextResponse.json({error:e?.message||'Invalid request.'},{status:400});
}
