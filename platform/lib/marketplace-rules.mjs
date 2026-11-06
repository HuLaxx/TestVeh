const kinds = new Set(['vehicle','parking','charging']);
function field(value,label,max,min=2) {
  if(typeof value!=='string') throw Error(label+' is required.');
  const result=value.trim().replace(/\s+/g,' ');
  if(result.length<min || result.length>max || /[\u0000-\u001F\u007F]/.test(result))
    throw Error(label+' must contain '+min+'–'+max+' valid characters.');
  return result;
}
export function parseOperatorApplication(data) {
  if(!data || typeof data!=='object' || Array.isArray(data)) throw Error('Invalid application.');
  const businessName=field(data.businessName,'Business name',120);
  const city=field(data.city,'City',80);
  const contactEmail=String(data.contactEmail||'').trim().toLowerCase();
  if(contactEmail.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    throw Error('Enter a valid business contact email.');
  return {businessName,city,contactEmail};
}
export function parseResource(data) {
  if(!data || typeof data!=='object' || Array.isArray(data)) throw Error('Invalid listing.');
  if(!kinds.has(data.kind)) throw Error('Choose a valid service.');
  const title=field(data.title,'Listing title',100);
  const subtitle=field(data.subtitle||'','Listing summary',200,0);
  const city=field(data.city,'City',80);
  const area=field(data.area,'Area',120);
  const price=Number(data.price_per_hour);
  if(!Number.isSafeInteger(price) || price<1 || price>100000)
    throw Error('Hourly price must be between ₹1 and ₹100,000.');
  if(!Array.isArray(data.features) || data.features.length>8)
    throw Error('Choose up to eight features.');
  const features=[...new Set(data.features.map(x=>field(x,'Feature',40,1)))];
  return {kind:data.kind,title,subtitle,city,area,price_per_hour:price,features};
}
export function decisionAllowed(previous,next,endAt,now=new Date()) {
  if(previous==='requested' && next==='rejected') return true;
  if(previous==='requested' && next==='confirmed' && new Date(endAt).getTime()>now.getTime()) return true;
  if(previous==='confirmed' && next==='completed' && new Date(endAt).getTime()<=now.getTime()) return true;
  return false;
}
export function reviewStatusAllowed(next) {return next==='approved'||next==='rejected';}
export function operatorStatusAllowed(next) {return ['approved','rejected','suspended'].includes(next);}
