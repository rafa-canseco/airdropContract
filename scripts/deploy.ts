import {ethers,run} from "hardhat"
import * as dotenv from "dotenv"
import { NewDistributor__factory } from "../typechain-types"
const hre = require("hardhat")
dotenv.config()

function setUpProvider () {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT_TESTNET ?? "");
    return provider
}

async function main() {
    const provider = setUpProvider()
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TESTNET ?? "", provider)
    console.log("Deploying Contract")
    const walletAddress = await wallet.getAddress();

    const distributorFactory = new NewDistributor__factory(wallet);
    const distributor = await distributorFactory.deploy(walletAddress);
    const deploymentTransaction = distributor.deploymentTransaction();
    await deploymentTransaction?.wait(5);
    await distributor.waitForDeployment();
    console.log("Contract deployed")

    const distributorContractAddress = await distributor.getAddress();
    console.log("Contract address: ", distributorContractAddress)

    console.log("Verifying Contract...");
    try {
        await run("verify:verify", {
            address: distributorContractAddress,
            constructorArguments: [walletAddress],
        });
        console.log("Contract verification successful.");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});