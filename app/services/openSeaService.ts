import {
  OPENSEA_API_KEY,
  NFT_CONTRACT_ADDRESS
} from '@/app/config/api';

// OpenSea API v2 endpoint
const OPENSEA_API_V2_URL = 'https://api.opensea.io/api/v2';

interface OpenSeaAssetV2 {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name?: string;
  description?: string;
  image_url?: string;
  metadata_url?: string;
  permalink: string;
  decimals: number;
  updated_at: string;
}

interface OpenSeaResponseV2 {
  next: string | null;
  previous: string | null;
  nfts: OpenSeaAssetV2[];
}

export interface NftAsset {
  tokenId: string;
  name?: string;
  imageUrl?: string;
  openseaUrl: string;
}

/**
 * Fetches NFTs owned by a wallet address from OpenSea API
 * @param walletAddress - The wallet address to check
 * @param contractAddress - The NFT contract address to filter by
 * @returns An array of NFT assets owned by the wallet
 */
export async function fetchNFTsFromOpenSea(
  walletAddress: string,
  contractAddress: string = NFT_CONTRACT_ADDRESS
): Promise<NftAsset[]> {
  try {
    // Using OpenSea API v2 endpoint
    const url = `${OPENSEA_API_V2_URL}/chain/ethereum/account/${walletAddress}/nfts?limit=50`;
    
    console.log(`Fetching OpenSea NFTs for wallet ${walletAddress} and contract ${contractAddress}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-KEY': OPENSEA_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenSea API error: ${response.status} ${errorText}`);
      throw new Error(`OpenSea API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as OpenSeaResponseV2;
    console.log(`Found ${data.nfts?.length || 0} total NFTs, filtering by contract`);
    
    // Filter NFTs by contract address (case-insensitive)
    const filteredNfts = (data.nfts || []).filter(nft => 
      nft.contract.toLowerCase() === contractAddress.toLowerCase()
    );
    
    console.log(`After filtering: ${filteredNfts.length} NFTs match contract ${contractAddress}`);
    
    // Map the response to our simplified format
    return filteredNfts.map(nft => ({
      tokenId: nft.identifier,
      name: nft.name,
      imageUrl: nft.image_url,
      openseaUrl: nft.permalink || `https://opensea.io/assets/ethereum/${contractAddress}/${nft.identifier}`
    }));
  } catch (error) {
    console.error('Error fetching NFTs from OpenSea:', error);
    throw error;
  }
}

/**
 * Check if wallet owns NFTs from the specified collection and get token IDs
 */
export async function checkWalletWithOpenSea(
  walletAddress: string,
  contractAddress: string = NFT_CONTRACT_ADDRESS
): Promise<{
  hasNFT: boolean;
  nftCount: number;
  assets: NftAsset[];
}> {
  try {
    const assets = await fetchNFTsFromOpenSea(walletAddress, contractAddress);
    return {
      hasNFT: assets.length > 0,
      nftCount: assets.length,
      assets
    };
  } catch (error) {
    console.error(`Error checking wallet with OpenSea API for ${walletAddress}:`, error);
    throw error;
  }
} 