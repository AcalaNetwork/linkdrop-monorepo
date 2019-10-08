import React from 'react'
import { Alert, Icons } from '@linkdrop/ui-kit'
import { translate, actions } from 'decorators'
import styles from './styles.module'
import commonStyles from '../styles.module'
import { getHashVariables, defineEtherscanUrl } from '@linkdrop/commons'
import classNames from 'classnames'

@actions(({ tokens: { transactionId } }) => ({ transactionId }))
@translate('pages.main')
class ClaimingFinishedPage extends React.Component {
  render () {
    const { chainId } = getHashVariables()
    const { transactionId, amount, symbol, alreadyClaimed } = this.props
    return <div className={commonStyles.container}>
      <Alert icon={<Icons.Check />} className={styles.alert} />
      {this.renderTitle({ symbol, alreadyClaimed })}
      <div
        className={classNames(styles.description, {
          [styles.descriptionHidden]: !transactionId
        })}
        dangerouslySetInnerHTML={{
          __html: this.t(`titles.${Number(chainId) === 100 ? 'seeDetailsBlockscout' : 'seeDetails'}`, {
            transactionLink: `${defineEtherscanUrl({ chainId })}tx/${transactionId}`
          })
        }}
      />
    </div>
  }

  renderTitle ({ alreadyClaimed, symbol }) {
    if (alreadyClaimed) { return <div className={styles.title} dangerouslySetInnerHTML={{ __html: this.t('titles.tokensAlreadyClaimed') }} /> }
    return <div className={styles.title} dangerouslySetInnerHTML={{ __html: this.t('titles.tokensClaimed', { tokens: symbol || '' }) }} />
  }
}

export default ClaimingFinishedPage
