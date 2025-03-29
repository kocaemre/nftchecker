import { ethers } from 'ethers';
import { 
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI, 
  ETHEREUM_PROVIDER_URL 
} from '@/app/config/contract';

export interface WalletCheckResult {
  address: string;
  hasNFT: boolean;
  error?: string;
}

/**
 * Check if wallets own any NFTs from the specified collection
 */
export async function checkWallets(
  walletAddresses: string[], 
  contractAddress: string = NFT_CONTRACT_ADDRESS
): Promise<WalletCheckResult[]> {
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, NFT_CONTRACT_ABI, provider);
    
    // Process all wallets concurrently
    const results = await Promise.all(
      walletAddresses.map(async (address) => {
        try {
          // Validate wallet address
          if (!ethers.isAddress(address)) {
            return {
              address,
              hasNFT: false,
              error: 'Invalid Ethereum address'
            };
          }
          
          // Call balanceOf to check if the wallet has any NFTs
          const balance = await contract.balanceOf(address);
          const hasNFT = Number(balance) > 0;
          
          return { address, hasNFT };
        } catch (error) {
          console.error(`Error checking wallet ${address}:`, error);
          return {
            address,
            hasNFT: false,
            error: 'Error checking wallet'
          };
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error during wallet check:', error);
    // Return error for all wallets
    return walletAddresses.map(address => ({
      address,
      hasNFT: false,
      error: 'Service error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }));
  }
} 