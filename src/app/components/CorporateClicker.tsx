import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { TrendingUp, User2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchWithAuthOrAnon } from '../lib/anon';

interface Building {
  name: string;
  baseCost: number;
  baseProduction: number;
}

export function CorporateClicker() {
  const [serverMoney, setServerMoney] = useState<number>(0);
  const [serverLastPlayed, setServerLastPlayed] = useState<string>(new Date().toISOString());
  const [moneyPerSecond, setMoneyPerSecond] = useState<number>(0);
  const [sessionClickEarnings, setSessionClickEarnings] = useState<number>(0);
  const [displayMoney, setDisplayMoney] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [clickValue, setClickValue] = useState<number>(1);
  const [productionMultiplier, setProductionMultiplier] = useState<number>(1);
  const [isPressed, setIsPressed] = useState<boolean>(false);

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

  const buildingKeys = [
    'developer',
    'manager',
    'shareholder',
    'ceo',
    'investor',
    'board_member',
    'venture_capitalist',
    'hedge_fund',
    'conglomerate',
    'monopoly',
  ];

  const buildingData: Building[] = [
    { name: 'Developer', baseCost: 10, baseProduction: 1 },
    { name: 'Manager', baseCost: 100, baseProduction: 10 },
    { name: 'Shareholder', baseCost: 1100, baseProduction: 80 },
    { name: 'CEO', baseCost: 12000, baseProduction: 470 },
    { name: 'Investor', baseCost: 130000, baseProduction: 2600 },
    { name: 'Board Member', baseCost: 1400000, baseProduction: 14000 },
    { name: 'Venture Capitalist', baseCost: 20000000, baseProduction: 78000 },
    { name: 'Hedge Fund', baseCost: 330000000, baseProduction: 440000 },
    { name: 'Conglomerate', baseCost: 5100000000, baseProduction: 2600000 },
    { name: 'Monopoly', baseCost: 75000000000, baseProduction: 16000000 },
  ];

  useEffect(() => {
    void checkAuthAndLoadProgress();
    void trackGameStart();
  }, []);

  const trackGameStart = async () => {
    try {
      const { projectId } = await import('../../utils/supabase/info');
      await fetchWithAuthOrAnon(`https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/start-game`, {
        method: 'POST',
        body: JSON.stringify({ game_id: 'corporate-clicker' }),
      });
    } catch (e) {
      console.error('trackGameStart error', e);
    }
  };

  const computeDisplayMoney = () => {
    const last = Date.parse(serverLastPlayed || new Date().toISOString());
    const elapsed = Math.max(0, (Date.now() - last) / 1000);
    return Math.floor((serverMoney || 0) + elapsed * (moneyPerSecond || 0) + (sessionClickEarnings || 0));
  };

  useEffect(() => {
    const id = setInterval(() => setDisplayMoney(computeDisplayMoney()), 1000);
    setDisplayMoney(computeDisplayMoney());
    return () => clearInterval(id);
  }, [serverMoney, serverLastPlayed, moneyPerSecond, sessionClickEarnings]);

  useEffect(() => {
    let total = 0;
    buildingKeys.forEach((key, idx) => {
      total += (buildings[key] || 0) * buildingData[idx].baseProduction;
    });
    setMoneyPerSecond(total * productionMultiplier);
  }, [buildings, productionMultiplier]);

  const checkAuthAndLoadProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { projectId } = await import('../../utils/supabase/info');

      const response = await fetchWithAuthOrAnon(`https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`);
      if (!response.ok) return;
      const body = await response.json();
      const profile = body?.profile;

      if (session?.user) setIsAuthenticated(true);

      if (profile?.corporate_clicker) {
        const clicker = profile.corporate_clicker;
        setServerMoney(typeof clicker.money === 'number' ? clicker.money : 0);
        setServerLastPlayed(clicker.last_played || new Date().toISOString());
        setBuildings(clicker.buildings || {} as Record<string, number>);
        if (typeof clicker.click_value === 'number') setClickValue(clicker.click_value);
        if (typeof clicker.production_multiplier === 'number') setProductionMultiplier(clicker.production_multiplier);
        if (typeof clicker.money_per_second === 'number') setMoneyPerSecond(clicker.money_per_second);
      }
    } catch (e) {
      console.error('checkAuthAndLoadProgress error', e);
    }
  };

  const handleClick = () => {
    setIsPressed(true);
    setSessionClickEarnings(prev => prev + clickValue);
    setTimeout(() => setIsPressed(false), 300);
  };

  const calculateCost = (buildingIndex: number) => {
    const building = buildingData[buildingIndex];
    const owned = buildings[buildingKeys[buildingIndex]] ?? 0;
    return Math.floor(building.baseCost * Math.pow(1.15, owned));
  };

  const buyBuilding = async (index: number) => {
    const cost = calculateCost(index);
    const current = computeDisplayMoney();
    if (current < cost) return;

    const key = buildingKeys[index];
    const updated = { ...buildings, [key]: (buildings[key] || 0) + 1 };

    const nowIso = new Date().toISOString();
    const elapsed = Math.max(0, (Date.now() - Date.parse(serverLastPlayed || nowIso)) / 1000);
    const newServerMoney = Math.floor((serverMoney || 0) + elapsed * moneyPerSecond + sessionClickEarnings - cost);

    setBuildings(updated);
    setServerMoney(newServerMoney);
    setServerLastPlayed(nowIso);
    setSessionClickEarnings(0);

    const newMps = buildingKeys.reduce((acc, k, i) => acc + ((updated[k] || 0) * buildingData[i].baseProduction), 0) * productionMultiplier;
    setMoneyPerSecond(newMps);

    await persistClickerState({ buildings: updated, money: newServerMoney, money_per_second: newMps });
  };

  const persistClickerState = async (overrides: Partial<Record<string, any>> = {}) => {
    try {
      const { projectId } = await import('../../utils/supabase/info');
      const payload: Record<string, any> = {
        money: typeof overrides.money === 'number' ? overrides.money : Math.floor(serverMoney),
        money_per_second: typeof overrides.money_per_second === 'number' ? overrides.money_per_second : moneyPerSecond,
        buildings: overrides.buildings ?? buildings,
        last_played: overrides.last_played ?? serverLastPlayed ?? new Date().toISOString(),
      };
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      await fetchWithAuthOrAnon(`https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/update-clicker`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('persistClickerState error', e);
    }
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-4">Corporate Clicker</h1>
            <p className="text-gray-600">Build your corporate empire by clicking and purchasing upgrades!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="p-8 border-2 border-black/10 text-center">
                <div className="mb-6">
                  <h2 className="text-2xl mb-2 text-[#D4AF37]">💰 ${formatNumber(displayMoney)}</h2>
                  <p className="text-sm text-gray-600">
                    <TrendingUp className="inline w-4 h-4 mr-1" />${formatNumber(moneyPerSecond)}/sec
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleClick}
                  animate={isPressed ? { x: [0, -6, 6, 0], scale: [1, 0.96, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="w-64 h-64 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] text-white shadow-2xl flex items-center justify-center text-6xl"
                >
                  <User2 className="w-32 h-32" />
                </motion.button>

                <p className="text-sm text-gray-500">Click the worker to earn ${formatNumber(clickValue)}</p>

                {!isAuthenticated && (
                  <Card className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300">
                    <p className="text-sm text-yellow-800">⚠️ Login to save your progress and earn idle income!</p>
                  </Card>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 border-2 border-black/10">
                <h3 className="text-2xl mb-4">Upgrades</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {buildingData.map((b, i) => {
                    const cost = calculateCost(i);
                    const canAfford = displayMoney >= cost;
                    return (
                      <Card
                        key={i}
                        className={`p-4 border-2 transition-all ${
                          canAfford ? 'border-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 cursor-pointer' : 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => canAfford && buyBuilding(i)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold">{b.name}</h4>
                            <p className="text-sm text-gray-600">+${formatNumber(b.baseProduction)}/sec</p>
                            <p className="text-xs text-gray-500">Owned: {buildings[buildingKeys[i]] ?? 0}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${canAfford ? 'text-[#D4AF37]' : 'text-gray-400'}`}>${formatNumber(cost)}</p>
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
                  <p>Total Earned: ${formatNumber(displayMoney)}</p>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
