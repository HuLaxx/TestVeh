// VEH / deterministic fictional mobility inventory and pure local demo ride rules.
// These objects are NOT real-world inventory, telemetry, prices or geo coordinates.
export const HOLD_MS=10*60*1000;
export const TIME_MULTIPLIER=20;
export const STATIONS=Object.freeze([
 {id:'central',name:'Central Loop',area:'Design District',x:27,y:49,eta:4,charging:2,docks:6},
 {id:'river',name:'Riverbend',area:'Canal Walk',x:70,y:65,eta:8,charging:2,docks:4},
 {id:'park',name:'Park Circuit',area:'Garden Quarter',x:42,y:23,eta:6,charging:3,docks:5},
 {id:'metro',name:'Metro Link',area:'Transit Interchange',x:77,y:26,eta:5,charging:2,docks:7},
 {id:'east',name:'East Studio',area:'Arts Quarter',x:22,y:79,eta:9,charging:1,docks:3}
]);
export const BIKES=Object.freeze([
 {id:'VE-014',name:'Volt City One',type:'city',station:'central',battery:86,maxRange:55,rate:3,unlock:15,status:'available',tag:'EVERYDAY GLIDE'},
 {id:'VE-015',name:'Moss Cargo',type:'cargo',station:'central',battery:64,maxRange:48,rate:4,unlock:19,status:'available',tag:'CARRY MORE'},
 {id:'VE-021',name:'River Runner',type:'sport',station:'river',battery:73,maxRange:65,rate:4,unlock:19,status:'available',tag:'LONGER ROUTES'},
 {id:'VE-022',name:'Current Lite',type:'city',station:'river',battery:92,maxRange:52,rate:3,unlock:15,status:'available',tag:'RANGE READY'},
 {id:'VE-031',name:'Park Glide',type:'city',station:'park',battery:54,maxRange:44,rate:3,unlock:15,status:'available',tag:'EASY URBAN'},
 {id:'VE-041',name:'Metro Sprint',type:'sport',station:'metro',battery:38,maxRange:65,rate:4,unlock:19,status:'available',tag:'QUICK CONNECTION'},
 {id:'VE-051',name:'Studio Cruiser',type:'city',station:'east',battery:78,maxRange:52,rate:3,unlock:15,status:'available',tag:'SMOOTH RIDING'},
 {id:'VE-099',name:'Dock Charge Unit',type:'city',station:'metro',battery:19,maxRange:52,rate:3,unlock:15,status:'charging',tag:'CHARGING / UNAVAILABLE'}
]);
export function stationFor(id){return STATIONS.find(s=>s.id===id)||null;}
export function bikeFor(id){return BIKES.find(b=>b.id===id)||null;}
export function rangeKm(bike,battery=bike?.battery){
 if(!bike||!Number.isFinite(battery))return 0;
 return Math.round(Math.max(0,Math.min(100,battery))*bike.maxRange/100*10)/10;
}
export function money(amount){
 if(!Number.isFinite(amount)||amount<0)throw Error('Invalid fare');
 return '₹'+Math.round(amount).toLocaleString('en-IN');
}
export function fareFor(bike,minutes){
 if(!bike||!Number.isFinite(minutes)||minutes<0)throw Error('Invalid ride');
 return bike.unlock+Math.max(1,Math.ceil(minutes))*bike.rate;
}
export function quoteFor(bike,minutes=15){
 return {fare:fareFor(bike,minutes),battery:bike.battery,range:rangeKm(bike)};
}
export function getPhase(session,now=Date.now()){
 if(!session||session.phase==='idle')return 'idle';
 if(session.phase==='reserved'&&Number.isFinite(session.holdEndsAt)&&now>=session.holdEndsAt)return 'expired';
 return ['reserved','riding','paused','completed'].includes(session.phase)?session.phase:'idle';
}
export function reserveBike(current,bikeId,now=Date.now()){
 if(!Number.isFinite(now))throw Error('Invalid time');
 const bike=bikeFor(bikeId);
 if(!bike||bike.status!=='available')throw Error('This sample bike is not available');
 if(['reserved','riding','paused'].includes(getPhase(current,now)))throw Error('Finish or cancel your current demo journey first');
 return {phase:'reserved',bikeId,createdAt:now,holdEndsAt:now+HOLD_MS,elapsedRealMs:0,segmentStartedAt:0};
}
export function startRide(session,now=Date.now()){
 if(getPhase(session,now)!=='reserved')throw Error('No valid reservation. Reserve a bike first.');
 return {...session,phase:'riding',rideStartedAt:now,segmentStartedAt:now,elapsedRealMs:0};
}
export function pauseRide(session,now=Date.now()){
 if(getPhase(session,now)!=='riding')throw Error('No active ride to pause');
 return {...session,phase:'paused',elapsedRealMs:Math.max(0,session.elapsedRealMs+(now-session.segmentStartedAt)),segmentStartedAt:0};
}
export function resumeRide(session,now=Date.now()){
 if(getPhase(session,now)!=='paused')throw Error('No paused ride to resume');
 return {...session,phase:'riding',segmentStartedAt:now};
}
export function rideMetrics(session,now=Date.now()){
 if(!session)throw Error('Missing ride');
 const bike=bikeFor(session.bikeId);
 if(!bike)throw Error('Unknown bike');
 const phase=getPhase(session,now);
 const accumulated=Math.max(0,Number(session.elapsedRealMs)||0);
 const incremental=phase==='riding'?Math.max(0,now-(Number(session.segmentStartedAt)||now)):0;
 const simMs=(accumulated+incremental)*TIME_MULTIPLIER;
 const simMins=simMs/60000;
 const distance=Math.min(55,simMs/3600000*13);
 const battery=Math.max(0,bike.battery-100*distance/bike.maxRange);
 const spent=phase==='reserved'?0:fareFor(bike,simMins);
 return {phase,bike,battery:Math.round(battery),rangeKm:rangeKm(bike,battery),distanceKm:Math.round(distance*10)/10,simulatedMs:simMs,simulatedMinutes:simMins,fare:spent,progress:Math.min(1,distance/8)};
}
export function completeRide(session,now=Date.now()){
 if(!['riding','paused'].includes(getPhase(session,now)))throw Error('Start your ride before ending it');
 const metrics=rideMetrics(session,now);
 const complete={...session,phase:'completed',completedAt:now,summary:{bikeId:session.bikeId,station:metrics.bike.station,rideStartedAt:session.rideStartedAt,endedAt:now,distanceKm:metrics.distanceKm,batteryEnd:metrics.battery,minutes:Math.max(1,Math.ceil(metrics.simulatedMinutes)),fare:metrics.fare}};
 return complete;
}
export function routeForStation(stationId){
 const s=stationFor(stationId)||STATIONS[0];
 const start=[Math.round(s.x*9),Math.round(s.y*6.1)];
 return [start,[Math.min(810,start[0]+95),Math.max(110,start[1]-56)],[Math.min(810,start[0]+189),Math.min(510,start[1]+40)],[Math.min(820,start[0]+255),Math.max(70,start[1]-25)]];
}
export function routePoint(stationId,progress){
 const pts=routeForStation(stationId);
 const p=Math.max(0,Math.min(1,Number(progress)||0))*(pts.length-1);
 const i=Math.min(pts.length-2,Math.floor(p));
 const f=p-i;
 return {x:pts[i][0]+(pts[i+1][0]-pts[i][0])*f,y:pts[i][1]+(pts[i+1][1]-pts[i][1])*f};
}
