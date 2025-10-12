const path = require('path');
const fs = require('fs');

/**
 * Main deployment function for POAPPlus contract
 * Enhanced with exact file path logging
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  // Enhanced network name mapping
  const getNetworkName = (chainId, hardhatName) => {
    const networkMap = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      1337: 'Localhost',
      31337: 'Hardhat Network',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
    };
    return networkMap[chainId] || hardhatName || 'Unknown Network';
  };

  const networkName = getNetworkName(network.chainId, network.name);

  console.log('🌐 Network Information:');
  console.log(`   Name: ${networkName}`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log('👤 Deployer Information:');
  console.log(`   Address: ${deployer.address}`);
  console.log(
    `   Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`,
  );

  // Deploy POAPPlus contract
  console.log('📦 Deploying POAPPlus contract...');
  const POAPPlus = await ethers.getContractFactory('POAPPlus');
  const poap = await POAPPlus.deploy();
  await poap.deployed();

  console.log('✅ Deployment Successful:');
  console.log(`   Contract Address: ${poap.address}`);
  console.log(`   Transaction Hash: ${poap.deployTransaction.hash}`);

  // Save contract artifacts with detailed path information
  saveFrontendFiles(poap, network.chainId, networkName);
}

/**
 * Save contract artifacts with detailed file path logging
 * @param {Contract} poap - Deployed contract instance
 * @param {number} chainId - Network chain ID
 * @param {string} networkName - Human-readable network name
 */
function saveFrontendFiles(poap, chainId, networkName) {
  const contractsDir = path.join(
    __dirname,
    '..',
    'frontend',
    'src',
    'contracts',
  );
  const addressFilePath = path.join(contractsDir, 'contract-address.json');
  const abiFilePath = path.join(contractsDir, 'POAPPlus.json');

  // Create contracts directory if it doesn't exist
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
    console.log('📁 Created contracts directory:', contractsDir);
  }

  // Read existing contract addresses or initialize new structure
  let contractAddresses = {};

  if (fs.existsSync(addressFilePath)) {
    contractAddresses = JSON.parse(fs.readFileSync(addressFilePath, 'utf8'));
    console.log('📖 Loaded existing contract addresses from:', addressFilePath);
  } else {
    console.log('📝 Creating new contract addresses file at:', addressFilePath);
  }

  // Initialize POAPPlus addresses object if it doesn't exist
  contractAddresses.POAPPlus = contractAddresses.POAPPlus || {};

  // Store previous address for comparison
  const previousAddress = contractAddresses.POAPPlus[chainId.toString()];

  // Update addresses with current deployment
  contractAddresses.POAPPlus[chainId.toString()] = poap.address;

  // Save updated addresses to JSON file
  fs.writeFileSync(addressFilePath, JSON.stringify(contractAddresses, null, 2));

  // Save contract ABI
  const POAPPlusArtifact = artifacts.readArtifactSync('POAPPlus');
  fs.writeFileSync(abiFilePath, JSON.stringify(POAPPlusArtifact, null, 2));

  // Detailed success message with exact file paths
  console.log('💾 Frontend Configuration Updated Successfully:');
  console.log('   📄 Contract ABI saved to:');
  console.log(`      ${abiFilePath}`);
  console.log('   📍 Contract Addresses saved to:');
  console.log(`      ${addressFilePath}`);
  console.log('   🔗 Network Configuration:');
  console.log(`      Network: ${networkName} (Chain ID: ${chainId})`);
  console.log(`      Contract: ${poap.address}`);

  // Show update information if address changed
  if (previousAddress && previousAddress !== poap.address) {
    console.log('   🔄 Address Updated:');
    console.log(`      Previous: ${previousAddress}`);
    console.log(`      New:      ${poap.address}`);
  } else if (!previousAddress) {
    console.log('   🆕 New deployment for this network');
  }

  // Show all deployed networks
  const deployedNetworks = Object.keys(contractAddresses.POAPPlus || {});
  if (deployedNetworks.length > 0) {
    console.log('   🌐 All Deployed Networks:');
    deployedNetworks.forEach((networkId) => {
      const netName = getNetworkName(parseInt(networkId));
      console.log(
        `      - ${netName} (${networkId}): ${contractAddresses.POAPPlus[networkId]}`,
      );
    });
  }

  console.log('🚀 Next Steps:');
  console.log('   1. Start frontend: cd frontend && npm run dev');
  console.log('   2. Connect wallet to the correct network');
  console.log('   3. Create your first event and mint badges!');
}

// Helper function for network name mapping (duplicated for use in saveFrontendFiles)
function getNetworkName(chainId) {
  const networkMap = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    1337: 'Localhost',
    31337: 'Hardhat Network',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
  };
  return networkMap[chainId] || `Chain ${chainId}`;
}

// Execute deployment and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Deployment failed:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  });
