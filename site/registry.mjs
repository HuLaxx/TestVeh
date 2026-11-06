export const TYPES=['Hatchback','Sedan','SUV','Motorcycle','Van','Truck','Other'];
export const FUELS=['Petrol','Diesel','Electric','Hybrid','CNG','Other'];
export const STATES=['Pending review','Documents requested','Reviewed (demo)'];
export const sampleRecords=[
 {id:'D-1001',plate:'MH12EX2401',make:'Tata',model:'Nexon EV',type:'SUV',fuel:'Electric',year:2024,keeper:'Demo Fleet A',zone:'Pune',status:'Pending review',inspection:'2027-01-15',notes:'Illustrative vehicle registration application. No real records.',documents:['identity','insurance'],created:'2026-11-01',demo:true},
 {id:'D-1002',plate:'KA03EX8812',make:'Honda',model:'City',type:'Sedan',fuel:'Petrol',year:2021,keeper:'Demo Fleet B',zone:'Bengaluru',status:'Documents requested',inspection:'2027-02-12',notes:'Illustrative application with a missing-document status.',documents:['insurance'],created:'2026-11-02',demo:true},
 {id:'D-1003',plate:'DL08EX1234',make:'Ather',model:'450X',type:'Motorcycle',fuel:'Electric',year:2023,keeper:'Demo Rider C',zone:'New Delhi',status:'Reviewed (demo)',inspection:'2027-03-29',notes:'Illustrative completed desk review; not official approval.',documents:['identity','insurance','inspection'],created:'2026-11-03',demo:true},
 {id:'D-1004',plate:'GJ01EX5432',make:'Maruti Suzuki',model:'Baleno',type:'Hatchback',fuel:'Petrol',year:2022,keeper:'Demo Fleet D',zone:'Ahmedabad',status:'Pending review',inspection:'2027-06-02',notes:'Illustrative personal vehicle record.',documents:['identity'],created:'2026-11-04',demo:true}
];
export function normalizePlate(s){return String(s||'').trim().toUpperCase().replace(/[\s-]/g,'')}
export function validateRecord(raw,others=[],currentId){
 const plate=normalizePlate(raw.plate);
 if(!/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(plate))throw Error('Use an Indian-style plate such as MH12AB1234 (fictional example).');
 if(others.some(x=>x.id!==currentId&&normalizePlate(x.plate)===plate))throw Error('This registration number is already in your local records.');
 const make=String(raw.make||'').trim(),model=String(raw.model||'').trim(),keeper=String(raw.keeper||'').trim(),zone=String(raw.zone||'').trim();
 if(make.length<2||make.length>50)throw Error('Manufacturer must be 2–50 characters.');
 if(model.length<2||model.length>60)throw Error('Model must be 2–60 characters.');
 if(keeper.length<2||keeper.length>65)throw Error('Enter a 2–65 character keeper label. Use a pseudonym for public demos.');
 if(zone.length<2||zone.length>65)throw Error('Region must be 2–65 characters.');
 const year=Number(raw.year);
 if(!Number.isInteger(year)||year<1980||year>new Date().getFullYear()+1)throw Error('Vehicle year is outside the supported range.');
 if(!TYPES.includes(raw.type)||!FUELS.includes(raw.fuel))throw Error('Select a supported vehicle type and fuel.');
 const inspection=String(raw.inspection||'').trim();
 if(inspection&&!/^\d{4}-\d{2}-\d{2}$/.test(inspection))throw Error('Use a valid inspection date.');
 if(inspection){const t=new Date(inspection+'T00:00:00Z');if(Number.isNaN(t.valueOf())||t.toISOString().slice(0,10)!==inspection)throw Error('Inspection date is invalid.');}
 const notes=String(raw.notes||'').trim();if(notes.length>450)throw Error('Notes must be 450 characters or fewer.');
 return {plate,make,model,keeper,zone,year,type:raw.type,fuel:raw.fuel,inspection,notes,documents:Array.isArray(raw.documents)?raw.documents.filter(x=>['identity','insurance','inspection'].includes(x)):[],status:STATES.includes(raw.status)?raw.status:STATES[0]};
}
export function searchRecords(items,{q='',status='All statuses',fuel='Any fuel',type='Any type'}={}){
 const query=q.toLowerCase().trim();
 return items.filter(x=>(!query||[x.plate,x.make,x.model,x.keeper,x.zone].join(' ').toLowerCase().includes(query))&&(status==='All statuses'||x.status===status)&&(fuel==='Any fuel'||x.fuel===fuel)&&(type==='Any type'||x.type===type));
}
export function counts(records){return {total:records.length,pending:records.filter(x=>x.status==='Pending review').length,requests:records.filter(x=>x.status==='Documents requested').length,reviewed:records.filter(x=>x.status==='Reviewed (demo)').length,electric:records.filter(x=>x.fuel==='Electric').length}}
export function exportCSV(records){const cols=['id','plate','make','model','type','fuel','year','keeper','zone','status','inspection','notes','documents'];const escapeCell=value=>'"'+String(value??'').replace(/"/g,'""')+'"';return [cols.map(escapeCell).join(','),...records.map(r=>cols.map(k=>escapeCell(k==='documents'?(r.documents||[]).join('|'):r[k])).join(','))].join('\r\n')}
