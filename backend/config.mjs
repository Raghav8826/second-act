const ALLOWED_PROTOCOLS = new Set(['falkor:', 'falkors:', 'redis:', 'rediss:']);

export class ConfigurationError extends Error {}

// Retry only the long-running server connection; commands are never queued
// during an outage. CLI checks still fail promptly instead of hanging.
export const reconnectDelay = retries => Math.min(250 * 2 ** Math.min(retries, 5), 5000);

export function loadDatabaseConfig(env = process.env, {recover = false} = {}) {
  const address = env.FALKORDB_URL?.trim();
  if (!address) throw new ConfigurationError('Add FALKORDB_URL to backend/.env first.');
  let endpoint;
  try { endpoint = new URL(address); }
  catch { throw new ConfigurationError('FALKORDB_URL is not a valid connection address.'); }
  if (!ALLOWED_PROTOCOLS.has(endpoint.protocol) || !endpoint.hostname) {
    throw new ConfigurationError('Use the falkor:// or falkors:// connection address from your database dashboard.');
  }
  if ((endpoint.pathname && endpoint.pathname !== '/') || endpoint.search || endpoint.hash) {
    throw new ConfigurationError('The database address should contain only its connection protocol, username, host and port.');
  }
  const username = env.FALKORDB_USERNAME?.trim() || decodeURIComponent(endpoint.username);
  if (!username) throw new ConfigurationError('Add the database username to FALKORDB_URL.');
  const password = env.FALKORDB_PASSWORD;
  if (!password || password === 'PASTE_DATABASE_PASSWORD_HERE') {
    throw new ConfigurationError('Add your database password to FALKORDB_PASSWORD in the private backend/.env file. Do not paste it into chat.');
  }
  const port = Number(endpoint.port || 6379);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ConfigurationError('The database port must be between 1 and 65535.');
  const tlsSetting = (env.FALKORDB_TLS || 'auto').trim().toLowerCase();
  if (!['auto', 'true', 'false'].includes(tlsSetting)) throw new ConfigurationError('FALKORDB_TLS must be auto, true or false.');
  const secureProtocol = endpoint.protocol === 'falkors:' || endpoint.protocol === 'rediss:';
  if (secureProtocol && tlsSetting === 'false') throw new ConfigurationError('A secure database URL cannot be used with TLS disabled.');
  const tls = tlsSetting === 'auto' ? secureProtocol : tlsSetting === 'true';
  return {
    graphName: env.FALKORDB_GRAPH?.trim() || 'second_act',
    connection: {
      username,
      password,
      socket: { host: endpoint.hostname, port, tls, connectTimeout: 10000, reconnectStrategy: recover ? reconnectDelay : false },
      ...(recover ? {pingInterval: 30000} : {}),
      disableOfflineQueue: true
    }
  };
}
