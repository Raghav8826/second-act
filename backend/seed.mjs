import { connectDatabase,installSafeFatalHandler } from './database.mjs';
import { DATASET,prefix,clubs,uses,disciplines,resources,materials,bookings,requirements } from './demo-data.mjs';
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
    r.dailyCost=row.dailyCost,r.unit=row.unit,r.dimensions=row.dimensions,
    r.restrictions=row.restrictions,r.description=row.description,r.condition=row.condition
    WITH r,row MATCH (c:Club {id:row.ownerId}) MERGE (c)-[:OWNS]->(r)`,{rows:resources});
  await run('UNWIND $rows AS row MATCH (r:Resource {id:row.resourceId}),(m:Material {id:row.materialId}) MERGE (r)-[:MADE_OF]->(m)',{rows:resources.flatMap(r=>r.materials.map(name=>({resourceId:r.id,materialId:prefix(`material:${name}`)})))});
  await run('UNWIND $rows AS row MATCH (r:Resource {id:row.resourceId}),(u:Use {id:row.useId}) MERGE (r)-[:SUITABLE_FOR]->(u)',{rows:resources.flatMap(r=>r.purposes.map(key=>({resourceId:r.id,useId:prefix(`use:${key}`)})))});
  await run(`UNWIND $rows AS row MERGE (b:Booking {id:row.id})
    SET b.dataset=$dataset,b.startDate=row.startDate,b.endDate=row.endDate,b.quantity=row.quantity,b.status=row.status
    WITH b,row MATCH (r:Resource {id:row.resourceId}) MERGE (b)-[:RESERVES]->(r)`,{rows:bookings});
  await run('UNWIND $rows AS row MATCH (r:Resource {id:row.resourceId}),(required:Resource {id:row.requiredId}) MERGE (r)-[:REQUIRES]->(required)',{rows:requirements});
  const result=await graph.roQuery('MATCH (r:Resource {dataset:$dataset}) RETURN count(r) AS resources',{params:{dataset:DATASET}});
  if(result.data[0]?.resources!==10)throw new Error('Unexpected resource count');
  console.log('Demo graph ready: 10 resources, 4 clubs, 4 disciplines, materials, creative uses, 3 bookings and a camera/lens dependency.');
  console.log('Only the Second Act demo namespace was updated. No existing records were deleted.');
}catch{
  console.error('The demo graph could not be prepared. Check the database connection and the seeding code.');
  process.exitCode=1;
}finally{if(database)await database.close()}
