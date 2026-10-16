import { FalkorDB } from 'falkordb';
import { ConfigurationError, loadDatabaseConfig } from './config.mjs';

function explainConnectionError(error) {
  const message = String(error?.message || '');
  if (/WRONGPASS|invalid username|authentication|NOAUTH/i.test(message)) {
    return 'The database rejected the login. Check the database username and password in backend/.env.';
  }
  if (/ENOTFOUND|EAI_AGAIN/i.test(message)) return 'The database host could not be resolved. Check the Cloud endpoint and your internet connection.';
  if (/certificate|TLS|SSL|wrong version|self.signed/i.test(message)) return 'Check the TLS setting against the Cloud connection instructions. Certificate verification has not been disabled.';
  if (/timeout|ETIMEDOUT|ECONNREFUSED|ECONNRESET|Socket closed|EACCES|EPERM/i.test(message)) {
    return 'The database could not be reached. Check that the instance is running, its port is correct, and its TLS setting matches the dashboard.';
  }
  return 'The database connection check failed. Recheck the Cloud connection settings and database password.';
}

let database;
// The driver's initial socket errors can be emitted before connect() returns a
// client to attach a listener to. Keep this CLI's fatal-error output sanitised.
process.on('uncaughtException', error => {
  console.error(explainConnectionError(error));
  process.exit(1);
});
try {
  const config = loadDatabaseConfig();
  console.log('Checking the configured FalkorDB instance…');
  database = await FalkorDB.connect(config.connection);
  // Read-only verification: no graphs, records or demo data are created.
  await database.list();
  console.log('Connected successfully. FalkorDB accepted the login and answered a read-only graph-list request.');
  console.log(`Ready to build the ${config.graphName} graph. No database records were changed.`);
} catch (error) {
  // Never echo the connection options, raw driver errors, password or full URL.
  console.error(error instanceof ConfigurationError ? error.message : explainConnectionError(error));
  process.exitCode = error instanceof ConfigurationError ? 2 : 1;
} finally {
  if (database) await database.close();
}
