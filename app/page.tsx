'use client';

import { useState, useEffect } from 'react';
import WalletForm from './components/WalletForm';
import ResultsTable from './components/ResultsTable';
import LoginScreen from './components/LoginScreen';
import { checkWallets, WalletCheckResult } from './services/nftChecker';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Wallet, LogOut, RefreshCw, BarChart2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { NFT_CONTRACT_ADDRESS } from './config/contract';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Home() {
  const [results, setResults] = useState<WalletCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [connectionAttempts, setConnectionAttempts] = useState(0);

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
    setConnectionAttempts(0);
    setProgress({ current: 0, total: walletAddresses.length });
    
    try {
      // Create a tracked version of the results that updates as we go
      const partialResults: WalletCheckResult[] = [];
      setResults(partialResults);

      // Process each wallet with a delay between calls
      for (let i = 0; i < walletAddresses.length; i++) {
        try {
          const address = walletAddresses[i];
          
          // Update progress indicator
          setProgress({ current: i, total: walletAddresses.length });
          
          // Individual wallet check
          try {
            setConnectionAttempts(prev => prev + 1);
            const checkResult = await checkWallets([address], NFT_CONTRACT_ADDRESS);
            
            // Add to results
            partialResults.push(checkResult[0]);
            setResults([...partialResults]);
          } catch (walletErr) {
            console.error(`Error checking wallet ${address}:`, walletErr);
            
            // Add error result
            partialResults.push({
              address,
              hasNFT: false,
              error: walletErr instanceof Error 
                ? walletErr.message 
                : 'Unknown error checking wallet'
            });
            setResults([...partialResults]);
          }
        } catch (err) {
          console.error(`Error in wallet check loop:`, err);
        }
      }
      
      // Final progress update
      setProgress({ current: walletAddresses.length, total: walletAddresses.length });
    } catch (err) {
      console.error('Error checking wallets:', err);
      setError(err instanceof Error 
        ? `Failed to check wallets: ${err.message}` 
        : 'Failed to check wallets. Please try again.');
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

  // Calculate progress percentage
  const progressPercentage = progress.total === 0 
    ? 0 
    : Math.round((progress.current / progress.total) * 100);
  
  // Show main application if authenticated
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">NFT Checker</h1>
          <div className="flex gap-4">
            <Link href="/statistics">
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Statistics
              </Button>
            </Link>
            {isAuthenticated && (
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
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
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1 mt-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Reload and Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {isLoading && (
              <div className="w-full flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border-2 border-gray-100">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
                <p className="mt-6 text-base text-gray-600">
                  Checking wallets... ({progress.current} of {progress.total})
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2.5 mt-4">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{progressPercentage}%</p>
                <p className="text-xs text-gray-500 mt-4">
                  Processing requests with minimal delay to optimize speed
                </p>
                {connectionAttempts > 2 && (
                  <p className="mt-3 text-sm text-amber-600">
                    <RefreshCw className="h-3.5 w-3.5 inline-block mr-1 animate-spin" /> 
                    Connecting to blockchain... (This may take longer than usual)
                  </p>
                )}
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
      </div>
    </div>
  );
}
