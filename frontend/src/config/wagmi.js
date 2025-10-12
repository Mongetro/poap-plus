import { createConfig, http } from 'wagmi';
import { arbitrum, mainnet, optimism, polygon, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

/**
 * Custom localhost chain configuration for Hardhat/Ganache development
 * @type {import('wagmi/chains').Chain}
 */
export const localhost = {
  id: 1337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Local Explorer',
      url: 'http://localhost:3000',
    },
  },
  testnet: true,
};

/**
 * Get transport configuration for each supported chain
 * @param {import('wagmi/chains').Chain} chain - The chain to configure
 * @returns {import('viem').Transport} Configured HTTP transport
 */
const getTransport = (chain) => {
  const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

  switch (chain.id) {
    case mainnet.id:
      return http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`);
    case sepolia.id:
      return http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`);
    case polygon.id:
      return http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`);
    case optimism.id:
      return http(`https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`);
    case arbitrum.id:
      return http(`https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`);
    case localhost.id:
      return http('http://127.0.0.1:8545'); // Hardhat default RPC URL
    default:
      // Fallback for unsupported networks
      return http();
  }
};

/**
 * Wagmi configuration supporting multiple networks including localhost
 * Defines available chains, connectors, and RPC endpoints
 * @type {import('wagmi').Config}
 */
export const config = createConfig({
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, localhost],
  connectors: [injected()],
  transports: {
    [mainnet.id]: getTransport(mainnet),
    [sepolia.id]: getTransport(sepolia),
    [polygon.id]: getTransport(polygon),
    [optimism.id]: getTransport(optimism),
    [arbitrum.id]: getTransport(arbitrum),
    [localhost.id]: getTransport(localhost),
  },
});

export default config;
