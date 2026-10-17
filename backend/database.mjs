import { FalkorDB } from 'falkordb';
import { loadDatabaseConfig } from './config.mjs';
import {recoveringReader} from './resilience.mjs';

export async function connectDatabase({recover=false}={}){
  const config=loadDatabaseConfig(process.env,{recover});
  const database=await FalkorDB.connect(config.connection);
  database.on('error',()=>console.error('The database connection is unavailable.'));
  const graph=database.selectGraph(config.graphName);
  if(recover){
    const client=await database.connection,read=graph.roQuery.bind(graph);
    graph.roQuery=recoveringReader(read,()=>client.isReady);
  }
  return {database,graph,graphName:config.graphName};
}

export function installSafeFatalHandler(){
  process.on('uncaughtException',()=>{
    console.error('The backend stopped after a connection or runtime error. Check the private database settings and restart.');
    process.exit(1);
  });
}
