/* eslint-disable no-undef */
import NFTMock from '../../contracts/build/NFTMock'
import LinkdropSDK from '@linkdrop/sdk'
import ora from 'ora'
import { terminal as term } from 'terminal-kit'
import { ethers } from 'ethers'
import path from 'path'
import fastcsv from 'fast-csv'
import fs from 'fs'
import { newError } from './utils'
import deployProxyIfNeeded from './deploy_proxy'
import config from '../config'

const {
  JSON_RPC_URL,
  NATIVE_TOKENS_AMOUNT,
  NFT_ADDRESS,
  SENDER_PRIVATE_KEY,
  CHAIN,
  FACTORY_ADDRESS,
  TOKEN_IDS,
  CAMPAIGN_ID,
  FEE_AMOUNT,
  CALLBACK_DATA
} = config

ethers.errors.setLogLevel('error')

const nativeTokensAmount = ethers.utils.bigNumberify(
  NATIVE_TOKENS_AMOUNT.toString()
)
const feeAmount = ethers.utils.bigNumberify(FEE_AMOUNT.toString())

const provider = new ethers.providers.JsonRpcProvider(JSON_RPC_URL)
const sender = new ethers.Wallet(SENDER_PRIVATE_KEY, provider)

const linkdropSDK = new LinkdropSDK({
  senderAddress: sender.address,
  chain: CHAIN,
  jsonRpcUrl: JSON_RPC_URL,
  factoryAddress: FACTORY_ADDRESS
})

export const generate = async () => {
  let spinner, tx
  try {
    spinner = ora({
      text: term.bold.green.str('Generating links'),
      color: 'green'
    })
    spinner.start()

    const proxyAddress = linkdropSDK.getProxyAddress(CAMPAIGN_ID)

    // check that proxy address is deployed
    await deployProxyIfNeeded(spinner)

    const nftContract = await new ethers.Contract(
      NFT_ADDRESS,
      NFTMock.abi,
      sender
    )
    const nftSymbol = await nftContract.symbol()

    // If owner of tokenId is not proxy contract -> send it to proxy
    const tokenIds = JSON.parse(TOKEN_IDS)

    // Approve tokens
    const isApprovedForAll = await nftContract.isApprovedForAll(
      sender.address,
      proxyAddress
    )
    if (!isApprovedForAll) {
      spinner.info(
        term.bold.str(`Approving all ${nftSymbol} to ^g${proxyAddress}`)
      )

      tx = await nftContract.setApprovalForAll(proxyAddress, true, {
        gasLimit: 500000
      })
      term.bold(`Tx Hash: ^g${tx.hash}\n`)
    }

    if (nativeTokensAmount.gt(0)) {
      // Transfer ethers
      const cost = nativeTokensAmount.mul(tokenIds.length)
      let amountToSend

      const tokenSymbol = 'ETH'
      const tokenDecimals = 18
      const proxyBalance = await provider.getBalance(proxyAddress)

      if (proxyBalance.lt(cost)) {
        amountToSend = cost.sub(proxyBalance)

        spinner.info(
          term.bold.str(
            `Sending ${amountToSend /
              Math.pow(10, tokenDecimals)} ${tokenSymbol} to ^g${proxyAddress}`
          )
        )

        tx = await sender.sendTransaction({
          to: proxyAddress,
          value: amountToSend,
          gasLimit: 23000
        })

        term.bold(`Tx Hash: ^g${tx.hash}\n`)
      }
    }

    const FEE_COSTS = feeAmount.mul(tokenIds.length)
    // Transfer fee coverage
    spinner.info(term.bold.str(`Sending fee costs to ^g${proxyAddress}`))

    tx = await sender.sendTransaction({
      to: proxyAddress,
      value: FEE_COSTS,
      gasLimit: 23000
    })

    term.bold(`Tx Hash: ^g${tx.hash}\n`)

    // Generate links
    const links = []

    for (let i = 0; i < tokenIds.length; i++) {
      const {
        url,
        linkId,
        linkKey,
        signerSignature
      } = await linkdropSDK.generateLink({
        signingKeyOrWallet: sender.privateKey,
        nativeTokensAmount: NATIVE_TOKENS_AMOUNT,
        nft: NFT_ADDRESS,
        tokenId: tokenIds[i],
        campaignId: CAMPAIGN_ID,
        feeAmount: FEE_AMOUNT,
        data: CALLBACK_DATA
      })

      const link = { i, linkId, linkKey, signerSignature, url }
      links.push(link)
    }

    // Save links
    const dir = path.join(__dirname, '../output')
    const filename = path.join(dir, 'linkdrop_erc721.csv')

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const ws = fs.createWriteStream(filename)
      fastcsv.write(links, { headers: true }).pipe(ws)
    } catch (err) {
      throw newError(err)
    }

    spinner.succeed(term.bold.str(`Generated and saved links to ^_${filename}`))

    return links
  } catch (err) {
    spinner.fail(term.bold.red.str('Failed to generate links'))
    throw newError(err)
  }
}

generate()
