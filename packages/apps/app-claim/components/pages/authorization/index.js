/* global gapi */
import React from 'react'
import { Button } from '@linkdrop/ui-kit'
import styles from './styles.module'
import { Page } from 'components/pages'
import { getEns } from 'helpers'
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
    this.actions().user.createWallet()
  }

  componentWillReceiveProps ({ privateKey, contractAddress }) {
    const { contractAddress: prevContractAddress, privateKey: prevPrivateKey } = this.props
    if (privateKey && contractAddress && !prevContractAddress && !prevPrivateKey) {
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
    gapi.load('client:auth2', _ => this.initClient())
  }

  initClient () {
    gapi.client.init({
      clientId: config.authClientId,
      apiKey: config.authApiKey,
      discoveryDocs: config.authDiscoveryDocs,
      scope: config.authScope
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
          this.getContacts()
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
            const { privateKey, contractAddress, avatar, ens } = response
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

  getContacts () {
    // fetch(`https://www.google.com/m8/feeds/contacts/default/thin?alt=json&access_token=${accessToken}&max-results=500&v=3.0`,
    //   function(response){
    //   //process the response here
    //   console.log(response);
    // });
    // console.log(gapi.client)
  }

  handleAuthClick () {
    gapi.auth2.getAuthInstance().signIn()
  }

  render () {
    const { loading } = this.props
    const { enableAuthorize } = this.state
    return <Page>
      <div className={styles.container}>
        <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: this.t('titles.signIn') }} />
        <Button inverted loading={!enableAuthorize || loading} onClick={e => this.handleAuthClick(e)}>{this.t('titles.googleSignIn')}</Button>
      </div>
    </Page>
  }
}
export default Authorization
