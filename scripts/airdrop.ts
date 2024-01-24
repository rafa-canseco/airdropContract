import { fetchHolders } from "./getAddresses";
import { ethers} from "ethers"
import * as dotenv from "dotenv"
const hre = require("hardhat")
dotenv.config()

function setUpProvider() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_TESTNET ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TESTNET ?? "", provider);
    return {provider,wallet};
}

const contractAirdrop = "0x14d6c043729f4b571fa57Ed8Fb809f3F79Ef83eC"

async function airdrop() {
    const {provider,wallet} = setUpProvider();
    const tokenArtifact = await hre.artifacts.readArtifact("contracts/newDistributor.sol:newDistributor");
    const abi = tokenArtifact.abi;
    const contract = new ethers.Contract(contractAirdrop, abi, wallet);
    const addresses = await fetchHolders();
    console.log("seteando holders")
    const setHolders = await contract.registerHolders(addresses);
    const receipt = await setHolders.wait();
    console.log("tx holders:", receipt.hash);
    const airdrop = await contract.airdrop()
    const receiptAirdrop = await airdrop.wait();
    console.log("tx airdrop:", receiptAirdrop.hash);
}

airdrop()