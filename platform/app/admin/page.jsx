'use client';
import {useCallback,useEffect,useState} from 'react';
async function api(url,options={}) {
 const r=await fetch(url,{...options,cache:'no-store',headers:{'content-type':'application/json',...options.headers}});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Service unavailable.');return data;
}
function status(s){return <span className="tvState" data-status={s}>{s}</span>;}
export default function Admin(){
 const [operators,setOperators]=useState([]),[resources,setResources]=useState([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  try{
   const [o,r]=await Promise.all([api('/api/admin/operators'),api('/api/admin/resources')]);
   setOperators(o.operators||[]);setResources(r.resources||[]);setError('');
  }catch(e){setError(e.message);}finally{setLoading(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 async function decide(type,id,next){
  if(next==='approved'&&!window.confirm('Approve only after verifying the business or listing offline. Continue?'))return;
  setBusy(true);
  try{await api('/api/admin/'+type+'/'+id,{method:'PATCH',body:JSON.stringify({status:next})});setNotice('Decision recorded in the audit log.');await load();}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <div className="tvPortal"><header className="tvTop"><a className="tvBrand" href="/">test<span>veh</span></a><nav><a href="/">Marketplace</a><a href="/partner">Partner portal</a><a href="/admin">Moderation</a></nav></header><main className="tvMain"><section className="tvHero"><div><small>TESTVEH / RESTRICTED</small><h1>Trust & operations.</h1><p>Review partners and inventory before they reach customers. Every decision is enforced on the server and written to an audit trail.</p></div><span className="tvPill">ADMIN ONLY</span></section>
   <div className="tvAlert">Approvals must follow your real identity, insurance, inventory ownership and safety verification process. The platform cannot perform these checks automatically.</div>
   {loading&&<div className="tvAlert">Checking administrator access…</div>}
   {error&&<div className="tvAlert tvError" role="alert">{error}</div>}
   {notice&&<div className="tvAlert tvSuccess" role="status">{notice}</div>}
   {!loading&&!error&&<>
    <div className="tvStats"><div className="tvStat"><strong>{operators.filter(x=>x.status==='pending').length}</strong><span>Partner applications</span></div><div className="tvStat"><strong>{resources.filter(x=>x.review_status==='pending').length}</strong><span>Listings awaiting review</span></div><div className="tvStat"><strong>{resources.filter(x=>x.active).length}</strong><span>Published listings</span></div></div>
    <div className="tvSplit tvSection">
     <section className="tvCard"><h2>Operator approvals</h2>{operators.length===0?<p className="tvEmpty">No operator applications.</p>:operators.map(o=><div className="tvItem" key={o.user_id}><div className="tvItemTop"><strong>{o.business_name}</strong>{status(o.status)}</div><small>{o.city} · {o.contact_email} · Account: {o.email}</small><div className="tvButtons">{o.status!=='approved'&&<button className="tvButton" disabled={busy} onClick={()=>decide('operators',o.user_id,'approved')}>Approve</button>}{o.status!=='rejected'&&o.status!=='suspended'&&<button className="tvButton tvDanger" disabled={busy} onClick={()=>decide('operators',o.user_id,o.status==='approved'?'suspended':'rejected')}>{o.status==='approved'?'Suspend':'Reject'}</button>}</div></div>)}</section>
     <section className="tvCard"><h2>Listing review queue</h2>{resources.length===0?<p className="tvEmpty">No submitted inventory.</p>:resources.map(r=><div className="tvItem" key={r.id}><div className="tvItemTop"><strong>{r.title}</strong>{status(r.review_status)}</div><small>{r.business_name||'No linked business'} · {r.kind} · {r.area}, {r.city} · ₹{r.price_per_hour}/hr</small><small>Operator status: {r.operator_status||'missing'} · {r.active?'Published':'Unpublished'}</small><div className="tvButtons">{(r.review_status!=='approved'||!r.active)&&<button className="tvButton" disabled={busy||r.operator_status!=='approved'} onClick={()=>decide('resources',r.id,'approved')}>Approve & publish</button>}{r.review_status!=='rejected'&&<button className="tvButton tvDanger" disabled={busy} onClick={()=>decide('resources',r.id,'rejected')}>Reject & unpublish</button>}</div></div>)}</section>
    </div>
   </>}
 </main></div>;
}
