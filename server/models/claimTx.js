import mongoose from 'mongoose'

const claimTxSchema = new mongoose.Schema({
  ethAmount: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  tokenAmount: { type: Number, required: true },
  expirationTime: { type: Number, required: true },
  linkId: { type: String, required: true, unique: true },
  senderAddress: { type: String, required: true },
  receiverAddress: { type: String, required: true },
  proxyAddress: { type: String, required: true },
  txHash: { type: String, required: true, unique: true }
})

const ClaimTx = mongoose.model('ClaimTx', claimTxSchema)

export default ClaimTx
