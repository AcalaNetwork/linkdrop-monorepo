import { put, call, select, all } from 'redux-saga/effects'
import { getERC721Items, getERC721TokenData } from 'data/api/tokens'
import { defineNetworkName, defineJsonRpcUrl } from '@linkdrop/commons'
import { ethers } from 'ethers'
import NFTMock from 'contracts/NFTMock.json'
import { infuraPk, jsonRpcUrlXdai } from 'app.config.js'

const defineSymbol = function * ({ tokenContract, address }) {
  try {
    const symbol = yield tokenContract.symbol()
    return symbol
  } catch (e) {
    return `NFT-${address.slice(0, 3)}`
  }
}

const getTokenData = function * ({ tokenId, address, name, provider, imagePreview }) {
  const tokenContract = yield new ethers.Contract(address, NFTMock.abi, provider)
  const symbol = yield defineSymbol({ tokenContract, address })
  let metadataURL = ''
  let image = address.toLowerCase() === '0xc94edae65cd0e07c17e7e1b6afb46589297313ae' ? imagePreview : ''
  try {
    if (image.length === 0) {
      if (tokenContract.tokenURI) {
        metadataURL = yield tokenContract.tokenURI(tokenId)
      }
      if (metadataURL !== '') {
        const data = yield call(getERC721TokenData, { erc721URL: metadataURL })
        if (data) {
          image = data.image
        }
      }
    }

    return {
      tokenId,
      address,
      symbol,
      name,
      image
    }
  } catch (e) {
    return {
      tokenId,
      address,
      symbol,
      name,
      image
    }
  }
}

const generator = function * ({ payload }) {
  try {
    yield put({ type: 'TOKENS.SET_LOADING', payload: { loading: true } })
    const { currentAddress, page } = payload
    const chainId = yield select(generator.selectors.chainId)
    const networkName = defineNetworkName({ chainId })
    const { assets } = yield call(getERC721Items, { address: currentAddress, networkName, page })
    if (assets) {
      const actualJsonRpcUrl = defineJsonRpcUrl({ chainId, infuraPk, jsonRpcUrlXdai })
      const provider = yield new ethers.providers.JsonRpcProvider(actualJsonRpcUrl)
      const assetsFormatted = yield all(assets.map(({ image_preview_url: imagePreview, token_id: tokenId, asset_contract: { address, symbol }, name }) => getTokenData({ imagePreview, provider, tokenId, address, name })))
      const assetsMerged = assetsFormatted.reduce((sum, { tokenId, address, symbol, name, image }) => {
        if (sum[address]) {
          sum[address] = { ...sum[address], names: { ...sum[address].names, [tokenId]: name }, ids: [...sum[address].ids, tokenId], images: { ...sum[address].images, [tokenId]: image } }
        } else {
          sum[address] = { address, symbol, names: { [tokenId]: name }, ids: [tokenId], images: { [tokenId]: image } }
        }
        return sum
      }, {})
      const finalAssets = Object.keys(assetsMerged).map(address => assetsMerged[address])
      yield put({ type: 'TOKENS.SET_ERC721_ASSETS', payload: { assetsERC721: finalAssets } })
      yield put({ type: 'TOKENS.SET_LOADING', payload: { loading: false } })
    }
  } catch (e) {
    console.error(e)
    yield put({ type: 'TOKENS.SET_LOADING', payload: { loading: false } })
  }
}

export default generator
generator.selectors = {
  chainId: ({ user: { chainId } }) => chainId
}
