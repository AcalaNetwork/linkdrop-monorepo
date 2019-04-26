pragma solidity >= 0.5.0;

contract ILinkdrop {

    event Canceled(address linkId, uint timestamp);
    event Claimed(address indexed linkId, address indexed token, uint amount, address receiver, uint timestamp);

    event Paused(uint timestamp);
    event Unpaused(uint timestamp);

    // Constructor
    function initializer(address payable _sender) external returns (bool);

    function verifySenderSignature
    (
        address _token,
        uint _amount,
        uint _expiration,
        address _linkId,
        bytes memory _signature
    )
    public view returns (bool);

    function verifyReceiverSignature
    (
        address _linkId,
	    address _receiver,
		bytes memory _signature
    )
    public view returns (bool);

    function checkClaimParams
    (
        address _token,
        uint _amount,
        uint _expiration,
        address _linkId, 
        bytes calldata _senderSignature,
        address _receiver, 
        bytes calldata _receiverSignature
    )
    external view returns (bool);

    function claim
    (
        address _token, 
        uint _amount,
        uint _expiration,
        address _linkId, 
        bytes calldata _senderSignature, 
        address payable _receiver, 
        bytes calldata _receiverSignature
    ) 
    external returns (bool);

    function isClaimedLink(address _linkId) external view returns (bool);
    function isCanceledLink(address _linkId) external view returns (bool);
    function cancel(address _linkId) external returns (bool);

    function paused() external view returns (bool);
    function pause() external returns (bool);
    function unpause() external returns (bool);
    
}