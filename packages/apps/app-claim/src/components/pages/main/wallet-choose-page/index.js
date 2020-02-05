import React from 'react'
import { RetinaImage } from '@linkdrop/ui-kit'
import { translate, actions, platform } from 'decorators'
import { getImages, getWalletLink, getWalletData, capitalize } from 'helpers'
import { copyToClipboard, getHashVariables } from '@linkdrop/commons'
import classNames from 'classnames'
import styles from './styles.module'
import commonStyles from '../styles.module'
import Slider from './slider'
import { Button } from 'components/common'
import CommonInstruction from './common-instruction'
import DeepLinkInstruction from './deep-link-instruction'
import connectors from 'components/application/connectors'

@actions(({ user: { walletType } }) => ({ walletType }))
@translate('pages.main')
@platform()
class WalletChoosePage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showSlider: null,
      loading: false
    }
  }

  render () {
    const { showSlider, loading } = this.state
    const { walletType, context } = this.props
    const { platform } = this
    const { w = 'trust', chainId } = getHashVariables()
    if (walletType && walletType != null) {
      return this.renderWalletInstruction({ walletType })
    } else {
      const { instruction } = this.defineWalletTexts({ walletType: w })
      const button = this.defineButton({ chainId, platform, w, context, loading })
      return <div className={classNames(commonStyles.container, styles.container, {
        [styles.sliderShow]: showSlider,
        [styles.sliderHide]: showSlider === false
      })}
      >
        <div className={classNames(styles.wallet, styles.withBorder, styles.walletPreview)}>
          {this.renderIcon({ id: w })}
        </div>
        <div
          className={styles.title}
          dangerouslySetInnerHTML={{
            __html: this.t('titles.needWallet')
          }}
        />
        {instruction}
        {button}
        {this.renderSlider({ walletType })}
      </div>
    }
  }

  defineButton ({ platform, w, context, loading, chainId }) {
    if (platform === 'desktop') { return null }

    if (w !== 'fortmatic' && w !== 'portis') {
      const buttonTitle = getWalletData({ wallet: w }).name
      if (w === 'coinbase') {
        return <Button onClick={_ => this.actions().deeplinks.getCoinbaseLink({ chainId })} className={styles.button}>
          {this.t('buttons.useWallet', { wallet: buttonTitle })}
        </Button>
      }
      const buttonLink = getWalletLink({ platform, wallet: w, currentUrl: window.location.href })
      return <Button href={buttonLink} target='_blank' className={styles.button}>
        {this.t('buttons.useWallet', { wallet: buttonTitle })}
      </Button>
    }
    return this.renderConnectorButton({ context, loading, connector: capitalize({ string: w }) })
  }

  renderIcon ({ id }) {
    let imageId = id
    if (id === 'opera') {
      if (this.platform === 'ios') {
        imageId = 'opera-touch'
      }
    }
    return <RetinaImage width={81} {...getImages({ src: imageId })} />
  }

  defineWalletHref ({ walletURL, walletURLIos, walletType }) {
    if (walletType === 'opera') {
      if (this.platform === 'ios') {
        return walletURLIos
      }
    }
    return walletURL
  }

  defineWalletTexts ({ walletType }) {
    const { name: walletTitle, walletURL, walletURLIos } = getWalletData({ wallet: walletType })
    let instruction = ''
    let title = <div className={classNames(styles.title, styles.instructionTitle)}>{this.t('titles.howToClaim', { wallet: walletTitle })}</div>
    switch (walletType) {
      case 'trust':
      case 'coinbase':
        break
      case 'fortmatic':
      case 'portis':
        title = <div
          className={styles.title}
          dangerouslySetInnerHTML={{
            __html: this.t('titles.needWallet')
          }}
        />
        break
      case 'status':
      case 'imtoken':
      case 'opera':
        instruction = this.renderDeepLinkInstruction({ walletType, title: walletTitle, href: this.defineWalletHref({ walletURL, walletURLIos, walletType }) })
        break
      default:
        instruction = this.renderCommonInstruction({ walletType, title: walletTitle, href: walletURL })
    }
    return {
      instruction,
      title
    }
  }

  renderWalletInstruction ({ walletType }) {
    const { showSlider } = this.state
    const { title, instruction } = this.defineWalletTexts({ walletType })
    return <div className={classNames(commonStyles.container, styles.container, {
      [styles.sliderShow]: showSlider,
      [styles.sliderHide]: showSlider === false
    })}
    >
      <div className={classNames(styles.wallet, styles.withBorder, styles.walletPreview)}>
        {this.renderIcon({ id: walletType })}
      </div>
      {title}
      {instruction}
      {this.renderInstructionButton({ walletType })}
      {this.renderSlider({ walletType })}
    </div>
  }

  renderInstructionButton ({ walletType }) {
    const { chainId } = getHashVariables()
    const { context } = this.props
    const { loading } = this.state
    const { platform } = this
    switch (walletType) {
      case 'fortmatic':
        return this.renderConnectorButton({ context, loading, connector: 'Fortmatic' })
      case 'portis':
        return this.renderConnectorButton({ context, loading, connector: 'Portis' })
      case 'trust':
      case 'imtoken':
      case 'status':
      case 'opera': {
        const buttonTitle = getWalletData({ wallet: walletType }).name
        const buttonLink = getWalletLink({ platform, wallet: walletType, currentUrl: window.location.href })
        return <Button href={platform !== 'desktop' && buttonLink} className={styles.button}>
          {buttonTitle}
        </Button>
      }
      case 'coinbase': {
        const buttonTitle = getWalletData({ wallet: walletType }).name
        return <Button onClick={_ => this.actions().deeplinks.getCoinbaseLink({ chainId })} className={styles.button}>
          {buttonTitle}
        </Button>
      }
      default:
        return <Button inverted onClick={_ => copyToClipboard({ value: window.location.href })} className={styles.button}>
          {this.t('buttons.copyLink')}
        </Button>
    }
  }

  renderConnectorButton ({ context, connector, loading }) {
    return <Button
      className={styles.button}
      loading={loading}
      onClick={_ => {
        this.setState({
          loading: true
        }, _ => {
          context.activate(connectors[connector])
        })
      }}
    >
      {this.t('buttons.useWallet', { wallet: connector })}
    </Button>
  }

  renderSlider ({ walletType }) {
    const { platform } = this
    return <Slider
      t={this.t}
      platform={platform}
      walletType={walletType}
      selectWallet={({ id }) => {
        this.toggleSlider({
          showSlider: false,
          callback: () => this.actions().user.setWalletType({ walletType: id })
        })
      }}
      showSlider={_ => {
        this.toggleSlider({
          showSlider: true
        })
      }}
    />
  }

  renderCommonInstruction ({ walletType, title, href }) {
    return <CommonInstruction walletType={walletType} styles={styles} t={this.t} title={title} href={href} />
  }

  renderDeepLinkInstruction ({ walletType, title, href }) {
    return <DeepLinkInstruction walletType={walletType} styles={styles} t={this.t} title={title} href={href} />
  }

  toggleSlider ({ showSlider = true, callback }) {
    this.setState({
      showSlider
    }, () => callback && callback())
  }
}

export default WalletChoosePage
