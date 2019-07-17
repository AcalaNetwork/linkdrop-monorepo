pragma solidity ^0.5.6;

import "../interfaces/ILinkdropERC721.sol";
import "../interfaces/ILinkdropFactoryERC721.sol";
import "./LinkdropFactoryCommon.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";

contract LinkdropFactoryERC721 is ILinkdropFactoryERC721, LinkdropFactoryCommon {

    /**
    * @dev Function to verify linkdrop signer's signature
    * @param _weiAmount Amount of wei to be claimed
    * @param _nftAddress NFT address
    * @param _tokenId Token id to be claimed
    * @param _expiration Unix timestamp of link expiration time
    * @param _linkId Address corresponding to link key
    * @param _linkdropSigner Address of linkdrop signer
    * @param _linkdropSignerSignature ECDSA signature of linkdrop signer
    * @param _proxy Address of proxy contract
    * @return True if signed with linkdrop signer's private key
    */
    function verifyLinkdropSignerSignatureERC721
    (
        uint _weiAmount,
        address _nftAddress,
        uint _tokenId,
        uint _expiration,
        address _linkId,
        address _linkdropSigner,
        bytes memory _linkdropSignerSignature,
        address _proxy
    )
    public view
    returns (bool)
    {
        bytes32 prefixedHash = ECDSA.toEthSignedMessageHash
        (
            keccak256
            (
                abi.encodePacked
                (
                    _weiAmount,
                    _nftAddress,
                    _tokenId,
                    _expiration,
                    masterCopyVersion,
                    chainId,
                    _linkId,
                    _proxy
                )
            )
        );
        address signer = ECDSA.recover(prefixedHash, _linkdropSignerSignature);
        return signer == _linkdropSigner;
    }

    /**
    * @dev Function to verify linkdrop receiver's signature
    * @param _linkId Address corresponding to link key
    * @param _receiver Address of linkdrop receiver
    * @param _signature ECDSA signature of linkdrop receiver
    * @return True if signed with link key
    */
    function verifyReceiverSignatureERC721
    (
        address _linkId,
        address _receiver,
        bytes memory _signature
    )
    public pure
    returns (bool)
    {
        bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(_receiver)));
        address signer = ECDSA.recover(prefixedHash, _signature);
        return signer == _linkId;
    }

    /**
    * @dev Function to verify claim params, make sure the link is not claimed or canceled and proxy is allowed to spend token
    * @param _weiAmount Amount of wei to be claimed
    * @param _nftAddress NFT address
    * @param _tokenId Token id to be claimed
    * @param _expiration Unix timestamp of link expiration time
    * @param _linkId Address corresponding to link key
    * @param _linkdropMaster Address corresponding to linkdrop master key
    * @param _campaignId Campaign id
    * @param _linkdropSignerSignature ECDSA signature of linkdrop signer
    * @param _receiver Address of linkdrop receiver
    * @param _receiverSignature ECDSA signature of linkdrop receiver
    * @param _proxy Address of proxy contract
    * @return True if success
    */
    function checkClaimParamsERC721
    (
        uint _weiAmount,
        address _nftAddress,
        uint _tokenId,
        uint _expiration,
        address _linkId,
        address payable _linkdropMaster,
        uint _campaignId,
        bytes memory _linkdropSignerSignature,
        address _receiver,
        bytes memory _receiverSignature,
        address _proxy
    )
    public view
    returns (bool)
    {
        // If proxy is deployed
        if (isDeployed(_linkdropMaster, _campaignId)) {

            return ILinkdropERC721(deployed[salt(_linkdropMaster, _campaignId)]).checkClaimParamsERC721
            (
                _weiAmount,
                _nftAddress,
                _tokenId,
                _expiration,
                _linkId,
                _linkdropSignerSignature,
                _receiver,
                _receiverSignature
            );

        }
        else {

            // Make sure nft address is not equal to address(0)
            require(_nftAddress != address(0), "Invalid nft address");

            // Make sure claim amount is available for proxy contract
            require(_proxy.balance >= _weiAmount.add(registry.getFee(_proxy)), "Insufficient funds");

            // Make sure token is available for proxy contract
            require(IERC721(_nftAddress).isApprovedForAll(_linkdropMaster, _proxy), "Unavailable token");

            // Verify that link key is legit and signed by linkdrop signer's private key
            require
            (
                verifyLinkdropSignerSignatureERC721
                (
                    _weiAmount,
                    _nftAddress,
                    _tokenId,
                    _expiration,
                    _linkId,
                    _linkdropMaster,
                    _linkdropSignerSignature,
                    _proxy
                ),
                "Invalid linkdrop signer signature"
            );

            // Make sure link is not expired
            require(_expiration >= now, "Expired link");

            // Verify that receiver address is signed by ephemeral key assigned to claim link (link key)
            require
            (
                verifyReceiverSignatureERC721(_linkId, _receiver, _receiverSignature),
                "Invalid receiver signature"
            );

            return true;
        }

    }

    /**
    * @dev Function to claim ETH and/or ERC721 token
    * @param _weiAmount Amount of wei to be claimed
    * @param _nftAddress NFT address
    * @param _tokenId Token id to be claimed
    * @param _expiration Unix timestamp of link expiration time
    * @param _linkId Address corresponding to link key
    * @param _linkdropMaster Address corresponding to linkdrop master key
    * @param _campaignId Campaign id
    * @param _linkdropSignerSignature ECDSA signature of linkdrop signer
    * @param _receiver Address of linkdrop receiver
    * @param _receiverSignature ECDSA signature of linkdrop receiver
    * @return True if success
    */
    function claimERC721
    (
        uint _weiAmount,
        address _nftAddress,
        uint _tokenId,
        uint _expiration,
        address _linkId,
        address payable _linkdropMaster,
        uint _campaignId,
        bytes calldata _linkdropSignerSignature,
        address payable _receiver,
        bytes calldata _receiverSignature
    )
    external
    returns (bool)
    {

        // Make sure only whitelisted relayer calls this function
        require(registry.isWhitelistedRelayer(msg.sender), "Only whitelisted relayer");

        // Check whether the proxy is deployed for linkdrop signer and deploy if not
        if (!isDeployed(_linkdropMaster, _campaignId)) {
            _deployProxy(_linkdropMaster, _campaignId);
        }

        // Call claim function in the context of proxy contract
        ILinkdropERC721(deployed[salt(_linkdropMaster, _campaignId)]).claimERC721
        (
            _weiAmount,
            _nftAddress,
            _tokenId,
            _expiration,
            _linkId,
            _linkdropSignerSignature,
            _receiver,
            _receiverSignature,
            msg.sender // Fee receiver
        );

        return true;

    }

}