import React from 'react'
import { Loading } from '@linkdrop/ui-kit'
import { actions, translate, platform, detectBrowser } from 'decorators'
import InitialPage from './initial-page'
import WalletChoosePage from './wallet-choose-page'
import ClaimingProcessPage from './claiming-process-page'
import ErrorPage from './error-page'
import ClaimingFinishedPage from './claiming-finished-page'
import NeedWallet from './need-wallet'
import { terminalApiKey, terminalProjectId } from 'app.config.js'
import { getHashVariables, defineNetworkName, capitalize } from '@linkdrop/commons'
import Web3 from 'web3'
import { TerminalHttpProvider, SourceType } from '@terminal-packages/sdk'

@actions(({ user: { errors, step, loading: userLoading, readyToClaim, alreadyClaimed }, tokens: { transactionId }, contract: { loading, decimals, amount, symbol, icon } }) => ({
  userLoading,
  loading,
  decimals,
  symbol,
  amount,
  icon,
  step,
  transactionId,
  errors,
  alreadyClaimed,
  readyToClaim
}))
@platform()
@detectBrowser()
@translate('pages.claim')
class Claim extends React.Component {
  constructor (props) {
    super(props)
    const { web3Provider } = props
    const currentProvider = web3Provider && createTerminalProvider({ web3Provider })
    this.state = {
      accounts: null,
      connectorChainId: null,
      currentProvider
    }
  }

  createTerminalProvider ({ web3Provider }) {
    return web3Provider
    // return new Web3(web3Provider)
    // const web3 = new Web3(
    //   new TerminalHttpProvider({
    //     apiKey: terminalApiKey,
    //     projectId: terminalProjectId,
    //     source: SourceType.Terminal,
    //     customHttpProvider: web3Provider
    //   })
    // );
  }

  async componentDidMount () {
    const {
      linkKey,
      chainId,
      linkdropMasterAddress,
      campaignId
    } = getHashVariables()
    const { currentProvider } = this.state
    this.actions().tokens.checkIfClaimed({ linkKey, chainId, linkdropMasterAddress, campaignId })
    this.actions().user.createSdk({ linkdropMasterAddress, chainId, linkKey, campaignId })
    if (currentProvider) {
      const { accounts, connectorChainId } = await this.getProviderData({ currentProvider })
      this.setState({
        accounts, connectorChainId
      })
    }
  }

  componentWillReceiveProps ({ readyToClaim, alreadyClaimed }) {
    const { readyToClaim: prevReadyToClaim } = this.props
    if (
      (readyToClaim === true && prevReadyToClaim === true) ||
      readyToClaim == null ||
      readyToClaim === false ||
      alreadyClaimed == null
    ) { return }
    const {
      token,
      tokensAmount,
      expiration,
      nft,
      feeToken,
      tokenId,
      feeAmount,
      feeReceiver,
      nativeTokensAmount,
      linkdropContract,
      linkKey,
      signerSignature,
      receiverAddress,
      chainId
    } = getHashVariables()

    // params in url:
    // token - contract/token address,
    // amount - tokens amount,
    // expirationTime - expiration time of link,
    // sender,
    // linkdropSignerSignature,
    // linkKey - private key for link,
    // chainId - network id

    // params needed for claim
    // sender: sender key address, e.g. 0x1234...ff
    // linkdropSignerSignature: ECDSA signature signed by sender (contained in claim link)
    // receiverSignature: ECDSA signature signed by receiver using link key

    // destination: destination address - can be received from web3-react context
    // token: ERC20 token address, 0x000...000 for ether - can be received from url params
    // tokenAmount: token amount in atomic values - can be received from url params
    // expirationTime: link expiration time - can be received from url params
    if (Number(expiration) < (+(new Date()) / 1000)) {
      // show error page if link expired
      return this.actions().user.setErrors({ errors: ['LINK_EXPIRED'] })
    }

    return this.actions().contract.getTokenData({
      nft,
      tokenId,
      chainId,
      token,
      nativeTokensAmount,
      tokensAmount
    })
  }

  render () {
    return <Web3Consumer>
      {context => this.renderCurrentPage({ context })}
    </Web3Consumer>
  }

  renderCurrentPage ({ context }) {
    const { assets, step, userLoading, errors, alreadyClaimed } = this.props
    // in context we can find:
    // active,
    // connectorName,
    // connector,
    // library,
    // networkId,
    // account,
    // error
    const { connectorChainId } = this.state

    const {
      account
    } = context


    const {
      chainId,
      linkdropMasterAddress
    } = getHashVariables()

    const commonData = { linkdropMasterAddress, chainId, assets, wallet: account, loading: userLoading }

    if (this.platform === 'desktop' && chainId && !account) {
      return <ErrorPage error='NETWORK_NOT_SUPPORTED' network={capitalize({ string: defineNetworkName({ chainId }) })} />
    }

    if (this.platform === 'desktop' && !account) {
      return <NeedWallet context={context} />
    }

    if (errors && errors.length > 0) {
      // if some errors occured and can be found in redux store, then show error page
      return <ErrorPage error={errors[0]} />
    }

    if (
      (this.platform === 'desktop' && connectorChainId && Number(chainId) !== Number(connectorChainId)) ||
      (this.platform !== 'desktop' && account && connectorChainId && Number(chainId) !== Number(connectorChainId))) {
      // if network id in the link and in the web3 are different
      return <ErrorPage error='NETWORK_NOT_SUPPORTED' network={capitalize({ string: defineNetworkName({ chainId }) })} />
    }

    switch (step) {
      case 1:
        return <InitialPage
          {...commonData}
          onClick={_ => {
            if (account) {
              // if wallet account was found in web3 context, then go to step 4 and claim data
              return this.actions().user.setStep({ step: 4 })
            }
            // if wallet was not found in web3 context, then go to step 2 with wallet select page and instructions
            this.actions().user.setStep({ step: 2 })
          }}
        />
      case 2:
        // page with wallet select component
        return <WalletChoosePage onClick={_ => {
          this.actions().user.setStep({ step: 3 })
        }}
        />
      case 3:
        // page with info about current wallet and button to claim tokens
        return <InitialPage
          {...commonData}
          onClick={_ => {
            this.actions().user.setStep({ step: 4 })
          }}
        />
      case 4:
        // claiming is in process
        return <ClaimingProcessPage
          {...commonData}
        />
      case 5:
        // claiming finished successfully
        return <ClaimingFinishedPage
          {...commonData}
        />
      default:
        // зloading
        return <Loading />
    }
  }
}

export default Claim
