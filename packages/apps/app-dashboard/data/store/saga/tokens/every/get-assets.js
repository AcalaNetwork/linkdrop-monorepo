import { put, call, select } from 'redux-saga/effects'
import { getItems } from 'data/api/tokens'
import { defineNetworkName } from '@linkdrop/commons'
import getCurrentEthBalance from './get-current-eth-balance'

const generator = function * ({ payload }) {
  try {
    const { currentAddress } = payload
    const chainId = yield select(generator.selectors.chainId)
    const networkName = defineNetworkName({ chainId })
    const { ethBalanceFormatted } = yield getCurrentEthBalance({ payload: { account: currentAddress, chainId } })
    yield put({
      type: 'TOKENS.SET_CURRENT_ETH_BALANCE',
      payload: {
        currentEthBalance: Math.round(ethBalanceFormatted * 100) / 100
      }
    })

    const { status = 0, result = [], message } = yield call(getItems, { address: currentAddress, networkName })
    if (status && status === '1' && message === 'OK') {
      const erc20Assets = result.filter(asset => {
        return Number(chainId) === 4 ? asset.type === 'ERC-20' : true
      }).map(item => ({
        ...item,
        decimals: defineDecimals({ decimals: item.decimals }),
        address: item.contractAddress
      }))
      yield put({ type: 'TOKENS.SET_ASSETS', payload: { assets: erc20Assets } })
    }
  } catch (e) {
    console.error(e)
  }
}

export default generator
generator.selectors = {
  chainId: ({ user: { chainId } }) => chainId
}

const defineDecimals = ({ decimals }) => {
  if (!decimals || decimals.length === 0) { return 0 }
  return Number(decimals)
}
