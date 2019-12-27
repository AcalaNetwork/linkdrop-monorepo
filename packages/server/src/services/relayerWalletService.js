import configs from '../../../../configs'
const config = configs.get('server')
const {
  jsonRpcUrl,
  relayerPrivateKey,
  DEFAULT_GAS_PRICE,
  MAX_GAS_PRICE
} = config
const ethers = require('ethers')
ethers.errors.setLogLevel('error')

if (jsonRpcUrl == null || jsonRpcUrl === '') {
  throw new Error('Please provide json rpc url')
}

if (relayerPrivateKey == null || relayerPrivateKey === '') {
  throw new Error('Please provide relayer private key')
}

class AutoNonceWallet extends ethers.Wallet {
  sendTransaction (transaction) {
    if (transaction.nonce == null) {
      if (this._noncePromise == null) {
        this._noncePromise = this.provider.getTransactionCount(this.address)
      }
      transaction.nonce = this._noncePromise
      this._noncePromise = this._noncePromise.then(nonce => nonce + 1)
    }
    return super.sendTransaction(transaction)
  }
}

class RelayerWalletService {
  constructor () {
    this.provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
    this.relayerWallet = new AutoNonceWallet(relayerPrivateKey, this.provider)
  }

  async getGasPrice () {
    let gasPrice

    if (!DEFAULT_GAS_PRICE || DEFAULT_GAS_PRICE === 'auto') {
      gasPrice = Math.min(
        await this.provider.getGasPrice(),
        ethers.utils.parseUnits(MAX_GAS_PRICE, 'gwei')
      )
    } else {
      gasPrice = Math.min(
        ethers.utils.parseUnits(DEFAULT_GAS_PRICE, 'gwei'),
        ethers.utils.parseUnits(MAX_GAS_PRICE, 'gwei')
      )
    }
    return gasPrice
  }
}

export default new RelayerWalletService()
