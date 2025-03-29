'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

interface WalletFormProps {
  onSubmit: (wallets: string[]) => void;
  isLoading: boolean;
}

export default function WalletForm({ onSubmit, isLoading }: WalletFormProps) {
  const [walletInput, setWalletInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split and clean wallet addresses
    const wallets = walletInput
      .split(/[\n,]/) // Split by newline or comma
      .map(address => address.trim())
      .filter(address => address.length > 0); // Remove empty entries
    
    if (wallets.length > 0) {
      onSubmit(wallets);
    }
  };

  return (
    <Card className="w-full shadow-lg border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <CardTitle className="text-xl">Check Wallet Addresses</CardTitle>
        <CardDescription className="text-gray-600">
          Enter Ethereum wallet addresses to check if they hold NFTs from the collection
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="w-full">
            <div className="flex flex-col space-y-2">
              <label htmlFor="wallets" className="text-sm font-medium">
                Wallet Addresses
              </label>
              <Textarea
                id="wallets"
                placeholder="Enter wallet addresses (one per line or comma-separated)"
                rows={10}
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                disabled={isLoading}
                className="min-h-[200px] text-base font-mono p-4 resize-y"
              />
              <p className="text-sm text-muted-foreground pt-1">
                Enter multiple wallets separated by commas or new lines
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full py-6 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow" 
            disabled={isLoading || !walletInput.trim()}
          >
            {isLoading ? 'Checking...' : 'Check Wallets'}
          </Button>
        </CardFooter>
      </form>
      <Toaster position="top-center" />
    </Card>
  );
} 