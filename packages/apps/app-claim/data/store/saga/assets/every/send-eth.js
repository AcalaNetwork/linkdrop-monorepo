import { put, select } from 'redux-saga/effects'
import { utils } from 'ethers'

const generator = function * ({ payload }) {
  try {
    yield put({ type: 'USER.SET_LOADING', payload: { loading: true } })
    const { to, amount } = payload
    const sdk = yield select(generator.selectors.sdk)
    const privateKey = yield select(generator.selectors.privateKey)
    const contractAddress = yield select(generator.selectors.contractAddress)
    const amountFormatted = utils.parseEther(String(amount).trim())

    const message = {
      from: contractAddress,
      to: to,
      data: '0x',
      value: amountFormatted
    }
    const result = yield sdk.execute(message, privateKey)
    const { success, errors, txHash } = result
    alert(JSON.stringify({ success, errors, txHash }))
    if (success) {
      yield put({ type: 'TOKENS.SET_TRANSACTION_ID', payload: { transactionId: txHash } })
    } else {
      if (errors.length > 0) {
        yield put({ type: 'USER.SET_LOADING', payload: { loading: false } })
        console.error(errors[0])
      }
    }
  } catch (e) {
    console.error(e)
  }
}

export default generator
generator.selectors = {
  sdk: ({ user: { sdk } }) => sdk,
  contractAddress: ({ user: { contractAddress } }) => contractAddress,
  privateKey: ({ user: { privateKey } }) => privateKey,
  chainId: ({ user: { chainId = '1' } }) => chainId
}
