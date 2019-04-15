import React from 'react'
import { translate, actions } from 'decorators'
import styles from './styles.module'

@actions(({ user }) => ({ user }))
@translate('components.footer')
class Footer extends React.Component {
  render () {
    return <footer className={styles.container} onClick={_ => this.actions().user.changeLocale({ locale: 'ru' })}>
      <div dangerouslySetInnerHTML={{ __html: this.t('copyright') }} />
    </footer>
  }
}

export default Footer
