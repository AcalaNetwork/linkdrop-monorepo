import React from 'react'
import { translate, actions } from 'decorators'
import styles from './styles.module'
import { getHashVariables, defineNetworkName } from '@linkdrop/commons'
import dapps from 'dapps'
import classNames from 'classnames'
import { Icons, Button } from '@linkdrop/ui-kit'
import { AssetBalance } from 'components/common'

@actions(({ user: { ens }, assets: { items } }) => ({
  items,
  ens
}))
@translate('pages.common.assetsList')
class AssetsList extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      expanded: false
    }
  }

  renderDappButton () {
    const {
      dappId
    } = getHashVariables()
    if (!dappId) { return null }
    const dapp = dapps[dappId]
    if (!dapp) { return null }
    const { label, url } = dapp
    const { ens } = this.props
    const { chainId } = getHashVariables()
    const network = defineNetworkName({ chainId })
    const widgetUrl = encodeURIComponent(`${window.origin}/#/widget`)
    const dappUrl = `${url}?user=${ens}&network=${network}&widgetUrl=${widgetUrl}`
    return <Button className={styles.button} inverted href={dappUrl} target='_blank'>{this.t('buttons.goTo', { title: label })}</Button>
  }

  render () {
    const { items } = this.props
    const { expanded } = this.state
    return <div className={styles.container}>
      <div className={classNames(styles.assets, { [styles.assetsExpanded]: expanded })}>
        <div className={styles.assetsHeader} onClick={_ => this.setState({ expanded: !expanded })}>
          {this.t('titles.digitalAssets')}
          <Icons.PolygonArrow fill='#000' />
        </div>
        <div className={styles.assetsContent}>
          <div className={styles.assetsContentItems}>
            {this.renderAssets({ items })}
          </div>
          {this.renderDappButton()}
        </div>
      </div>
    </div>
  }

  renderAssets ({ items }) {
    if (items.length === 0) {
      return <div className={styles.note} dangerouslySetInnerHTML={{ __html: this.t('texts.empty') }} />
    }
    return items.map(({
      icon,
      symbol,
      balanceFormatted,
      tokenAddress,
      price
    }) => <AssetBalance
      key={tokenAddress}
      symbol={symbol}
      amount={balanceFormatted}
      price={price}
      icon={icon}
    />)
  }
}

export default AssetsList
