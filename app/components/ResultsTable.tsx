'use client';

import { useState } from 'react';
import { WalletCheckResult } from '@/app/services/nftChecker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Copy, ClipboardCopy, CheckCheck, XIcon, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResultsTableProps {
  results: WalletCheckResult[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy');
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
  const totalNFTs = results.reduce((sum, result) => sum + (result.nftCount || 0), 0);

  // Check if we have OpenSea data (assets available)
  const hasOpenSeaData = results.some(r => r.assets && r.assets.length > 0);
  const hasBlockchainResults = results.some(r => r.apiSource === 'blockchain');
  const hasOpenSeaResults = results.some(r => r.apiSource === 'opensea');

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
          <div className="bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Total NFTs: <span className="font-bold">{totalNFTs}</span>
          </div>
        </div>
      </CardHeader>
      {(hasOpenSeaResults && hasBlockchainResults) && (
        <div className="bg-blue-50 py-2 px-4 border-y border-blue-100 flex items-center gap-2 text-sm text-blue-700">
          <Info className="h-4 w-4" />
          Some results are using blockchain data only, without detailed NFT information.
        </div>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[30%] py-4">Wallet Address</TableHead>
                <TableHead className="w-[30%]">Status</TableHead>
                <TableHead className="w-[25%]">NFT IDs</TableHead>
                <TableHead className="text-right w-[15%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <>
                  <TableRow key={index} className={result.error ? 'bg-red-50' : (index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white')}>
                    <TableCell className="font-mono py-4">
                      {result.address.substring(0, 10)}...{result.address.substring(result.address.length - 8)}
                      {result.apiSource && (
                        <Badge variant="outline" className={`ml-2 text-[10px] ${
                          result.apiSource === 'opensea' 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {result.apiSource === 'opensea' ? 'OpenSea' : 'Blockchain'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.error ? (
                        <div className="flex items-center text-red-500 text-sm">
                          <XCircle className="h-4 w-4 mr-2" /> {result.error}
                        </div>
                      ) : result.hasNFT ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-600 border-green-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Has NFT
                          </span>
                          {result.nftCount && result.nftCount > 0 && (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              {result.nftCount} NFT{result.nftCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {result.assets && result.assets.length > 0 && result.apiSource === 'opensea' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => toggleRow(index)}
                            >
                              {expandedRows[index] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-200">
                            <XCircle className="h-3.5 w-3.5" /> No NFT
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.hasNFT ? (
                        <div className="flex flex-wrap gap-1">
                          {result.apiSource === 'blockchain' ? (
                            <span className="text-xs text-gray-500 italic">
                              (Token IDs not available)
                            </span>
                          ) : result.assets && result.assets.length > 0 ? (
                            result.assets.map((asset, i) => (
                              <Button
                                key={asset.tokenId}
                                variant="outline"
                                size="sm"
                                className="h-6 gap-1 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800 px-2 py-0 text-xs rounded flex items-center"
                                onClick={() => copyToClipboard(asset.tokenId)}
                                title="Click to copy"
                              >
                                <span className="font-mono">#{asset.tokenId}</span>
                                <Copy className="h-3 w-3 ml-1" />
                              </Button>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 italic">
                              (No token IDs found)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
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
                  {result.hasNFT && expandedRows[index] && result.assets && result.assets.length > 0 && (
                    <TableRow className="bg-blue-50/50 border-t border-blue-100">
                      <TableCell colSpan={4} className="py-3">
                        <div className="pl-4">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">NFT Details:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-full">
                            {result.assets.map(asset => (
                              <div key={asset.tokenId} className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden flex flex-col">
                                <div className="p-2 bg-blue-50 text-blue-800 flex justify-between items-center border-b border-blue-100">
                                  <div className="font-mono text-xs font-semibold flex items-center">
                                    #{asset.tokenId}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 rounded-full"
                                    onClick={() => copyToClipboard(asset.tokenId)}
                                    title="Copy token ID"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                {asset.imageUrl ? (
                                  <div className="relative h-32 w-full">
                                    <img
                                      src={asset.imageUrl}
                                      alt={asset.name || `NFT #${asset.tokenId}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-32 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    No Image
                                  </div>
                                )}
                                <div className="p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className="font-semibold text-sm text-blue-800 truncate">
                                      {asset.name || `NFT #${asset.tokenId}`}
                                    </div>
                                  </div>
                                  <a 
                                    href={asset.openseaUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
                                  >
                                    <ExternalLink className="h-3 w-3" /> View on OpenSea
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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