import test from 'node:test';
import assert from 'node:assert/strict';
import { inventorySearchParams,parseInterval,totalInPaise } from '../lib/booking-rules.mjs';

const now = new Date('2026-11-06T00:00:00.000Z');

test('availability search is optional until both dates are chosen', () => {
  assert.equal(inventorySearchParams('', '' ,now),'');
  assert.equal(inventorySearchParams('2026-11-07T12:00:00Z','',now),'');
});

test('availability search sends the exact validated UTC booking interval', () => {
  const params=inventorySearchParams('2026-11-07T10:00:00+05:30','2026-11-07T12:30:00+05:30',now);
  const query=new URLSearchParams(params.slice(1));
  assert.equal(query.get('start'),'2026-11-07T04:30:00.000Z');
  assert.equal(query.get('end'),'2026-11-07T07:00:00.000Z');
});

test('invalid availability windows cannot be sent to inventory API',()=>{
  assert.throws(()=>inventorySearchParams('2026-11-07T12:00:00Z','2026-11-07T11:00:00Z',now),/after/);
  assert.throws(()=>inventorySearchParams('2026-11-07T12:00:00Z','2026-11-16T12:00:00Z',now),/seven days/);
});

test('reservation duration and paise calculation remain consistent',()=>{
  const r=parseInterval('2026-11-07T10:00:00Z','2026-11-07T11:30:00Z',now);
  assert.equal(totalInPaise(220,r.hours),33000);
});
