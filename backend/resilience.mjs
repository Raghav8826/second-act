import {setTimeout as sleep} from 'node:timers/promises';

export class InventoryUnavailable extends Error {
  constructor(){super('The inventory connection is recovering. Your brief is saved; try again in a few seconds.');this.name='InventoryUnavailable'}
}

export function isConnectionFailure(error){
  return /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENETUNREACH|EHOSTUNREACH|EAI_AGAIN)$/.test(error?.code||'')||
    [error?.name,error?.constructor?.name].some(name=>/^(ClientClosedError|ClientOfflineError|SocketClosedUnexpectedlyError|SocketTimeoutError|InventoryUnavailable)$/.test(name||''));
}

async function bounded(operation,ms){
  let timer;
  try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new InventoryUnavailable()),ms)})])}
  finally{clearTimeout(timer)}
}

// Retry reads only. A timeout never replays a mutation or uses cached inventory.
export function recoveringReader(read,isReady,{waitMs=6000,queryMs=8000,pause=sleep}={}){
  return async(...args)=>{
    for(let attempt=0;attempt<2;attempt++){
      try{
        let waited=0;
        while(!isReady()&&waited<waitMs){await pause(100);waited+=100}
        if(!isReady())throw new InventoryUnavailable();
        return await bounded(()=>read(...args),queryMs);
      }catch(error){
        if(!isConnectionFailure(error))throw error;
        if(attempt===1)throw new InventoryUnavailable();
        await pause(300);
      }
    }
  };
}
