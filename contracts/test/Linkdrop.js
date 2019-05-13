/* global describe, before, it */

import chai from 'chai'

import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity
} from 'ethereum-waffle'

import Factory from '../build/Factory'
import Linkdrop from '../build/Linkdrop'
import TokenMock from '../build/TokenMock'

import {
  computeProxyAddress,
  createLink,
  signReceiverAddress
} from '../scripts/utils'

const ethers = require('ethers')

chai.use(solidity)
const { expect } = chai

let provider = createMockProvider()

let [sender, receiver, nonsender] = getWallets(provider)

let masterCopy
let factory
let proxy
let proxyAddress
let tokenInstance

let link
let receiverAddress
let receiverSignature
let ethAmount
let tokenAddress
let tokenAmount
let expirationTime

describe('Linkdrop tests', () => {
  before(async () => {
    tokenInstance = await deployContract(sender, TokenMock)
  })

  it('should deploy master copy of linkdrop implementation', async () => {
    masterCopy = await deployContract(sender, Linkdrop)
    expect(masterCopy.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy factory', async () => {
    factory = await deployContract(sender, Factory, [masterCopy.address], {
      gasLimit: 6000000
    })

    expect(factory.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy proxy and delegate to implementation', async () => {
    let senderAddress = sender.address

    // Compute next address with js function
    proxyAddress = await computeProxyAddress(
      factory.address,
      senderAddress,
      masterCopy.address
    )

    await factory.deployProxy(senderAddress)

    proxy = new ethers.Contract(proxyAddress, Linkdrop.abi, sender)

    let senderAddr = await proxy.sender()
    expect(senderAddress).to.eq(senderAddr)
  })

  it('should revert while checking claim params with unsufficient funds', async () => {
    ethAmount = 0
    tokenAddress = tokenInstance.address
    tokenAmount = 100
    expirationTime = 11234234223
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.checkClaimParams(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        proxyAddress
      )
    ).to.be.revertedWith('Insufficient funds')
  })

  it('creates new link key and verifies its signature', async () => {
    let senderAddr = await proxy.sender()
    expect(sender.address).to.eq(senderAddr)

    expect(
      await proxy.verifySenderSignature(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        link.senderSignature
      )
    ).to.be.true
  })

  it('signs receiver address with link key and verifies this signature onchain', async () => {
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    expect(
      await proxy.verifyReceiverSignature(
        link.linkId,
        receiverAddress,
        receiverSignature
      )
    ).to.be.true
  })

  it('non-sender should not be able to pause contract', async () => {
    let proxyInstance = new ethers.Contract(
      proxyAddress,
      Linkdrop.abi,
      nonsender
    )
    // Pausing
    await expect(proxyInstance.pause({ gasLimit: 500000 })).to.be.revertedWith(
      'Only sender'
    )
  })

  it('sender should be able to pause contract', async () => {
    // Pausing
    await proxy.pause({ gasLimit: 500000 })
    let paused = await proxy.paused()
    expect(paused).to.eq(true)
  })

  it('sender should be able to unpause contract', async () => {
    // Unpausing
    await proxy.unpause({ gasLimit: 500000 })
    let paused = await proxy.paused()
    expect(paused).to.eq(false)
  })

  it('sender should be able to cancel link', async () => {
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    await expect(proxy.cancel(link.linkId, { gasLimit: 200000 })).to.emit(
      proxy,
      'Canceled'
    )
    let canceled = await proxy.isCanceledLink(link.linkId)
    expect(canceled).to.eq(true)
  })

  it('should fail to claim tokens when paused', async () => {
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    // Pausing
    await proxy.pause({ gasLimit: 500000 })

    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 80000 }
      )
    ).to.be.reverted
  })

  it('should fail to claim more than existent amount of tokens', async () => {
    // Unpause
    await proxy.unpause({ gasLimit: 500000 })

    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.reverted
  })

  it('should fail to claim insufficient funds', async () => {
    link = await createLink(sender, ethAmount, tokenAddress, tokenAmount, 0)
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Insufficient funds')
  })

  it('should fail to claim tokens by expired link', async () => {
    // Approving tokens from sender to Linkdrop Contract
    await tokenInstance.approve(proxy.address, 10000)

    link = await createLink(sender, ethAmount, tokenAddress, tokenAmount, 0)
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        0,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Expired link')
  })

  it('should succesfully claim tokens with valid claim params', async () => {
    // Transfering tokens from sender to Linkdrop Contract
    await tokenInstance.transfer(proxy.address, 20)
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    let proxyBalanceBefore = await proxy.getAvailableBalance(tokenAddress)

    await factory.claim(
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime,
      link.linkId,
      sender.address,
      link.senderSignature,
      receiverAddress,
      receiverSignature,
      { gasLimit: 500000 }
    )

    let proxyBalanceAfter = await proxy.getAvailableBalance(tokenAddress)
    expect(proxyBalanceAfter).to.eq(proxyBalanceBefore.sub(tokenAmount))

    let receiverTokenBalance = await tokenInstance.balanceOf(receiverAddress)
    expect(receiverTokenBalance).to.eq(tokenAmount)
  })

  it('should be able to check link claimed from factory instance', async () => {
    let claimed = await factory.isClaimedLink(sender.address, link.linkId)
    expect(claimed).to.eq(true)
  })

  it('should fail to claim link twice', async () => {
    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Claimed link')
  })

  it('should fail to claim tokens with fake sender signature', async () => {
    let wallet = ethers.Wallet.createRandom()
    let linkId = wallet.address

    let message = ethers.utils.solidityKeccak256(['address'], [linkId])
    let messageToSign = ethers.utils.arrayify(message)
    let fakeSignature = await receiver.signMessage(messageToSign)

    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        linkId,
        sender.address,
        fakeSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Invalid sender signature')
  })

  it('should fail to claim tokens with fake receiver signature', async () => {
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    let fakeLink = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(
      fakeLink.linkKey, // signing receiver address with fake link key
      receiverAddress
    )
    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Invalid receiver signature')
  })

  it('should fail to claim tokens by canceled link', async () => {
    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await proxy.cancel(link.linkId, { gasLimit: 100000 })

    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Canceled link')
  })

  it('should be able to get balance and send ethers to proxy', async () => {
    let balanceBefore = await proxy.getAvailableBalance(
      ethers.constants.AddressZero
    )

    let wei = ethers.utils.parseEther('2')
    // send some eth
    let tx = {
      to: proxy.address,
      value: wei
    }
    await sender.sendTransaction(tx)
    let balanceAfter = await proxy.getAvailableBalance(
      ethers.constants.AddressZero
    )
    expect(balanceAfter).to.eq(balanceBefore.add(wei))
  })

  it('should succesully claim ethers only', async () => {
    ethAmount = 100 // wei
    tokenAmount = 0
    link = await createLink(
      sender,
      ethAmount,
      ethers.constants.AddressZero,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        ethAmount,
        ethers.constants.AddressZero,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address,
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.emit(proxy, 'Claimed')
  })

  it('should be able to withdraw ethers from proxy to sender', async () => {
    let balanceBefore = await provider.getBalance(proxy.address)
    expect(balanceBefore).to.not.eq(0)
    await proxy.withdraw({ gasLimit: 200000 })
    let balanceAfter = await provider.getBalance(proxy.address)
    expect(balanceAfter).to.eq(0)
  })

  it('should succesfully claim tokens and deploy proxy is not deployed yet', async () => {
    ethAmount = 0 // wei
    tokenAddress = tokenInstance.address
    tokenAmount = 123
    expirationTime = 11234234223

    let proxyAddress = await computeProxyAddress(
      factory.address,
      sender.address,
      masterCopy.address
    )

    // Contract not deployed yet
    proxy = new ethers.Contract(proxyAddress, Linkdrop.abi, sender)

    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    // Transfering tokens from sender to Linkdrop Contract
    await tokenInstance.approve(proxyAddress, tokenAmount)
    await expect(
      factory.claim(
        ethAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        sender.address, // New
        link.senderSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    )
      .to.emit(proxy, 'Claimed')
      .to.emit(tokenInstance, 'Transfer') // should transfer claimed tokens to receiver

    // Now when deployed, check sender
    let senderAddr = await proxy.sender()
    expect(sender.address).to.eq(senderAddr)

    let receiverTokenBalance = await tokenInstance.balanceOf(receiverAddress)
    expect(receiverTokenBalance).to.eq(tokenAmount)
  })

  it('should succesfully claim tokens and ethers simultaneously', async () => {
    ethAmount = 15 // wei
    tokenAmount = 20
    // Transfering tokens from sender to Linkdrop Contract
    await tokenInstance.transfer(proxy.address, 20)

    // Send ethers to Linkdrop contract
    let tx = {
      to: proxy.address,
      value: ethAmount
    }
    await sender.sendTransaction(tx)

    link = await createLink(
      sender,
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    let proxyEthBalanceBefore = await proxy.getAvailableBalance(
      ethers.constants.AddressZero
    )
    let proxyTokenBalanceBefore = await proxy.getAvailableBalance(tokenAddress)

    await factory.claim(
      ethAmount,
      tokenAddress,
      tokenAmount,
      expirationTime,
      link.linkId,
      sender.address,
      link.senderSignature,
      receiverAddress,
      receiverSignature,
      { gasLimit: 500000 }
    )

    let proxyTokenBalanceAfter = await proxy.getAvailableBalance(tokenAddress)
    let proxyEthBalanceAfter = await proxy.getAvailableBalance(
      ethers.constants.AddressZero
    )
    expect(proxyEthBalanceAfter).to.eq(proxyEthBalanceBefore.sub(ethAmount))

    expect(proxyTokenBalanceAfter).to.eq(
      proxyTokenBalanceBefore.sub(tokenAmount)
    )

    let receiverEthBalance = await provider.getBalance(receiverAddress)
    expect(receiverEthBalance).to.eq(ethAmount)

    let receiverTokenBalance = await tokenInstance.balanceOf(receiverAddress)
    expect(receiverTokenBalance).to.eq(tokenAmount)
  })
})
