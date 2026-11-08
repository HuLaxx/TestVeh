// VEH / local-only interactive EV rental prototype. No payments, GPS, bike locks or live telemetry.
const $=id=>document.getElementById(id);
const stations=[
{id:"central",name:"Central Loop",detail:"Civic Square · demo station",x:31,y:50,route:"210,310 380,256 525,343 707,392"},
{id:"river",name:"Riverbend",detail:"Canal Walk · demo station",x:72,y:64,route:"210,310 380,256 525,343 707,392"},
{id:"park",name:"Park Circuit",detail:"Garden Gate · demo station",x:59,y:25,route:"210,310 380,256 525,160 707,160"},
{id:"metro",name:"Metro Link",detail:"Transit Hub · demo station",x:26,y:27,route:"210,310 260,256 275,165"},
{id:"east",name:"East Studio",detail:"Creative District · demo station",x:85,y:40,route:"210,310 380,256 525,343 780,244"}
];
const bikes=[
{id:"VEH-001",name:"Volt City 01",station:"central",type:"city",battery:91,range:52,rate:4,shade:"lime",available:true,tag:"MOST POPULAR"},
{id:"VEH-002",name:"Metro Glide S",station:"central",type:"sport",battery:74,range:47,rate:5,shade:"silver",available:true,tag:"CITY SPEED"},
{id:"VEH-003",name:"Cargo Orbit",station:"river",type:"cargo",battery:86,range:61,rate:6,shade:"orange",available:true,tag:"HAUL MORE"},
{id:"VEH-004",name:"Volt City 02",station:"river",type:"city",battery:23,range:13,rate:4,shade:"lime",available:false,tag:"CHARGING"},
{id:"VEH-005",name:"Street Echo",station:"park",type:"city",battery:96,range:55,rate:4,shade:"white",available:true,tag:"LONG RANGE"},
{id:"VEH-006",name:"Sprint Carbon",station:"park",type:"sport",battery:68,range:38,rate:6,shade:"orange",available:true,tag:"FAST & LIGHT"},
{id:"VEH-007",name:"Metro Glide 02",station:"metro",type:"city",battery:78,range:44,rate:4,shade:"silver",available:true,tag:"COMMUTER"},
{id:"VEH-008",name:"Cargo Studio",station:"east",type:"cargo",battery:82,range:58,rate:6,shade:"lime",available:true,tag:"DAY RIDER"}
];
const getStation=id=>stations.find(s=>s.id===id),getBike=id=>bikes.find(b=>b.id===id);
const money=n=>"₹"+Math.round(n).toLocaleString("en-IN");
const time=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0");
const set=(id,v)=>{if($(id))$(id).textContent=String(v)};
const key="veh-demo-ride-v1",historyKey="veh-demo-history-v1";
function read(k,fallback){try{const x=localStorage.getItem(k);return x&&x.length<50000?JSON.parse(x):fallback}catch{return fallback}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
function validRide(v){return v&&typeof v==="object"&&getBike(v.bikeId)&&["reserved","riding","paused","completed"].includes(v.phase)&&Number.isFinite(v.created)&&Number.isFinite(v.seconds)&&Number.isFinite(v.distance)&&v.created<Date.now()+60000&&v.created>Date.now()-86400000}
let ride=validRide(read(key,null))?read(key,null):null;
if(ride){ride.seconds=Math.min(36000,Math.max(0,ride.seconds));ride.distance=Math.min(100,Math.max(0,ride.distance));ride.battery=Math.min(100,Math.max(0,Number(ride.battery)||0));if(ride.phase==="reserved"&&Date.now()-ride.created>600000)ride=null}
let trips=read(historyKey,[]);if(!Array.isArray(trips))trips=[];trips=trips.filter(t=>t&&getBike(t.bikeId)&&Number.isFinite(t.created)).slice(0,12);
let focus="all",type="all",chosen="VEH-001",activeTab="explore",toastTimer;
function toast(message){const el=$("toast");el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true},3500)}
function showTab(tab){activeTab=tab;const isRide=tab==="ride";$("explorePanel").hidden=isRide;$("ridePanel").hidden=!isRide;$("tabExplore").setAttribute("aria-selected",String(!isRide));$("tabRide").setAttribute("aria-selected",String(isRide));if(isRide)renderRide()}
function selectStation(id){if(id!=="all"&&!getStation(id))return;focus=id;$("stationFilter").value=id;renderMap();renderBikes()}
function renderMap(){
 const pins=$("stationMarkers");pins.replaceChildren();
 stations.forEach(s=>{
  const p=document.createElement("button");p.type="button";p.className="station-pin"+(focus===s.id?" selected":"");
  p.style.left=s.x+"%";p.style.top=s.y+"%";p.setAttribute("aria-pressed",String(focus===s.id));p.setAttribute("aria-label",s.name+" station, "+bikes.filter(b=>b.station===s.id&&b.available).length+" demo bicycles available");
  p.innerHTML='<span class="pin-core">ϟ</span><span class="pin-text"></span>';
  p.querySelector(".pin-text").textContent=s.name;p.onclick=()=>selectStation(s.id);pins.append(p);
 });
 const station=ride?getStation(getBike(ride.bikeId).station):getStation(focus);
 if(station){$("routeLine").setAttribute("points",station.route);$("routeLine").setAttribute("opacity",ride?"1":".5");$("routePulse").setAttribute("opacity",ride?"1":"0");set("stationName",station.name);set("stationDetail",station.detail);set("mapActiveBadge",station.name.toUpperCase())}
 else{$("routeLine").setAttribute("opacity","0");$("routePulse").setAttribute("opacity","0");set("stationName","All demo stations");set("stationDetail","Select a pin to focus nearby e-bikes");set("mapActiveBadge","ALL STATIONS")}
 if(ride){const coords=station.route.split(" ").at(-1).split(",");$("routePulse").setAttribute("cx",coords[0]);$("routePulse").setAttribute("cy",coords[1]);}
}
function createBikeCard(b){
 const card=document.createElement("button");card.type="button";card.disabled=!b.available;card.className="bike-card"+(chosen===b.id?" selected":"")+(b.available?"":" charging");card.setAttribute("aria-pressed",String(chosen===b.id));
 const header=document.createElement("div");header.className="bike-card-top";
 const id=document.createElement("span");id.textContent=b.id+" / "+b.tag;
 const state=document.createElement("span");state.className=b.available?"ready":"charge-label";state.textContent=b.available?"● READY":"ϟ CHARGING";header.append(id,state);
 const body=document.createElement("div");body.className="bike-card-body";
 const graphic=document.createElement("div");graphic.className="small-bike "+b.shade;graphic.innerHTML='<svg viewBox="0 0 102 65" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="21" cy="46" r="15"/><circle cx="79" cy="46" r="15"/><path d="M21 46L42 20L55 46H21M42 20H63L55 46M63 20L79 46M37 18H50M63 20L69 10L82 10"/></g></svg>';
 const detail=document.createElement("div");detail.className="bike-detail";
 const title=document.createElement("strong");title.textContent=b.name;
 const sub=document.createElement("span");sub.textContent=getStation(b.station).name+" · "+b.type.toUpperCase();detail.append(title,sub);body.append(graphic,detail);
 const foot=document.createElement("div");foot.className="bike-card-bottom";
 const power=document.createElement("div");power.className="bike-power";const text=document.createElement("span");text.textContent="ϟ "+b.battery+"% BATTERY";
 const line=document.createElement("span");line.className="bike-bar";const fill=document.createElement("i");fill.style.width=b.battery+"%";line.append(fill);power.append(text,line);
 const range=document.createElement("span");range.textContent="≈ "+b.range+" KM";foot.append(power,range);
 card.append(header,body,foot);
 if(b.available)card.onclick=()=>{chosen=b.id;renderBikes()};
 return card;
}
function renderBikes(){
 const list=bikes.filter(b=>(focus==="all"||b.station===focus)&&(type==="all"||b.type===type));
 const available=list.filter(b=>b.available);if(!available.some(b=>b.id===chosen))chosen=available[0]?.id||null;
 const box=$("bikeCards");box.replaceChildren(...list.map(createBikeCard));
 if(list.length===0){const empty=document.createElement("p");empty.className="no-bikes";empty.textContent="No demo bikes match your filters. Select another station or ride type.";box.append(empty)}
 set("bikeCount",available.length+" AVAILABLE / "+list.length+" SHOWN");
 const b=getBike(chosen);
 set("selectedName",b?.name||"No available bicycle");
 set("selectedMeta",b?getStation(b.station).name+" · "+b.battery+"% battery · ≈"+b.range+" km":"Try a different filter");
 set("selectedRate",b?money(b.rate)+"/min":"—");set("priceEstimate",b?money(b.rate*15):"—");
 $("bookBtn").disabled=!b||Boolean(ride&&ride.phase!=="completed");
 $("bookBtn").textContent=ride&&ride.phase!=="completed"?"FINISH CURRENT TRIP FIRST ↗":"RESERVE THIS BIKE ↗";
 set("statAvailable",String(bikes.filter(b=>b.available).length).padStart(2,"0"));
}
function openDialog(){
 const b=getBike(chosen);if(!b||!b.available)return toast("Select an available demo bicycle");
 if(ride&&ride.phase!=="completed")return toast("Finish or cancel your current demo trip first");
 set("dialogModel",b.name+" / "+b.id);set("dialogStation",getStation(b.station).name);
 set("dialogPower",b.battery+"% / approx. "+b.range+" km");set("dialogFare",money(b.rate*15)+" demo estimate");
 $("bookingDialog").showModal();
}
function confirm(){
 const b=getBike(chosen);$("bookingDialog").close();if(!b||!b.available)return;
 ride={bikeId:b.id,phase:"reserved",created:Date.now(),seconds:0,distance:0,battery:b.battery,lastTick:Date.now()};
 save(key,ride);focus=b.station;$("stationFilter").value=focus;
 renderMap();renderBikes();showTab("ride");$("tabRideIndicator").hidden=false;
 toast("Demo bike held at "+getStation(focus).name);
}
function renderRide(){
 const b=ride?getBike(ride.bikeId):null;const phase=ride?.phase||"standby";
 const names={standby:"STANDBY",reserved:"RESERVED",riding:"RIDE IN PROGRESS",paused:"PAUSED",completed:"RETURNED"};
 const messages={standby:"Reserve a demo e-bike to activate your route and ride console.",reserved:"EN ROUTE: Follow the dashed fictional path to "+(b?getStation(b.station).name:"your bike")+". This is not live turn-by-turn navigation.",riding:"Ride simulation running at 5× demo speed. Battery, distance and location are modelled, not measured.",paused:"Simulation paused. Resume when you're ready.",completed:"Ride completed. Your fictional journey is saved locally."};
 set("ridePhaseBadge",names[phase]);set("rideTitle",phase==="completed"?"RIDE COMPLETE":phase==="standby"?"YOUR JOURNEY":"KEEP MOVING");
 set("rideDescription",messages[phase]);set("rideBikeName",b?.name||"—");
 set("rideBikeCode",b?b.id+" / "+getStation(b.station).name:"NO ACTIVE TRIP");
 const pct=ride?ride.battery:0;
 set("rideBattery",ride?Math.round(pct)+"%":"—");$("batteryRing").style.setProperty("--battery",pct+"%");
 set("rideRange",ride?(b.range*pct/b.battery).toFixed(1)+" km":"— km");
 set("rideDistance",ride?ride.distance.toFixed(2)+" km":"0.00 km");
 set("rideTime",time(ride?.seconds||0));set("rideFare",b?money(Math.ceil(ride.seconds/60)*b.rate):"₹0");
 $("holdBox").hidden=phase!=="reserved";
 if(phase==="reserved")set("holdCountdown",time(Math.max(0,Math.ceil((ride.created+600000-Date.now())/1000))));
 $("startRide").hidden=phase!=="reserved";$("pauseRide").hidden=!["riding","paused"].includes(phase);
 set("pauseRide",phase==="paused"?"RESUME DEMO RIDE":"PAUSE SIMULATION");
 $("endRide").hidden=!["riding","paused"].includes(phase);
 $("cancelRide").hidden=phase!=="reserved";$("newRide").hidden=phase!=="completed";
 $("tabRideIndicator").hidden=!ride||phase==="completed";
 const progress={standby:0,reserved:2,riding:3,paused:3,completed:4}[phase];
 ["stepReserve","stepNavigate","stepRide","stepReturn"].forEach((id,i)=>{$(id).classList.toggle("step-done",i<progress);$(id).classList.toggle("step-active",i===progress-1&&progress<4)});
}
function start(){if(!ride||ride.phase!=="reserved")return; if(Date.now()-ride.created>=600000){cancel();return}
 ride.phase="riding";ride.lastTick=Date.now();save(key,ride);renderRide();toast("Ride simulation started — no physical bike unlocked")}
function pause(){if(!ride||!["riding","paused"].includes(ride.phase))return;ride.phase=ride.phase==="riding"?"paused":"riding";ride.lastTick=Date.now();save(key,ride);renderRide()}
function finish(){
 if(!ride||!["riding","paused"].includes(ride.phase))return;
 ride.phase="completed";const b=getBike(ride.bikeId);
 trips.unshift({bikeId:b.id,created:ride.created,ended:Date.now(),seconds:ride.seconds,distance:ride.distance,fare:Math.ceil(ride.seconds/60)*b.rate});trips=trips.slice(0,12);
 save(historyKey,trips);save(key,ride);renderBikes();renderMap();renderRide();renderHistory();
 toast("Sample trip complete. No money was charged.");
}
function cancel(){if(!ride||ride.phase!=="reserved")return;ride=null;save(key,null);renderMap();renderBikes();renderRide();showTab("explore");toast("Demo booking cancelled")}
function reset(){if(!ride||ride.phase!=="completed")return;ride=null;save(key,null);renderMap();renderBikes();renderRide();showTab("explore");$("network").scrollIntoView({behavior:"smooth"})}
function renderHistory(){
 const box=$("historyList");box.replaceChildren();
 if(!trips.length){const p=document.createElement("div");p.className="history-empty";p.textContent="NO RIDES YET. YOUR NEXT MOVE STARTS ABOVE. ↗";box.append(p);return}
 trips.forEach(t=>{
  const item=document.createElement("div");item.className="history-row";
  const left=document.createElement("div"),right=document.createElement("div");
  const date=document.createElement("span");date.textContent=new Date(t.ended||t.created).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})+" · DEMO TRIP";
  const name=document.createElement("strong");name.textContent=getBike(t.bikeId).name;left.append(date,name);
  const distance=document.createElement("strong");distance.textContent=Number(t.distance).toFixed(2)+" km";
  const cost=document.createElement("small");cost.textContent=money(Number(t.fare)||0)+" DEMO · "+time(Number(t.seconds)||0);
  right.append(distance,cost);item.append(left,right);box.append(item);
 });
}
function tick(){
 set("consoleClock",new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}));
 if(!ride)return;
 if(ride.phase==="reserved"){if(Date.now()-ride.created>=600000){ride=null;save(key,null);renderRide();renderBikes();renderMap();toast("Demo reservation expired")}else if(activeTab==="ride")renderRide();return}
 if(ride.phase!=="riding")return;
 const now=Date.now(),delta=Math.min(5,Math.max(0,(now-(ride.lastTick||now))/1000));ride.lastTick=now;
 const elapsed=delta*5,km=15*elapsed/3600,b=getBike(ride.bikeId);
 ride.seconds+=elapsed;ride.distance+=km;ride.battery=Math.max(0,ride.battery-km*b.battery/b.range);
 if(ride.battery<=0||ride.seconds>=7200){finish();return}
 save(key,ride);if(activeTab==="ride")renderRide();
 const points=getStation(b.station).route.split(" ").map(s=>s.split(",").map(Number));
 const p=(ride.distance%3.2)/3.2*(points.length-1),idx=Math.min(points.length-2,Math.floor(p)),frac=p-idx;
 $("routePulse").setAttribute("cx",points[idx][0]*(1-frac)+points[idx+1][0]*frac);
 $("routePulse").setAttribute("cy",points[idx][1]*(1-frac)+points[idx+1][1]*frac);
}
$("stationFilter").addEventListener("change",e=>selectStation(e.target.value));
$("typeFilter").addEventListener("change",e=>{type=e.target.value;renderBikes()});
$("showAll").onclick=()=>selectStation("all");
$("tabExplore").onclick=()=>showTab("explore");$("tabRide").onclick=()=>showTab("ride");
$("navRide").onclick=()=>{$("network").scrollIntoView({behavior:"smooth"});showTab("ride")};
$("heroDemo").onclick=()=>$("journey").scrollIntoView({behavior:"smooth"});
$("bookBtn").onclick=openDialog;$("dialogClose").onclick=()=>$("bookingDialog").close();
$("dialogCancel").onclick=()=>$("bookingDialog").close();$("confirmBooking").onclick=confirm;
$("startRide").onclick=start;$("pauseRide").onclick=pause;$("endRide").onclick=finish;
$("cancelRide").onclick=cancel;$("newRide").onclick=reset;
$("bookingDialog").onclick=e=>{if(e.target===$("bookingDialog"))$("bookingDialog").close()};
if(ride&&ride.phase==="riding")ride.lastTick=Date.now();
renderMap();renderBikes();renderHistory();renderRide();if(ride&&ride.phase!=="completed")showTab("ride");tick();setInterval(tick,1000);
