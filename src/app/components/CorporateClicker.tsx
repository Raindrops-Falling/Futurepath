import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Briefcase, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Building {
  name: string;
  baseCost: number;
  baseProduction: number;
  owned: number;
}

export function CorporateClicker() {
  const [money, setMoney] = useState(0);
  const [moneyPerSecond, setMoneyPerSecond] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [buildings, setBuildings] = useState<Record<string, number>>({
    developer: 0,
    manager: 0,
    shareholder: 0,
    ceo: 0,
    investor: 0,
    board_member: 0,
    venture_capitalist: 0,
    hedge_fund: 0,
    conglomerate: 0,
    monopoly: 0,
  });

  const buildingKeys = ['developer', 'manager', 'shareholder', 'ceo', 'investor', 'board_member', 'venture_capitalist', 'hedge_fund', 'conglomerate', 'monopoly'];

  const buildingData: Building[] = [
    { name: 'Developer', baseCost: 10, baseProduction: 1, owned: buildings.developer },
    { name: 'Manager', baseCost: 100, baseProduction: 10, owned: buildings.manager },
    { name: 'Shareholder', baseCost: 1100, baseProduction: 80, owned: buildings.shareholder },
    { name: 'CEO', baseCost: 12000, baseProduction: 470, owned: buildings.ceo },
    { name: 'Investor', baseCost: 130000, baseProduction: 2600, owned: buildings.investor },
    { name: 'Board Member', baseCost: 1400000, baseProduction: 14000, owned: buildings.board_member },
    { name: 'Venture Capitalist', baseCost: 20000000, baseProduction: 78000, owned: buildings.venture_capitalist },
    { name: 'Hedge Fund', baseCost: 330000000, baseProduction: 440000, owned: buildings.hedge_fund },
    { name: 'Conglomerate', baseCost: 5100000000, baseProduction: 2600000, owned: buildings.conglomerate },
    { name: 'Monopoly', baseCost: 75000000000, baseProduction: 16000000, owned: buildings.monopoly },
  ];

  useEffect(() => {
    checkAuthAndLoadProgress();
    trackGameStart();
  }, []);

  const trackGameStart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { projectId } = await import('../../utils/supabase/info');
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/start-game`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              game_id: 'corporate-clicker'
            }),
          }
        );
      }
    } catch (error) {
      console.error('Error tracking game start:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMoney(prev => prev + moneyPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [moneyPerSecond]);

  useEffect(() => {
    // Calculate money per second based on buildings
    let total = 0;
    buildingData.forEach((building, index) => {
      const buildingKey = buildingKeys[index];
      total += buildings[buildingKey as keyof typeof buildings] * building.baseProduction;
    });
    setMoneyPerSecond(total);
  }, [buildings]);

  const checkAuthAndLoadProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        
        // Fetch user profile to check clicker state
        const { projectId } = await import('../../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;
          
          if (profile.corporate_clicker) {
            const clicker = profile.corporate_clicker;
            
            // Calculate idle earnings
            const lastPlayed = new Date(clicker.last_played);
            const now = new Date();
            const timeElapsed = (now.getTime() - lastPlayed.getTime()) / 1000; // in seconds
            const idleEarnings = timeElapsed * clicker.money_per_second;
            
            setMoney(clicker.money + idleEarnings);
            setBuildings(clicker.buildings);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth/progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { projectId } = await import('../../utils/supabase/info');
        
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/update-clicker`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              money,
              money_per_second: moneyPerSecond,
              buildings
            }),
          }
        );
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const saveInterval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [money, moneyPerSecond, buildings, isAuthenticated]);

  const handleClick = () => {
    setMoney(prev => prev + 1);
  };

  const buyBuilding = (buildingIndex: number) => {
    
    const building = buildingData[buildingIndex];
    const cost = calculateCost(building);
    
    if (money >= cost) {
      setMoney(prev => prev - cost);
      const buildingKey = buildingKeys[buildingIndex] as keyof typeof buildings;
      setBuildings(prev => ({
        ...prev,
        [buildingKey]: prev[buildingKey] + 1
      }));
      
      // Auto-save whenever a building is purchased
      saveProgress();
    }
    
  };

  const calculateCost = (building: Building) => {
    return Math.floor(building.baseCost * Math.pow(1.15, building.owned));
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-4">Corporate Clicker</h1>
            <p className="text-gray-600">Build your corporate empire by clicking and purchasing upgrades!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Clicker */}
            <div className="space-y-6">
              <Card className="p-8 border-2 border-black/10 text-center">
                <div className="mb-6">
                  <h2 className="text-2xl mb-2 text-[#D4AF37]">💰 ${formatNumber(money)}</h2>
                  <p className="text-sm text-gray-600">
                    <TrendingUp className="inline w-4 h-4 mr-1" />
                    ${formatNumber(moneyPerSecond)}/sec
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  className="w-64 h-64 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] text-white shadow-2xl flex items-center justify-center text-6xl hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all"
                >
                  <Briefcase className="w-32 h-32" />
                </motion.button>

                <p className="text-sm text-gray-500">Click the worker to earn $1</p>

                {!isAuthenticated && (
                  <Card className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Login to save your progress and earn idle income!
                    </p>
                  </Card>
                )}
              </Card>
            </div>

            {/* Right Side - Buildings */}
            <div className="space-y-4">
              <Card className="p-6 border-2 border-black/10">
                <h3 className="text-2xl mb-4">Upgrades</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {buildingData.map((building, index) => {
                    const cost = calculateCost(building);
                    const canAfford = money >= cost;
                    
                    return (
                      <Card
                        key={index}
                        className={`p-4 border-2 transition-all ${
                          canAfford 
                            ? 'border-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 cursor-pointer' 
                            : 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => canAfford && buyBuilding(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold">{building.name}</h4>
                            <p className="text-sm text-gray-600">
                              +${formatNumber(building.baseProduction)}/sec
                            </p>
                            <p className="text-xs text-gray-500">
                              Owned: {building.owned}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${canAfford ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                              ${formatNumber(cost)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6 border-2 border-black/10 bg-black text-white">
                <h4 className="text-[#D4AF37] mb-2">Statistics</h4>
                <div className="space-y-1 text-sm">
                  <p>Total Buildings: {Object.values(buildings).reduce((a, b) => a + b, 0)}</p>
                  <p>Money Per Second: ${formatNumber(moneyPerSecond)}</p>
                  <p>Total Earned: ${formatNumber(money)}</p>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}