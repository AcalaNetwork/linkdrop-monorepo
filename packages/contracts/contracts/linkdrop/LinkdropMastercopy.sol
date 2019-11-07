pragma solidity ^0.5.12;
pragma experimental ABIEncoderV2;

import "./LinkdropERC20.sol";
import "./LinkdropERC721.sol";

contract LinkdropMastercopy is LinkdropERC20, LinkdropERC721 {} // solium-disable-line no-empty-blocks