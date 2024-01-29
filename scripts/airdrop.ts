import { fetchHolders } from "./getAddresses";
import { ethers} from "ethers"
import * as dotenv from "dotenv"
const hre = require("hardhat")
dotenv.config()

function setUpProvider() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_MAINNET ?? "");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_ANDRES ?? "", provider);
    return {provider,wallet};
}

const contractAirdrop = "0x33578637570E09C52B463976d893524E75c53d4e"

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

}

airdrop()