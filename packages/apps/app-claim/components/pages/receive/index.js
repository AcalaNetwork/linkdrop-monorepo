import React from 'react'
import { actions, translate } from 'decorators'
import { Icons, Button } from '@linkdrop/ui-kit'
import styles from './styles.module'
import { Page } from 'components/pages'
import classNames from 'classnames'
import QRCode from 'qrcode.react'
import { copyToClipboard } from '@linkdrop/commons'

@actions(({ user: { loading, contractAddress }, assets: { items } }) => ({ contractAddress, items, loading }))
@translate('pages.receive')
class Receive extends React.Component {
  render () {
    const { contractAddress } = this.props
    return <Page hideHeader>
      <div className={classNames(styles.container)}>
        <div className={styles.close} onClick={_ => { window.location.href = '/#/' }}>
          <Icons.Cross />
        </div>
        <div className={styles.content}>
          <div className={styles.qr}>
            <QRCode size={132} value={contractAddress} />
          </div>

          <div className={styles.address}>
            <div className={styles.addressText}>{contractAddress}</div>
          </div>

          <div className={styles.controls}>
            <Button
              onClick={_ => {
                console.log({ contractAddress })
                copyToClipboard({ value: contractAddress })
              }} className={styles.button}
            >Copy
            </Button>
          </div>
        </div>
      </div>
    </Page>
  }
}

export default Receive
