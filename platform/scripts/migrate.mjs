
import { readFile } from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL in your environment before migrating.');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
try{
  await db.connect();
  await db.query(await readFile(new URL('../sql/001_init.sql',import.meta.url),'utf8'));
  console.log('TestVeh database schema installed successfully.');
}finally{await db.end();}
