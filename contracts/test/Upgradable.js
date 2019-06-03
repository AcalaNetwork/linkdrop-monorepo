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

import { computeBytecode, computeProxyAddress } from '../scripts/utils'

const ethers = require('ethers')
// Turn off annoying warnings
ethers.errors.setLogLevel('error')

chai.use(solidity)
const { expect } = chai

let provider = createMockProvider()

let [linkdropMaster, deployer] = getWallets(provider)

let masterCopy
let factory
let proxy
let bytecode

const initcode = '0x6352c7420d6000526103ff60206004601c335afa6040516060f3'

describe('Proxy upgradability tests', () => {
  it('should deploy initial master copy of linkdrop implementation', async () => {
    masterCopy = await deployContract(deployer, LinkdropMastercopy, [], {
      gasLimit: 6000000
    })
    expect(masterCopy.address).to.not.eq(ethers.constants.AddressZero)
  })

  it('should deploy factory', async () => {
    bytecode = computeBytecode(masterCopy.address)
    factory = await deployContract(
      deployer,
      LinkdropFactory,
      [initcode, bytecode],
      {
        gasLimit: 6000000
      }
    )
    expect(factory.address).to.not.eq(ethers.constants.AddressZero)
    let version = await factory.version()
    expect(version).to.eq(1)
  })

  it('should deploy proxy and delegate to implementation', async () => {
    // Compute next address with js function
    let expectedAddress = computeProxyAddress(
      factory.address,
      linkdropMaster.address,
      initcode
    )

    await expect(
      factory.deployProxy(linkdropMaster.address, {
        gasLimit: 6000000
      })
    ).to.emit(factory, 'Deployed')

    proxy = new ethers.Contract(
      expectedAddress,
      LinkdropMastercopy.abi,
      deployer
    )

    let linkdropMasterAddress = await proxy.linkdropMaster()
    expect(linkdropMasterAddress).to.eq(linkdropMaster.address)

    let version = await proxy.version()
    expect(version).to.eq(1)

    let owner = await proxy.owner()
    expect(owner).to.eq(factory.address)
  })

  it('should deploy second version of mastercopy', async () => {
    let oldMasterCopyAddress = masterCopy.address
    masterCopy = await deployContract(deployer, LinkdropMastercopy, [], {
      gasLimit: 6000000
    })

    expect(masterCopy.address).to.not.eq(ethers.constants.AddressZero)
    expect(masterCopy.address).to.not.eq(oldMasterCopyAddress)
  })

  it('should update bytecode in factory', async () => {
    bytecode = computeBytecode(masterCopy.address)

    await factory.updateBytecode(bytecode)
    let deployedBytecode = await factory.getBytecode()
    expect(deployedBytecode.toString().toLowerCase()).to.eq(
      bytecode.toString().toLowerCase()
    )
  })

  it('proxy owner should be able to destroy proxy', async () => {
    factory = factory.connect(linkdropMaster)

    let isDeployed = await factory.isDeployed(linkdropMaster.address)
    expect(isDeployed).to.eq(true)

    let computedAddress = computeProxyAddress(
      factory.address,
      linkdropMaster.address,
      initcode
    )

    let deployedAddress = await factory.functions.deployed(
      linkdropMaster.address
    )
    expect(deployedAddress.toString().toLowerCase()).to.eq(
      computedAddress.toString().toLowerCase()
    )

    await expect(
      factory.destroyProxy({
        gasLimit: 6400000
      })
    ).to.emit(factory, 'Destroyed')

    isDeployed = await factory.isDeployed(linkdropMaster.address)
    expect(isDeployed).to.eq(false)

    deployedAddress = await factory.functions.deployed(linkdropMaster.address)
    expect(deployedAddress).to.eq(ethers.constants.AddressZero)
  })

  it('should deploy upgraded proxy to the same address as before', async () => {
    await expect(
      factory.deployProxy(linkdropMaster.address, {
        gasLimit: 6400000
      })
    ).to.emit(factory, 'Deployed')

    let isDeployed = await factory.isDeployed(linkdropMaster.address)
    expect(isDeployed).to.eq(true)

    let deployedAddress = await factory.functions.deployed(
      linkdropMaster.address
    )

    let computedAddress = computeProxyAddress(
      factory.address,
      linkdropMaster.address,
      initcode
    )

    expect(deployedAddress.toString().toLowerCase()).to.eq(
      computedAddress.toString().toLowerCase()
    )

    let factoryVersion = await factory.version()
    expect(factoryVersion).to.eq(2)

    proxy = new ethers.Contract(
      computedAddress,
      LinkdropMastercopy.abi,
      deployer
    )

    let proxyVersion = await proxy.version()
    expect(proxyVersion).to.eq(factoryVersion)
  })
})
