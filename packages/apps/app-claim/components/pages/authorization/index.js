/* global gapi */
import React from 'react'
import { Button, RetinaImage } from '@linkdrop/ui-kit'
import styles from './styles.module'
import { Page } from 'components/pages'
import { getEns, getImages } from 'helpers'
import { actions, translate } from 'decorators'
import config from 'app.config.js'
import { getHashVariables } from '@linkdrop/commons'

@actions(({ user: { sdk, privateKey, contractAddress, ens, loading } }) => ({ loading, sdk, contractAddress, privateKey, ens }))
@translate('pages.authorization')
class Authorization extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      enableAuthorize: false
    }
  }

  componentDidMount () {
    console.log("comp did mount")
    this.actions().user.createWallet()
    console.log("wallet created")
  }

  componentWillReceiveProps ({ privateKey, contractAddress }) {
    console.log("componentWillReceiveProps")
    const { contractAddress: prevContractAddress, privateKey: prevPrivateKey } = this.props
    if (privateKey && contractAddress && !prevContractAddress && !prevPrivateKey) {
      console.log("adding script to the document")
      const script = document.createElement('script')
      script.setAttribute('src', 'https://apis.google.com/js/api.js')
      script.setAttribute('async', true)
      script.onload = _ => this.handleClientLoad()
      script.onreadystatechange = function () {
        if (this.readyState === 'complete') this.onload()
      }
      document.body.appendChild(script)
    }
  }

  handleClientLoad () {
    console.log("client inited")
    gapi.load('client:auth2', _ => this.initClient())
  }

  initClient () {
    console.log("initing client")
    gapi.client.init({
      clientId: config.authClientId,
      apiKey: config.authApiKey,
      discoveryDocs: config.authDiscoveryDocs,
      // scope: `${config.authScopeDrive} ${config.authScopeContacts}`
      scope: config.authScopeDrive
    }).then(_ => {
      // Listen for sign-in state changes.
      const authInstance = gapi.auth2.getAuthInstance()
      authInstance.isSignedIn.listen(isSignedIn => this.updateSigninStatus({ authInstance }))
      // Handle the initial sign-in state.
      this.updateSigninStatus({ authInstance })
    }, error => {
      console.error(error)
    })
  }

  updateSigninStatus ({ authInstance }) {
    if (!authInstance) { return }
    const isSignedIn = authInstance.isSignedIn.get()

    this.setState({
      enableAuthorize: !isSignedIn
    }, _ => {
      if (isSignedIn) {
        const email = authInstance.currentUser.get().getBasicProfile().getEmail()
        const avatar = authInstance.currentUser.get().getBasicProfile().getImageUrl()
        this.setState({
          email
        }, _ => {
          this.getFiles({ email, avatar })
        })
      }
    })
  }

  getFiles ({ email, avatar }) {
    const {
      chainId
    } = getHashVariables()
    gapi.client.drive.files.list({
      spaces: 'appDataFolder'
    }).then(response => {
      const files = response.result.files.filter(file => file.name === 'linkdrop-data.json')
      if (files && files.length > 0) {
        const id = files[0].id
        gapi.client.drive.files
          .get({
            fileId: id,
            alt: 'media'
          })
          .execute(response => {
            const { privateKey, contractAddress, ens } = response
            this.actions().user.setUserData({ privateKey, contractAddress, ens, avatar })
          })
      } else {
        const ens = getEns({ email, chainId })
        const { contractAddress, privateKey } = this.props
        const boundary = '-------314159265358979323846'
        const delimiter = '\r\n--' + boundary + '\r\n'
        const closeDelim = '\r\n--' + boundary + '--'

        const contentType = 'application/json'

        const metadata = {
          name: 'linkdrop-data.json',
          mimeType: contentType,
          parents: ['appDataFolder']
        }

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' +
          contentType +
          '\r\n\r\n' +
          JSON.stringify({ ens, contractAddress, privateKey }) +
          closeDelim

        gapi.client
          .request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: {
              'Content-Type':
              'multipart/related; boundary="' + boundary + '"'
            },
            body: multipartRequestBody
          })
          .execute(response => {
            this.actions().user.setUserData({ privateKey, contractAddress, ens, avatar })
          })
      }
    })
  }

  handleAuthClick () {
    gapi.auth2.getAuthInstance().signIn()
  }

  render () {
    console.log("in auth render")
    const { loading } = this.props
    const { enableAuthorize } = this.state
    return <Page>
      <div className={styles.container}>
        <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: this.t('titles.signIn') }} />
        <Button loadingClassName={styles.buttonLoading} className={styles.button} inverted loading={!enableAuthorize || loading} onClick={e => this.handleAuthClick(e)}>
          <RetinaImage width={30} {...getImages({ src: 'google' })} />
          {this.t('titles.googleSignIn')}
        </Button>
        <div className={styles.note} dangerouslySetInnerHTML={{ __html: this.t('texts.backup', { href: 'https://www.notion.so/linkdrop/Help-Center-9cf549af5f614e1caee6a660a93c489b#49e760a3af404bb99d91450a16fa8a80' }) }} />
      </div>
    </Page>
  }
}
export default Authorization
