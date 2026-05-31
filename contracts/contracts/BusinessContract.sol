// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BusinessContract {
    address public trustedGatewayRelayer;
    mapping(address => uint256) public counters;

    event PQCActionExecuted(
        address indexed pqcSender,
        address indexed relayer,
        uint256 value,
        uint256 newCounter
    );

    constructor(address _trustedGatewayRelayer) {
        trustedGatewayRelayer = _trustedGatewayRelayer;
    }

    function executeFromPQC(address pqcSender, uint256 value) external {
        require(msg.sender == trustedGatewayRelayer, "Only gateway relayer");

        counters[pqcSender] += value;

        emit PQCActionExecuted(
            pqcSender,
            msg.sender,
            value,
            counters[pqcSender]
        );
    }
}
