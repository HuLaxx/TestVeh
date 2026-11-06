
import { readFile } from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL in your environment before migrating.');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
try{
  await db.connect();
  for(const file of ['001_init.sql','002_marketplace.sql','003_auth_limits.sql']) {
    await db.query(await readFile(new URL('../sql/'+file,import.meta.url),'utf8'));
    console.log('Applied '+file);
  }
  console.log('TestVeh marketplace schema is ready.');
}finally{await db.end();}
