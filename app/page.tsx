'use client';

import { useState, useEffect } from 'react';
import WalletForm from './components/WalletForm';
import ResultsTable from './components/ResultsTable';
import LoginScreen from './components/LoginScreen';
import { checkWallets, WalletCheckResult } from './services/nftChecker';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Wallet, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { NFT_CONTRACT_ADDRESS } from './config/contract';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export default function Home() {
  const [results, setResults] = useState<WalletCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated via cookie
    const authToken = Cookies.get('auth_token');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    Cookies.remove('auth_token');
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  const handleWalletCheck = async (walletAddresses: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const checkResults = await checkWallets(walletAddresses, NFT_CONTRACT_ADDRESS);
      setResults(checkResults);
    } catch (err) {
      console.error('Error checking wallets:', err);
      setError('Failed to check wallets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show main application if authenticated
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="text-center space-y-3 py-6">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="flex items-center justify-center gap-2">
                <Wallet className="h-8 w-8" /> NFT Wallet Checker
              </span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Check if wallet addresses hold NFTs from the collection
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid gap-8">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800 font-medium">NFT Collection Contract</AlertTitle>
            <AlertDescription className="font-mono text-sm break-all text-blue-700 mt-1">
              {NFT_CONTRACT_ADDRESS}
            </AlertDescription>
          </Alert>

          <WalletForm onSubmit={handleWalletCheck} isLoading={isLoading} />
          
          {error && (
            <Alert variant="destructive" className="border-2 border-red-200 shadow-sm">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error Occurred</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading && (
            <div className="w-full flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border-2 border-gray-100">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
              <p className="mt-6 text-base text-gray-600">Checking wallets...</p>
            </div>
          )}
          
          {!isLoading && results.length > 0 && (
            <ResultsTable results={results} />
          )}
        </div>
      </div>
      <footer className="mt-20 pb-8 text-center text-gray-500 text-sm">
        <p>NFT Wallet Checker &copy; {new Date().getFullYear()}</p>
      </footer>
      <Toaster position="top-right" />
    </main>
  );
}
