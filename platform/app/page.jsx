
'use client';
import {useState,useEffect,useMemo} from 'react';
import {samples} from '../lib/catalog.js';
import {inventorySearchParams,parseInterval} from '../lib/booking-rules.mjs';

const TABS=[
  {id:'all',name:'All services',icon:'✦'},
  {id:'vehicle',name:'Rent a vehicle',icon:'🚙'},
  {id:'parking',name:'Find parking',icon:'Ⓟ'},
  {id:'charging',name:'EV charging',icon:'ϟ'}
];
const symbols={vehicle:'🚙',parking:'Ⓟ',charging:'⚡'};
const gradients={vehicle:'vehicleArt',parking:'parkingArt',charging:'chargingArt'};
const INR=n=>'₹'+Number(n||0).toLocaleString('en-IN');
function Label({children}){return <span className="fieldLabel">{children}</span>;}
function Icon({name}){return <span className="serviceIcon" aria-hidden="true">{symbols[name]||'✦'}</span>;}
function hourLabel(date){if(!date)return '—';return new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});}

export default function Home(){
 const [items,setItems]=useState(samples);
 const [mode,setMode]=useState('demonstration');
 const [kind,setKind]=useState('all');
 const [city,setCity]=useState('All cities');
 const [search,setSearch]=useState('');
 const [start,setStart]=useState('');
 const [end,setEnd]=useState('');
 const [limit,setLimit]=useState(100000);
 const [loading,setLoading]=useState(true);
 const [user,setUser]=useState(null);
 const [panel,setPanel]=useState('');
 const [authMode,setAuthMode]=useState('login');
 const [auth,setAuth]=useState({name:'',email:'',password:''});
 const [working,setWorking]=useState(false);
 const [bookings,setBookings]=useState([]);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const showToast=(s)=>{setMessage(s);setError('');};
 const showError=(s)=>{setError(s);setMessage('');};
 const isDemo=mode!=='live';
 const cities=useMemo(()=>['All cities',...new Set(items.map(x=>x.city).filter(Boolean))],[items]);
 const maxPrice=useMemo(()=>Math.max(1000,Math.ceil(Math.max(0,...items.map(x=>Number(x.price_per_hour)||0))/50)*50),[items]);

 async function load(controller){
   setLoading(true);
   let query;
   try{query=inventorySearchParams(start,end);}catch(e){
     setItems(previous=>previous.map(item=>({...item,available:null})));
     showError(e.message);setLoading(false);return;
   }
   try{
     const r=await fetch('/api/inventory'+query,{cache:'no-store',signal:controller.signal});
     const data=await r.json();if(!r.ok)throw Error(data.error||'Inventory unavailable');
     if(controller.signal.aborted)return;
     setMode(data.mode);setItems(data.items||[]);
   }catch(e){
     if(controller.signal.aborted)return;
     setItems(samples);setMode('demonstration');showError('Could not reach inventory service. Showing clearly labeled sample listings.');
   }finally{if(!controller.signal.aborted)setLoading(false);}
 }
 async function loadUser(){
   try{const r=await fetch('/api/auth/me',{cache:'no-store'});if(r.ok){const d=await r.json();setUser(d.user||null);}}catch{}
 }
 useEffect(()=>{const controller=new AbortController();load(controller);return ()=>controller.abort();},[start,end]);
 useEffect(()=>{loadUser();},[]);
 const found=useMemo(()=>items.filter(item=>{
   const text=[item.title,item.city,item.area,item.subtitle,...(item.features||[])].join(' ').toLowerCase();
   return (kind==='all'||kind===item.kind)&&(city==='All cities'||city===item.city)&&text.includes(search.toLowerCase().trim())&&item.price_per_hour<=limit;
 }),[items,kind,city,search,limit]);
 function openAuth(which){setAuthMode(which);setPanel('auth');setError('');setMessage('');}
 async function submitAuth(event){
   event.preventDefault();if(isDemo){showError('Account creation is disabled until the production database is configured.');return;}
   setWorking(true);setError('');
   try{
     const route=authMode==='register'?'/api/auth/register':'/api/auth/login';
     const res=await fetch(route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(auth)});
     const d=await res.json();if(!res.ok)throw Error(d.error||'Authentication failed');
     setUser(d.user);setPanel('');setAuth({name:'',email:'',password:''});showToast('You are signed in to TestVeh.');
   }catch(e){showError(e.message)}finally{setWorking(false)}
 }
 async function logout(){
   await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});
   setUser(null);setPanel('');showToast('Signed out.');
 }
 function validDates(){
   if(!start||!end){showError('Select a start and end time to request a reservation.');return false;}
   try{parseInterval(start,end);return true;}catch(e){showError(e.message);return false;}
 }
 async function reserve(item){
   if(item.demo||isDemo){showError('This is illustrative inventory, not a live booking. Real bookings will be enabled after connecting verified operator inventory and a database.');return;}
   if(!user){openAuth('login');return;}
   if(!validDates())return;
   setWorking(true);setError('');
   try{
     const r=await fetch('/api/bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({resourceId:item.id,start:new Date(start).toISOString(),end:new Date(end).toISOString()})});
     const d=await r.json();if(!r.ok)throw Error(d.error||'Reservation failed');
     showToast('Request #'+d.booking.id.slice(0,8)+' recorded. Await operator confirmation within two hours. No payment taken.');
   }catch(e){showError(e.message)}finally{setWorking(false);}
 }
 async function showBookings(){
   if(!user){openAuth('login');return;}
   setPanel('bookings');setError('');setWorking(true);
   try{const r=await fetch('/api/bookings',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setBookings(d.bookings||[]);}
   catch(e){showError(e.message);}finally{setWorking(false);}
 }
 async function cancelBooking(id){
   if(!confirm('Cancel this reservation request?'))return;
   setWorking(true);
   try{const r=await fetch('/api/bookings/'+encodeURIComponent(id),{method:'DELETE'});const d=await r.json();if(!r.ok)throw Error(d.error);setBookings(list=>list.map(b=>b.id===id?{...b,status:'cancelled'}:b));showToast('Reservation request cancelled.');}
   catch(e){showError(e.message)}finally{setWorking(false);}
 }
 return <div className="site">
   <header className="topbar">
    <div className="topInner">
     <a href="/" className="logo" aria-label="TestVeh home"><span className="brandMark">T<span>V</span></span><span>test<span className="logoAccent">veh</span><small>MOVE SMARTER</small></span></a>
     <nav className="primaryNav"><a href="#explore">Explore services</a><a href="/partner">For partners</a><a href="#how-it-works">How it works</a><a href="#why-testveh">Why TestVeh</a></nav>
     <div className="rightNav"><span className={'modeChip '+(isDemo?'sampleChip':'liveChip')}><span className="chipDot"/>{isDemo?'Product preview':'Database connected'}</span>{user?<button className="outlineButton" onClick={showBookings}>My bookings</button>:<button className="outlineButton" onClick={()=>openAuth('login')}>Sign in</button>}<button className="solidButton navJoin" onClick={()=>user?showBookings():openAuth('register')}>{user?'Account':'Get started'} <span>↗</span></button></div>
    </div>
   </header>
   <main>
    <section className="hero">
      <div className="heroNoise"></div>
      <div className="heroContent container">
       <div className="heroText"><div className="eyebrow"><span className="line"/> THE FUTURE OF EVERYDAY MOBILITY</div><h1>Move freely.<br/><em>Go anywhere.</em></h1><p>One intelligent platform for vehicles, parking, and EV charging. Discover smarter ways to move through your city — on your schedule.</p><div className="heroActions"><a className="solidButton largeButton" href="#explore">Explore services <span>↗</span></a><a className="textLink" href="#how-it-works">See how it works <span>↗</span></a></div><div className="heroStats"><div><strong>03</strong><span>CONNECTED SERVICES</span></div><div><strong>01</strong><span>SEAMLESS EXPERIENCE</span></div><div><strong>24/7</strong><span>DISCOVERY</span></div></div></div>
       <div className="heroVisual" aria-hidden="true"><div className="orb orbOne"></div><div className="orb orbTwo"></div><div className="trackCircle c1"></div><div className="trackCircle c2"></div><div className="motionCard motionMain"><div className="motionIcon">↗</div><span>YOUR CITY.<br/>YOUR WAY.</span><strong>MOVE<br/>BEYOND.</strong></div><div className="motionCard motionSmall"><span className="smallLine">● AVAILABLE SERVICES</span><strong>VEHICLES<br/>PARKING<br/>CHARGING</strong></div><div className="motionBadge">✦ MOBILITY REIMAGINED</div></div>
      </div>
      <div className="heroBottom container"><span>BUILT FOR THE WAY YOU MOVE</span><span>DISCOVER • PLAN • GO</span></div>
    </section>
    <section id="explore" className="discovery container">
      <div className="sectionTop"><div><div className="eyebrow darkEyebrow">01 / DISCOVER</div><h2>Everything you need<br/><em>to get moving.</em></h2></div><p>From your next ride to the perfect parking spot or a quick EV top-up — it all starts here.</p></div>
      <div className="serviceTabs" role="group" aria-label="Choose mobility service">{TABS.map(tab=><button key={tab.id} className={'serviceTab '+(kind===tab.id?'selected':'')} onClick={()=>setKind(tab.id)}><span>{tab.icon}</span> {tab.name}</button>)}</div>
      <div className="searchBox">
       <label><Label>WHERE?</Label><div className="controlWithIcon"><span>⌖</span><select value={city} onChange={e=>setCity(e.target.value)}>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select></div></label>
       <label><Label>START DATE & TIME</Label><input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></label>
       <label><Label>END DATE & TIME</Label><input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></label>
       <label className="keywordField"><Label>WHAT ARE YOU LOOKING FOR?</Label><input type="search" placeholder="Search services, amenities..." value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      <div className="resultHeader"><div><span className="eyebrow darkEyebrow">CURATED MOBILITY</span><h3>{kind==='all'?'Explore our services':TABS.find(x=>x.id===kind)?.name} <span className="resultsCount">{found.length}</span></h3></div><div className="priceField"><label htmlFor="maxPrice">MAX PRICE / HOUR <strong>{INR(Math.min(limit,maxPrice))}</strong></label><input id="maxPrice" type="range" min="0" max={maxPrice} step="50" value={Math.min(limit,maxPrice)} onChange={e=>setLimit(Number(e.target.value))}/></div></div>
      {isDemo&&<div className="notice"><span className="noticeMark">i</span><div><strong>Preview inventory</strong><p>These six listings are illustrative, not verified availability or actual merchant offers. Bookings and sign-ups remain disabled until a real database and operator inventory are connected.</p></div></div>}
      {!!error&&<div className="feedback error" role="alert"><span>!</span>{error}<button onClick={()=>setError('')} aria-label="Dismiss error">×</button></div>}
      {!!message&&<div className="feedback success" role="status"><span>✓</span>{message}<button onClick={()=>setMessage('')} aria-label="Dismiss notification">×</button></div>}
      {loading?<div className="emptyState">Loading services…</div>:found.length===0?<div className="emptyState"><strong>No matching listings</strong><p>Try another city, service type or price range.</p><button className="outlineButton" onClick={()=>{setKind('all');setCity('All cities');setSearch('');setLimit(100000)}}>Reset filters</button></div>:
      <div className="cardGrid">{found.map((item,i)=><article className="listingCard" key={item.id}><div className={'listingVisual '+gradients[item.kind]}><span className="listingNumber">TV / 0{i+1}</span><div className="listingGlyph"><Icon name={item.kind}/></div><span className="listingCategory">{item.kind==='vehicle'?'VEHICLE RENTAL':item.kind==='parking'?'SMART PARKING':'EV CHARGING'}</span></div><div className="listingBody"><div className="itemLocation">⌖ {item.area}, {item.city}</div><h4>{item.title}</h4><p>{item.subtitle}</p><div className="featureList">{(item.features||[]).slice(0,3).map(f=><span key={f}>{f}</span>)}</div><div className="listingFoot"><div className="rate"><strong>{INR(item.price_per_hour)}</strong><small>/ hour</small></div><button className={'bookButton '+(item.demo||isDemo||item.available===false?'disabledBook':'')} onClick={()=>reserve(item)} disabled={working||item.available===false} aria-label={'Request booking for '+item.title}>{item.demo||isDemo?'Preview listing':item.available===false?'Unavailable':'Request booking'} <span>↗</span></button></div></div></article>)}</div>}
     </section>
     <section className="servicesShowcase" id="why-testveh"><div className="container"><div className="eyebrow">02 / ALL IN ONE PLACE</div><div className="showcaseTitle"><h2>One city.<br/><em>Endless possibilities.</em></h2><p>Built to bring the essential parts of urban mobility together without the clutter.</p></div><div className="featureGrid"><div><span className="featureSymbol">↗</span><h3>Freedom to move</h3><p>Discover vehicles that fit your journey, from a quick city drive to a weekend escape.</p></div><div><span className="featureSymbol">Ⓟ</span><h3>Parking, simplified</h3><p>Find a space when you need one, with time-based reservations and clear pricing.</p></div><div><span className="featureSymbol">ϟ</span><h3>Charge with confidence</h3><p>Find compatible charging locations and operator-provided slots in one place.</p></div></div></div></section>
     <section id="how-it-works" className="how container"><div><div className="eyebrow darkEyebrow">03 / HOW IT WORKS</div><h2>Less planning.<br/><em>More going.</em></h2></div><div className="steps"><div><span>01</span><div><h3>Discover</h3><p>Choose a service and find relevant inventory in your city.</p></div></div><div><span>02</span><div><h3>Choose your time</h3><p>Select a start and end time, then check the offered availability.</p></div></div><div><span>03</span><div><h3>Request & go</h3><p>Send a reservation request. An operator confirms it before your trip.</p></div></div></div></section>
    </main>
    <footer className="footer"><div className="container footerInner"><div className="footerLogo">test<span>veh</span><small>MOVE SMARTER</small></div><p>Make space for what moves you.</p><span>© 2026 TESTVEH · BUILT FOR REAL-WORLD MOBILITY</span></div></footer>
    {panel&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget){setPanel('');setError('');}}}><section className="dialog" role="dialog" aria-modal="true" aria-label={panel==='auth'?'Account access':'My bookings'}><button className="dialogClose" onClick={()=>{setPanel('');setError('')}} aria-label="Close dialog">×</button>{panel==='auth'?<><div className="eyebrow darkEyebrow">YOUR TESTVEH ACCOUNT</div><h2>{authMode==='login'?'Welcome back.':'Move with us.'}</h2><p>{authMode==='login'?'Sign in to manage your journeys.':'Create your account to request vehicle, parking and charging reservations.'}</p><div className="authSwitch"><button className={authMode==='login'?'active':''} onClick={()=>setAuthMode('login')}>Sign in</button><button className={authMode==='register'?'active':''} onClick={()=>setAuthMode('register')}>Sign up</button></div>{isDemo&&<div className="dialogNotice">Account access will be activated when the database and real inventory are configured.</div>}<form className="authForm" onSubmit={submitAuth}>{authMode==='register'&&<label>FULL NAME<input required minLength={2} maxLength={80} autoComplete="name" value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} placeholder="Your full name"/></label>}<label>EMAIL ADDRESS<input required type="email" autoComplete="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="you@example.com"/></label><label>PASSWORD<input required type="password" autoComplete={authMode==='login'?'current-password':'new-password'} minLength={authMode==='register'?12:1} value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="At least 12 characters"/></label><button className="solidButton authSubmit" disabled={isDemo||working}>{working?'Please wait…':authMode==='login'?'Sign in ↗':'Create account ↗'}</button></form>{error&&<div className="feedback error" role="alert">{error}</div>}</>:<><div className="eyebrow darkEyebrow">YOUR JOURNEYS</div><h2>My bookings.</h2><p>Requests expire after two hours unless an operator accepts them. No payment is taken.</p>{working&&<p>Loading…</p>}{bookings.length?bookings.map(b=><div className="bookingRow" key={b.id}><strong>{b.title}</strong><span>{b.city}, {b.area}</span><span>{hourLabel(b.start_at)} → {hourLabel(b.end_at)}</span><div className="bookingActions"><b>{b.status.toUpperCase()}</b><span>{INR(Number(b.total_paise)/100)}</span>{b.status==='requested'&&<button onClick={()=>cancelBooking(b.id)}>Cancel request</button>}</div></div>):<div className="emptyState">No reservation requests yet.</div>}{error&&<p className="error">{error}</p>}<button className="outlineButton" onClick={logout}>Sign out</button></>}</section></div>}
   </div>;
}
