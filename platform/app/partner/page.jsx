'use client';
import {useCallback,useEffect,useState} from 'react';

const empty={kind:'vehicle',title:'',subtitle:'',city:'',area:'',price_per_hour:'',features:''};
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
async function api(url,options={}) {
  const r=await fetch(url,{...options,cache:'no-store',headers:{'content-type':'application/json',...options.headers}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||'Service unavailable.');
  return data;
}
const state=s=><span className="tvState" data-status={s}>{s}</span>;
function Shell({children,status='PARTNER WORKSPACE'}){
 return <div className="tvPortal"><header className="tvTop"><a href="/" className="tvBrand">test<span>veh</span></a><nav><a href="/">Marketplace</a><a href="/partner">Partner portal</a><a href="/admin">Admin</a></nav></header><main className="tvMain"><section className="tvHero"><div><small>TESTVEH / {status}</small><h1>Grow your mobility business.</h1><p>Manage your vehicles, parking spaces and EV charging listings with an approval-based marketplace workflow.</p></div><span className="tvPill">OPERATIONS CONSOLE</span></section>{children}</main></div>;
}
export default function Partner(){
 const [me,setMe]=useState(null),[resources,setResources]=useState([]),[bookings,setBookings]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [application,setApplication]=useState({businessName:'',city:'',contactEmail:''});
 const [draft,setDraft]=useState(empty),[editing,setEditing]=useState('');
 const flash=s=>{setMessage(s);setError('');};
 const fail=e=>{setError(e.message||String(e));setMessage('');};
 const refresh=useCallback(async()=>{
   try{
     const info=await api('/api/operator/me');setMe(info);
     if(info.operator?.status==='approved'){
       const [items,reservations]=await Promise.all([api('/api/operator/resources'),api('/api/operator/bookings')]);
       setResources(items.resources||[]);setBookings(reservations.bookings||[]);
     }
   }catch(e){fail(e);}finally{setLoading(false);}
 },[]);
 useEffect(()=>{refresh();},[refresh]);
 async function submitApplication(e){
   e.preventDefault();setBusy(true);
   try{await api('/api/operator/apply',{method:'POST',body:JSON.stringify(application)});flash('Application submitted for review.');await refresh();}
   catch(e){fail(e);}finally{setBusy(false);}
 }
 async function submitResource(e){
   e.preventDefault();setBusy(true);
   const payload={...draft,price_per_hour:Number(draft.price_per_hour),features:draft.features.split(',').map(x=>x.trim()).filter(Boolean)};
   try{
     await api(editing?'/api/operator/resources/'+editing:'/api/operator/resources',{
       method:editing?'PATCH':'POST',body:JSON.stringify(payload)});
     flash(editing?'Changes submitted for re-review.':'Listing submitted for review.');
     setDraft(empty);setEditing('');await refresh();
   }catch(e){fail(e);}finally{setBusy(false);}
 }
 async function unpublish(id){
   if(!window.confirm('Unpublish this listing? Existing reservations are retained.'))return;
   setBusy(true);try{await api('/api/operator/resources/'+id,{method:'DELETE'});flash('Listing unpublished.');await refresh();}catch(e){fail(e);}finally{setBusy(false);}
 }
 async function bookingAction(id,status){
   setBusy(true);try{await api('/api/operator/bookings/'+id,{method:'PATCH',body:JSON.stringify({status})});flash('Reservation updated to '+status+'.');await refresh();}catch(e){fail(e);}finally{setBusy(false);}
 }
 function edit(r){setEditing(r.id);setDraft({kind:r.kind,title:r.title,subtitle:r.subtitle,city:r.city,area:r.area,price_per_hour:String(r.price_per_hour),features:(r.features||[]).join(', ')});document.getElementById('listing-form')?.scrollIntoView({behavior:'smooth'});}
 const op=me?.operator;
 return <Shell>
   <div className="tvAlert">Bookings are currently request-and-confirm only. No payment processing or real-time charger occupancy is connected. Approved listings must represent operator-controlled inventory.</div>
   {loading&&<div className="tvAlert">Loading partner account…</div>}
   {error&&<div className="tvAlert tvError" role="alert">{error}</div>}
   {message&&<div className="tvAlert tvSuccess" role="status">{message}</div>}
   {!loading&&!me?.user&&<section className="tvCard tvSection"><h2>Sign in first</h2><p>Use the marketplace sign-in to apply as an operator or access your workspace.</p><a className="tvLink" href="/">Go to TestVeh sign in</a></section>}
   {!loading&&me?.user&&!op&&<section className="tvCard tvSection"><h2>Apply as an operator</h2><p className="tvHelp">Applications undergo manual review. Your listings cannot go live until they have been individually approved.</p><form onSubmit={submitApplication}><label className="tvLabel">Registered business name<input required maxLength={120} minLength={2} value={application.businessName} onChange={e=>setApplication({...application,businessName:e.target.value})}/></label><label className="tvLabel">Operating city<input required maxLength={80} value={application.city} onChange={e=>setApplication({...application,city:e.target.value})}/></label><label className="tvLabel">Business contact email<input type="email" required value={application.contactEmail} onChange={e=>setApplication({...application,contactEmail:e.target.value})}/></label><div className="tvButtons"><button className="tvButton" disabled={busy}>Submit application</button></div></form></section>}
   {!loading&&op&&op.status!=='approved'&&<section className="tvCard tvSection"><h2>{op.business_name}</h2><p>Your operator application is {state(op.status)}. The platform team must approve it before inventory can be submitted.</p></section>}
   {op?.status==='approved'&&<>
     <div className="tvStats"><div className="tvStat"><strong>{resources.length}</strong><span>Total listings</span></div><div className="tvStat"><strong>{resources.filter(x=>x.active).length}</strong><span>Published listings</span></div><div className="tvStat"><strong>{bookings.filter(x=>x.status==='requested').length}</strong><span>Requests to review</span></div></div>
     <div className="tvSplit tvSection">
       <section className="tvCard" id="listing-form"><h2>{editing?'Edit listing':'Submit new listing'}</h2><p className="tvHelp">New or edited listings require manual review and are hidden from public bookings until approved.</p><form onSubmit={submitResource}><label className="tvLabel">Service type<select value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value})}><option value="vehicle">Vehicle rental</option><option value="parking">Parking space</option><option value="charging">EV charging</option></select></label><label className="tvLabel">Listing title<input required maxLength={100} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label className="tvLabel">Short description<textarea maxLength={200} value={draft.subtitle} onChange={e=>setDraft({...draft,subtitle:e.target.value})}/></label><label className="tvLabel">City<input required maxLength={80} value={draft.city} onChange={e=>setDraft({...draft,city:e.target.value})}/></label><label className="tvLabel">Area / locality<input required maxLength={120} value={draft.area} onChange={e=>setDraft({...draft,area:e.target.value})}/></label><label className="tvLabel">Hourly price (INR)<input type="number" min="1" max="100000" step="1" required value={draft.price_per_hour} onChange={e=>setDraft({...draft,price_per_hour:e.target.value})}/></label><label className="tvLabel">Features (comma-separated)<input placeholder="Covered, CCTV, 24/7" value={draft.features} onChange={e=>setDraft({...draft,features:e.target.value})}/></label><div className="tvButtons"><button className="tvButton" disabled={busy}>{busy?'Saving…':editing?'Send changes for review':'Submit listing'}</button>{editing&&<button type="button" className="tvButton tvSecondary" onClick={()=>{setEditing('');setDraft(empty);}}>Discard changes</button>}</div></form></section>
       <section className="tvCard"><h2>Your inventory</h2>{resources.length===0?<p className="tvEmpty">No listings submitted yet.</p>:resources.map(r=><div className="tvItem" key={r.id}><div className="tvItemTop"><strong>{r.title}</strong>{state(r.review_status)}</div><small>{r.kind.toUpperCase()} · {r.area}, {r.city} · {money(r.price_per_hour)}/hour</small><small>{r.active?'Publicly listed':'Not published'}</small><div className="tvButtons"><button className="tvButton tvSecondary" disabled={busy} onClick={()=>edit(r)}>Edit</button>{r.active&&<button className="tvButton tvDanger" disabled={busy} onClick={()=>unpublish(r.id)}>Unpublish</button>}</div></div>)}</section>
     </div>
     <section className="tvCard tvSection"><h2>Reservation requests</h2><p className="tvHelp">Approve or reject a new request. A confirmed request is not a payment receipt.</p>{bookings.length===0?<p className="tvEmpty">No bookings yet.</p>:bookings.map(b=><div className="tvItem" key={b.id}><div className="tvItemTop"><strong>{b.title}</strong>{state(b.status)}</div><small>{new Date(b.start_at).toLocaleString('en-IN')} — {new Date(b.end_at).toLocaleString('en-IN')} · {money(Number(b.total_paise)/100)}</small><div className="tvButtons">{b.status==='requested'&&<><button className="tvButton" disabled={busy} onClick={()=>bookingAction(b.id,'confirmed')}>Confirm</button><button className="tvButton tvDanger" disabled={busy} onClick={()=>bookingAction(b.id,'rejected')}>Reject</button></>}{b.status==='confirmed'&&new Date(b.end_at)<=new Date()&&<button className="tvButton tvSecondary" disabled={busy} onClick={()=>bookingAction(b.id,'completed')}>Mark complete</button>}</div></div>)}</section>
   </>}
 </Shell>;
}
