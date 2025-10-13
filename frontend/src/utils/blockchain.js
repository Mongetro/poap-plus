/**
 * Blockchain utility functions for multi-network support
 * Provides helper functions for explorer URLs, network detection, and chain information
 * @module utils/blockchain
 */

/**
 * Get explorer URL for transaction, address, or token
 * @param {string} hash - Transaction hash, contract address, or token ID
 * @param {string} type - Type: 'tx' for transaction, 'address' for contract, 'token' for NFT
 * @param {Object} chain - Current chain object from Wagmi
 * @returns {string} Formatted explorer URL or '#' for localhost/unsupported chains
 */
export const getExplorerUrl = (hash, type = 'tx', chain) => {
  // Handle localhost and chains without block explorers
  if (
    !chain?.blockExplorers?.default?.url ||
    chain.id === 1337 ||
    chain.id === 31337
  ) {
    return '#'; // Return placeholder for local development
  }

  // Construct URL based on type
  switch (type) {
    case 'tx':
      return `${chain.blockExplorers.default.url}/tx/${hash}`;
    case 'address':
      return `${chain.blockExplorers.default.url}/address/${hash}`;
    case 'token':
      return `${chain.blockExplorers.default.url}/token/${hash}`;
    default:
      return `${chain.blockExplorers.default.url}/${type}/${hash}`;
  }
};

/**
 * Check if current chain is localhost (Hardhat/Ganache)
 * @param {Object} chain - Current chain object from Wagmi
 * @returns {boolean} True if chain is localhost
 */
export const isLocalhost = (chain) => {
  return chain?.id === 1337 || chain?.id === 31337;
};

/**
 * Check if current chain is a testnet
 * @param {Object} chain - Current chain object from Wagmi
 * @returns {boolean} True if chain is testnet or localhost
 */
export const isTestnet = (chain) => {
  return chain?.testnet || isLocalhost(chain);
};

/**
 * Get formatted network name for display
 * @param {Object} chain - Current chain object from Wagmi
 * @returns {string} Human-readable network name
 */
export const getNetworkName = (chain) => {
  if (isLocalhost(chain)) return 'Localhost';
  return chain?.name || 'Unknown Network';
};

/**
 * Get explorer name for current chain
 * @param {Object} chain - Current chain object from Wagmi
 * @returns {string} Explorer name or 'Explorer' as fallback
 */
export const getExplorerName = (chain) => {
  if (isLocalhost(chain)) return 'No Explorer';
  return chain?.blockExplorers?.default?.name || 'Explorer';
};

/**
 * Format Ethereum address for display (truncate middle)
 * @param {string} address - Full Ethereum address
 * @param {number} startChars - Number of starting characters to show
 * @param {number} endChars - Number of ending characters to show
 * @returns {string} Truncated address (e.g., "0x1234...abcd")
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || address.length !== 42) return 'Invalid Address';
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format transaction hash for display (truncate middle)
 * @param {string} transactionHash - Full transaction hash
 * @param {number} startChars - Number of starting characters to show
 * @param {number} endChars - Number of ending characters to show
 * @returns {string} Truncated transaction hash
 */
export const formatTransactionHash = (
  transactionHash,
  startChars = 10,
  endChars = 8,
) => {
  if (!transactionHash || transactionHash.length !== 66) return 'Processing...';
  return `${transactionHash.slice(0, startChars)}...${transactionHash.slice(
    -endChars,
  )}`;
};
