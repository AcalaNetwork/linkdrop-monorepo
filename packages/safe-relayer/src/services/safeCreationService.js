import GnosisSafe from '@gnosis.pm/safe-contracts/build/contracts/GnosisSafe'
import ProxyFactory from '@gnosis.pm/safe-contracts/build/contracts/ProxyFactory'
import MultiSend from '@gnosis.pm/safe-contracts/build/contracts/MultiSend'
import { ethers } from 'ethers'
import assert from 'assert-js'
import relayerWalletService from './relayerWalletService'
import logger from '../utils/logger'
import { ENS, FIFSRegistrar } from '@ensdomains/ens'
import sdkService from './sdkService'
import ensService from './ensService'
import linkdropFactoryService from './linkdropFactoryService'

import {
  GNOSIS_SAFE_MASTER_COPY_ADDRESS,
  PROXY_FACTORY_ADDRESS,
  MULTISEND_LIBRARY_ADDRESS
} from '../../config/config.json'

const ADDRESS_ZERO = ethers.constants.AddressZero
const BYTES_ZERO = '0x'

const CALL_OP = 0
const DELEGATECALL_OP = 1

class SafeCreationService {
  constructor () {
    this.gnosisSafeMasterCopy = new ethers.Contract(
      GNOSIS_SAFE_MASTER_COPY_ADDRESS,
      GnosisSafe.abi,
      relayerWalletService.provider
    )

    this.proxyFactory = new ethers.Contract(
      PROXY_FACTORY_ADDRESS,
      ProxyFactory.abi,
      relayerWalletService.wallet
    )

    this.multiSend = new ethers.Contract(
      MULTISEND_LIBRARY_ADDRESS,
      MultiSend.abi,
      relayerWalletService.provider
    )
  }

  async create ({ owner, name, saltNonce }) {
    try {
      logger.info('Creating new safe with ENS...')

      const ensOwner = await ensService.getOwner(
        `${name}.${ensService.ensDomain}`
      )

      assert.true(
        ensOwner === ADDRESS_ZERO,
        'Provided name already has an owner'
      )

      const gnosisSafeData = sdkService.walletSDK.encodeParams(
        GnosisSafe.abi,
        'setup',
        [
          [owner], // owners
          1, // threshold
          ADDRESS_ZERO, // to
          BYTES_ZERO, // data,
          ADDRESS_ZERO, // payment token address
          0, // payment amount
          ADDRESS_ZERO // payment receiver address
        ]
      )
      logger.debug(`gnosisSafeData: ${gnosisSafeData}`)

      const safe = sdkService.walletSDK.computeSafeAddress({
        owner,
        saltNonce,
        gnosisSafeMasterCopy: GNOSIS_SAFE_MASTER_COPY_ADDRESS,
        proxyFactory: PROXY_FACTORY_ADDRESS
      })
      logger.debug(`Computed safe address: ${safe}`)

      const createSafeData = sdkService.walletSDK.encodeParams(
        ProxyFactory.abi,
        'createProxyWithNonce',
        [this.gnosisSafeMasterCopy.address, gnosisSafeData, saltNonce]
      )
      logger.debug(`createSafeData: ${createSafeData}`)

      const createSafeMultiSendData = sdkService.walletSDK.encodeDataForMultiSend(
        CALL_OP,
        this.proxyFactory.address,
        0,
        createSafeData
      )
      logger.debug(`createSafeMultiSendData: ${createSafeMultiSendData}`)

      const registrar = await ensService.getRegistrarContract()

      const label = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
      logger.debug(`label: ${label}`)

      const registerEnsData = sdkService.walletSDK.encodeParams(
        FIFSRegistrar.abi,
        'register',
        [label, safe]
      )
      logger.debug(`registerEnsData: ${registerEnsData}`)

      const registerEnsMultiSendData = sdkService.walletSDK.encodeDataForMultiSend(
        CALL_OP,
        registrar.address,
        0,
        registerEnsData
      )
      logger.debug(`registerEnsMultiSendData: ${registerEnsMultiSendData}`)

      const nestedTxData =
        '0x' + createSafeMultiSendData + registerEnsMultiSendData
      logger.debug(`nestedTxData: ${nestedTxData}`)

      const multiSendData = sdkService.walletSDK.encodeParams(
        MultiSend.abi,
        'multiSend',
        [nestedTxData]
      )
      logger.debug(`multiSendData: ${multiSendData}`)

      const tx = await relayerWalletService.wallet.sendTransaction({
        to: this.multiSend.address,
        data: multiSendData,
        gasPrice: ethers.utils.parseUnits('20', 'gwei'),
        gasLimit: 6500000
      })

      logger.json({ txHash: tx.hash, safe }, 'info')
      return { success: true, txHash: tx.hash, safe }
    } catch (err) {
      logger.error(err)
      return { success: false, errors: err.message || err }
    }
  }

  async claimAndCreate ({
    weiAmount,
    tokenAddress,
    tokenAmount,
    expirationTime,
    linkId,
    linkdropMasterAddress,
    linkdropSignerSignature,
    campaignId,
    receiverAddress,
    receiverSignature,
    owner,
    name,
    saltNonce
  }) {
    try {
      logger.info('Creating new safe with ENS and claiming linkdrop...')

      const ensOwner = await ensService.getOwner(
        `${name}.${ensService.ensDomain}`
      )

      assert.true(
        ensOwner === ADDRESS_ZERO,
        'Provided name already has an owner'
      )

      const claimData = sdkService.walletSDK.encodeParams(
        linkdropFactoryService.abi,
        'claim',
        [
          weiAmount,
          tokenAddress,
          tokenAddress,
          expirationTime,
          linkId,
          linkdropMasterAddress,
          campaignId,
          linkdropSignerSignature,
          receiverAddress,
          receiverSignature
        ]
      )
      logger.debug(`claimData: ${claimData}`)

      const claimMultiSendData = sdkService.walletSDK.encodeDataForMultiSend(
        CALL_OP,
        linkdropFactoryService.linkdropFactory.address,
        0,
        claimData
      )
      logger.debug(`claimMultiSendData: ${claimMultiSendData}`)

      const gnosisSafeData = sdkService.walletSDK.encodeParams(
        GnosisSafe.abi,
        'setup',
        [
          [owner], // owners
          1, // threshold
          ADDRESS_ZERO, // to
          BYTES_ZERO, // data,
          ADDRESS_ZERO, // payment token address
          0, // payment amount
          ADDRESS_ZERO // payment receiver address
        ]
      )
      logger.debug(`gnosisSafeData: ${gnosisSafeData}`)

      const safe = sdkService.walletSDK.computeSafeAddress({
        owner,
        saltNonce,
        gnosisSafeMasterCopy: GNOSIS_SAFE_MASTER_COPY_ADDRESS,
        proxyFactory: PROXY_FACTORY_ADDRESS
      })
      logger.debug(`Computed safe address: ${safe}`)

      const createSafeData = sdkService.walletSDK.encodeParams(
        ProxyFactory.abi,
        'createProxyWithNonce',
        [this.gnosisSafeMasterCopy.address, gnosisSafeData, saltNonce]
      )
      logger.debug(`createSafeData: ${createSafeData}`)

      const createSafeMultiSendData = sdkService.walletSDK.encodeDataForMultiSend(
        CALL_OP,
        this.proxyFactory.address,
        0,
        createSafeData
      )
      logger.debug(`createSafeMultiSendData: ${createSafeMultiSendData}`)

      const registrar = await ensService.getRegistrarContract()

      const label = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
      logger.debug(`label: ${label}`)

      const registerEnsData = sdkService.walletSDK.encodeParams(
        FIFSRegistrar.abi,
        'register',
        [label, safe]
      )
      logger.debug(`registerEnsData: ${registerEnsData}`)

      const registerEnsMultiSendData = sdkService.walletSDK.encodeDataForMultiSend(
        CALL_OP,
        registrar.address,
        0,
        registerEnsData
      )
      logger.debug(`registerEnsMultiSendData: ${registerEnsMultiSendData}`)

      const nestedTxData =
        '0x' +
        claimMultiSendData +
        createSafeMultiSendData +
        registerEnsMultiSendData
      logger.debug(`nestedTxData: ${nestedTxData}`)

      const multiSendData = sdkService.walletSDK.encodeParams(
        MultiSend.abi,
        'multiSend',
        [nestedTxData]
      )
      logger.debug(`multiSendData: ${multiSendData}`)

      const tx = await relayerWalletService.wallet.sendTransaction({
        to: this.multiSend.address,
        data: multiSendData,
        gasPrice: ethers.utils.parseUnits('20', 'gwei'),
        gasLimit: 6500000
      })

      logger.json({ txHash: tx.hash, safe }, 'info')
      return { success: true, txHash: tx.hash }
    } catch (err) {
      logger.error(err)
      return { success: false, errors: err.message || err }
    }
  }
}

export default new SafeCreationService()
