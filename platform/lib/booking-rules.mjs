
export function parseInterval(start,end,now=new Date()) {
  const a = new Date(start), b = new Date(end);
  if(!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()))
    throw Error('Select valid start and end times.');
  if(a.getTime() < now.getTime()+10*60*1000)
    throw Error('Bookings must start at least ten minutes from now.');
  if(b.getTime() <= a.getTime()) throw Error('End time must be after start time.');
  if(b.getTime()-a.getTime() > 7*24*60*60*1000)
    throw Error('Maximum booking length is seven days.');
  if(a.getTime()-now.getTime() > 90*24*60*60*1000)
    throw Error('Bookings can be made at most 90 days ahead.');
  return {start:a.toISOString(),end:b.toISOString(),hours:(b.getTime()-a.getTime())/3600000};
}
export function totalInPaise(hourlyRupees,hours) {
  if(!Number.isInteger(hourlyRupees)||hourlyRupees<0||!Number.isFinite(hours)||hours<=0) throw Error('Invalid pricing');
  return Math.ceil(hourlyRupees*100*hours);
}
