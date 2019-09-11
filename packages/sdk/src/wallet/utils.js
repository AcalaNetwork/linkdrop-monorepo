import { ethers } from 'ethers'

export const getCreateAndAddModulesData = dataArray => {
  const moduleDataWrapper = new ethers.utils.Interface([
    'function setup(bytes data)'
  ])

  // Remove method id (10) and position of data in payload (64)
  return dataArray.reduce(
    (acc, data) =>
      acc + moduleDataWrapper.functions.setup.encode([data]).substr(74),
    '0x'
  )
}

/**
 * @dev Function to get encoded params data from contract abi
 * @param {Object} abi Contract abi
 * @param {String} method Function name
 * @param {Array<T>} params Array of function params to be encoded
 * @return Encoded params data
 */
export const encodeParams = (abi, method, params) => {
  return new ethers.utils.Interface(abi).functions[method].encode([...params])
}

/**
 * Function to get encoded data to use in MultiSend library
 * @param {Number} operation
 * @param {String} to
 * @param {Number} value
 * @param {String} data
 */
export const encodeData = (operation, to, value, data) => {
  const transactionWrapper = new ethers.utils.Interface([
    'function send(uint8 operation, address to, uint256 value, bytes data)'
  ])
  return transactionWrapper.functions.send
    .encode([operation, to, value, data])
    .substr(10)
}

/**
 * Function to get specific param from transaction event
 * @param {Object} tx Transaction object compatible with ethers.js library
 * @param {String} eventName Event name to parse param from
 * @param {String} paramName Parameter to be retrieved from event log
 * @param {Object} contract Contract instance compatible with ethers.js library
 * @return {String} Parameter parsed from transaction event
 */
export const getParamFromTxEvent = async (
  tx,
  eventName,
  paramName,
  contract
) => {
  const provider = contract.provider
  const txReceipt = await provider.getTransactionReceipt(tx.hash)
  const topic = contract.interface.events[eventName].topic
  let logs = txReceipt.logs
  logs = logs.filter(
    l => l.address === contract.address && l.topics[0] === topic
  )
  const param = contract.interface.events[eventName].decode(logs[0].data)[
    paramName
  ]
  return param
}

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
