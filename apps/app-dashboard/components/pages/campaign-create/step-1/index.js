import React from 'react'
import { actions, translate } from 'decorators'
import styles from './styles.module'
import { Web3Consumer } from 'web3-react'
import classNames from 'classnames'
import { Button } from 'components/common'
import { RetinaImage } from 'linkdrop-ui-kit'
import { getImages } from 'helpers'

@actions(_ => ({}))
@translate('pages.campaignCreate')
class Step1 extends React.Component {
  render () {
    return <Web3Consumer>
      {context => <div className={styles.container}>
        <div className={styles.title}>{this.t('titles.createLinkKey')}</div>
        <div className={styles.main}>
          <div className={styles.description}>
            <p class={classNames(styles.text, styles.textMain)}>{this.t('texts._1')}</p>
            <p class={styles.text}>{this.t('texts._2')}</p>
            <p class={styles.text}>{this.t('texts._3')}</p>
            <p class={styles.text}>{this.t('texts._4')}</p>
          </div>

          <div className={styles.scheme}>
            <p class={classNames(styles.text, styles.centered)}>{this.t('texts._1')}</p>
            <RetinaImage width={255} {...getImages({ src: 'key-preview' })} />
          </div>
        </div>
        <div className={styles.controls}>
          <Button>{this.t('buttons.create')}</Button>
        </div>
      </div>}
    </Web3Consumer>
  }
}

export default Step1
