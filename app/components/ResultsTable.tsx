'use client';

import { useState } from 'react';
import { WalletCheckResult } from '@/app/services/nftChecker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Copy, ClipboardCopy, CheckCheck, XIcon } from 'lucide-react';

interface ResultsTableProps {
  results: WalletCheckResult[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy address');
    }
  };
  
  const bulkCopy = async (filter: 'all' | 'holders' | 'non-holders') => {
    try {
      let addressesToCopy: string[] = [];
      
      switch (filter) {
        case 'all':
          addressesToCopy = results
            .filter(r => !r.error)
            .map(r => r.address);
          break;
        case 'holders':
          addressesToCopy = results
            .filter(r => r.hasNFT && !r.error)
            .map(r => r.address);
          break;
        case 'non-holders':
          addressesToCopy = results
            .filter(r => !r.hasNFT && !r.error)
            .map(r => r.address);
          break;
      }
      
      if (addressesToCopy.length === 0) {
        toast.info('No addresses to copy');
        return;
      }
      
      await navigator.clipboard.writeText(addressesToCopy.join('\n'));
      toast.success(`Copied ${addressesToCopy.length} addresses to clipboard`);
    } catch (err) {
      console.error('Failed to copy addresses:', err);
      toast.error('Failed to copy addresses');
    }
  };

  if (results.length === 0) {
    return null;
  }

  const nftHolders = results.filter(r => r.hasNFT).length;
  const nonHolders = results.filter(r => !r.hasNFT && !r.error).length;
  const errorsCount = results.filter(r => r.error).length;

  return (
    <Card className="w-full mt-6 shadow-lg border-2 border-gray-100 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Results</CardTitle>
        <div className="flex space-x-6 text-sm">
          <div className="bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Total wallets: <span className="font-bold">{results.length}</span>
          </div>
          <div className="bg-white/80 px-3 py-1 rounded-full shadow-sm">
            NFT holders: <span className="font-bold">{nftHolders}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[40%] py-4">Wallet Address</TableHead>
                <TableHead className="w-[40%]">Status</TableHead>
                <TableHead className="text-right w-[20%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index} className={result.error ? 'bg-red-50' : (index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white')}>
                  <TableCell className="font-mono py-4">
                    {result.address.substring(0, 10)}...{result.address.substring(result.address.length - 8)}
                  </TableCell>
                  <TableCell>
                    {result.error ? (
                      <div className="flex items-center text-red-500 text-sm">
                        <XCircle className="h-4 w-4 mr-2" /> {result.error}
                      </div>
                    ) : result.hasNFT ? (
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-600 border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Has NFT
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-200">
                          <XCircle className="h-3.5 w-3.5" /> No NFT
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.address)}
                      className="gap-1 hover:bg-gray-100"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 justify-between bg-gray-50 py-4 border-t">
        <div className="text-sm text-gray-500">
          {nftHolders} holders, {nonHolders} non-holders, {errorsCount} errors
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkCopy('holders')}
            className="gap-1"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Copy Holders
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkCopy('non-holders')}
            className="gap-1"
          >
            <XIcon className="h-3.5 w-3.5" /> Copy Non-Holders
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkCopy('all')}
            className="gap-1"
          >
            <ClipboardCopy className="h-3.5 w-3.5" /> Copy All
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 