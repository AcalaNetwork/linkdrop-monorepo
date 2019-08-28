import React from 'react'
import { translate, actions } from 'decorators'
import { Page } from 'components/pages'
import styles from './styles.module'
import Header from './header'
import Assets from './assets'
import Input from './input'
import Contacts from './contacts'
import { getHashVariables } from '@linkdrop/commons'
import { Scrollbars } from 'react-custom-scrollbars'
import { ethers } from 'ethers'

@actions(({ user: { loading, contractAddress }, assets: { items } }) => ({ items, loading, contractAddress }))
@translate('pages.send')
class Send extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sendTo: '',
      currentAsset: (props.items[0] || {}).tokenAddress
    }
  }

  componentDidMount () {
    const { items } = this.props
    const {
      chainId
    } = getHashVariables()
    if (!items || items.length === 0) {
      this.actions().assets.getItems({ chainId })
    }
  }

  render () {
    const { sendTo, currentAsset } = this.state
    return <div className={styles.container}>
      <Header sendTo={sendTo} onSend={({ amount }) => this.onSend({ amount })} />
      <Scrollbars style={{
        heigth: 'calc(100vh - 90px)',
        width: '100%'
      }}
      >
        <div className={styles.content}>
          <Assets onChange={({ currentAsset }) => this.setState({ currentAsset })} currentAsset={currentAsset} />
          <Input
            onChange={({ value }) => this.setState({
              sendTo: value
            })}
            value={sendTo}
            title={this.t('titles.to')}
            placeholder={this.t('titles.toPlaceholder')}
          />
          {false && <Input title={this.t('titles.for')} placeholder={this.t('titles.forPlaceholder')} />}
          {false && <Contacts />}
        </div>
      </Scrollbars>
    </div>
  }

  onSend ({ amount }) {
    const { items } = this.props
    const { sendTo, currentAsset } = this.state
    const { decimals } = items.find(item => item.tokenAddress === currentAsset)
    if (currentAsset === ethers.constants.AddressZero) {
      this.actions().assets.sendEth({ to: sendTo, amount })
    } else {
      this.actions().assets.sendErc20({ to: sendTo, amount, tokenAddress: currentAsset, decimals })
    }
  }
}

export default Send
