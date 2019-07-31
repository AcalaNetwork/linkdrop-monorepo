import React from 'react'
import { actions, translate } from 'decorators'
import styles from './styles.module'
import { Loading } from 'linkdrop-ui-kit'
import { PageHeader } from 'components/common'
import EthAmountData from './eth-amount-data'
import LinkContents from './link-contents'
import ApproveSummary from './approve-summary'
import NextButton from './next-button'
import config from 'config-dashboard'

@actions(({
  user: {
    loading,
    currentAddress,
    errors,
    chainId
  },
  tokens: {
    ethBalanceFormatted,
    erc20BalanceFormatted,
    address
  },
  metamask: {
    status: metamaskStatus
  },
  campaigns: {
    ethAmount,
    tokenAmount,
    linksAmount,
    proxyAddress,
    tokenType,
    tokenSymbol
  } }) => ({
  ethAmount,
  tokenAmount,
  linksAmount,
  address,
  errors,
  tokenSymbol,
  loading,
  currentAddress,
  metamaskStatus,
  chainId,
  ethBalanceFormatted,
  proxyAddress,
  tokenType,
  erc20BalanceFormatted
}))
@translate('pages.campaignCreate')
class Step2 extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  componentWillReceiveProps ({ metamaskStatus, errors, ethBalanceFormatted, erc20BalanceFormatted }) {
    const {
      metamaskStatus: prevMetamaskStatus,
      errors: prevErrors,
      erc20BalanceFormatted: prevErc20BalanceFormatted,
      proxyAddress,
      chainId,
      address: tokenAddress,
      currentAddress,
      tokenType,
      ethBalanceFormatted: prevEthBalanceFormatted
    } = this.props

    if (metamaskStatus && metamaskStatus === 'finished' && metamaskStatus !== prevMetamaskStatus) {
      this.setState({
        loading: true
      }, _ => {
        if (tokenType === 'eth') {
          this.intervalCheck = window.setInterval(_ => this.actions().tokens.getEthBalance({ account: proxyAddress, chainId }), config.balanceCheckInterval)
        } else if (tokenType === 'erc20') {
          this.intervalCheck = window.setInterval(_ => this.actions().tokens.getERC20Balance({ chainId, tokenAddress, account: proxyAddress, currentAddress }), config.balanceCheckInterval)
        }
      })
    }

    if (errors && errors[0] && prevErrors.length === 0 && errors[0] !== prevErrors[0]) {
      this.setState({
        loading: false
      }, _ => {
        window.alert(this.t(`errors.${errors[0]}`))
        this.intervalCheck && window.clearInterval(this.intervalCheck)
      })
    }

    if (tokenType === 'eth') {
      if (ethBalanceFormatted && Number(ethBalanceFormatted) > 0 && ethBalanceFormatted !== prevEthBalanceFormatted) {
        this.setState({
          loading: false
        }, _ => {
          this.intervalCheck && window.clearInterval(this.intervalCheck)
          window.setTimeout(_ => this.actions().user.setStep({ step: 4 }), config.nextStepTimeout)
        })
      }
    } else if (tokenType === 'erc20') {
      if (erc20BalanceFormatted && Number(erc20BalanceFormatted) > 0 && erc20BalanceFormatted !== prevErc20BalanceFormatted) {
        this.setState({
          loading: false
        }, _ => {
          this.intervalCheck && window.clearInterval(this.intervalCheck)
          window.setTimeout(_ => this.actions().user.setStep({ step: 3 }), config.nextStepTimeout)
        })
      }
    }
  }

  render () {
    const { ethAmount, tokenType, tokenAmount, linksAmount, tokenSymbol, loading, currentAddress } = this.props
    const { loading: stateLoading } = this.state
    return <div className={styles.container}>
      {(stateLoading || loading) && <Loading withOverlay />}
      <PageHeader title={this.t('titles.summaryPay')} />
      <div className={styles.main}>
        <div className={styles.summary}>
          <div className={styles.summaryBox}>
            <div>
              <div className={styles.data}>
                <h3 className={styles.dataTitle}>
                  {this.t('titles.linksToGenerate')}
                </h3>

                <div className={styles.dataContent}>
                  {linksAmount}
                </div>
              </div>
              <div className={styles.data}>
                <h3 className={styles.dataTitle}>
                  {this.t('titles.serviceFeeTitle')}
                </h3>
                <div className={styles.dataContent}>
                  {`${linksAmount * config.linkPrice} ETH`}
                </div>
                <div className={styles.extraDataContent}>
                  {this.t('titles.ethPerLink', { eth: config.linkPrice })}
                </div>

              </div>
            </div>

            <div>
              <div className={styles.data}>
                <h3 className={styles.dataTitle}>
                  {this.t('titles.oneLinkContainsTitle')}
                </h3>
                <div className={styles.dataContent}>
                  <LinkContents ethAmount={ethAmount} tokenAmount={tokenAmount} tokenSymbol={tokenSymbol} />
                </div>

              </div>
              <EthAmountData ethAmount={ethAmount} linksAmount={linksAmount} tokenAmount={tokenAmount} />
            </div>
          </div>
        </div>
        <div className={styles.description}>
          <p className={styles.text}>{this.t('texts._6')}</p>
          <p className={styles.text}>{this.t('texts._7', { price: config.linkPrice })}</p>
          <p className={styles.text}>{this.t('texts._13')}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <ApproveSummary tokenType={tokenType} linksAmount={linksAmount} serviceFee={config.linkPrice} ethAmount={ethAmount} tokenAmount={tokenAmount} tokenSymbol={tokenSymbol} />
        <NextButton
          tokenType={tokenType}
          tokenAmount={tokenAmount}
          currentAddress={currentAddress}
          linksAmount={linksAmount}
          ethAmount={ethAmount}
          serviceFee={config.linkPrice}
        />
      </div>
    </div>
  }
}

export default Step2
