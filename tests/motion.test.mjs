import test from 'node:test';
import assert from 'node:assert/strict';
import {STATIONS,BIKES,HOLD_MS,TIME_MULTIPLIER,stationFor,bikeFor,rangeKm,fareFor,quoteFor,getPhase,reserveBike,startRide,pauseRide,resumeRide,rideMetrics,completeRide,routeForStation,routePoint} from '../site/motion-model.mjs';
const now=1_800_000_000_000;
test('fictional sample fleet is station-bound and realistic statuses are explicit',()=>{
 assert.equal(STATIONS.length,5);
 assert.equal(BIKES.length,8);
 assert.equal(new Set(BIKES.map(b=>b.id)).size,8);
 assert.ok(BIKES.every(b=>stationFor(b.station)&&b.battery>=0&&b.battery<=100));
 assert.equal(bikeFor('VE-099').status,'charging');
 assert.equal(BIKES.filter(b=>b.status==='available').length,7);
});
test('battery and fare estimates never claim live bike readings',()=>{
 const b=bikeFor('VE-014');
 assert.equal(rangeKm(b),47.3);
 assert.equal(rangeKm(b,0),0);
 assert.equal(rangeKm(b,100),55);
 assert.equal(quoteFor(b,15).fare,60);
 assert.equal(fareFor(b,0),18);
 assert.throws(()=>fareFor(b,-1),/Invalid/);
});
test('reserve only available sample bike and reject competing local journeys',()=>{
 const a=reserveBike(null,'VE-014',now);
 assert.equal(a.holdEndsAt-now,HOLD_MS);
 assert.equal(getPhase(a,now),'reserved');
 assert.equal(getPhase(a,now+HOLD_MS),'expired');
 assert.throws(()=>reserveBike(a,'VE-021',now+2_000),/Finish or cancel/);
 assert.throws(()=>reserveBike(null,'VE-099',now),/not available/);
 assert.doesNotThrow(()=>reserveBike(a,'VE-021',now+HOLD_MS+1));
});
test('expired reservation is not unlockable',()=>{
 const a=reserveBike(null,'VE-014',now);
 assert.throws(()=>startRide(a,now+HOLD_MS),/valid reservation/);
});
test('ride telemetry is simulated, deterministic and monotone',()=>{
 const hold=reserveBike(null,'VE-014',now);
 const ride=startRide(hold,now+1000);
 const initial=rideMetrics(ride,now+1000);
 const after=rideMetrics(ride,now+61_000);
 assert.equal(initial.distanceKm,0);
 assert.equal(after.simulatedMs,60_000*TIME_MULTIPLIER);
 assert.ok(after.distanceKm>0);
 assert.ok(after.battery<86);
 assert.ok(after.rangeKm<47.3);
 assert.ok(after.fare>15);
});
test('pause and resume freeze the simulated ride clock without double count',()=>{
 const s=startRide(reserveBike(null,'VE-021',now),now+100);
 const paused=pauseRide(s,now+10_100);
 assert.equal(getPhase(paused),'paused');
 const a=rideMetrics(paused,now+20_100);
 const b=rideMetrics(paused,now+200_100);
 assert.equal(a.distanceKm,b.distanceKm);
 const resumed=resumeRide(paused,now+200_100);
 const c=rideMetrics(resumed,now+210_100);
 assert.ok(c.distanceKm>b.distanceKm);
 const ended=completeRide(resumed,now+220_100);
 assert.equal(ended.phase,'completed');
 assert.equal(ended.summary.bikeId,'VE-021');
 assert.ok(ended.summary.fare>0);
 assert.throws(()=>completeRide(ended,now+220_101),/Start your ride/);
});
test('routes are schematics with interpolated coordinates',()=>{
 const pts=routeForStation('park');
 assert.equal(pts.length,4);
 assert.deepEqual(routePoint('park',0),{x:pts[0][0],y:pts[0][1]});
 assert.deepEqual(routePoint('park',1),{x:pts[3][0],y:pts[3][1]});
 const p=routePoint('park',0.5);
 assert.ok(p.x>pts[0][0]&&Number.isFinite(p.y));
});
