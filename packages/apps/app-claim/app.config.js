/* global
  JSON_RPC_URL,
  MASTER_COPY,
  FACTORY,
  CLAIM_HOST,
  API_HOST_RINKEBY,
  API_HOST_MAINNET,
  INITIAL_BLOCK_MAINNET,
  INITIAL_BLOCK_RINKEBY,
  AUTH_CLIENT_ID,
  AUTH_API_KEY,
  AUTH_DISCOVERY_DOCS,
  AUTH_SCOPE
*/
let config
let authConfig
try {
  config = require('../../../configs/app.config.json')
} catch (e) {
  config = {}
}

try {
  authConfig = require('../../../configs/auth.config.json')
} catch (e) {
  authConfig = {}
}

const jsonRpcUrl = JSON_RPC_URL || String(config.jsonRpcUrl)
const masterCopy = MASTER_COPY || String(config.masterCopy)
const factory = FACTORY || String(config.factory)
const claimHost = CLAIM_HOST || String(config.claimHost)
const apiHostRinkeby = API_HOST_RINKEBY || String(config.apiHostRinkeby)
const apiHostMainnet = API_HOST_MAINNET || String(config.apiHostMainnet)
const initialBlockMainnet = INITIAL_BLOCK_MAINNET || config.initialBlockMainnet
const initialBlockRinkeby = INITIAL_BLOCK_RINKEBY || config.initialBlockRinkeby

const authClientId = AUTH_CLIENT_ID || authConfig.clientId
const authApiKey = AUTH_API_KEY || authConfig.apiKey
const authDiscoveryDocs = JSON.parse(AUTH_DISCOVERY_DOCS) || authConfig.discoveryDocs
const authScope = AUTH_SCOPE || authConfig.scope

module.exports = {
  jsonRpcUrl,
  claimHost,
  apiHostMainnet,
  apiHostRinkeby,
  masterCopy,
  factory,
  initialBlockMainnet,
  initialBlockRinkeby,
  authClientId,
  authApiKey,
  authDiscoveryDocs,
  authScope
}
