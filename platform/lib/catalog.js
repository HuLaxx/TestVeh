
export const samples = Object.freeze([
  {id:'sample-v1',kind:'vehicle',title:'Tata Nexon EV',subtitle:'Electric SUV · Automatic',city:'Pune',area:'Koregaon Park',price_per_hour:340,features:['5 seats','EV','Automatic'],icon:'car'},
  {id:'sample-v2',kind:'vehicle',title:'Hyundai i20',subtitle:'Premium hatchback · Manual',city:'Mumbai',area:'Andheri West',price_per_hour:220,features:['5 seats','Petrol','Manual'],icon:'car'},
  {id:'sample-p1',kind:'parking',title:'Covered City Parking',subtitle:'Secure covered parking · CCTV',city:'Pune',area:'Viman Nagar',price_per_hour:45,features:['Covered','CCTV','24/7'],icon:'parking'},
  {id:'sample-p2',kind:'parking',title:'Central Business Parking',subtitle:'Flexible hourly parking',city:'Bengaluru',area:'Indiranagar',price_per_hour:65,features:['Accessible','Covered','Guarded'],icon:'parking'},
  {id:'sample-c1',kind:'charging',title:'Rapid DC Charging Bay',subtitle:'60 kW DC · CCS2',city:'Pune',area:'Baner',price_per_hour:290,features:['CCS2','60 kW','DC fast'],icon:'charging'},
  {id:'sample-c2',kind:'charging',title:'Community AC Charger',subtitle:'7.4 kW AC · Type 2',city:'Mumbai',area:'Powai',price_per_hour:95,features:['Type 2','7.4 kW','AC'],icon:'charging'}
].map(x=>({...x, demo:true, available:null})));
export function normalizeItem(r) {
  return {
    id:r.id,kind:r.kind,title:r.title,subtitle:r.subtitle,city:r.city,
    area:r.area,price_per_hour:Number(r.price_per_hour),features:r.features||[],
    icon:r.kind==='parking'?'parking':r.kind==='charging'?'charging':'car',
    demo:false,available:r.available??null
  };
}
