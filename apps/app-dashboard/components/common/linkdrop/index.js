import React from 'react'
import styles from './styles.module'
import { Button } from 'components/common'
import classNames from 'classnames'
import { translate } from 'decorators'
import moment from 'moment'
moment.locale('en-gb')

@translate('common.linkdrop')
class Linkdrop extends React.Component {
  render () {
    const {
      tokenAmount,
      tokenSymbol,
      ethAmount,
      created,
      status,
      linksAmount,
      id
    } = this.props
    return <div className={styles.container}>
      {this.renderTitle({ tokenAmount, tokenSymbol, ethAmount })}
      {this.renderStatus({ status })}
      {this.renderDate({ created })}
      {this.renderLinksData({ linksAmount, tokenAmount, tokenSymbol, ethAmount })}
      <div className={styles.buttons}>
        <Button transparent className={styles.button}>{this.t('links')}</Button>
        <Button transparent className={styles.button}>{this.t('viewContract')}</Button>
      </div>
    </div>
  }

  renderTitle ({ tokenAmount, tokenSymbol, ethAmount }) {
    if (tokenAmount && tokenSymbol && !ethAmount) {
      return <div className={styles.title}>{`${this.t('linkdrop')}: ${tokenAmount} ${tokenSymbol}` }</div>
    }
    if (tokenAmount && tokenSymbol && ethAmount) {
      return <div className={styles.title}>{`${this.t('linkdrop')}: ${tokenAmount}${tokenSymbol} + ${this.t('eth')}` }</div>
    }
    return null
  }

  renderStatus ({ status }) {
    return <div
      className={classNames(styles.status, {
        [styles.active]: status === 'active'
      })}
    >
      {this.t('status')}: <span>{status}</span>
    </div>
  }

  renderDate ({ created }) {
    if (!created) { return }
    return <div className={styles.date}>
      {this.t('created')}: <span>{moment(created).format('LL')}</span>
    </div>
  }

  renderLinksData ({ linksAmount, tokenAmount, tokenSymbol, ethAmount }) {
    if (linksAmount && tokenAmount && tokenSymbol && ethAmount) {
      return <div className={styles.links}>
        {linksAmount} {this.t('linksCount')} / {tokenAmount} {tokenSymbol}
      </div>
    }

    return <div className={styles.links}>
      {linksAmount} {this.t('linksCount')} / {tokenAmount} {tokenSymbol} + {ethAmount} {this.t('eth')}
    </div>
  }
}

export default Linkdrop
