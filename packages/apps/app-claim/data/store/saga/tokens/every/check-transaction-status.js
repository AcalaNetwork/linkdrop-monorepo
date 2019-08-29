import { put } from 'redux-saga/effects'
import { ethers } from 'ethers'
import { defineNetworkName } from '@linkdrop/commons'

const generator = function * ({ payload }) {
  try {
    const { transactionId, chainId = '1', statusToAdd } = payload
    const networkName = defineNetworkName({ chainId })
    alert(transactionId, chainId, statusToAdd)
    const provider = yield ethers.getDefaultProvider(networkName)
    const receipt = yield provider.getTransactionReceipt(transactionId)
    if (receipt && receipt.confirmations != null && receipt.confirmations > 0) {
      yield put({ type: 'TOKENS.SET_TRANSACTION_ID', payload: { transactionId: null } })
      yield put({ type: 'TOKENS.SET_TRANSACTION_STATUS', payload: { transactionStatus: statusToAdd } })
      yield put({ type: 'USER.SET_LOADING', payload: { loading: false } })
    }
  } catch (e) {
    console.error(e)
  }
}

export default generator
