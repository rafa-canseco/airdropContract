import {fetchHolders_testing} from "./testing"
import { ethers } from "ethers"
import * as dotenv from "dotenv"
const hre = require("hardhat")
dotenv.config()

function setUpProvider() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_TESTNET ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TESTNET ?? "", provider)
    return {provider,wallet};
}

const contractAirdrop = "0x6401A84d283bBC5Bf397014f4bcA78567923d170"

async function airdrop() {
    const {provider,wallet} = setUpProvider();
    const tokenArtifact = await hre.artifacts.readArtifact("contracts/newDistributor.sol:newDistributor");
    const abi = tokenArtifact.abi;
    const contract = new ethers.Contract(contractAirdrop, abi, wallet);
    const {addresses, totalCount} = await fetchHolders_testing();
    const numBatches = Math.ceil(totalCount / 100);
    const batchSize = Math.ceil(totalCount / numBatches);
    console.log(batchSize);

    for (let i = 0; i < numBatches; i++) {
        console.log(`Procesando batch ${i + 1} de ${numBatches}`);
        await contract.processPercentagesInBatches(); 
        await new Promise(resolve => setTimeout(resolve, 7000)); 
    }


    for (let i = 0; i < numBatches; i++) {
        console.log(`Ejecutando airdrop para el batch ${i + 1} de ${numBatches}`);
        await contract.airdrop(); 
        await new Promise(resolve => setTimeout(resolve, 7000)); 
    }
}

airdrop()
