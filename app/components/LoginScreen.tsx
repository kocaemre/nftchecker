'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import Cookies from 'js-cookie';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'respectemre') {
      // Set cookie with 7 days expiry
      Cookies.set('auth_token', 'authenticated', { expires: 7 });
      toast.success('Login successful');
      onLogin();
    } else {
      setError(true);
      toast.error('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl text-center">
          <CardTitle className="text-2xl font-bold">NFT Wallet Checker</CardTitle>
          <CardDescription className="text-gray-600">
            Please enter the password to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-2 bg-blue-50/50 p-3 rounded-lg">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-700">
                This tool is password protected. Enter the correct password to access.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password"
                className={`${error ? 'border-red-500 ring-red-500/20' : ''}`}
              />
              {error && (
                <p className="text-red-500 text-sm">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full py-5 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow"
            >
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 