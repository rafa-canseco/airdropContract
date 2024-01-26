// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract newDistributor is Ownable {
    //Variables de estado y mapeos
    mapping(address => bool) public isHolder;
    mapping(address => uint256) public holderAirdropAmounts;
    address[] public holders;
    IERC20 public tokenToTrack;
    IERC20 public airdropToken;
    bool public allHoldersAirdropped = false; 
    bool public allPercentagesProcessed= false;
    uint256 public lastProcessedIndex = 0;
    uint256 public lastPercentageProcessedIndex = 0;
    uint256 public batchSize;

    //Eventos
    event TokenToTrackRegistered(IERC20 indexed token);
    event AirdropTokenRegistered(IERC20 indexed token);
    event AirdropExecuted(address indexed holder, uint256 amount);
    event AllHoldersAirdropped();
    event BatchSizeUpdated(uint256 newBatchSize);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setBatchSize(uint256 _newBatchSize) public onlyOwner {
    require(_newBatchSize > 0, "El tamano del lote debe ser mayor que 0");
    batchSize = _newBatchSize;
    emit BatchSizeUpdated(_newBatchSize);
}

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

function processPercentagesInBatches() public onlyOwner {
    require(batchSize > 0, "El tamano del lote no esta configurado");
    uint256 totalSupply = tokenToTrack.totalSupply();
    uint256 totalAirdropAmount = airdropToken.balanceOf(address(this));
    uint256 scaleFactor = 10 ** 18;
    uint256 processed = 0;

    for (uint256 i = lastPercentageProcessedIndex; i < holders.length && processed < batchSize; i++) {
        address holder = holders[i];
        uint256 balance = tokenToTrack.balanceOf(holder);
        uint256 holderAmount = (totalAirdropAmount * balance *scaleFactor ) / totalSupply / scaleFactor;
        holderAirdropAmounts[holder] = holderAmount;
        processed++;
    }

    lastPercentageProcessedIndex += processed;


    if (lastPercentageProcessedIndex >= holders.length) {
        lastPercentageProcessedIndex = 0;
        allPercentagesProcessed = true;
    }
    else{
        allPercentagesProcessed = false;
    }
}



function airdrop() public onlyOwner {
    require(allPercentagesProcessed, "no todos los porcentajes estan calculados");

    uint256 processed = 0;
    for (uint256 i = lastProcessedIndex; i < holders.length && processed < batchSize; i++) {
        address holder = holders[i];
        uint256 holderAmount = holderAirdropAmounts[holder];

        if (airdropToken.balanceOf(address(this)) >= holderAmount) {
            bool success = airdropToken.transfer(holder, holderAmount);
            require(success, "La transferencia de tokens ha fallado");
            emit AirdropExecuted(holder, holderAmount);
            processed++;
        }
    }

    lastProcessedIndex += processed; 

    if (lastProcessedIndex >= holders.length) {
        resetHolders();
        allHoldersAirdropped = true;
        lastProcessedIndex = 0; 
        emit AllHoldersAirdropped(); 
    } else {

        allHoldersAirdropped = false;
    }
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
            holderAirdropAmounts[holder] = 0;
        }
    allHoldersAirdropped = false; 
    allPercentagesProcessed= false;
        delete holders;
    }

    receive() external payable {}
}
