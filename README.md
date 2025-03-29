# NFT Wallet Checker

NFT Wallet Checker is a web application that allows you to check if Ethereum wallet addresses hold specific NFTs from a collection. Simply enter wallet addresses and get instant results.

## Features

- Check multiple wallet addresses at once
- See which wallets hold NFTs from a specific collection
- Copy wallet addresses with one click (all, holders, or non-holders)
- Password-protected access
- Modern and responsive UI

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/nft-wallet-checker.git
cd nft-wallet-checker
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure the application
   - Open `app/config/contract.ts`
   - Replace `NFT_CONTRACT_ADDRESS` with your NFT contract address
   - Set up an Ethereum API provider URL (from Alchemy, Infura, etc.)

```typescript
// Example configuration
export const NFT_CONTRACT_ADDRESS = '0xYourNFTContractAddress';
export const ETHEREUM_PROVIDER_URL = 'https://eth-mainnet.g.alchemy.com/v2/your-api-key';
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Login**: Enter the password to access the application
2. **Check Wallets**: Enter Ethereum wallet addresses (one per line or comma-separated)
3. **View Results**: See which wallets hold NFTs from the collection
4. **Copy Addresses**: Use the copy buttons to copy addresses based on NFT ownership

## Deployment

You can deploy this application to Vercel:

```bash
npm run build
# or
vercel
```

## Security

This application uses a simple password protection mechanism with cookies. For production use, consider implementing more robust authentication.

Default password: `respectemre`

To change the password, edit the `LoginScreen.tsx` file.

## License

MIT

## Acknowledgements

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Ethereum interaction with [ethers.js](https://docs.ethers.org/)
