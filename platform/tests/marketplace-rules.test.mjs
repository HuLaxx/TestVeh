import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseOperatorApplication,parseResource,decisionAllowed,
  reviewStatusAllowed,operatorStatusAllowed
} from '../lib/marketplace-rules.mjs';

const resource={
  kind:'parking',title:'Secure parking',subtitle:'Covered hourly parking',
  city:'Pune',area:'Baner',price_per_hour:80,features:['Covered','CCTV']
};

test('validates and normalizes partner applications',()=>{
  const p=parseOperatorApplication({businessName:'  Mobility Partners ',city:' Pune ',contactEmail:'  SALES@EXAMPLE.COM '});
  assert.deepEqual(p,{businessName:'Mobility Partners',city:'Pune',contactEmail:'sales@example.com'});
  assert.throws(()=>parseOperatorApplication({businessName:'X',city:'Pune',contactEmail:'no'}),/Business name/);
});

test('accepts a valid listing with bounded integer rupee price',()=>{
  const x=parseResource({...resource,features:['Covered','Covered',' CCTV ']});
  assert.equal(x.price_per_hour,80);
  assert.deepEqual(x.features,['Covered','CCTV']);
  assert.equal(x.city,'Pune');
});

test('rejects invalid prices, types and oversized fields',()=>{
  assert.throws(()=>parseResource({...resource,price_per_hour:-10}),/price/);
  assert.throws(()=>parseResource({...resource,price_per_hour:2.5}),/price/);
  assert.throws(()=>parseResource({...resource,kind:'flight'}),/service/);
  assert.throws(()=>parseResource({...resource,title:'x'.repeat(101)}),/title/);
  assert.throws(()=>parseResource({...resource,features:Array(9).fill('CCTV')}),/eight/);
});

test('only permitted reservation transitions are allowed',()=>{
  const future='2026-12-10T12:00:00.000Z';
  const past='2026-11-05T12:00:00.000Z';
  const now=new Date('2026-11-06T12:00:00.000Z');
  assert.ok(decisionAllowed('requested','confirmed',future,now));
  assert.equal(decisionAllowed('requested','confirmed',past,now),false);
  assert.ok(decisionAllowed('requested','rejected',future,now));
  assert.ok(decisionAllowed('confirmed','completed',past,now));
  assert.equal(decisionAllowed('confirmed','completed',future,now),false);
  assert.equal(decisionAllowed('cancelled','confirmed',future,now),false);
  assert.equal(decisionAllowed('rejected','confirmed',future,now),false);
});

test('restricts administrator state decisions',()=>{
  assert.ok(reviewStatusAllowed('approved'));
  assert.ok(reviewStatusAllowed('rejected'));
  assert.equal(reviewStatusAllowed('pending'),false);
  assert.ok(operatorStatusAllowed('suspended'));
  assert.equal(operatorStatusAllowed('pending'),false);
});
