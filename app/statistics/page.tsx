"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, Fish, Clock, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface CollectionStats {
  totalSupply: number;
  numOwners: number;
  floorPrice: number;
  totalVolume: number;
  averagePrice: number;
  numSales: number;
  bestOffer: number;
}

interface HolderAnalysis {
  totalHolders: number;
  activeHolders: number;
  newHolders: number;
  holderDistribution: {
    range: string;
    count: number;
  }[];
}

interface TimeBasedData {
  date: string;
  price: number;
  volume: number;
  holders: number;
}

interface ComparisonData {
  collection: string;
  floorPrice: number;
  totalVolume: number;
  holders: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const REFRESH_INTERVAL = 10000; // 10 seconds

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [previousStats, setPreviousStats] = useState<CollectionStats | null>(null);
  const [highlightedCards, setHighlightedCards] = useState<string[]>([]);
  const [holderAnalysis, setHolderAnalysis] = useState<HolderAnalysis | null>(null);
  const [timeData, setTimeData] = useState<TimeBasedData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("seven_day");
  const [selectedCollection, setSelectedCollection] = useState("quills-adventure");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [lastDataHash, setLastDataHash] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated via cookie
    const authToken = Cookies.get('auth_token');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    } else {
      router.push('/');
    }
    setIsCheckingAuth(false);
  }, [router]);

  const calculateDataHash = (data: any) => {
    return JSON.stringify({
      volume: data?.total?.volume,
      sales: data?.total?.sales,
      numOwners: data?.total?.num_owners,
      floorPrice: data?.total?.floor_price,
      averagePrice: data?.total?.average_price,
      intervals: data?.intervals
    });
  };

  const fetchAllData = async () => {
    try {
      const apiKey = "a073f12180134273854325e95517f7ed";
      
      // Fetch collection details for total supply
      const collectionResponse = await fetch(
        `https://api.opensea.io/api/v2/collections/${selectedCollection}`,
        {
          headers: { "X-API-KEY": apiKey },
        }
      );
      const collectionData = await collectionResponse.json();
      
      // Fetch collection stats with time interval
      const statsResponse = await fetch(
        `https://api.opensea.io/api/v2/collections/${selectedCollection}/stats`,
        {
          headers: { "X-API-KEY": apiKey },
        }
      );
      const statsData = await statsResponse.json();

      // Fetch best offer for the first NFT in the collection
      const bestOfferResponse = await fetch(
        `https://api.opensea.io/api/v2/offers/collection/${selectedCollection}/nfts/1/best`,
        {
          headers: { 
            "X-API-KEY": apiKey,
            "Accept": "application/json"
          },
        }
      );
      
      if (!bestOfferResponse.ok) {
        console.error('Best offer API error:', bestOfferResponse.status);
        throw new Error('Failed to fetch best offer');
      }
      
      const bestOfferData = await bestOfferResponse.json();
      console.log('Best offer data:', bestOfferData); // Debug için
      
      // Calculate new data hash
      const newDataHash = calculateDataHash(statsData);
      
      // Only update if data has changed
      if (newDataHash !== lastDataHash) {
        setIsUpdating(true);
        setStatsData(statsData);
        
        // Transform the stats data with null checks
        const transformedStats: CollectionStats = {
          totalSupply: collectionData?.total_supply || 0,
          numOwners: statsData?.total?.num_owners || 0,
          floorPrice: statsData?.total?.floor_price || 0,
          totalVolume: statsData?.total?.volume || 0,
          averagePrice: statsData?.total?.average_price || 0,
          numSales: statsData?.total?.sales || 0,
          bestOffer: bestOfferData?.price?.value ? Number(bestOfferData.price.value) / 1e18 : 0
        };

        // Check which values have changed
        const changedFields = [];
        if (stats) {
          if (transformedStats.totalSupply !== stats.totalSupply) changedFields.push("Supply & Holders");
          if (transformedStats.totalVolume !== stats.totalVolume) changedFields.push("Total Volume");
          if (transformedStats.numSales !== stats.numSales) changedFields.push("Total Sales");
          if (transformedStats.averagePrice !== stats.averagePrice) changedFields.push("Average Price");
          if (transformedStats.floorPrice !== stats.floorPrice) changedFields.push("Floor Price");
          if (transformedStats.bestOffer !== stats.bestOffer) changedFields.push("Best Offer");
        }

        // Set highlighted cards
        setHighlightedCards(changedFields);
        
        // Reset highlighted cards after 1 second
        setTimeout(() => {
          setHighlightedCards([]);
        }, 1000);

        setPreviousStats(stats);
        setStats(transformedStats);

        // Transform time data with proper date formatting
        const transformedTimeData = (statsData?.intervals || []).map((interval: any) => {
          // Parse the interval string to get the date
          let date = new Date();
          if (interval.interval === "one_day") {
            date.setDate(date.getDate() - 1);
          } else if (interval.interval === "seven_day") {
            date.setDate(date.getDate() - 7);
          } else if (interval.interval === "thirty_day") {
            date.setDate(date.getDate() - 30);
          }

          return {
            date: date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            price: interval.average_price || 0,
            volume: interval.volume || 0,
            holders: interval.num_owners || statsData?.total?.num_owners || 0
          };
        });

        setTimeData(transformedTimeData);

        // Transform holder data with better metrics
        const transformedHolderData: HolderAnalysis = {
          totalHolders: statsData?.total?.num_owners || 0,
          activeHolders: statsData?.intervals?.[0]?.num_owners || 0,
          newHolders: statsData?.intervals?.[0]?.num_owners_diff || 0,
          holderDistribution: [
            { range: "1-5 NFTs", count: Math.floor((statsData?.total?.num_owners || 0) * 0.6) },
            { range: "6-10 NFTs", count: Math.floor((statsData?.total?.num_owners || 0) * 0.25) },
            { range: "11-20 NFTs", count: Math.floor((statsData?.total?.num_owners || 0) * 0.1) },
            { range: "20+ NFTs", count: Math.floor((statsData?.total?.num_owners || 0) * 0.05) }
          ]
        };
        setHolderAnalysis(transformedHolderData);

        setLastDataHash(newDataHash);
        
        // Reset updating state after a short delay
        setTimeout(() => {
          setIsUpdating(false);
        }, 1000);
      }
    } catch (err) {
      setError("Failed to fetch statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [selectedCollection, timeRange, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchAllData();
      }, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const overviewCards = [
    { 
      title: "Supply & Holders", 
      value: `${stats?.numOwners.toLocaleString()} / ${stats?.totalSupply.toLocaleString()}`, 
      icon: <Users className="h-4 w-4" />, 
      color: "#0088FE",
      description: `Total holders with ${((stats?.numOwners || 0) / (stats?.totalSupply || 1) * 100).toFixed(1)}% of supply`
    },
    { 
      title: "Total Volume", 
      value: stats?.totalVolume ? `Ξ${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}` : "N/A", 
      icon: <Activity className="h-4 w-4" />, 
      color: "#82ca9d",
      description: "Total trading volume in ETH"
    },
    { 
      title: "Total Sales", 
      value: stats?.numSales.toLocaleString(), 
      icon: <Activity className="h-4 w-4" />, 
      color: "#82ca9d",
      description: "Total number of NFT sales in the last 30 days"
    },
    { 
      title: "Average Price", 
      value: stats?.averagePrice ? `Ξ${stats.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "N/A", 
      icon: <TrendingUp className="h-4 w-4" />, 
      color: "#8884d8",
      description: "Average sale price of NFTs in the last 30 days"
    },
    { 
      title: "Floor Price", 
      value: stats?.floorPrice ? `Ξ${stats.floorPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "N/A", 
      icon: <TrendingUp className="h-4 w-4" />, 
      color: "#FFBB28",
      description: "Lowest listed price for an NFT in the collection"
    },
    { 
      title: "Best Offer", 
      value: stats?.bestOffer ? `Ξ${stats.bestOffer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : "N/A", 
      icon: <TrendingUp className="h-4 w-4" />, 
      color: "#FF8042",
      description: "Highest offer price for an NFT in the collection"
    }
  ];

  // Add time-based metrics
  const timeBasedMetrics = statsData?.intervals ? {
    lastPeriodVolume: statsData.intervals.find((interval: any) => interval.interval === timeRange)?.volume || 0,
    lastPeriodSales: statsData.intervals.find((interval: any) => interval.interval === timeRange)?.sales || 0,
    previousPeriodVolume: statsData.intervals.find((interval: any) => interval.interval === timeRange)?.volume_diff || 0,
    previousPeriodSales: statsData.intervals.find((interval: any) => interval.interval === timeRange)?.sales_diff || 0
  } : null;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Collection Statistics
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={fetchAllData}
            className="flex items-center gap-2"
            disabled={isUpdating}
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_day">Last 24 Hours</SelectItem>
              <SelectItem value="seven_day">Last 7 Days</SelectItem>
              <SelectItem value="thirty_day">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {overviewCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`overflow-hidden border-t-4 hover:shadow-lg transition-all duration-300 ${
                      highlightedCards.includes(card.title) ? 'bg-green-50 dark:bg-green-900/20' : ''
                    }`} 
                    style={{ borderColor: card.color }}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {card.title}
                      </CardTitle>
                      <div className="p-2 rounded-full" style={{ backgroundColor: `${card.color}20` }}>
                        {card.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <motion.div
                        key={card.value}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl font-bold"
                      >
                        {card.value}
                      </motion.div>
                      <p className="text-sm text-gray-500 mt-2">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {timeBasedMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Period Volume</CardTitle>
                  <p className="text-sm text-gray-500">
                    Volume for the selected time period
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      Ξ{timeBasedMetrics.lastPeriodVolume.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {calculateChange(timeBasedMetrics.lastPeriodVolume, timeBasedMetrics.previousPeriodVolume) > 0 ? (
                        <span className="text-green-500">↑ {calculateChange(timeBasedMetrics.lastPeriodVolume, timeBasedMetrics.previousPeriodVolume).toFixed(1)}% from previous period</span>
                      ) : (
                        <span className="text-red-500">↓ {Math.abs(calculateChange(timeBasedMetrics.lastPeriodVolume, timeBasedMetrics.previousPeriodVolume)).toFixed(1)}% from previous period</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Period Sales</CardTitle>
                  <p className="text-sm text-gray-500">
                    Number of sales for the selected time period
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {timeBasedMetrics.lastPeriodSales.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {calculateChange(timeBasedMetrics.lastPeriodSales, timeBasedMetrics.previousPeriodSales) > 0 ? (
                        <span className="text-green-500">↑ {calculateChange(timeBasedMetrics.lastPeriodSales, timeBasedMetrics.previousPeriodSales).toFixed(1)}% from previous period</span>
                      ) : (
                        <span className="text-red-500">↓ {Math.abs(calculateChange(timeBasedMetrics.lastPeriodSales, timeBasedMetrics.previousPeriodSales)).toFixed(1)}% from previous period</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Holder Distribution</CardTitle>
                <p className="text-sm text-gray-500">
                  Distribution of NFTs across different holder sizes
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={holderAnalysis?.holderDistribution}
                        dataKey="count"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        label
                      >
                        {holderAnalysis?.holderDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Activity</CardTitle>
                <p className="text-sm text-gray-500">
                  Recent market activity and transaction metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">24h Transactions</h3>
                      <span className="text-xl font-bold">{statsData?.intervals?.[0]?.sales?.toLocaleString() || 0}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Number of transactions in the last 24 hours
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Avg. Transaction</h3>
                      <span className="text-xl font-bold">
                        {statsData?.intervals?.[0]?.average_price ? 
                          `Ξ${statsData.intervals[0].average_price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}` : 
                          "N/A"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Average transaction value in the last 24 hours
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Volume Change (24h)</h3>
                      <span className={`text-xl font-bold ${
                        statsData?.intervals?.[0]?.volume_diff > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {statsData?.intervals?.[0]?.volume_diff > 0 ? '+' : ''}
                        {statsData?.intervals?.[0]?.volume_diff ? 
                          `${statsData.intervals[0].volume_diff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : 
                          "N/A"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Volume change percentage in the last 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Price & Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.1} />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="price"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                      name="Price (ETH)"
                      fill="url(#colorPrice)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="volume"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={false}
                      name="Volume (ETH)"
                      fill="url(#colorVolume)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isUpdating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Updating data...
          </div>
        </motion.div>
      )}
    </div>
  );
} 