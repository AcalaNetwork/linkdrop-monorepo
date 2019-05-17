/* global describe, before, it */

import chai from 'chai'

import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity
} from 'ethereum-waffle'

import LinkdropFactoryApprove from '../build/LinkdropFactoryApprove'
import LinkdropMastercopyApprove from '../build/LinkdropMastercopyApprove'
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

let [linkdropSigner, receiver, nonsender, approver] = getWallets(provider)

let masterCopy
let factory
let proxy
let proxyAddress
let tokenInstance

let link
let receiverAddress
let receiverSignature
let weiAmount
let tokenAddress
let tokenAmount
let expirationTime

describe('ETH + ERC20 Linkdrop tests (approve pattern)', () => {
  before(async () => {
    tokenInstance = await deployContract(approver, TokenMock)
  })

  it('should deploy master copy of linkdrop implementation', async () => {
    masterCopy = await deployContract(linkdropSigner, LinkdropMastercopyApprove)
    expect(masterCopy.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy factory', async () => {
    factory = await deployContract(
      linkdropSigner,
      LinkdropFactoryApprove,
      [masterCopy.address],
      {
        gasLimit: 6000000
      }
    )

    expect(factory.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy proxy and delegate to implementation', async () => {
    // Compute next address with js function
    proxyAddress = await computeProxyAddress(
      factory.address,
      linkdropSigner.address,
      masterCopy.address
    )

    await factory.deployProxy(linkdropSigner.address)

    proxy = new ethers.Contract(
      proxyAddress,
      LinkdropMastercopyApprove.abi,
      linkdropSigner
    )

    let senderAddress = await proxy.linkdropSigner()
    expect(linkdropSigner.address).to.eq(senderAddress)
  })

  it('should revert while checking claim params with unsufficient funds', async () => {
    weiAmount = 0
    tokenAddress = tokenInstance.address
    tokenAmount = 100
    expirationTime = 11234234223
    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.checkClaimParams(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        proxyAddress
      )
    ).to.be.revertedWith('Insufficient amount of tokens')
  })

  it('creates new link key and verifies its signature', async () => {
    let senderAddr = await proxy.linkdropSigner()
    expect(linkdropSigner.address).to.eq(senderAddr)

    expect(
      await proxy.verifyLinkdropSignerSignature(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        link.linkdropSignerSignature
      )
    ).to.be.true
  })

  it('signs receiver address with link key and verifies this signature onchain', async () => {
    link = await createLink(
      linkdropSigner,
      weiAmount,
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

  it('non-linkdropSigner should not be able to pause contract', async () => {
    let proxyInstance = new ethers.Contract(
      proxyAddress,
      LinkdropMastercopyApprove.abi,
      nonsender
    )
    // Pausing
    await expect(proxyInstance.pause({ gasLimit: 500000 })).to.be.revertedWith(
      'Only linkdrop signer'
    )
  })

  it('linkdropSigner should be able to pause contract', async () => {
    // Pausing
    await proxy.pause({ gasLimit: 500000 })
    let paused = await proxy.paused()
    expect(paused).to.eq(true)
  })

  it('linkdropSigner should be able to unpause contract', async () => {
    // Unpausing
    await proxy.unpause({ gasLimit: 500000 })
    let paused = await proxy.paused()
    expect(paused).to.eq(false)
  })

  it('linkdropSigner should be able to cancel link', async () => {
    link = await createLink(
      linkdropSigner,
      weiAmount,
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
      linkdropSigner,
      weiAmount,
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
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 80000 }
      )
    ).to.be.reverted
  })

  it('should fail to claim insufficient funds', async () => {
    // Unpause
    await proxy.unpause({ gasLimit: 500000 })

    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Insufficient amount of tokens')
  })

  it('should fail to claim tokens by expired link', async () => {
    // Approving tokens from linkdropSigner to Linkdrop Contract
    await tokenInstance.approve(proxy.address, tokenAmount)

    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      0
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        0,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Expired link')
  })

  it('should succesfully claim tokens with valid claim params', async () => {
    // Approving tokens from linkdropSigner to Linkdrop Contract
    await tokenInstance.approve(proxy.address, tokenAmount)
    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    let approverBalanceBefore = await tokenInstance.balanceOf(approver.address)

    await factory.claim(
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime,
      link.linkId,
      approver.address,
      linkdropSigner.address,
      link.linkdropSignerSignature,
      receiverAddress,
      receiverSignature,
      { gasLimit: 800000 }
    )

    let approverBalanceAfter = await tokenInstance.balanceOf(approver.address)
    expect(approverBalanceAfter).to.eq(approverBalanceBefore.sub(tokenAmount))

    let receiverTokenBalance = await tokenInstance.balanceOf(receiverAddress)
    expect(receiverTokenBalance).to.eq(tokenAmount)
  })

  it('should be able to check link claimed from factory instance', async () => {
    let claimed = await factory.isClaimedLink(
      linkdropSigner.address,
      link.linkId
    )
    expect(claimed).to.eq(true)
  })

  it('should fail to claim link twice', async () => {
    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Claimed link')
  })

  it('should fail to claim tokens with fake linkdropSigner signature', async () => {
    // Approving tokens from linkdropSigner to Linkdrop Contract
    await tokenInstance.approve(proxy.address, tokenAmount)

    let wallet = ethers.Wallet.createRandom()
    let linkId = wallet.address

    let message = ethers.utils.solidityKeccak256(['address'], [linkId])
    let messageToSign = ethers.utils.arrayify(message)
    let fakeSignature = await receiver.signMessage(messageToSign)

    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        linkId,
        approver.address,
        linkdropSigner.address,
        fakeSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Invalid linkdrop signer signature')
  })

  it('should fail to claim tokens with fake receiver signature', async () => {
    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    let fakeLink = await createLink(
      linkdropSigner,
      weiAmount,
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
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Invalid receiver signature')
  })

  it('should fail to claim tokens by canceled link', async () => {
    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await proxy.cancel(link.linkId, { gasLimit: 100000 })

    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.be.revertedWith('Canceled link')
  })

  it('should be able to get balance and send ethers to proxy', async () => {
    let balanceBefore = await provider.getBalance(proxy.address)

    let wei = ethers.utils.parseEther('2')
    // send some eth
    let tx = {
      to: proxy.address,
      value: wei
    }
    await linkdropSigner.sendTransaction(tx)
    let balanceAfter = await provider.getBalance(proxy.address)

    expect(balanceAfter).to.eq(balanceBefore.add(wei))
  })

  it('should succesully claim ethers only', async () => {
    weiAmount = 100 // wei
    tokenAmount = 0
    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )
    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address,
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    ).to.emit(proxy, 'Claimed')
  })

  it('should be able to withdraw ethers from proxy to linkdropSigner', async () => {
    let balanceBefore = await provider.getBalance(proxy.address)
    expect(balanceBefore).to.not.eq(0)
    await proxy.withdraw({ gasLimit: 200000 })
    let balanceAfter = await provider.getBalance(proxy.address)
    expect(balanceAfter).to.eq(0)
  })

  it('should succesfully claim tokens and deploy proxy is not deployed yet', async () => {
    weiAmount = 0 // wei
    tokenAddress = tokenInstance.address
    tokenAmount = 123
    expirationTime = 11234234223

    let proxyAddress = await computeProxyAddress(
      factory.address,
      linkdropSigner.address,
      masterCopy.address
    )

    // Contract not deployed yet
    proxy = new ethers.Contract(
      proxyAddress,
      LinkdropMastercopyApprove.abi,
      linkdropSigner
    )

    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    // Approving tokens from linkdropSigner to Linkdrop Contract
    await tokenInstance.approve(proxyAddress, tokenAmount)
    await expect(
      factory.claim(
        weiAmount,
        tokenAddress,
        tokenAmount,
        expirationTime,
        link.linkId,
        approver.address,
        linkdropSigner.address, // New
        link.linkdropSignerSignature,
        receiverAddress,
        receiverSignature,
        { gasLimit: 500000 }
      )
    )
      .to.emit(proxy, 'Claimed')
      .to.emit(tokenInstance, 'Transfer') // should transfer claimed tokens to receiver

    // Now when deployed, check linkdropSigner
    let senderAddr = await proxy.linkdropSigner()
    expect(linkdropSigner.address).to.eq(senderAddr)

    let receiverTokenBalance = await tokenInstance.balanceOf(receiverAddress)
    expect(receiverTokenBalance).to.eq(tokenAmount)
  })

  it('should succesfully claim tokens and ethers simultaneously', async () => {
    weiAmount = 15 // wei
    tokenAmount = 20

    // Approving tokens from linkdropSigner to Linkdrop Contract
    await tokenInstance.approve(proxy.address, 20)

    // Send ethers to Linkdrop contract
    let tx = {
      to: proxy.address,
      value: weiAmount
    }
    await linkdropSigner.sendTransaction(tx)

    link = await createLink(
      linkdropSigner,
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime
    )

    receiverAddress = ethers.Wallet.createRandom().address
    receiverSignature = await signReceiverAddress(link.linkKey, receiverAddress)

    let proxyEthBalanceBefore = await provider.getBalance(proxy.address)
    let approverTokenBalanceBefore = await tokenInstance.balanceOf(
      approver.address
    )

    await factory.claim(
      weiAmount,
      tokenAddress,
      tokenAmount,
      expirationTime,
      link.linkId,
      approver.address,
      linkdropSigner.address,
      link.linkdropSignerSignature,
      receiverAddress,
      receiverSignature,
      { gasLimit: 500000 }
    )

    let proxyEthBalanceAfter = await provider.getBalance(proxy.address)
    expect(proxyEthBalanceAfter).to.eq(proxyEthBalanceBefore.sub(weiAmount))

    let approverTokenBalanceAfter = await await tokenInstance.balanceOf(
      approver.address
    )
    expect(approverTokenBalanceAfter).to.eq(
      approverTokenBalanceBefore.sub(tokenAmount)
    )

    let receiverEthBalance = await provider.getBalance(receiverAddress)
    expect(receiverEthBalance).to.eq(weiAmount)

    let receiverTokenBalance = await tokenInstance.balanceOf(receiverAddress)
    expect(receiverTokenBalance).to.eq(tokenAmount)
  })
})
