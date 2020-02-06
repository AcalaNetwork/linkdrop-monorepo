import React from 'react'
import i18next from 'i18next'
import { Switch, Route } from 'react-router'
import { Main, Page, NotFound } from 'components/pages'
import './styles'

import { actions } from 'decorators'
@actions(({ user }) => ({
  locale: (user || {}).locale
}))
class AppRouter extends React.Component {
  componentWillReceiveProps ({ locale }) {
    const { locale: prevLocale } = this.props
    if (locale === prevLocale) { return }
    i18next.changeLanguage(locale)
  }

  componentDidMount () {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  render () {
    const { web3Provider, context, externalAccount, externalChainId } = this.props
    
    return <Page>
      <Switch>
        <Route
          path='/'
          render={props => <Main
            {...props}
            web3Provider={web3Provider}
            context={context}
            externalAccount={externalAccount}
            externalChainId={externalChainId}
          />
        } />
        <Route path='*' component={NotFound} />
      </Switch>
    </Page>
  }
}

export default AppRouter
