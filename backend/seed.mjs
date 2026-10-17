import { connectDatabase,installSafeFatalHandler } from './database.mjs';
import { DATASET,prefix,clubs,uses,disciplines,resources,materials,bookings,requirements,techniques } from './demo-data.mjs';
installSafeFatalHandler();
let database;
try{
  const connection=await connectDatabase();database=connection.database;
  const graph=connection.graph;
  const run=(query,params)=>graph.query(query,{params:{dataset:DATASET,...params}});
  // MERGE touches only stable IDs in this demo namespace; nothing is deleted.
  await run('UNWIND $rows AS row MERGE (c:Club {id:row.id}) SET c.dataset=$dataset,c.name=row.name,c.collection=row.collection',{rows:clubs});
  await run('UNWIND $rows AS row MERGE (u:Use {id:row.id}) SET u.dataset=$dataset,u.key=row.key,u.name=row.name',{rows:uses});
  await run('UNWIND $rows AS row MERGE (d:Discipline {id:row.id}) SET d.dataset=$dataset,d.key=row.key,d.name=row.name',{rows:disciplines.map(({id,key,name})=>({id,key,name}))});
  await run('UNWIND $rows AS row MATCH (d:Discipline {id:row.disciplineId}),(u:Use {id:row.useId}) MERGE (d)-[:USES]->(u)',{rows:disciplines.flatMap(d=>d.uses.map(key=>({disciplineId:d.id,useId:prefix(`use:${key}`)})))});
  await run('UNWIND $rows AS row MERGE (m:Material {id:row.id}) SET m.dataset=$dataset,m.name=row.name',{rows:materials});
  await run(`UNWIND $rows AS row MERGE (r:Resource {id:row.id})
    SET r.dataset=$dataset,r.key=row.key,r.name=row.name,r.quantity=row.quantity,
    r.dailyCost=row.dailyCost,r.unit=row.unit,r.dimensions=row.dimensions,r.canCut=row.canCut,r.canDye=row.canDye,
    r.restrictions=row.restrictions,r.description=row.description,r.condition=row.condition
    WITH r,row MATCH (c:Club {id:row.ownerId}) MERGE (c)-[:OWNS]->(r)`,{rows:resources});
  await run('UNWIND $rows AS row MATCH (r:Resource {id:row.resourceId}),(m:Material {id:row.materialId}) MERGE (r)-[:MADE_OF]->(m)',{rows:resources.flatMap(r=>r.materials.map(name=>({resourceId:r.id,materialId:prefix(`material:${name}`)})))});
  await run('UNWIND $rows AS row MATCH (r:Resource {id:row.resourceId}),(u:Use {id:row.useId}) MERGE (r)-[:SUITABLE_FOR]->(u)',{rows:resources.flatMap(r=>r.purposes.map(key=>({resourceId:r.id,useId:prefix(`use:${key}`)})))});
  await run(`UNWIND $rows AS row MERGE (b:Booking {id:row.id})
    SET b.dataset=$dataset,b.startDate=row.startDate,b.endDate=row.endDate,b.quantity=row.quantity,b.status=row.status
    WITH b,row MATCH (r:Resource {id:row.resourceId}) MERGE (b)-[:RESERVES]->(r)`,{rows:bookings});
  await run('UNWIND $rows AS row MATCH (r:Resource {id:row.resourceId}),(required:Resource {id:row.requiredId}) MERGE (r)-[:REQUIRES]->(required)',{rows:requirements});

  await run('UNWIND $rows AS row MERGE (t:Technique {id:row.id}) SET t.dataset=$dataset,t.name=row.name,t.outcome=row.outcome WITH t,row MATCH (d:Discipline {id:row.disciplineId}) MERGE (d)-[:ENABLES]->(t)',{rows:techniques.map(t=>({id:t.id,name:t.name,outcome:t.outcome,disciplineId:prefix('discipline:'+t.discipline)}))});
  const needs=techniques.flatMap(t=>t.needs.map(n=>({...n,techniqueId:t.id})));
  await run('UNWIND $rows AS row MERGE (n:Need {id:row.id}) SET n.dataset=$dataset,n.name=row.name,n.operation=row.operation WITH n,row MATCH (t:Technique {id:row.techniqueId}) MERGE (t)-[:NEEDS]->(n)',{rows:needs.map(({options,...n})=>n)});
  await run('UNWIND $rows AS row MATCH (n:Need {id:row.needId}),(r:Resource {id:row.resourceId}) MERGE (n)-[:ACCEPTS]->(r)',{rows:needs.flatMap(n=>n.options.map(resourceId=>({needId:n.id,resourceId})))});
  const result=await graph.roQuery('MATCH (r:Resource {dataset:$dataset}) RETURN count(r) AS resources',{params:{dataset:DATASET}});
  if(result.data[0]?.resources!==resources.length)throw new Error('Unexpected resource count');
  console.log(`Demo graph ready: ${resources.length} resources, ${techniques.length} connected techniques, ${bookings.length} bookings and ${requirements.length} equipment dependencies.`);
  console.log('Only the SecondAct demo namespace was updated. No existing records were deleted.');
}catch{
  console.error('The demo graph could not be prepared. Check the database connection and the seeding code.');
  process.exitCode=1;
}finally{if(database)await database.close()}
