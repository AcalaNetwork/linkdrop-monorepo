export default {
  titles: {
    createLinkKey: 'Create Link Key',
    setupCampaign: 'Setup',
    chooseToken: 'Choose token',
    total: 'Total:',
    fillTheField: 'Fill all fields to see the details',
    amountPerLink: 'Amount per link',
    totalLinks: 'Total links to distribute',
    howTo: 'How to:',
    addIcon: 'Check your icon, if not<br>—submit or send to us',
    eth: 'ETH',
    ethInLinks: '{{ethAmount}} {{symbol}} in {{linksAmount}} links',
    holdEth: '{{symbol}} will be stored in Linkdrop Contract',
    oneLinkContains: 'Each link contains: ',
    oneLinkContentsWithEth: '{{tokenAmount}} {{tokenSymbol}} + {{ethAmount}} {{symbol}}',
    oneLinkContents: '{{tokenAmount}} {{tokenSymbol}}',
    // step1
    receiverWallet: 'Receiver wallet:',
    etherBalance: 'Ether Balance: ',
    balance: 'Balance: ', 
    tokenAddress: 'Token Address',
    tokenAddressPlaceholder: '0x Address',
    selectNft: 'Select tokens to distribute',
    ethInLink: '{{symbol}} in link',

    // step2
    summaryPay: 'Summary',
    linksToGenerate: 'Links to generate',
    oneLinkContainsTitle: 'Each link contains',
    serviceFeeTitle: 'Service fee',
    totalEthInLinks: 'Total {{symbol}} in links',
    ethPerLink: '{{eth}} {{symbol}} per link',
    ethHold: 'Will be stored in Linkdrop Contract',
    approveTokens: 'Approve permission to spend <span>{{tokenAmount}} {{tokenSymbol}}</span> for generating links',
    sendEthToGenerate: 'You wil send <span>{{ethAmount}} {{symbol}}</span> to start generate links',
    etherToDistribute: '<span>{{ethAmount}} {{symbol}}</span> — to distribute',
    serviceFeeToDistribute: '<span>{{ethAmount}} {{symbol}}</span> — service fee',

    // step3
    sendEth: 'Secure {{ethAmount}} {{symbol}} into Linkdrop Contract',
    serviceFee: '<span>{{price}} {{symbol}}</span> in service fees',
    serviceFeePerLink: '<span>{{price}} {{symbol}}</span> per link, for covering gas fees and our service costs',

    // step4
    generatingLinks: 'Generating links…',
    loadingProcess: 'It may take a few minuts, <span>don’t close this page</span>',

    // step5
    getTheLinks: 'Get the Links',
    linkdropSdk: 'Linkdrop SDK',
    automaticDistribution: 'Automatic distribution on the fly',
    nodeJsSupport: 'Right now Linkdrop SDK supports only Node.js.',
    otherPlatforms: 'We\'re working on adding other languages and platforms.',
    contactUs: ' Contact us for more details.',
    codeDetails: 'See the code and details',
    contractParams: 'Linkdrop Contract parameters',
    masterAddress: 'Master Address: <span>{{address}}</span>',
    factoryAddress: 'Factory Address: <span>{{address}}</span>',
    signingKey: 'Signing Key: <span>{{signingKey}}</span>',
    downloadFile: 'Download CSV file',
    manual: 'Manual distribution',
    howToClaimPreview: 'How claim page will look like<br>for receivers — <a target="_blank" href={{href}}>Preview<a/>',
    faq: 'FAQ',
    visitHelpCenter: 'Have a question — visit <a target="_blank" href={{href}}>Help Center</a><br>or send us a message via Intercom',
    campaignId: 'Campaign ID: <span>{{campaignId}}</span>',

    // step6
    useTerminalApp: 'Use Terminal App',
    cloneLinkdropMonorepo: '1. Clone Linkdrop Monorepo',
    fillInConfig: '2. Fill in <span>configs/scripts.config.json</span> from the root with the following params:',
    generateLinks: '3. Generate links by running <span>yarn generate-links-erc20</span> from the root',
    csvFile: '4. The generated <span>CSV file</span> will be located in <span>scripts/output/linkdrop_erc20.csv</span>',
  },
  texts: {
    _3: 'It’s created once and will work for the next campaigns.',
    _2: 'The Link Key is a unique private key that allows us to sign every link for you so you no need to do it manually.',

    // step3
    _10: 'Ether will be stored in Linkdrop Contract to distribute into links.<br>You can stop the campaign anytime and get back your Ether.',
    _15: 'You wil send {{eth}} {{symbol}} to start generate links',
    _16: '<span>{{eth}} {{symbol}}</span> — to distribute',
    _17: '<span>{{eth}} {{symbol}}</span> — service fee',
    _18: 'By service fees, we cover Gas costs for links distribution and our operation costs.',
    payAttention: 'Pay attention to correctly fill all the fields. tokenAmount should be provided in atomic value.',
    terminalApp: 'If you\'re not familiar with how to use the Terminal app, contact with your technical teammates to help',
    haveAQuestion: 'Have a question — send us a message via Intercom',
    scriptInstruction: 'To generation more than 1000 links at a time',
    scriptDescription: 'This script will deploy the linkdrop proxy contract for your campaign and top it up with the required ETH amount for covering fee costs as well as approve your ERC20 tokens.',
    codeBlockScript: `{
  "jsonRpcUrl": "https://mainnet.infura.io",
  "CHAIN": "mainnet",
  "chainId": "1",
  "API_HOST": "https://mainnet.linkdrop.io",
  "version": "1",
  "linkdropMasterPrivateKey": "$YOUR_PRIVATE_KEY",
  "masterCopy": "0x6a86aA5D394741b4464C785BD7Bf3D4c4bD87a6E",
  "weiAmount": "0",
  "tokenAddress": "0xc770eefad204b5180df6a14ee197d99d808ee52d",
  "tokenAmount": "100", // $ TOKENS AMOUNT PER LINK IN ATOMIC VALUE
  "linksNumber": "40000",
  "CAMPAIGN_ID": "1",
  "FACTORY_ADDRESS": "0xBa051891B752ecE3670671812486fe8dd34CC1c8"
}
`,
    codeBlockErc20: `// installation: yarn add @linkdrop/sdk
// import library
const LinkdropSDK = require('@linkdrop/sdk')

// OR
import LinkdropSDK from '@linkdrop/sdk'

// initialization
const linkdropSDK = LinkdropSDK({
  linkdropMasterAddress: '{{masterAddress}}',
  factoryAddress: '{{factoryAddress}}',
  // optional params
  // chain: '{{chain}}',
  // jsonRpcUrl = <JSON_RPC_URL>, // https://{{chain}}.infura.io by default,
  // apiHost = <API_HOST>, // https://{{chain}}.linkdrop.io by default
  // claimHost = <CLAIM_HOST>, // 'https://claim.linkdrop.io' by default
})

// generate links for {{symbol}} and ERC20
const {
  url,
  linkId,
  linkKey,
  linkdropSignerSignature
} = await linkdropSDK.generateLink({
  signingKeyOrWallet: '{{linkdropSigner}}', // Signing private key or ethers.js Wallet instance
  weiAmount: {{weiAmount}}, // Amount of wei per claim
  tokenAddress: '{{tokenAddress}}', // ERC20 token address
  tokenAmount: {{tokenAmount}}, // Amount of ERC20 tokens per claim
  expirationTime: 12345678910, // Link expiration time
  campaignId: {{campaignId}} // Campaign id
})
`,
    codeBlockErc721: `// installation: yarn add @linkdrop/sdk
// import library
const LinkdropSDK = require('@linkdrop/sdk')

// OR
import LinkdropSDK from '@linkdrop/sdk'

// initialization
const linkdropSDK = LinkdropSDK({
  linkdropMasterAddress: '{{masterAddress}}',
  factoryAddress: '{{factoryAddress}}',
  // optional params
  // chain: '{{chain}}',
  // jsonRpcUrl = <JSON_RPC_URL>, // https://{{chain}}.infura.io by default,
  // apiHost = <API_HOST>, // https://{{chain}}.linkdrop.io by default
  // claimHost = <CLAIM_HOST>, // 'https://claim.linkdrop.io' by default
})

// generate links for ERC721
const {
  url,
  linkId,
  linkKey,
  linkdropSignerSignature
} = await linkdropSDK.generateLinkERC721({
  signingKeyOrWallet: '{{linkdropSigner}}', // Signing private key or ethers.js Wallet instance
  weiAmount: {{weiAmount}}, // Amount of wei per claim
  nftAddress: '{{tokenAddress}}', // ERC721 token address
  tokenId: <TOKEN_ID>, // ID of individual ERC721 token
  expirationTime: 12345678910, // Link expiration time
  campaignId: {{campaignId}} // Campaign id
})
`
  },
  buttons: {
    create: 'Create',
    next: 'Next',
    addTokenIcon: 'Add Token Icon',
    addEth: '+ {{symbol}}',
    payAndContinue: 'Pay & Continue',
    send: 'Send',
    useLinkdropSdk: 'Use Linkdrop SDK',
    seeOnGithub: 'See How-To On Github',
    downloadCsv: 'Download CSV',
    qr: 'QR-Codes',
    approve: 'Approve',
    sendAndContinue: 'Send & Continue',
    selectAll: 'Select All',
    deselectAll: 'Deselect All'
  }
}
