import React from 'react'
import { Loading } from 'linkdrop-ui-kit'
import { translate, actions } from 'decorators'
import styles from './styles.module'
import commonStyles from '../styles.module'
import { getHashVariables } from 'linkdrop-commons'
import config from 'config-claim'
import classNames from 'classnames'

@actions(({ tokens: { transactionId, transactionStatus } }) => ({ transactionId, transactionStatus }))
@translate('pages.main')
class ClaimingProcessPage extends React.Component {
  componentDidMount () {
    const { wallet } = this.props
    const {
      token,
      amount,
      expirationTime,
      linkKey,
      senderAddress,
      senderSignature,
      nft,
      tokenId
    } = getHashVariables()
    // destination: destination address - can be received from web3-react context
    // token: ERC20 token address, 0x000...000 for ether - can be received from url params
    // tokenAmount: token amount in atomic values - can be received from url params
    // expirationTime: link expiration time - can be received from url params
    if (nft && tokenId) {
      return this.actions().tokens.claimTokensERC721({ wallet, nft, tokenId, expirationTime, linkKey, senderAddress, senderSignature })
    }

    this.actions().tokens.claimTokensERC20({ wallet, token, tokenAmount: amount, expirationTime, linkKey, senderAddress, senderSignature })
  }

  componentWillReceiveProps ({ transactionId: id, transactionStatus: status }) {
    const { transactionId: prevId, transactionStatus: prevStatus } = this.props
    if (id != null && prevId === null) {
      const { n } = getHashVariables()
      this.statusCheck = window.setInterval(_ => this.actions().tokens.checkTransactionStatus({ transactionId: id, networkId: n }), 3000)
    }
    if (status != null && prevStatus === null) {
      this.statusCheck && window.clearInterval(this.statusCheck)
      this.actions().user.setStep({ step: 5 })
    }
  }

  render () {
    const { n } = getHashVariables()
    const { transactionId } = this.props
    return <div className={commonStyles.container}>
      <Loading container size='small' className={styles.loading} />
      <div className={styles.title}>{this.t('titles.claiming')}</div>
      <div className={styles.subtitle}>{this.t('titles.transactionInProcess')}</div>
      <div className={styles.description}>{this.t('titles.instructions')}</div>
      <div
        className={classNames(styles.description, {
          [styles.descriptionHidden]: !transactionId
        })}
        dangerouslySetInnerHTML={{
          __html: this.t('titles.seeDetails', {
            transactionLink: `${Number(n) === 4 ? config.etherscanRinkeby : config.etherscanMainnet}${transactionId}`
          })
        }}
      />
    </div>
  }
}

export default ClaimingProcessPage
