import React from 'react'
import { Header } from 'linkdrop-ui-kit'
import styles from './styles.module'

class Page extends React.Component {
  render () {
    return <div className={styles.container}>
      <Header />
      <div className={styles.main}>
        {this.props.children}
      </div>
    </div>
  }
}

export default Page
