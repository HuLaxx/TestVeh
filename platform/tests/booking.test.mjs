
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseInterval,totalInPaise} from '../lib/booking-rules.mjs';
const now=new Date('2026-11-06T00:00:00Z');
test('converts a valid booking to UTC',()=>{
 const x=parseInterval('2026-11-07T10:00:00Z','2026-11-07T12:30:00Z',now);
 assert.equal(x.hours,2.5);assert.equal(totalInPaise(120,x.hours),30000);
});
test('rejects invalid and stale bookings',()=>{
 assert.throws(()=>parseInterval('bad','2026-11-07T10:00:00Z',now),/valid/);
 assert.throws(()=>parseInterval('2026-11-07T10:00:00Z','2026-11-07T09:00:00Z',now),/after/);
 assert.throws(()=>parseInterval('2026-11-06T00:05:00Z','2026-11-06T01:00:00Z',now),/ten minutes/);
});
test('rejects extremely long reservations and bad prices',()=>{
 assert.throws(()=>parseInterval('2026-11-07T10:00:00Z','2026-12-07T10:00:00Z',now),/seven days/);
 assert.throws(()=>totalInPaise(-1,2),/Invalid/);
});
