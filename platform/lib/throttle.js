import { createHash } from 'node:crypto';
import { database } from './db.js';

// Shared PostgreSQL throttling: unlike in-memory counters, it works across
// independent serverless functions. Only a hash of the login identifier is stored.
export async function allowLoginAttempt(email) {
  const key='login:'+createHash('sha256').update(String(email).toLowerCase()).digest('hex');
  const r=await database().query(`
    INSERT INTO auth_rate_limits(key,attempts,reset_at) VALUES($1,1,NOW()+INTERVAL '15 minutes')
    ON CONFLICT(key) DO UPDATE
      SET attempts=CASE WHEN auth_rate_limits.reset_at < NOW() THEN 1 ELSE auth_rate_limits.attempts+1 END,
          reset_at=CASE WHEN auth_rate_limits.reset_at < NOW() THEN NOW()+INTERVAL '15 minutes' ELSE auth_rate_limits.reset_at END
    RETURNING attempts
  `,[key]);
  return r.rows[0].attempts<=12;
}
