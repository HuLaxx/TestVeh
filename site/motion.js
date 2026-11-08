import {STATIONS,BIKES,HOLD_MS,TIME_MULTIPLIER,stationFor,bikeFor,rangeKm,money,quoteFor,getPhase,reserveBike,startRide,pauseRide,resumeRide,rideMetrics,completeRide,routeForStation,routePoint} from './motion-model.mjs';

const $=id=>document.getElementById(id);
const KEY='hulax-veh-mobility-demo-v1';
const $all=selector=>document.querySelectorAll(selector);
let selectedBike='VE-014';
let selectedStation='all';
let selectedType='all';
let currentTab='explore';
let session={phase:'idle'};
let history=[];
let toastTimer=null;

function loadState(){
 try{
  const json=localStorage.getItem(KEY);
  if(!json)return;
  const saved=JSON.parse(json);
  if(!saved||typeof saved!=='object')return;
  if(saved.session&&bikeFor(saved.session.bikeId)&&['reserved','riding','paused','completed'].includes(saved.session.phase)){
   const s=saved.session;
   if(['reserved','riding','paused'].includes(s.phase)&&Number.isFinite(s.createdAt)&&Number.isFinite(s.holdEndsAt)&&s.holdEndsAt>s.createdAt&&Number.isFinite(s.elapsedRealMs)&&s.elapsedRealMs>=0&&Number.isFinite(s.segmentStartedAt)&&s.segmentStartedAt>=0&&s.createdAt<=Date.now()+60000){
    session=s;
   } else if(s.phase==='completed'&&s.summary)session=s;
  }
  if(Array.isArray(saved.history)){
   history=saved.history.filter(h=>h&&typeof h==='object'&&bikeFor(h.bikeId)&&Number.isFinite(h.endedAt)&&Number.isFinite(h.fare)&&h.fare>=0&&Number.isFinite(h.distanceKm)&&h.distanceKm>=0).slice(0,12);
  }
  if(bikeFor(saved.selectedBike))selectedBike=saved.selectedBike;
  if(stationFor(saved.selectedStation))selectedStation=saved.selectedStation;
 }catch{ /* unavailable or invalid local storage: run in-memory only */ }
 if(getPhase(session)==='expired')session={phase:'idle'};
 if(['reserved','riding','paused','completed'].includes(getPhase(session)))currentTab='ride';
}
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify({session,history,selectedBike,selectedStation}));}
 catch{showToast('Browser storage is unavailable. This demo session may not survive a reload.');}
}
function showToast(message){
 const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{el.hidden=true;},4500);
}
function dateLabel(ms){
 return new Date(ms).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function timeLabel(ms){
 const s=Math.max(0,Math.floor(ms/1000));
 const m=Math.floor(s/60);
 return String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
function bikeIsAvailable(b){
 return b.status==='available' && !(['reserved','riding','paused'].includes(getPhase(session))&&session.bikeId===b.id);
}
function availableCount(stationId){
 return BIKES.filter(b=>b.station===stationId&&bikeIsAvailable(b)).length;
}
function setTab(next){
 currentTab=next==='ride'?'ride':'explore';
 $('tabExplore').setAttribute('aria-selected',String(currentTab==='explore'));
 $('tabRide').setAttribute('aria-selected',String(currentTab==='ride'));
 $('explorePanel').hidden=currentTab!=='explore';
 $('ridePanel').hidden=currentTab!=='ride';
 $('tabExplore').tabIndex=currentTab==='explore'?0:-1;
 $('tabRide').tabIndex=currentTab==='ride'?0:-1;
 renderRide();
}
function focusNetwork(mode){
 if(mode)setTab(mode);
 $('network').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function renderStations(){
 const holder=$('stationMarkers');
 holder.replaceChildren();
 STATIONS.forEach(s=>{
  const count=availableCount(s.id);
  const btn=document.createElement('button');
  btn.type='button';btn.className='station-pin';
  btn.style.left=s.x+'%';btn.style.top=s.y+'%';
  btn.dataset.station=s.id;
  btn.dataset.selected=String(selectedStation===s.id);
  btn.dataset.count=String(count);
  btn.setAttribute('aria-label',s.name+', '+count+' sample bikes ready. Select station.');
  btn.innerHTML='<span class="pin-glyph" aria-hidden="true">ϟ</span><span><strong>'+s.name+'</strong><small>'+count+' READY / DEMO</small></span>';
  holder.append(btn);
 });
 const station=stationFor(selectedStation);
 $('stationName').textContent=station?station.name:'All demo stations';
 $('stationDetail').textContent=station?station.area+' · '+station.eta+' min fictional walk · '+station.charging+' charge points':'Select a location pin to browse its bikes';
 $('mapActiveBadge').textContent=station?station.name.toUpperCase():'ALL STATIONS';
 $('stationFilter').value=station?station.id:'all';
 $('statAvailable').textContent=BIKES.filter(b=>bikeIsAvailable(b)).length;
}
function getFilteredBikes(){
 return BIKES.filter(b=>(selectedStation==='all'||b.station===selectedStation)&&(selectedType==='all'||b.type===selectedType))
   .sort((a,b)=>Number(b.status==='available')-Number(a.status==='available')||b.battery-a.battery);
}
function renderBikes(){
 const bikes=getFilteredBikes();
 const el=$('bikeCards');
 el.replaceChildren();
 $('bikeCount').textContent=bikes.length+' SAMPLE BIKES MATCH';
 if(!bikes.length){
  el.innerHTML='<div class="no-bikes">No sample bikes match. Choose another station or ride type.</div>';
  return;
 }
 bikes.forEach(b=>{
  const station=stationFor(b.station);
  const available=bikeIsAvailable(b);
  const btn=document.createElement('button');btn.type='button';btn.className='bike-card';
  btn.dataset.bike=b.id;btn.dataset.selected=String(selectedBike===b.id);
  btn.disabled=!available;
  btn.setAttribute('aria-label',b.name+', '+b.battery+' percent battery, '+rangeKm(b)+' kilometres estimated range, '+station.name+'. '+(available?'Select this bike':'Unavailable'));
  const status=available?rangeKm(b)+' km range':'CHARGING / BUSY';
  btn.innerHTML='<span class="bike-small" aria-hidden="true">ϟ</span><span class="bike-info"><strong>'+b.name+'</strong><small>'+station.name+' · '+b.tag+'</small></span><span class="bike-end"><strong>'+b.battery+'% ϟ</strong><small>'+status+'</small><span class="battery-mini '+(b.battery<35?'low':'')+'"><i style="width:'+b.battery+'%"></i></span></span>';
  el.append(btn);
 });
}
function renderSelection(){
 const b=bikeFor(selectedBike);
 if(!b){$('bookBtn').disabled=true;return;}
 const station=stationFor(b.station);
 $('selectedName').textContent=b.name;
 $('selectedMeta').textContent=station.name+' · '+b.battery+'% · '+rangeKm(b)+' km estimate';
 $('selectedRate').textContent=money(b.rate)+'/min';
 $('priceEstimate').textContent=money(quoteFor(b,15).fare);
 $('bookBtn').disabled=!bikeIsAvailable(b)||['reserved','riding','paused'].includes(getPhase(session));
 $('bookBtn').querySelector('span').textContent=$('bookBtn').disabled?'×':'↗';
}
function renderHistory(){
 const box=$('historyList');
 box.replaceChildren();
 if(history.length===0){box.innerHTML='<div class="history-empty">NO RIDES YET. YOUR NEXT MOVE STARTS ABOVE. ↗</div>';return;}
 history.slice(0,10).forEach(h=>{
  const bike=bikeFor(h.bikeId);
  const div=document.createElement('div');div.className='history-item';
  const title=document.createElement('div');
  const name=document.createElement('strong');name.textContent=bike?bike.name:'Sample E-bike';
  const meta=document.createElement('span');meta.textContent=dateLabel(h.endedAt)+' · '+h.distanceKm.toFixed(1)+' km · '+(Math.round(h.minutes)||1)+' simulated min';
  title.append(name,meta);
  const cost=document.createElement('b');cost.textContent=money(h.fare);
  div.append(title,cost);box.append(div);
 });
}
function renderMapRoute(){
 const phase=getPhase(session);
 const valid=phase==='reserved'||phase==='riding'||phase==='paused';
 const line=$('routeLine'),cursor=$('routePulse');
 if(!valid){line.style.opacity='0';cursor.style.opacity='0';return;}
 const bike=bikeFor(session.bikeId);if(!bike)return;
 const points=routeForStation(bike.station);
 line.setAttribute('points',points.map(p=>p.join(',')).join(' '));
 line.style.opacity=phase==='reserved'?'0.4':'0.92';
 cursor.style.opacity=phase==='reserved'?'0':'1';
 if(phase!=='reserved'){
  const stats=rideMetrics(session);
  const point=routePoint(bike.station,stats.progress);
  cursor.setAttribute('cx',point.x.toFixed(1));cursor.setAttribute('cy',point.y.toFixed(1));
 }
}
function setStep(id,state){
 const el=$(id);el.classList.toggle('done',state==='done');el.classList.toggle('active',state==='active');
}
function resetRideButtons(){
 ['startRide','pauseRide','endRide','cancelRide','newRide'].forEach(id=>$(id).hidden=true);
 $('holdBox').hidden=true;
}
function renderRide(){
 const phase=getPhase(session);
 const b=bikeFor(session.bikeId);
 const active=['reserved','riding','paused'].includes(phase);
 $('rideDot').hidden=!active;$('tabRideIndicator').hidden=!active;
 resetRideButtons();
 $('rideBattery').textContent=b?b.battery+'%':'—';
 $('rideRange').textContent=b?rangeKm(b)+' km':'— km';
 $('rideDistance').innerHTML='0.0 <small>km</small>';
 $('rideTime').textContent='00:00';
 $('rideFare').textContent='₹0';
 $('batteryRing').style.background='conic-gradient(#b8e467 0% '+(b?b.battery:0)+'%,#d7e0d0 '+(b?b.battery:0)+'% 100%)';
 $('rideBikeName').textContent=b?b.name:'Choose an electric bike';
 $('rideBikeCode').textContent=b?b.id:'NO ACTIVE TRIP';
 ['stepReserve','stepNavigate','stepRide','stepReturn'].forEach(id=>setStep(id,''));
 if(phase==='idle'||phase==='expired'){
  $('ridePhaseBadge').textContent='STANDBY';
  $('rideTitle').innerHTML='YOUR<br><em>JOURNEY.</em>';
  $('rideDescription').textContent='Reserve an e-bike from the live demo fleet selector to begin.';
  $('newRide').hidden=false;
 }else if(phase==='reserved'){
  const station=stationFor(b.station);
  $('ridePhaseBadge').textContent='RESERVED / DEMO';
  $('rideTitle').innerHTML='EN ROUTE<br><em>TO YOUR BIKE.</em>';
  $('rideDescription').textContent='Head to '+station.name+' ('+station.area+'). Estimated demo walking time: '+station.eta+' min. No real navigation or location sharing.';
  $('holdBox').hidden=false;
  $('holdCountdown').textContent=timeLabel(Math.max(0,session.holdEndsAt-Date.now()));
  $('startRide').hidden=false;$('cancelRide').hidden=false;
  setStep('stepReserve','done');setStep('stepNavigate','active');
 }else if(phase==='riding'||phase==='paused'){
  const m=rideMetrics(session);
  $('ridePhaseBadge').textContent=phase==='paused'?'SIMULATION PAUSED':'RIDE IN MOTION / DEMO';
  $('rideTitle').innerHTML=phase==='paused'?'TAKE YOUR<br><em>TIME.</em>':'STAY IN<br><em>MOTION.</em>';
  $('rideDescription').textContent='Your route visualization advances at '+TIME_MULTIPLIER+'× demo speed. GPS, power and pricing are entirely simulated.';
  $('rideBattery').textContent=m.battery+'%';
  $('rideRange').textContent=m.rangeKm.toFixed(1)+' km';
  $('rideDistance').innerHTML=m.distanceKm.toFixed(1)+' <small>km</small>';
  $('rideTime').textContent=timeLabel(m.simulatedMs);
  $('rideFare').textContent=money(m.fare);
  $('batteryRing').style.background='conic-gradient(#b8e467 0% '+m.battery+'%,#d7e0d0 '+m.battery+'% 100%)';
  $('pauseRide').hidden=false;
  $('pauseRide').textContent=phase==='paused'?'RESUME RIDE SIMULATION':'PAUSE RIDE SIMULATION';
  $('endRide').hidden=false;
  setStep('stepReserve','done');setStep('stepNavigate','done');setStep('stepRide','active');
 }else if(phase==='completed'){
  const summary=session.summary;
  $('ridePhaseBadge').textContent='TRIP COMPLETE';
  $('rideTitle').innerHTML='NICE<br><em>MOVE.</em>';
  $('rideDescription').textContent='Your demonstration ride has ended. A summary has been saved in this browser only. No fare was charged.';
  if(summary){
   $('rideBattery').textContent=summary.batteryEnd+'%';
   $('rideDistance').innerHTML=Number(summary.distanceKm||0).toFixed(1)+' <small>km</small>';
   $('rideTime').textContent=timeLabel(Math.max(1,summary.minutes)*60000);
   $('rideFare').textContent=money(summary.fare);
   $('rideRange').textContent=rangeKm(b,summary.batteryEnd)+' km';
   $('batteryRing').style.background='conic-gradient(#b8e467 0% '+summary.batteryEnd+'%,#d7e0d0 '+summary.batteryEnd+'% 100%)';
  }
  $('newRide').hidden=false;
  ['stepReserve','stepNavigate','stepRide','stepReturn'].forEach(id=>setStep(id,'done'));
 }
 renderMapRoute();
}
function renderAll(){
 renderStations();renderBikes();renderSelection();renderRide();renderHistory();
}
function selectStation(id){
 selectedStation=stationFor(id)?id:'all';
 const bikes=getFilteredBikes().filter(b=>bikeIsAvailable(b));
 if(bikes.length)selectedBike=bikes[0].id;
 renderAll();persist();
}
function selectBike(id){
 const b=bikeFor(id);if(!b||!bikeIsAvailable(b))return;
 selectedBike=id;renderBikes();renderSelection();persist();
}
function openBooking(){
 const b=bikeFor(selectedBike);
 if(!b||!bikeIsAvailable(b)){showToast('Select an available demonstration e-bike first.');return;}
 if(['reserved','riding','paused'].includes(getPhase(session))){showToast('Please finish your current demo ride first.');setTab('ride');return;}
 const s=stationFor(b.station);
 $('dialogModel').textContent=b.name+' · '+b.id;
 $('dialogStation').textContent=s.name+' / '+s.area;
 $('dialogPower').textContent=b.battery+'% / '+rangeKm(b)+' km modelled range';
 $('dialogFare').textContent=money(quoteFor(b,15).fare);
 $('dialogBike').textContent='Your bike is waiting at '+s.name+'. This is a simulated hold for '+Math.round(HOLD_MS/60000)+' minutes.';
 $('bookingDialog').showModal();
}
function closeBooking(){if($('bookingDialog').open)$('bookingDialog').close();}
function confirmBooking(){
 const b=bikeFor(selectedBike);if(!b)return;
 try{
  session=reserveBike(session,b.id);
  closeBooking();
  renderAll();setTab('ride');persist();
  focusNetwork('ride');
  showToast('Demo bike reserved. See your en-route stage and simulate unlock when ready.');
 }catch(e){closeBooking();showToast(e.message);}
}
function begin(){
 try{
  session=startRide(session);
  renderAll();persist();
  showToast('Demo unlocked. Route motion and estimated battery now update at 20× simulation speed.');
 }catch(e){showToast(e.message);}
}
function togglePause(){
 try{
  session=getPhase(session)==='paused'?resumeRide(session):pauseRide(session);
  renderAll();persist();
 }catch(e){showToast(e.message);}
}
function end(){
 try{
  session=completeRide(session);
  history.unshift(session.summary);
  history=history.slice(0,12);
  renderAll();persist();
  showToast('Trip ended and saved locally. No payment was charged.');
 }catch(e){showToast(e.message);}
}
function cancel(){
 if(getPhase(session)!=='reserved')return;
 session={phase:'idle'};renderAll();setTab('explore');persist();showToast('Demonstration hold cancelled.');
}
function freshRide(){
 if(['reserved','riding','paused'].includes(getPhase(session)))return;
 session={phase:'idle'};renderAll();setTab('explore');focusNetwork('explore');persist();
}
function tick(){
 const local=new Date();
 $('consoleClock').textContent=local.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
 if(getPhase(session)==='expired'){
  session={phase:'idle'};renderAll();setTab('explore');persist();
  showToast('Your ten-minute demo reservation expired. Choose a bike to start again.');
  return;
 }
 if(currentTab==='ride')renderRide();
}
$('stationMarkers').addEventListener('click',e=>{
 const btn=e.target.closest('button[data-station]');if(btn)selectStation(btn.dataset.station);
});
$('bikeCards').addEventListener('click',e=>{
 const btn=e.target.closest('button[data-bike]');if(btn)selectBike(btn.dataset.bike);
});
$('stationFilter').addEventListener('change',e=>selectStation(e.target.value));
$('typeFilter').addEventListener('change',e=>{
 selectedType=e.target.value;
 if(!['all','city','cargo','sport'].includes(selectedType))selectedType='all';
 const first=getFilteredBikes().find(b=>bikeIsAvailable(b));
 if(first)selectedBike=first.id;
 renderBikes();renderSelection();
});
$('showAll').addEventListener('click',()=>selectStation('all'));
$('bookBtn').addEventListener('click',openBooking);
$('dialogClose').addEventListener('click',closeBooking);
$('dialogCancel').addEventListener('click',closeBooking);
$('confirmBooking').addEventListener('click',confirmBooking);
$('bookingDialog').addEventListener('click',e=>{
 if(e.target===$('bookingDialog'))closeBooking();
});
$('tabExplore').addEventListener('click',()=>setTab('explore'));
$('tabRide').addEventListener('click',()=>setTab('ride'));
$all('.console-tabs button').forEach(btn=>btn.addEventListener('keydown',e=>{
 if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
 e.preventDefault();const id=btn.id==='tabExplore'?'tabRide':'tabExplore';
 $(id).focus();setTab(id==='tabRide'?'ride':'explore');
}));
$('navRide').addEventListener('click',()=>focusNetwork('ride'));
$('heroDemo').addEventListener('click',()=>{$('journey').scrollIntoView({behavior:'smooth'});});
$('startRide').addEventListener('click',begin);
$('pauseRide').addEventListener('click',togglePause);
$('endRide').addEventListener('click',end);
$('cancelRide').addEventListener('click',cancel);
$('newRide').addEventListener('click',freshRide);
window.addEventListener('storage',e=>{if(e.key!==KEY)return;loadState();renderAll();setTab(currentTab);});
loadState();
renderAll();
setTab(currentTab);
tick();
setInterval(tick,1000);
