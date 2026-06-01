// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NativePQCBusinessContract {
    mapping(address => uint256) public counters;

    event NativePQCActionExecuted(
        address indexed pqcSender,
        uint256 value,
        uint256 counterAfter
    );

    function executeNativePQC(uint256 value) external {
        counters[msg.sender] += value;

        emit NativePQCActionExecuted(
            msg.sender,
            value,
            counters[msg.sender]
        );
    }
}
