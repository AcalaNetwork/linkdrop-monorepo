import { put } from 'redux-saga/effects'
import { initializeWalletSdk } from 'data/sdk'
import { infuraPk } from 'config'
import { defineNetworkName } from '@linkdrop/commons'

const generator = function * ({ payload }) {
  try {
    const { chainId = '4' } = payload
    const networkName = defineNetworkName({ chainId })
    const sdk = initializeWalletSdk({ chain: networkName, infuraPk })
    yield put({ type: 'USER.SET_SDK', payload: { sdk } })
  } catch (e) {
    console.error(e)
    yield put({ type: 'USER.SET_ERRORS', payload: { errors: ['LINK_INVALID'] } })
  }
}

export default generator
