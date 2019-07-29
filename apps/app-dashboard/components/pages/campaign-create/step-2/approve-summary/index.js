import React from 'react'
import { actions, translate } from 'decorators'
import styles from './styles.module'
import { multiply, add } from 'mathjs'
import { convertFromExponents } from 'linkdrop-commons'

@actions(_ => ({}))
@translate('pages.campaignCreate')
class ApproveSummary extends React.Component {
  render () {
    const { serviceFee, linksAmount, ethAmount, tokenAmount, tokenSymbol, tokenType } = this.props
    const ethAmountFinal = multiply(add(ethAmount, serviceFee), linksAmount)
    const onlyServiceFee = multiply(serviceFee, linksAmount)
    const onlyEthForLinks = multiply(ethAmount, linksAmount)
    if (tokenType === 'erc20') {
      return <div className={styles.container}>
        <div dangerouslySetInnerHTML={{ __html: this.t('titles.approveTokens', { tokenAmount: convertFromExponents(multiply(tokenAmount, linksAmount)), tokenSymbol }) }} />
      </div>
    }
    return <div className={styles.container}>
      <div dangerouslySetInnerHTML={{ __html: this.t('titles.sendEthToGenerate', { ethAmount: convertFromExponents(ethAmountFinal) }) }} />
      <div className={styles.contents}>
        <div className={styles.contentsItem} dangerouslySetInnerHTML={{ __html: this.t('titles.etherToDistribute', { ethAmount: convertFromExponents(onlyEthForLinks) }) }} />
        <div className={styles.contentsItem} dangerouslySetInnerHTML={{ __html: this.t('titles.serviceFeeToDistribute', { ethAmount: convertFromExponents(onlyServiceFee) }) }} />
      </div>
    </div>
  }
}

export default ApproveSummary
