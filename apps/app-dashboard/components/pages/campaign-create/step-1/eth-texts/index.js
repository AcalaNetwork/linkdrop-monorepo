import React from 'react'
import { actions, translate } from 'decorators'
import styles from '../styles.module'
import classNames from 'classnames'
import { convertFromExponents } from 'linkdrop-commons'
import { multiply, bignumber } from 'mathjs'
console.log({ multiply, bignumber })
@actions(_ => ({}))
@translate('pages.campaignCreate')
class EthTexts extends React.Component {
  render () {
    console.log(this.props)
    const { ethAmount, linksAmount } = this.props
    console.log({ ethAmount, linksAmount })
    if (!ethAmount || Number(ethAmount) === 0) { return null }
    return <div>
      <p className={styles.text}>{this.t('titles.ethInLinks', { ethAmount: convertFromExponents(Number(multiply(bignumber(ethAmount), bignumber(linksAmount)))), linksAmount })}</p>
      <p className={classNames(styles.text, styles.textGrey, styles.textMargin30)}>{this.t('titles.holdEth')}</p>
    </div>
  }
}

export default EthTexts
