import test from 'node:test';
import assert from 'node:assert/strict';
import {loadDatabaseConfig} from './config.mjs';
const env={FALKORDB_URL:'falkors://demo@example.test:6379',FALKORDB_PASSWORD:'fictional-test-password'};

test('server reconnects indefinitely with bounded delays and no offline command replay',()=>{
  const {connection}=loadDatabaseConfig(env,{recover:true});
  const retry=connection.socket.reconnectStrategy;
  assert.equal(retry(0),250);
  assert.equal(retry(2),1000);
  assert.equal(retry(1000),5000);
  assert.equal(connection.disableOfflineQueue,true);
  assert.equal(connection.socket.tls,true);
  assert.equal(connection.pingInterval,30000);
});

test('one-off connection checks keep fail-fast behaviour',()=>{
  const {connection}=loadDatabaseConfig(env);
  assert.equal(connection.socket.reconnectStrategy,false);
  assert.equal(connection.pingInterval,undefined);
  assert.equal(connection.disableOfflineQueue,true);
});
