export default ({ assets }) => {
	const erc721 = assets.find(asset => asset.type === 'erc721')
  if (erc721) return erc721
  const erc20 = assets.find(asset => asset.type === 'erc20')
  if (erc20) return erc20
  return assets.find(asset => asset.type === 'eth')
}