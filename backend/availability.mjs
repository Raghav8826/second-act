const DAY=86400000;
export class InputError extends Error{}
export function parseDate(value,label='Date'){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new InputError(`${label} must be a valid date.`);
  const timestamp=Date.parse(`${value}T00:00:00Z`);
  if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==value)throw new InputError(`${label} must be a valid date.`);
  return timestamp;
}
export function parseSearch(params){
  const discipline=params.get('discipline')||'';
  const purpose=params.get('purpose')||'';
  const start=params.get('start')||'',end=params.get('end')||start;
  const from=parseDate(start,'Start date'),until=parseDate(end,'End date');
  if(until<from)throw new InputError('End date must be on or after the start date.');
  const days=(until-from)/DAY+1;
  if(days>366)throw new InputError('Search for no more than 366 days at a time.');
  const rawQuantity=params.get('quantity')||'1',quantity=Number(rawQuantity);
  if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw new InputError('Quantity must be a whole number from 1 to 99.');
  const budgetValue=params.get('budget');
  const budget=budgetValue===null||budgetValue===''?null:Number(budgetValue);
  if(budget!==null&&(!Number.isFinite(budget)||budget<0||budget>10000000))throw new InputError('Budget must be a non-negative amount in rupees.');
  return {discipline,purpose,start,end,days,quantity,budget,includeUnavailable:params.get('includeUnavailable')==='true',sourceId:params.get('sourceId')||''};
}
// A booking occupies stock on both its start and end dates. Use peak concurrent
// reservations, not the sum of separate bookings across the entire date range.
export function availableStock(total,bookings,start,end){
  const from=parseDate(start),until=parseDate(end);
  const events=new Map();
  for(const booking of bookings||[]){
    if(!booking?.id||booking.status!=='confirmed')continue;
    const left=Math.max(from,parseDate(booking.startDate)),right=Math.min(until,parseDate(booking.endDate));
    if(left>right)continue;
    const quantity=Number(booking.quantity);
    if(!Number.isInteger(quantity)||quantity<1)continue;
    events.set(left,(events.get(left)||0)+quantity);
    events.set(right+DAY,(events.get(right+DAY)||0)-quantity);
  }
  let current=0,peak=0;
  for(const [,change] of [...events.entries()].sort((a,b)=>a[0]-b[0])){current+=change;peak=Math.max(peak,current)}
  return Math.max(0,Number(total)-peak);
}
