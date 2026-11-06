import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

// This test intentionally uses a disposable database; never run against production.
test('PostgreSQL holds prevent overlap and allow reuse after expiry', {
  skip:!process.env.TEST_DATABASE_URL
}, async () => {
  const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});
  await db.connect();
  try {
    await db.query('BEGIN');
    const userId=randomUUID(),resourceId=randomUUID();
    await db.query('INSERT INTO users(id,email,display_name,password_hash) VALUES($1,$2,$3,$4)',
      [userId,'ci-'+userId+'@example.invalid','CI Operator','not-a-real-hash']);
    await db.query("INSERT INTO operators(user_id,business_name,city,contact_email,status) VALUES($1,$2,$3,$4,'approved')",
      [userId,'CI Mobility','Pune','ci@example.invalid']);
    await db.query("INSERT INTO resources(id,operator_id,kind,title,city,area,price_per_hour,active,review_status) VALUES($1,$2,'parking',$3,$4,$5,$6,true,'approved')",
      [resourceId,userId,'CI parking','Pune','Baner',50]);
    const start='2026-12-05T10:00:00.000Z',end='2026-12-05T11:00:00.000Z';
    const insert=async() => db.query(
      "INSERT INTO reservations(resource_id,user_id,start_at,end_at,status,total_paise,expires_at) VALUES($1,$2,$3,$4,'requested',5000,NOW()+INTERVAL '2 hours') RETURNING id",
      [resourceId,userId,start,end]);
    const first=await insert();
    await db.query('SAVEPOINT before_overlap');
    let overlapError=null;
    try{await insert();}catch(e){overlapError=e;}
    assert.equal(overlapError?.code,'23P01');
    await db.query('ROLLBACK TO SAVEPOINT before_overlap');
    await db.query("UPDATE reservations SET status='expired' WHERE id=$1",[first.rows[0].id]);
    const newRequest=await insert();
    assert.ok(newRequest.rows[0].id);
  }finally{
    await db.query('ROLLBACK').catch(()=>{});
    await db.end();
  }
});
