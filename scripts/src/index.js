import Mastercopy from '../../contracts/build/Mastercopy'
import Factory from '../../contracts/build/Factory'
import TokenMock from '../../contracts/build/TokenMock'
import NFTMock from '../../contracts/build/NFTMock'
import LinkdropSDK from '../../sdk/src/index'

const ethers = require('ethers')
const fs = require('fs')
const fastcsv = require('fast-csv')
const path = require('path')
const configPath = path.resolve(__dirname, '../../config/scripts.config.json')
const config = require(configPath)

let {
  networkId,
  senderPrivateKey,
  token,
  amount,
  linksNumber,
  jsonRpcUrl,
  host,
  nft,
  nftIds
} = config

config.token == null || config.token === ''
  ? (token = '0x0000000000000000000000000000000000000000')
  : (token = config.token)

if (jsonRpcUrl == null || jsonRpcUrl === '') {
  throw 'Please provide JSON RPC url'
}

// Make sure we have these set in config.json
if (senderPrivateKey == null || senderPrivateKey === '') {
  throw "Please provide sender's private key"
}

const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl)
const sender = new ethers.Wallet(senderPrivateKey, provider)
let mastercopy, proxyFactory, expirationTime, tokenMock, nftMock

export const deployMasterCopy = async () => {
  let factory = new ethers.ContractFactory(
    Mastercopy.abi,
    Mastercopy.bytecode,
    sender
  )

  mastercopy = await factory.deploy()

  let txHash = mastercopy.deployTransaction.hash
  console.log(`#️⃣  Tx Hash: ${txHash}`)

  await mastercopy.deployed()
  console.log(`Deployed linkdrop master copy at ${mastercopy.address}\n`)

  config.masterCopy = mastercopy.address

  fs.writeFile(configPath, JSON.stringify(config), err => {
    if (err) throw err
    console.log('Master copy address successfully added to config.json ')
  })

  return mastercopy.address
}

export const deployFactory = async masterCopy => {
  let factory = new ethers.ContractFactory(
    Factory.abi,
    Factory.bytecode,
    sender
  )

  proxyFactory = await factory.deploy(masterCopy, {
    gasLimit: 6000000
  })

  let txHash = proxyFactory.deployTransaction.hash
  console.log(`#️⃣  Tx Hash: ${txHash}`)

  await proxyFactory.deployed()
  console.log(`Deployed proxy factory at ${proxyFactory.address}\n`)

  config.factory = proxyFactory.address
  fs.writeFile(configPath, JSON.stringify(config), err => {
    if (err) throw err
    console.log('Proxy factory address successfully added to config.json ')
  })

  return proxyFactory.address
}

export const deployERC20 = async () => {
  let factory = new ethers.ContractFactory(
    TokenMock.abi,
    TokenMock.bytecode,
    sender
  )

  tokenMock = await factory.deploy({
    gasLimit: 6000000
  })

  let txHash = tokenMock.deployTransaction.hash
  console.log(`#️⃣  Tx Hash: ${txHash}`)

  await tokenMock.deployed()
  console.log(`Deployed token at ${tokenMock.address}\n`)

  config.token = tokenMock.address
  fs.writeFile(configPath, JSON.stringify(config), err => {
    if (err) throw err
    console.log(`Token address successfully added to config.json `)
  })
}

export const deployERC721 = async () => {
  let factory = new ethers.ContractFactory(
    NFTMock.abi,
    NFTMock.bytecode,
    sender
  )

  nftMock = await factory.deploy({
    gasLimit: 6000000
  })

  let txHash = nftMock.deployTransaction.hash
  console.log(`#️⃣  Tx Hash: ${txHash}`)

  await nftMock.deployed()
  console.log(`Deployed token at ${nftMock.address}\n`)

  config.nft = nftMock.address
  fs.writeFile(configPath, JSON.stringify(config), err => {
    if (err) throw err
    console.log(`NFT address successfully added to config.json `)
  })
}

export const generateLinksETH = async () => {
  if (networkId == null || networkId === '') {
    throw 'Please provide networkId'
  }

  if (host == null || host === '') {
    throw 'Please provide host'
  }

  if (amount === null || amount === '') throw 'Please provide amount per link'

  if (linksNumber === null || linksNumber === '') {
    throw 'Please provide links number'
  }

  token = ethers.constants.AddressZero
  expirationTime = 1900000000000000

  let links = []

  for (let i = 0; i < linksNumber; i++) {
    let {
      url,
      linkId,
      linkKey,
      senderSignature
    } = await LinkdropSDK.generateLink(
      jsonRpcUrl,
      networkId,
      host,
      senderPrivateKey,
      token,
      amount,
      expirationTime
    )

    let link = { i, linkId, linkKey, senderSignature, url }
    links.push(link)
  }

  // Save links to csv
  const filename = path.join(__dirname, '../output/linkdrop_eth.csv')

  try {
    const ws = fs.createWriteStream(filename)
    fastcsv.write(links, { headers: true }).pipe(ws)
    console.log(`File ${filename} has been succesfully updated`)
  } catch (err) {
    console.error(err)
  }

  return links
}

export const generateLinksERC20 = async () => {
  if (networkId == null || networkId === '') {
    throw 'Please provide networkId'
  }

  if (host == null || host === '') {
    throw 'Please provide host'
  }

  if (token == null || token === '' || token === ethers.constants.AddressZero) {
    throw 'Please provide ERC20 token address'
  }

  if (amount === null || amount === '') throw 'Please provide amount per link'

  if (linksNumber === null || linksNumber === '') {
    throw 'Please provide links number'
  }
  expirationTime = 1900000000000000

  let links = []

  for (let i = 0; i < linksNumber; i++) {
    let {
      url,
      linkId,
      linkKey,
      senderSignature
    } = await LinkdropSDK.generateLink(
      jsonRpcUrl,
      networkId,
      host,
      senderPrivateKey,
      token,
      amount,
      expirationTime
    )

    let link = { i, linkId, linkKey, senderSignature, url }
    links.push(link)
  }

  // Save links to csv
  const filename = path.join(__dirname, '../output/linkdrop_erc20.csv')

  try {
    const ws = fs.createWriteStream(filename)
    fastcsv.write(links, { headers: true }).pipe(ws)
    console.log(`File ${filename} has been succesfully updated`)
  } catch (err) {
    console.error(err)
  }

  return links
}

export const generateLinksERC721 = async () => {
  if (networkId == null || networkId === '') {
    throw 'Please provide networkId'
  }

  if (host == null || host === '') {
    throw 'Please provide host'
  }
  if (nft == null || nft === '' || nft === ethers.constants.AddressZero) {
    throw 'Please provide ERC721 token address'
  }

  if (nftIds == null || nft === '' || nft === '[]') {
    throw 'Please provide NFT ids'
  }

  expirationTime = 1900000000000000
  let links = []
  let tokenIds = JSON.parse(nftIds)

  for (let i = 0; i < tokenIds.length; i++) {
    let {
      url,
      linkId,
      linkKey,
      senderSignature
    } = await LinkdropSDK.generateLinkERC721(
      jsonRpcUrl,
      networkId,
      host,
      senderPrivateKey,
      nft,
      tokenIds[i],
      expirationTime
    )
    let link = { i, linkId, linkKey, senderSignature, url }
    links.push(link)
  }
  // Save links to csv
  const filename = path.join(__dirname, '../output/linkdrop_erc721.csv')

  try {
    const ws = fs.createWriteStream(filename)
    fastcsv.write(links, { headers: true }).pipe(ws)
    console.log(`File ${filename} has been succesfully updated`)
  } catch (err) {
    console.error(err)
  }
  return links
}
