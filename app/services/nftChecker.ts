import { ethers } from 'ethers';
import { 
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI, 
  ETHEREUM_PROVIDER_URL 
} from '@/app/config/contract';
import { checkWalletWithOpenSea, NftAsset } from './openSeaService';

export interface WalletCheckResult {
  address: string;
  hasNFT: boolean;
  tokenIds?: string[];
  nftCount?: number;
  assets?: NftAsset[];
  error?: string;
  apiSource?: 'opensea' | 'blockchain';
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function to handle temporary API failures
async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delayMs = 500,
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
 * Check if wallets own any NFTs from the specified collection using blockchain queries
 */
export async function checkWalletsBlockchain(
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
            error: 'Invalid Ethereum address',
            apiSource: 'blockchain'
          });
        } else {
          // Call balanceOf to check if the wallet has any NFTs with retry logic
          const balance = await retryOperation(
            async () => await contract.balanceOf(address),
            2, // Max 2 retries
            300, // 300ms between retries
            `Balance check for ${address}`
          );
          
          const nftCount = Number(balance);
          const hasNFT = nftCount > 0;
          
          results.push({ 
            address, 
            hasNFT,
            nftCount: hasNFT ? nftCount : 0,
            apiSource: 'blockchain'
          });
        }
      } catch (error) {
        console.error(`Error checking wallet ${address}:`, error);
        results.push({
          address,
          hasNFT: false,
          error: error instanceof Error 
            ? `Error checking wallet: ${error.message}` 
            : 'Unknown error checking wallet',
          apiSource: 'blockchain'
        });
      }
      
      // Add delay between API calls
      await delay(300);
    }
    
    return results;
  } catch (error) {
    console.error('Error during wallet check:', error);
    // Return error for all wallets
    return walletAddresses.map(address => ({
      address,
      hasNFT: false,
      error: 'Service error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      apiSource: 'blockchain'
    }));
  }
}

/**
 * Check if wallets own any NFTs from the specified collection using OpenSea API
 * This method provides token IDs and additional metadata
 */
export async function checkWalletsOpenSea(
  walletAddresses: string[],
  contractAddress: string = NFT_CONTRACT_ADDRESS
): Promise<WalletCheckResult[]> {
  const results: WalletCheckResult[] = [];
  let useFallback = false;
  
  for (const address of walletAddresses) {
    try {
      // Validate wallet address
      if (!ethers.isAddress(address)) {
        results.push({
          address,
          hasNFT: false,
          error: 'Invalid Ethereum address',
          apiSource: 'opensea'
        });
        continue;
      }
      
      // If previous API calls failed, use blockchain directly
      if (useFallback) {
        await checkWalletWithBlockchain(address, contractAddress, results);
        continue;
      }
      
      // Check with OpenSea API
      try {
        const openSeaResult = await checkWalletWithOpenSea(address, contractAddress);
        
        results.push({
          address,
          hasNFT: openSeaResult.hasNFT,
          nftCount: openSeaResult.nftCount,
          tokenIds: openSeaResult.assets.map(asset => asset.tokenId),
          assets: openSeaResult.assets,
          apiSource: 'opensea'
        });
      } catch (openSeaError) {
        console.error(`OpenSea API error for wallet ${address}:`, openSeaError);
        console.log('Setting useFallback to true for remaining wallets');
        useFallback = true; // Use blockchain for remaining wallets
        
        // Check this wallet with blockchain
        await checkWalletWithBlockchain(address, contractAddress, results);
      }
    } catch (error) {
      console.error(`Error processing wallet ${address}:`, error);
      results.push({
        address,
        hasNFT: false,
        error: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Unknown error processing wallet',
        apiSource: 'blockchain'
      });
    }
    
    // Add delay between API calls to avoid rate limits
    await delay(500);
  }
  
  return results;
}

/**
 * Helper function to check a wallet with blockchain and add the result
 */
async function checkWalletWithBlockchain(
  address: string,
  contractAddress: string,
  results: WalletCheckResult[]
): Promise<void> {
  try {
    // Create provider and contract instance
    const provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
    const contract = new ethers.Contract(contractAddress, NFT_CONTRACT_ABI, provider);
    
    // Check balance directly
    const balance = await contract.balanceOf(address);
    const nftCount = Number(balance);
    const hasNFT = nftCount > 0;
    
    results.push({ 
      address, 
      hasNFT,
      nftCount: hasNFT ? nftCount : 0,
      error: hasNFT ? 'OpenSea API unavailable, token IDs not available' : undefined,
      apiSource: 'blockchain'
    });
  } catch (blockchainError) {
    // Both API and blockchain failed
    results.push({
      address,
      hasNFT: false,
      error: `Blockchain error: ${blockchainError instanceof Error ? blockchainError.message : 'Unknown error'}`,
      apiSource: 'blockchain'
    });
  }
}

/**
 * Check if wallets own any NFTs using the most reliable method available
 * This will attempt to use OpenSea API first and fall back to blockchain queries if needed
 */
export async function checkWallets(
  walletAddresses: string[],
  contractAddress: string = NFT_CONTRACT_ADDRESS,
  useOpenSea: boolean = true
): Promise<WalletCheckResult[]> {
  if (useOpenSea) {
    try {
      return await checkWalletsOpenSea(walletAddresses, contractAddress);
    } catch (error) {
      console.error('Error with OpenSea API, falling back to blockchain query:', error);
      // Fall back to blockchain query
      return await checkWalletsBlockchain(walletAddresses, contractAddress);
    }
  } else {
    return await checkWalletsBlockchain(walletAddresses, contractAddress);
  }
} 