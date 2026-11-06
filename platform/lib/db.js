
import pg from 'pg';
let instance;
export function configured() { return Boolean(process.env.DATABASE_URL); }
export function database() {
  if (!configured()) throw new Error('Database not configured. Real accounts and bookings are disabled.');
  if (!instance) instance = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 25000
  });
  return instance;
}
