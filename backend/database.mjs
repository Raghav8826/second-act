import { FalkorDB } from 'falkordb';
import { loadDatabaseConfig } from './config.mjs';

export async function connectDatabase(){
  const config=loadDatabaseConfig();
  const database=await FalkorDB.connect(config.connection);
  database.on('error',()=>console.error('The database connection is unavailable.'));
  return {database,graph:database.selectGraph(config.graphName),graphName:config.graphName};
}

export function installSafeFatalHandler(){
  process.on('uncaughtException',()=>{
    console.error('The backend stopped after a connection or runtime error. Check the private database settings and restart.');
    process.exit(1);
  });
}
