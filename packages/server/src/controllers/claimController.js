import claimService from '../services/claimService'

// POST
export const claim = async (req, res) => {
  // claim transaction
  const txHash = await claimService.claim(req.body)

  // return tx hash in successful response
  res.json({
    success: true,
    txHash: txHash
  })
}

// POST
export const claimAndDeploy = async (req, res) => {
  // claim transaction
  const txHash = await claimService.claimAndDeploy(req.body)
  console.log('CLAIM_AND_DEPLOY txHash: ', txHash)

  // return tx hash in successful response
  res.json({
    success: true,
    txHash: txHash
  })
}

// GET
export const getStatus = async (req, res) => {
  const linkdropContractAddress = req.params.linkdropContractAddress
  const linkId = req.params.linkId
  const status = await claimService.getStatus(linkdropContractAddress, linkId)
  // return status in successful response
  res.send(status)
}

// POST
export const cancel = async (req, res) => {
  const { linkdropContractAddress, linkId } = req.body
  const claimOperation = await claimService.cancel(
    linkdropContractAddress,
    linkId
  )
  res.json({ success: true, claimOperation })
}
