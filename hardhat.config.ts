import { HardhatUserConfig,task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const FORK_FUJI = false
const FORK_MAINNET = true

const forkingData = FORK_FUJI
  ? {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
    }
  : FORK_MAINNET
  ? {
      url: process.env.RPC_ENDPOINT_MAINNET || "",
      blockNumber: 
      40711444,
    }
  : undefined

  const config: HardhatUserConfig = {
    solidity: {
      compilers: [
        {
          version: "0.7.4",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200,
            },
          },
        },
        {
          version: "0.8.20",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200,
            },
          },
        },
      ],
    },
    etherscan: {
      apiKey: {
        avalancheFujiTestnet: "snowtrace", 
      }
    },
    networks: {
      hardhat: {
        forking: forkingData
      },
      fuji: {
        url: process.env.RPC_ENDPOINT_TESTNET || "",
        gasPrice: 225000000000,
        chainId: 43113,
        accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      },
      mainnet:{
        url: process.env.RPC_ENDPOINT_MAINNET || "",
        gasPrice: 225000000000,
        chainId: 43114,
        accounts: 
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      }
    }
  };


export default config;
