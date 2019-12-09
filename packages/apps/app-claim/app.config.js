/* global MASTER_COPY, TERMINAL_API_KEY, TERMINAL_PROJECT_ID, PORTIS_DAPP_ID, FORMATIC_API_KEY_TESTNET, FORMATIC_API_KEY_MAINNET, JSON_RPC_URL_XDAI, INFURA_PK, FACTORY, INITIAL_BLOCK_GOERLI, INITIAL_BLOCK_KOVAN, INITIAL_BLOCK_ROPSTEN, INITIAL_BLOCK_MAINNET, INITIAL_BLOCK_RINKEBY */

let config

try {
  config = require('../../../configs/app.config.json')
} catch (e) {
  config = {}
}

const masterCopy = MASTER_COPY || String(config.masterCopy)
const factory = FACTORY || String(config.factory)
const initialBlockMainnet = INITIAL_BLOCK_MAINNET || config.initialBlockMainnet || 0
const initialBlockRinkeby = INITIAL_BLOCK_RINKEBY || config.initialBlockRinkeby || 0
const initialBlockGoerli = INITIAL_BLOCK_GOERLI || config.initialBlockGoerli || 0
const initialBlockRopsten = INITIAL_BLOCK_ROPSTEN || config.initialBlockRopsten || 0
const initialBlockKovan = INITIAL_BLOCK_KOVAN || config.initialBlockKovan || 0
const infuraPk = INFURA_PK || String(config.infuraPk)
const jsonRpcUrlXdai = JSON_RPC_URL_XDAI || String(config.jsonRpcUrlXdai)
const portisDappId = PORTIS_DAPP_ID || String(config.portisDappId)
const formaticApiKeyTestnet = FORMATIC_API_KEY_TESTNET || String(config.formaticApiKeyTestnet)
const formaticApiKeyMainnet = FORMATIC_API_KEY_MAINNET || String(config.formaticApiKeyMainnet)
const terminalApiKey = TERMINAL_API_KEY || String(config.terminalApiKey)
const terminalProjectId = TERMINAL_PROJECT_ID || String(config.terminalProjectId)

module.exports = {
  masterCopy,
  jsonRpcUrlXdai,
  factory,
  portisDappId,
  formaticApiKeyTestnet,
  formaticApiKeyMainnet,
  initialBlockMainnet,
  initialBlockRinkeby,
  infuraPk,
  initialBlockGoerli,
  initialBlockRopsten,
  initialBlockKovan,
  terminalProjectId,
  terminalApiKey
}
