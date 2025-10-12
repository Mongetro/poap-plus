// Import Hardhat Toolbox plugin which provides all essential Hardhat plugins
require('@nomicfoundation/hardhat-toolbox');
// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  // Solidity compiler version
  solidity: '0.8.20',

  // Network configurations for deployment and interaction
  networks: {
    // Local development network using Hardhat's built-in node
    localhost: {
      url: 'http://127.0.0.1:8545', // Local Hardhat network URL
      chainId: 31337, // Default chain ID for Hardhat network
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk', // Default test mnemonic for local development
      },
    },
    // Hardhat networking with explicit configuration
    hardhat: {
      chainId: 31337,
    },
    // Sepolia testnet configuration
    sepolia: {
      // Alchemy RPC endpoint for Sepolia with API key from environment variables
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      // Private key for deploying contracts (from environment variables)
      accounts: [process.env.TESTNET_PRIVATE_KEY],
      chainId: 11155111, // Chain ID for Sepolia testnet
    },
    // Ethereum mainnet configuration
    mainnet: {
      // Alchemy RPC endpoint for mainnet with API key from environment variables
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      // Private key for deploying contracts (from environment variables)
      accounts: [process.env.TESTNET_PRIVATE_KEY],
      chainId: 1, // Chain ID for Ethereum mainnet
    },
  },

  // Etherscan configuration for contract verification
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY, // API key for Sepolia verification
      mainnet: process.env.ETHERSCAN_API_KEY, // API key for mainnet verification
    },
  },
};
