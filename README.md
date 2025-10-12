# POAP+ - Proof of Attendance Protocol on EVM

This repository contains a decentralized attendance certification system built on Ethereum. Create, distribute, and verify digital attendance badges as NFTs with unique metadata and IPFS storage.

## Features

- Digital Badges: ERC-721 NFTs for event attendance proof
- IPFS Integration: Decentralized image and metadata storage
- Multi-Network Support: Deploy on Ethereum, Sepolia, Polygon, and local networks
- Verification System: Real-time attendance verification on blockchain
- Custom Metadata: Unique badge metadata for each participant
- Modern UI: React-based responsive frontend

## Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/fr) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) or compatible Ethereum wallet
- Testnet ETH (for Sepolia deployment). You can get some on [Alchemy Faucet ](https://www.alchemy.com/faucets/ethereum-sepolia) or [Google Faucet ](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

## Quick start

## 1. Clone and Install

The first things you need to do are cloning this repository and installing its
dependencies:

```sh
git clone https://github.com/Mongetro/poap-plus.git
cd poap-plus
npm install
```

## 2. Backend Configuration

Set up environment variables

Create a .env file in the project root :

```sh
cp .env.example .env
```

PS : ⚠️ NEVER commit real private keys in your .env to version control

Once you have copied the .env file, configure all environment variables according to the instructions included in the file.

## 3. Compile and Deploy Smart Contract

Compile your smart contract :

```sh
npx hardhat compile
```

You can deploy your smart contract on a local network like Hardhat or on Ethereum testnets. In our case, we will use the Sepolia testnet.

```sh
npx hardhat run scripts/deploy.js --network sepolia
```

## 4. Frontend Setup

Navigate to frontend directory

```sh
cd frontend
```

Install frontend dependencies

```sh
npm install
```

Create a .env file in the frontend directory:

```sh
cp .env.example .env
```

PS : ⚠️ NEVER commit real private keys in your .env to version control

Once you have copied the .env file, configure all environment variables according to the instructions included in the file.

## 5. Start Frontend Application

Run development server

```sh
npm run dev
```

The Decentralized Application (dApp) will start and typically be available at [http://localhost:5173/](http://localhost:5173/).

You will need to have a compatible Ethereum wallet, such as [MetaMask](https://metamask.io/) installed and listening to the network you have chosen to deploy your smart contract on ( `sepolia` in our case).

## User Guide

## 1. Connect Wallet

- Open the application in your browser at [http://localhost:5173/](http://localhost:5173/)
- Connect your wallet (MetaMask)
- Ensure you're on the correct network (Localhost, Sepolia, etc.)

## 2. Create an Event

- Navigate to "Create Event"
- Fill in event details (name, date, organizer)
- Upload an event image (stored on IPFS)
- Upload an event image (stored on IPFS)
- Send data and confirm the blockchain transaction via your wallet

## 3. Mint Badges

- Go to "Mint Badge"
- Select the event and enter participant details
- POAP system will generate unique metadata and mint the NFT
- Badges are automatically transferred to participants' wallets

## 4. Verify Attendance badges

- Use "Verify" page to check badge ownership
- Enter any Ethereum address to verify attendance
- View detailed badge information and metadata

## Troubleshooting

**Common Issues**

**_Metamask Connection Issues_**

- Ensure you're on the correct network
- Reset account in MetaMask (Settings > Advanced > Clear activity tab data)

**_Transaction Failures_**

- Check you have sufficient gas funds
- Verify contract is deployed on current network

**_Frontend Build Issues_**

- Clear node_modules and reinstall dependencies
- Check all environment variables are set
- Verify React and dependency versions

**Happy _building_! Enjoy ! 🎉**
