/* global describe, it */

import chai from 'chai'

import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity
} from 'ethereum-waffle'

import LinkdropFactory from '../build/LinkdropFactory'
import LinkdropMastercopy from '../build/LinkdropMastercopy'

import { computeProxyAddress } from '../scripts/utils'

const ethers = require('ethers')

chai.use(solidity)
const { expect } = chai

let provider = createMockProvider()

let [linkdropSigner, receiver, user] = getWallets(provider)

let masterCopy
let factory
let proxy

describe('Factory/Proxy tests', () => {
  //   before(async () => {})

  it('should deploy master copy of linkdrop implementation', async () => {
    masterCopy = await deployContract(linkdropSigner, LinkdropMastercopy, [], {
      gasLimit: 6000000
    })
    expect(masterCopy.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy factory', async () => {
    factory = await deployContract(
      linkdropSigner,
      LinkdropFactory,
      [masterCopy.address],
      {
        gasLimit: 6000000
      }
    )

    expect(factory.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy proxy and delegate to implementation', async () => {
    // Compute next address with js function
    let expectedAddress = await computeProxyAddress(
      factory.address,
      linkdropSigner.address,
      masterCopy.address
    )

    await factory.deployProxy(linkdropSigner.address)

    proxy = new ethers.Contract(
      expectedAddress,
      LinkdropMastercopy.abi,
      linkdropSigner
    )

    let linkdropSignerAddress = await proxy.linkdropSigner()
    expect(linkdropSignerAddress).to.eq(linkdropSigner.address)
  })

  it('should correctly precompute create2 address', async () => {
    let linkdropSignerAddress = receiver.address
    let expectedAddress = await computeProxyAddress(
      factory.address,
      linkdropSignerAddress,
      masterCopy.address
    )

    await factory.deployProxy(linkdropSignerAddress)

    proxy = new ethers.Contract(
      expectedAddress,
      LinkdropMastercopy.abi,
      linkdropSigner
    )

    let linkdropSignerAddr = await proxy.linkdropSigner()
    expect(linkdropSignerAddress).to.eq(linkdropSignerAddr)
  })

  it('should deploy another proxy', async () => {
    let linkdropSignerAddress = user.address
    let expectedAddress = await computeProxyAddress(
      factory.address,
      linkdropSignerAddress,
      masterCopy.address
    )

    await factory.deployProxy(linkdropSignerAddress)

    proxy = new ethers.Contract(
      expectedAddress,
      LinkdropMastercopy.abi,
      linkdropSigner
    )

    let linkdropSignerAddr = await proxy.linkdropSigner()
    expect(linkdropSignerAddress).to.eq(linkdropSignerAddr)
  })
})
