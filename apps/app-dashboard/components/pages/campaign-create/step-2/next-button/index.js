import React from 'react'
import { actions, translate } from 'decorators'
import styles from '../styles.module'
import { Button } from 'components/common'

@actions(_ => ({}))
@translate('pages.campaignCreate')
class NextButton extends React.Component {
  render () {
    const { ethAmount = 0, tokenSymbol, tokenAmount = 0, linksAmount = 0, tokenType } = this.props
    let action
    if (tokenType === 'eth') {
      action = _ => this.actions().campaigns.prepareNewEthData({ ethAmount, linksAmount, tokenSymbol, tokenType })
    } else if (tokenType === 'erc20') {
      action = _ => this.actions().campaigns.prepareNewERC20Data({ tokenAmount, ethAmount, linksAmount, tokenSymbol, tokenType })
    }
    return <div className={styles.controls}>
      <Button onClick={action}>{this.t('buttons.next')}</Button>
    </div>
  }
}

export default NextButton
