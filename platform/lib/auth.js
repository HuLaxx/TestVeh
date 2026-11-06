
import { randomBytes,createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { database } from './db.js';
const COOKIE='testveh_session';
const digest=s=>createHash('sha256').update(s).digest('hex');
const SEVEN_DAYS=7*24*60*60*1000;
export async function currentUser() {
  const token=(await cookies()).get(COOKIE)?.value;
  if(!token) return null;
  const r=await database().query(
    'SELECT u.id,u.email,u.display_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() LIMIT 1',
    [digest(token)]
  );
  return r.rows[0]||null;
}
export async function issueSession(userId) {
  const token=randomBytes(32).toString('hex');
  await database().query('INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)',
    [userId,digest(token),new Date(Date.now()+SEVEN_DAYS)]);
  (await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:604800});
}
export async function revokeSession() {
  const jar=await cookies();
  const token=jar.get(COOKIE)?.value;
  if(token) await database().query('DELETE FROM sessions WHERE token_hash=$1',[digest(token)]);
  jar.delete(COOKIE);
}
export function cleanEmail(e) {return String(e||'').trim().toLowerCase();}
export function validEmail(e) {return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)&&e.length<=254;}
export async function hashPassword(password){return bcrypt.hash(password,12);}
export async function verifyPassword(password,hash){return bcrypt.compare(password,hash);}
