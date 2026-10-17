import {DATASET,prefix,disciplines} from './demo-data.mjs';
import {parseSearch,InputError} from './availability.mjs';
import {searchResources} from './search.mjs';

export const TECHNIQUES_QUERY=`
 MATCH (d:Discipline {id:$disciplineId,dataset:$dataset})-[:ENABLES]->(t:Technique {dataset:$dataset})
       -[:NEEDS]->(n:Need {dataset:$dataset})-[:ACCEPTS]->(r:Resource {dataset:$dataset})
 RETURN t.id AS techniqueId,t.name AS techniqueName,t.outcome AS outcome,
 n.id AS needId,n.name AS needName,n.operation AS operation,
 r.id AS resourceId,r.name AS resourceName,r.canCut AS canCut,r.canDye AS canDye`;

export async function inspectTechniques(graph,brief){
  const discipline=disciplines.find(d=>d.key===brief.discipline);
  if(!discipline)throw new InputError('Choose a supported creative discipline.');
  const result=await graph.roQuery(TECHNIQUES_QUERY,{params:{dataset:DATASET,disciplineId:prefix(`discipline:${brief.discipline}`)}});
  const inventory=new Map();
  for(const purpose of discipline.uses){
    const found=await searchResources(graph,parseSearch(new URLSearchParams({discipline:brief.discipline,purpose,start:brief.start,end:brief.end,quantity:'1',includeUnavailable:'true'})));
    for(const resource of found.matches)inventory.set(resource.id,resource);
  }
  const methods=new Map();
  for(const row of result.data||[]){
    if(!methods.has(row.techniqueId))methods.set(row.techniqueId,{id:row.techniqueId,name:row.techniqueName,outcome:row.outcome,needs:new Map()});
    const method=methods.get(row.techniqueId);
    if(!method.needs.has(row.needId))method.needs.set(row.needId,{id:row.needId,name:row.needName,operation:row.operation,options:[],rejected:[]});
    const need=method.needs.get(row.needId),resource=inventory.get(row.resourceId);
    const permitted=(row.operation!=='cut'||row.canCut===true)&&(row.operation!=='dye'||row.canDye===true);
    const reason=!permitted?`This technique needs ${row.operation}; the owner does not permit it.`:!resource?'Not found in the discipline inventory.':!resource.available?resource.reason:null;
    const path=`${discipline.name} → ${method.name} → ${need.name} → ${row.resourceName}`;
    if(reason)need.rejected.push({id:row.resourceId,name:row.resourceName,reason,path});
    else need.options.push({...resource,path});
  }
  return {techniques:[...methods.values()].map(method=>{
    const needs=[...method.needs.values()];
    return {...method,needs,available:needs.every(n=>n.options.length>0),
      reason:needs.filter(n=>!n.options.length).map(n=>`Missing: ${n.name}`).join('; ')||'Every required need has an available, permitted option. Final selections must still fit the combined budget.'};
  }),note:'Fictional demo methods. Availability and alteration permissions are checked in the graph. Select one option for every need; costs and shared dependencies are verified together at plan completion. User-owned base garments, skills and creative suitability remain assumptions.'};
}

export function verifyTechniques(ids,observed,resourceIds){
  if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length)throw new InputError('Select up to three different inspected techniques.');
  return ids.map(id=>{
    const method=observed.get(id);
    if(!method||!method.available)throw new InputError('Only select techniques verified as available by inspect_techniques.');
    const needs=method.needs.map(need=>{
      const selected=need.options.find(option=>resourceIds.has(option.id));
      if(!selected)throw new InputError(`Include an available, permitted resource for ${method.name}: ${need.name}.`);
      return {name:need.name,operation:need.operation,resourceId:selected.id,resourceName:selected.name,path:selected.path};
    });
    return {id:method.id,name:method.name,outcome:method.outcome,needs};
  });
}
