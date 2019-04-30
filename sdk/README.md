# Linkdrop SDK

## Short description

SDK for computing proxy address, generating claim links and claiming linkdrops

## Installation

```bash
yarn add https://github.com/LinkdropProtocol/linkdrop-monorepo/tree/dev/sdk
```

## Usage

```js
const LinkdropSDK = require('sdk')
```

### Compute proxy address

```js
LinkdropSDK.computeProxyAddress(factoryAddress, senderAddress, masterCopyAddress)
```

This function will use hash of `senderAddress` as salt when building CREATE2 address


### Generate link for ETH or ERC20

```js
LinkdropSDK.generateLink(jsonRpcUrl, networkId, host, senderPrivateKey, token, amount, expirationTime)
```

This function will generate link for claiming ETH or any ERC20 token

### Generate link for ERC721

```js
LinkdropSDK.generateLinkERC721(jsonRpcUrl, networkId, host, senderPrivateKey, nft, tokenId, expirationTime)
```

This function will generate link for claiming ERC721 token


### Claim ETH or ERC20

```js
LinkdropSDK.claim(jsonRpcUrl, host, token, amount, expirationTime, linkKey, senderAddress, senderSignature, receiverAddress)
```

This function will claim ETH or ERC20 token by making a POST request to server endpoint. Make sure the server is up by running `yarn server`

### Claim ERC721

```js
LinkdropSDK.claimERC721(jsonRpcUrl, host, nft, tokenId, expirationTime, linkKey, senderAddress, senderSignature, receiverAddress)
```

This function will claim ETH or ERC20 token by making a POST request to server endpoint. Make sure the server is up by running `yarn server`