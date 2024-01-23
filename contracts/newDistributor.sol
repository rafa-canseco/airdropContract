// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract newDistributor is Ownable {
    //State variables and mappings
    mapping(address => bool) public isHolder;
    mapping(address => uint256) public holderPercentages;
    address[] public holders;
    IERC20 public tokenToTrack;
    IERC20 public airdropToken;

    //Events
    event TokenToTrackRegistered(IERC20 indexed token);
    event AirdropTokenRegistered(IERC20 indexed token);
    event AidropExecuted(address indexed holder, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerTokenToTrack(IERC20 _tokenToTrack) public onlyOwner {
        tokenToTrack = _tokenToTrack;
        emit TokenToTrackRegistered(_tokenToTrack);
    }

    function registerAirdropToken(IERC20 _airdropToken) public onlyOwner {
        airdropToken = _airdropToken;
        emit AirdropTokenRegistered(_airdropToken);
    }

    function registerHolders(address[] calldata _holders) public onlyOwner {
        for (uint i = 0; i < _holders.length; i++) {
            if (!isHolder[_holders[i]]) {
                isHolder[_holders[i]] = true;
                holders.push(_holders[i]);
            }
        }
    }

    function percentages() public onlyOwner {
        uint256 totalSupply = tokenToTrack.totalSupply();
        for (uint i = 0; i < holders.length; i++) {
            address holder = holders[i];
            uint256 balance = tokenToTrack.balanceOf(holder);
            holderPercentages[holder] = (balance * 100) / totalSupply;
        }
    }

    function airdrop() public onlyOwner {
        uint256 totalAirdropAmount = airdropToken.balanceOf(address(this));
        require(
            totalAirdropAmount > 0,
            "there is no tokens of airdrop tokens on the contract"
        );

        percentages();

        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            uint256 holderPercentage = holderPercentages[holder];
            uint256 holderAmount = (totalAirdropAmount * holderPercentage) /
                100;
            require(
                airdropToken.balanceOf(address(this)) >= holderAmount,
                "Insufficient tokens for airdrop"
            );
            airdropToken.transfer(holder, holderAmount);
            emit AidropExecuted(holder, holderAmount);
        }
        resetHolders();
    }

    function withdrawToken(IERC20 _token) public onlyOwner {
        uint256 balance = _token.balanceOf(address(this));
        require(balance > 0, "no token balance");
        bool success = _token.transfer(owner(), balance);
        require(success, "transfer tokens failed");
    }

    function emergencyWithdrawAvax() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No AVAX balance to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    function resetHolders() public onlyOwner {
        for (uint i = 0; i < holders.length; i++) {
            address holder = holders[i];
            isHolder[holder] = false;
            holderPercentages[holder] = 0;
        }
        delete holders;
    }

        receive() external payable {}
}
