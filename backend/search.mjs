import { DATASET,prefix,disciplines } from './demo-data.mjs';
import { availableStock,InputError } from './availability.mjs';

const RESOURCE_ROWS=`
  MATCH (owner:Club {dataset:$dataset})-[:OWNS]->(r:Resource {dataset:$dataset})-[:SUITABLE_FOR]->(u)
  OPTIONAL MATCH (r)<-[:RESERVES]-(b:Booking {dataset:$dataset})
  WHERE b.status='confirmed' AND b.startDate <= $end AND b.endDate >= $start
  WITH r,owner,u,collect(DISTINCT {id:b.id,startDate:b.startDate,endDate:b.endDate,quantity:b.quantity,status:b.status}) AS bookings
  OPTIONAL MATCH (r)-[:MADE_OF]->(m:Material {dataset:$dataset})
  RETURN r.id AS id,r.name AS name,r.quantity AS totalQuantity,r.dailyCost AS dailyCost,
    r.unit AS unit,r.dimensions AS dimensions,r.restrictions AS restrictions,r.description AS description,
    owner.name AS owner,owner.collection AS collection,u.name AS purposeName,
    collect(DISTINCT m.name) AS materials,bookings`;
export const SEARCH_QUERY=`MATCH (d:Discipline {id:$disciplineId})-[:USES]->(u:Use {key:$purpose}) ${RESOURCE_ROWS}`;
export const ALTERNATIVES_QUERY=`
  MATCH (source:Resource {id:$sourceId,dataset:$dataset})-[:SUITABLE_FOR]->(u:Use {key:$purpose})
  MATCH (d:Discipline {id:$disciplineId})-[:USES]->(u)
  ${RESOURCE_ROWS.replace('OPTIONAL MATCH (r)<-', 'WITH r,owner,u WHERE r.id <> $sourceId\n OPTIONAL MATCH (r)<-')}`;
const REQUIREMENTS_QUERY=`
  MATCH (r:Resource {dataset:$dataset})-[:REQUIRES]->(required:Resource {dataset:$dataset})
  WHERE r.id IN $resourceIds
  OPTIONAL MATCH (required)<-[:RESERVES]-(b:Booking {dataset:$dataset})
  WHERE b.status='confirmed' AND b.startDate <= $end AND b.endDate >= $start
  RETURN r.id AS resourceId,required.id AS id,required.name AS name,required.quantity AS totalQuantity,
    required.dailyCost AS dailyCost,collect(DISTINCT {id:b.id,startDate:b.startDate,endDate:b.endDate,quantity:b.quantity,status:b.status}) AS bookings`;

export async function searchResources(graph,input){
  const discipline=disciplines.find(d=>d.key===input.discipline);
  if(!discipline)throw new InputError('Choose one of the four creative disciplines.');
  if(!discipline.uses.includes(input.purpose))throw new InputError('Choose a supported resource purpose for this creative discipline.');
  if(input.sourceId&&(!input.sourceId.startsWith(prefix('resource:'))||input.sourceId.length>160))throw new InputError('Choose a valid resource to find alternatives.');
  const params={dataset:DATASET,disciplineId:discipline.id,purpose:input.purpose,start:input.start,end:input.end,sourceId:input.sourceId};
  const result=await graph.roQuery(input.sourceId?ALTERNATIVES_QUERY:SEARCH_QUERY,{params});
  const rows=result.data||[];
  let requiredRows=[];
  if(rows.length){
    const required=await graph.roQuery(REQUIREMENTS_QUERY,{params:{dataset:DATASET,resourceIds:rows.map(r=>r.id),start:input.start,end:input.end}});
    requiredRows=required.data||[];
  }
  const matches=rows.map(row=>{
    const primaryStock=availableStock(row.totalQuantity,row.bookings,input.start,input.end);
    const requirements=requiredRows.filter(r=>r.resourceId===row.id).map(r=>({
      id:r.id,name:r.name,availableQuantity:availableStock(r.totalQuantity,r.bookings,input.start,input.end),dailyCost:Number(r.dailyCost)
    }));
    const availableQuantity=Math.min(primaryStock,...requirements.map(r=>r.availableQuantity));
    const available=availableQuantity>=input.quantity;
    const costPerDay=Number(row.dailyCost)+requirements.reduce((sum,r)=>sum+r.dailyCost,0);
    const totalCost=costPerDay*input.quantity*input.days;
    let reason=`${availableQuantity} ${row.unit}${availableQuantity===1?'':'s'} available throughout your dates.`;
    if(primaryStock<input.quantity)reason=`Only ${primaryStock} ${row.unit}${primaryStock===1?'':'s'} available throughout your dates; you requested ${input.quantity}.`;
    const missing=requirements.filter(r=>r.availableQuantity<input.quantity);
    if(missing.length)reason=`Requires ${missing.map(r=>r.name).join(', ')}, which is unavailable in the quantity requested.`;
    return {
      id:row.id,name:row.name,owner:row.owner,collection:row.collection,description:row.description,
      unit:row.unit,dimensions:row.dimensions,restrictions:row.restrictions,materials:row.materials,
      availableQuantity,available,reason,quantityRequested:input.quantity,days:input.days,dailyCost:Number(row.dailyCost),
      totalCost,currency:'INR',requirements,withinBudget:input.budget===null||totalCost<=input.budget,
      explanation:`${discipline.name} → ${row.purposeName} → ${row.name}. Shared by ${row.owner}.`,
      source:'FalkorDB demo inventory'
    };
  }).filter(r=>r.withinBudget&&(input.includeUnavailable||r.available));
  matches.sort((a,b)=>Number(b.available)-Number(a.available)||a.totalCost-b.totalCost||a.name.localeCompare(b.name));
  return {
    inventory:'Fictional campus demo',discipline:input.discipline,purpose:input.purpose,start:input.start,end:input.end,
    days:input.days,quantity:input.quantity,budget:input.budget,sourceId:input.sourceId||null,
    matches,availableCount:matches.filter(r=>r.available).length,totalMatches:matches.length,
    note:'Costs are for each listed resource and quantity over the full date range. Required equipment costs are included. No booking is created by searching.'
  };
}
