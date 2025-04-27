// NFT Contract configuration

/**
 * NFT Contract address on Ethereum mainnet
 * IMPORTANT: Replace this with your actual NFT contract address
 */
export const NFT_CONTRACT_ADDRESS = '0xd887090Fc6f9af10abE6cF287AC8011a3Cb55a65'; 

// ABI for checking NFT balance
export const NFT_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Ethereum provider URL (using public endpoint for demo)
// For production, use your own API key from Alchemy, Infura, etc.
export const ETHEREUM_PROVIDER_URL = 'https://eth-mainnet.g.alchemy.com/v2/6cF287AC8011a'; 
