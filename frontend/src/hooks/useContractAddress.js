import { useChainId } from 'wagmi';
import contractAddresses from '../contracts/contract-address.json';

/**
 * Custom hook to get contract address for current network
 * Handles multi-network deployments and fallback scenarios
 * @returns {Object} Contract address and deployment status
 */
export const useContractAddress = () => {
  const chainId = useChainId();

  /**
   * Get POAPPlus contract address for current network
   * Implements fallback logic for development scenarios
   * @returns {string} Contract address
   * @throws {Error} If no contract address found and no fallback available
   */
  const getContractAddress = () => {
    const addresses = contractAddresses.POAPPlus;

    if (!addresses) {
      throw new Error('No contract addresses configuration found');
    }

    // Try current chain ID first
    const currentChainAddress = addresses[chainId.toString()];
    if (currentChainAddress) {
      return currentChainAddress;
    }

    // Fallback to Hardhat localhost (common development chain ID)
    const hardhatAddress = addresses['31337'];
    if (hardhatAddress) {
      console.warn(
        `Using fallback contract address from Hardhat (31337) for chain ${chainId}`,
      );
      return hardhatAddress;
    }

    // Fallback to localhost (1337)
    const localhostAddress = addresses['1337'];
    if (localhostAddress) {
      console.warn(
        `Using fallback contract address from localhost (1337) for chain ${chainId}`,
      );
      return localhostAddress;
    }

    // Last resort: use any available address (for development)
    const availableChains = Object.keys(addresses);
    if (availableChains.length > 0) {
      const fallbackChain = availableChains[0];
      console.warn(
        `Using fallback contract address from chain ${fallbackChain} for chain ${chainId}`,
      );
      return addresses[fallbackChain];
    }

    throw new Error(
      `No contract address found for network ${chainId}. Please deploy the contract first.`,
    );
  };

  /**
   * Check if contract is deployed on current network
   * @returns {boolean} True if contract address is available
   */
  const isContractDeployed = () => {
    try {
      getContractAddress();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Get all available deployed networks
   * @returns {Array} List of chain IDs where contract is deployed
   */
  const getDeployedNetworks = () => {
    const addresses = contractAddresses.POAPPlus;
    return addresses ? Object.keys(addresses) : [];
  };

  return {
    contractAddress: getContractAddress(),
    chainId,
    isContractDeployed: isContractDeployed(),
    deployedNetworks: getDeployedNetworks(),
  };
};
