import { BadRequestError } from '../../utils/errors'
import logger from '../../utils/logger'
import proxyFactoryService from '../proxyFactoryService'
import ClaimServiceBase from './claimServiceBase'
import walletService from '../walletService'

class ClaimServiceERC20 extends ClaimServiceBase {
  _checkClaimParams (params) {
    // check basic linkdrop params
    super._checkClaimParamsBase(params)

    // make erc20 specific checks
    if (!params.tokenAddress) {
      throw new BadRequestError('Please provide tokenAddress argument')
    }
    if (!params.tokenAmount) {
      throw new BadRequestError('Please provide tokenAddress argument')
    }
    logger.debug('Valid claim params: ' + JSON.stringify(params))
  }

  _checkParamsWithBlockchainCall (params) {
    return proxyFactoryService.checkClaimParams(params)
  }

  _sendClaimTx (params) {
    return proxyFactoryService.claim(params)
  }

  async claimAndDeploy ({
    weiAmount,
    tokenAddress,
    tokenAmount,
    expirationTime,
    linkId,
    linkdropMasterAddress,
    campaignId,
    version,
    chainId,
    linkdropSignerSignature,
    receiverAddress,
    receiverSignature,
    walletFactory,
    publicKey,
    initializeWithENS,
    signature
  }) {
    console.log('claimServiceERC20', {
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime,
      linkId,
      linkdropMasterAddress,
      campaignId,
      version,
      chainId,
      linkdropSignerSignature,
      receiverAddress,
      receiverSignature,
      walletFactory,
      publicKey,
      initializeWithENS,
      signature
    })

    const createWalletData = await walletService.getCreateWalletData({
      publicKey,
      initializeWithENS,
      signature
    })
    console.log('createWalletData: ', createWalletData)

    return proxyFactoryService.claimAndDeploy({
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime,
      linkId,
      linkdropMasterAddress,
      campaignId,
      linkdropSignerSignature,
      receiverAddress,
      receiverSignature,
      walletFactory,
      createWalletData
    })
  }
}

export default new ClaimServiceERC20()
