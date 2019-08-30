import React from 'react'
import { Header, Footer } from '@linkdrop/ui-kit'
import { WalletHeader, MoonpayWidget } from 'components/common'
import styles from './styles.module'
import { translate, actions } from 'decorators'
import text from 'texts'
import classNames from 'classnames'
import { getHashVariables } from '@linkdrop/commons'

@actions(({ user: { moonpayShow, contractAddress } }) => ({ moonpayShow, contractAddress }))
@translate('pages.page')
class Page extends React.Component {
  componentDidMount () {
    const { contractAddress } = this.props
    const interval = window.checkAssets
    const {
      chainId = '1'
    } = getHashVariables()
    if (interval) {
      interval && window.clearInterval(interval)
    }
    this.actions().assets.getItems({ chainId, wallet: contractAddress })
    window.checkAssets = window.setInterval(_ => this.actions().assets.getItems({ chainId, wallet: contractAddress }), 30000)
  }

  render () {
    const { dynamicHeader, moonpayShow, children, hideHeader } = this.props
    return <div className={classNames(styles.container, {
      [styles.hideHeader]: hideHeader
    })}
    >
      {this.renderHeader({ hideHeader, dynamicHeader })}
      <div className={styles.main}>
        {children}
      </div>
      <Footer
        content={text('components.footer.copyright', { href: 'https://t.me/LinkdropHQ' })}
      />
      {moonpayShow && <MoonpayWidget onClose={_ => this.actions().user.setMoonpayShow({ moonpayShow: false })} />}
    </div>
  }

  renderHeader ({ hideHeader, dynamicHeader }) {
    if (hideHeader) { return null }
    if (dynamicHeader) { return <WalletHeader /> }
    return <Header title={this.t('titles.getTokens')} />
  }
}

export default Page
