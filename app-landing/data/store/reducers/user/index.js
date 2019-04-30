import reducers from './reducers'

const initialState = {
  id: undefined,
  locale: 'en',
  wallet: null,
  step: 0,
  loading: false,
  errors: [],
  balance: null,
  balanceFormatted: null,
  link: null,
  privateKey: null,
  claimed: false
}

export default (state = initialState, action = {}) => {
  const newState = { ...state }
  const { type } = action
  const actionMethod = ACTIONS[type]
  if (!actionMethod) return newState

  return actionMethod(newState, action)
}

const ACTIONS = {
  'USER.CHANGE_LOCALE': reducers.changeLocale,
  'USER.SET_WALLET': reducers.setWallet,
  'USER.SET_STEP': reducers.setStep,
  'USER.SET_LOADING': reducers.setLoading,
  'USER.SET_ERRORS': reducers.setErrors,
  'USER.SET_BALANCE': reducers.setBalance,
  'USER.SET_LINK': reducers.setLink,
  'USER.SET_PRIVATE_KEY': reducers.setPrivateKey,
  'USER.SET_CLAIMED_STATUS': reducers.setClaimedStatus,
  'USER.SET_ALL_DATA': reducers.setAllData
}
