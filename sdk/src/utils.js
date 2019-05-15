const ethers = require('ethers')

export const buildCreate2Address = (creatorAddress, saltHex, byteCode) => {
  const byteCodeHash = ethers.utils.keccak256(byteCode)
  return `0x${ethers.utils
    .keccak256(
      `0x${['ff', creatorAddress, saltHex, byteCodeHash]
        .map(x => x.replace(/0x/, ''))
        .join('')}`
    )
    .slice(-40)}`.toLowerCase()
}

// Generates new link
export const createLink = async (
  sender, // Wallet
  ethAmount,
  tokenAddress,
  tokenAmount,
  expirationTime
) => {
  let linkWallet = ethers.Wallet.createRandom()
  let linkKey = linkWallet.privateKey
  let linkId = linkWallet.address
  let senderSignature = await signLink(
    sender,
    ethAmount,
    tokenAddress,
    tokenAmount,
    expirationTime,
    linkId
  )
  return {
    linkKey, // link's ephemeral private key
    linkId, // address corresponding to link key
    senderSignature // signed by linkdrop verifier
  }
}

// Should be signed by sender
export const signLink = async (
  sender, // Wallet
  ethAmount,
  tokenAddress,
  tokenAmount,
  expirationTime,
  linkId
) => {
  let messageHash = ethers.utils.solidityKeccak256(
    ['uint', 'address', 'uint', 'uint', 'address'],
    [ethAmount, tokenAddress, tokenAmount, expirationTime, linkId]
  )
  let messageHashToSign = ethers.utils.arrayify(messageHash)
  let signature = await sender.signMessage(messageHashToSign)
  return signature
}

export const signReceiverAddress = async (linkKey, receiverAddress) => {
  let wallet = new ethers.Wallet(linkKey)
  let messageHash = ethers.utils.solidityKeccak256(
    ['address'],
    [receiverAddress]
  )
  let messageHashToSign = ethers.utils.arrayify(messageHash)
  let signature = await wallet.signMessage(messageHashToSign)
  return signature
}
