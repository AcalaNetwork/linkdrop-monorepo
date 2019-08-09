import React from 'react'
import { translate, actions } from 'decorators'
import styles from './styles.module'
import commonStyles from '../styles.module'
import { TokensAmount, AssetBalance, AccountBalance } from 'components/common'
import dapps from 'dapps'
import classNames from 'classnames'
import { getHashVariables } from '@linkdrop/commons'
import { Button, Icons } from '@linkdrop/ui-kit'
import { getCurrentAsset } from 'helpers'

@actions(({ assets: { items, itemsToClaim } }) => ({ items }))
@translate('pages.main')
class ClaimingFinishedPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showAssets: false,
      expandAssets: false
    }
  }

  componentDidMount () {
    window.setTimeout(_ => this.setState({ showAssets: true }), 3000)
  }

  render () {
    const { items, itemsToClaim } = this.props
    const { showAssets, expandAssets } = this.state
    const {
      dappId
    } = getHashVariables()
    const { label, url } = dapps[dappId]
    const finalPrice = items.reduce((sum, item) => {
      sum = sum + (Number(item.balanceFormatted) * Number(item.price))
      return sum
    }, 0)
    const mainAsset = getCurrentAsset({ itemsToClaim })
    if (!mainAsset) { return null }
    const { balanceFormatted, symbol } = mainAsset
    return <div className={commonStyles.container}>
      <AccountBalance balance={finalPrice} />
      {!showAssets && <TokensAmount symbol={symbol} amount={balanceFormatted} />}
      {showAssets && this.renderAllAssets({ items, expandAssets })}
      <Button href={url} target='_blank'>{this.t('buttons.goTo', { title: label })}</Button>
    </div>
  }

  renderAllAssets ({ items, expandAssets }) {
    console.log({ expandAssets })
    return <div className={classNames(styles.assets, { [styles.assetsExpanded]: expandAssets })}>
      <div className={styles.assetsHeader} onClick={_ => this.setState({ expandAssets: !expandAssets })}>
        {this.t('titles.digitalAssets')}
        <Icons.PolygonArrow fill='#000' />
      </div>
      <div className={styles.content}>
        {items.map(({
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
        />)}
      </div>
    </div>
  }
}

export default ClaimingFinishedPage
