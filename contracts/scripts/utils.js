import { utils } from 'ethers'
const ethers = require('ethers')

function buildCreate2Address (creatorAddress, saltHex, byteCode) {
  const byteCodeHash = utils.keccak256(byteCode)
  return `0x${utils
    .keccak256(
      `0x${['ff', creatorAddress, saltHex, byteCodeHash]
        .map(x => x.replace(/0x/, ''))
        .join('')}`
    )
    .slice(-40)}`.toLowerCase()
}

export const computeProxyAddress = (
  factoryAddress,
  linkdropSignerAddress,
  masterCopyAddress
) => {
  const salt = utils.solidityKeccak256(['address'], [linkdropSignerAddress])

  // /let bytecode = `0x${Linkdrop.bytecode}`
  const bytecode = `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${masterCopyAddress.slice(
    2
  )}5af43d82803e903d91602b57fd5bf3`

  const proxyAddress = buildCreate2Address(factoryAddress, salt, bytecode)

  return proxyAddress
}

// Should be signed by sender
export const signLink = async function (
  linkdropSigner, // Wallet
  ethAmount,
  tokenAddress,
  tokenAmount,
  expirationTime,
  linkId
) {
  let messageHash = ethers.utils.solidityKeccak256(
    ['uint', 'address', 'uint', 'uint', 'address'],
    [ethAmount, tokenAddress, tokenAmount, expirationTime, linkId]
  )
  let messageHashToSign = ethers.utils.arrayify(messageHash)
  let signature = await linkdropSigner.signMessage(messageHashToSign)
  return signature
}

// Generates new link
export const createLink = async function (
  linkdropSigner, // Wallet
  ethAmount,
  tokenAddress,
  tokenAmount,
  expirationTime
) {
  let linkWallet = ethers.Wallet.createRandom()
  let linkKey = linkWallet.privateKey
  let linkId = linkWallet.address
  let linkdropSignerSignature = await signLink(
    linkdropSigner,
    ethAmount,
    tokenAddress,
    tokenAmount,
    expirationTime,
    linkId
  )
  return {
    linkKey, // link's ephemeral private key
    linkId, // address corresponding to link key
    linkdropSignerSignature // signed by linkdrop verifier
  }
}

export const signReceiverAddress = async function (linkKey, receiverAddress) {
  let wallet = new ethers.Wallet(linkKey)
  let messageHash = ethers.utils.solidityKeccak256(
    ['address'],
    [receiverAddress]
  )
  let messageHashToSign = ethers.utils.arrayify(messageHash)
  let signature = await wallet.signMessage(messageHashToSign)
  return signature
}
