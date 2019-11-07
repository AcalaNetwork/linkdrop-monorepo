/* global describe, it */

import chai from 'chai'
import { ethers } from 'ethers'

import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity
} from 'ethereum-waffle'

import LinkdropFactory from '../build/LinkdropFactory'
import LinkdropMastercopy from '../build/LinkdropMastercopy'
import TokenMock from '../build/TokenMock'

import { computeProxyAddress } from '../scripts/utils'

// Turn off annoying warnings
ethers.errors.setLogLevel('error')

chai.use(solidity)
const { expect } = chai

const provider = createMockProvider()

const [sender, signer] = getWallets(provider)

let masterCopy
let factory
let proxy
const campaignId = 0

const initcode = '0x6352c7420d6000526103ff60206004601c335afa6040516060f3'
const chainId = 4 // Rinkeby

describe('Factory tests', () => {
  it('should deploy master copy of linkdrop implementation', async () => {
    masterCopy = await deployContract(sender, LinkdropMastercopy, [], {
      gasLimit: 6000000
    })
    expect(masterCopy.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy factory', async () => {
    factory = await deployContract(
      sender,
      LinkdropFactory,
      [masterCopy.address, chainId],
      {
        gasLimit: 6000000
      }
    )

    expect(factory.address).to.not.eq(ethers.constants.AddressZero)
    const version = await factory.masterCopyVersion()
    expect(version).to.eq(1)
  })

  it('should deploy proxy with signing key and topup with ethers in single tx', async () => {
    // Compute next address with js function
    const expectedAddress = computeProxyAddress(
      factory.address,
      sender.address,
      campaignId,
      initcode
    )

    const value = 100

    await expect(
      factory.deployProxyWithSigner(campaignId, signer.address, {
        value,
        gasLimit: 6000000
      })
    ).to.emit(factory, 'Deployed')

    proxy = new ethers.Contract(expectedAddress, LinkdropMastercopy.abi, sender)

    const senderAddress = await proxy.sender()
    expect(senderAddress).to.eq(sender.address)

    const version = await proxy.version()
    expect(version).to.eq(1)

    const owner = await proxy.owner()
    expect(owner).to.eq(factory.address)

    const isSigner = await proxy.isSigner(signer.address)
    expect(isSigner).to.eq(true)

    const balance = await provider.getBalance(proxy.address)
    expect(balance).to.eq(value)
  })
})
