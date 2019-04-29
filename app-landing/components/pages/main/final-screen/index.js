import React from 'react'
import { translate, actions } from 'decorators'
import styles from './styles.module'
import { Icons, Button, TextControlBlock } from 'linkdrop-ui-kit'
import { LinkBlock, QrShare } from 'components/pages/common'
import classNames from 'classnames'
import { copyToClipboard, getHashVariables } from 'helpers'

@actions(({ user: { link, claimed } }) => ({ link, claimed }))
@translate('pages.main')
class FinalScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showQr: false,
      blink: false
    }
  }

  render () {
    const { onClick, link, claimed } = this.props
    const { showQr } = this.state
    return <LinkBlock title={this.t('titles.getYourLink')}>
      {claimed && <h1>CLAIMED!!!</h1>}
      <div className={classNames({
        [styles.showQr]: showQr
      })}>
        {this.renderMainScreen({ onClick, link })}
        {this.renderQrScreen({ link, onClose: _ => this.setState({ showQr: false }) })}
      </div>
      <input ref={node => { this.input = node }} />
      <Button onClick={_ => {
        const hashVariables = getHashVariables({ url: this.input.value })
        this.actions().user.testClaimTokens(hashVariables)
      }}>claim</Button>
    </LinkBlock>
  }

  renderMainScreen ({ onClick, link }) {
    const { blink } = this.state
    return <div className={classNames(styles.container, styles.main)}>
      <TextControlBlock
        blinkOnClick
        blink={blink}
        icon={<Icons.Qr />}
        className={styles.copyBlock}
        style={{ maxWidth: 340 }}
        onBlickChange={({ value }) => this.setState({ blink: value })}
        onClick={({ value }) => this.setState({
          showQr: true
        })}
        value={link}
      />
      <Button className={styles.button} onClick={_ => {
        this.setState({ blink: true }, _ => copyToClipboard({ value: link }))
      }}>
        {this.t('buttons.copyLink')}
      </Button>
      <div className={styles.description}>{this.t('descriptions.newLinkInstruction')}</div>

      <div className={styles.title}>
        {this.t('titles.linkdrop')}
      </div>

      <div className={styles.listItem}>
        <Icons.CheckSmall /> {this.t('titles.multipleLinks')}
      </div>

      <Button inverted className={styles.button} >
        {this.t('buttons.joinWaitlist')}
      </Button>
    </div>
  }

  renderQrScreen ({ onClick, onClose, link }) {
    return <div className={styles.secondary}>
      <QrShare t={this.t} onClose={onClose} value={link} />
    </div>
  }
}

export default FinalScreen
