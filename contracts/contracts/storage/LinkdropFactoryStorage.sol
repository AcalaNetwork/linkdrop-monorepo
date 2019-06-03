pragma solidity ^0.5.6;

contract LinkdropFactoryStorage {

    // Address of factory owner
    address payable public owner;

    // Current version of mastercopy contract
    uint public version;

    // Contract bytecode to be installed when deploying proxy
    bytes internal _bytecode;

    // Bootstrap initcode to fetch the actual contract bytecode. Used to generate repeatable contract addresses
    // 0x6352c7420d6000526103ff60206004601c335afa6040516060f3
    bytes internal _initcode;

    // Maps sender address to its corresponding proxy address
    mapping (address => address) public deployed;

    // Events
    event Deployed(address payable owner, address payable proxy, bytes32 salt, uint timestamp);
    event Destroyed(address payable owner, address payable proxy, uint timestamp);
    event UpdatedBytecode(bytes bytecode, uint version, uint timestamp);

}