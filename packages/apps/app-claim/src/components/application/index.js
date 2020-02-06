import React from 'react'
import { Provider } from 'react-redux'
import { Web3ReactProvider } from "@web3-react/core"
import connectors from './connectors'
import RouterProvider from './router-provider'
import store from 'data/store'
import Web3 from 'web3'
import { getHashVariables } from '@linkdrop/commons'

function getLibrary(provider) {
  return new Web3(provider);
}

class Application extends React.Component {
  componentDidMount () {
    const { tokenId } = getHashVariables()
    if (Number(tokenId) === 398) {
      window.location.href = 'https://linkdrop.to/376SIRu'
    }
  }

  render () {
    return <Web3ReactProvider
      getLibrary={getLibrary}
    >
      <Provider store={store()}>
        <RouterProvider />
      </Provider>
    </Web3ReactProvider>
  }
}
export default Application
