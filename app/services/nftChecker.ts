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

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function to handle temporary API failures
async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delayMs = 1000,
  operationName = "operation"
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Wait before retrying
    await delay(delayMs);
    return retryOperation(operation, retries - 1, delayMs);
  }
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
    
    // Process wallets sequentially with delay to avoid rate limiting
    const results: WalletCheckResult[] = [];
    
    for (const address of walletAddresses) {
      try {
        // Validate wallet address
        if (!ethers.isAddress(address)) {
          results.push({
            address,
            hasNFT: false,
            error: 'Invalid Ethereum address'
          });
        } else {
          // Call balanceOf to check if the wallet has any NFTs with retry logic
          const balance = await retryOperation(
            async () => await contract.balanceOf(address),
            2, // Max 2 retries
            500, // 1.5 seconds between retries
            `Balance check for ${address}`
          );
          
          const hasNFT = Number(balance) > 0;
          results.push({ address, hasNFT });
        }
      } catch (error) {
        console.error(`Error checking wallet ${address}:`, error);
        results.push({
          address,
          hasNFT: false,
          error: error instanceof Error 
            ? `Error checking wallet: ${error.message}` 
            : 'Unknown error checking wallet'
        });
      }
      
      // Add delay between API calls (1000ms)
      await delay(1000);
    }
    
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