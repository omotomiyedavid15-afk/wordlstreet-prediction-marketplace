import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { PredictionMarket } from "../domains/finance/predictionData";
import { contractOutcome } from "../domains/finance/predictionContracts";
import { sampleFundingAssets, type FundingAsset, type PredictionFunding } from "../domains/finance/predictionFunding";

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  outcomeId: string;
  outcomeLabel: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  side: "buy" | "sell";
  timestamp: string;
}

export interface TradeHistoryItem {
  id: string;
  marketId?: string;
  outcomeId?: string;
  funding?: PredictionFunding;
  marketTitle: string;
  outcomeLabel: string;
  side: "buy" | "sell";
  orderType: "market" | "limit";
  shares: number;
  price: number;
  total: number;
  status: "filled" | "pending";
  timestamp: string;
}

interface PredictionContextType {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  savedMarkets: string[];
  toggleSaveMarket: (id: string) => void;
  positions: Position[];
  fundingAssets: FundingAsset[];
  tradeHistory: TradeHistoryItem[];
  executeTrade: (market: PredictionMarket, outcomeId: string, side: "buy" | "sell", orderType: "market" | "limit", shares: number, price: number, funding?: PredictionFunding) => void;
  claimWinnings: (marketId: string, amount: number) => void;
  claimableWinnings: number;
  toast: { key: number; message: string; tone: "success" | "neutral" | "danger" } | null;
  setToast: (t: { key: number; message: string; tone: "success" | "neutral" | "danger" } | null) => void;
}

const PredictionContext = createContext<PredictionContextType | null>(null);

export function usePrediction() {
  const ctx = useContext(PredictionContext);
  if (!ctx) throw new Error("usePrediction must be used inside PredictionProvider");
  return ctx;
}

export function PredictionProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(2450.00);
  const [assetBalances, setAssetBalances] = useState<Record<string, number>>(Object.fromEntries(sampleFundingAssets.map(a => [a.id, a.balance])));
  const fundingAssets = sampleFundingAssets.map(a => ({ ...a, balance: a.id === "USD" ? balance : assetBalances[a.id] ?? 0 }));
  const [savedMarkets, setSavedMarkets] = useState<string[]>(["btc-100k", "fed-cut"]);
  const [toast, setToast] = useState<{ key: number; message: string; tone: "success" | "neutral" | "danger" } | null>(null);
  
  const [positions, setPositions] = useState<Position[]>([
    {
      id: "pos-1",
      marketId: "btc-100k",
      marketTitle: "Will Bitcoin close above $100,000 this year?",
      outcomeId: "yes",
      outcomeLabel: "Yes",
      shares: 150,
      avgPrice: 0.62,
      currentPrice: 0.68,
      side: "buy",
      timestamp: "2026-09-14T14:32:00Z"
    },
    {
      id: "pos-2",
      marketId: "fed-cut",
      marketTitle: "Federal Reserve interest rate cut in September?",
      outcomeId: "cut50",
      outcomeLabel: "50 bps cut",
      shares: 200,
      avgPrice: 0.28,
      currentPrice: 0.35,
      side: "buy",
      timestamp: "2026-09-15T09:15:00Z"
    }
  ]);

  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([
    {
      id: "WS-8841",
      marketTitle: "Will Bitcoin close above $100,000 this year?",
      outcomeLabel: "Yes",
      side: "buy",
      orderType: "market",
      shares: 150,
      price: 0.62,
      total: 93.00,
      status: "filled",
      timestamp: "2026-09-14T14:32:00Z"
    },
    {
      id: "WS-8842",
      marketTitle: "Federal Reserve interest rate cut in September?",
      outcomeLabel: "50 bps cut",
      side: "buy",
      orderType: "market",
      shares: 200,
      price: 0.28,
      total: 56.00,
      status: "filled",
      timestamp: "2026-09-15T09:15:00Z"
    }
  ]);

  const [claimableWinnings, setClaimableWinnings] = useState(350.00);

  const toggleSaveMarket = (id: string) => {
    setSavedMarkets(prev => {
      const isSaved = prev.includes(id);
      const next = isSaved ? prev.filter(x => x !== id) : [...prev, id];
      setToast({
        key: Date.now(),
        message: isSaved ? "Market removed from watchlist" : "Market added to watchlist",
        tone: "neutral"
      });
      return next;
    });
  };

  const executeTrade = (
    market: PredictionMarket,
    outcomeId: string,
    side: "buy" | "sell",
    orderType: "market" | "limit",
    shares: number,
    price: number,
    funding?: PredictionFunding
  ) => {
    const totalCost = Math.round(shares * price * 100) / 100;
    const asset = fundingAssets.find(a => a.id === (funding?.assetId ?? "USD"));
    const outcomeObj = contractOutcome(market, outcomeId);
    if (!asset || !outcomeObj || market.winner || !Number.isSafeInteger(shares) || shares < 1 || !Number.isFinite(price) || price < .01 || price > .99) throw new Error("Invalid order");
    const amount = Math.ceil((totalCost / asset.usdRate - 1e-10) * 10 ** asset.decimals) / 10 ** asset.decimals;
    if (funding && (funding.usdRate !== asset.usdRate || Math.abs(funding.amount - amount) > 10 ** -asset.decimals)) throw new Error("Quote changed");
    const reserved = tradeHistory.filter(t => t.marketId === market.id && t.outcomeId === outcomeId && t.side === "sell" && t.status === "pending").reduce((sum,t) => sum + t.shares,0);
    const owned = positions.filter(p => p.marketId === market.id && p.outcomeId === outcomeId).reduce((sum,p) => sum + p.shares,0) - reserved;
    if (side === "buy" && amount > asset.balance) throw new Error("Insufficient balance");
    if (side === "sell" && shares > owned) throw new Error("Insufficient holdings");
    // Pending buys reserve funds; pending sells reserve shares, without crediting proceeds.
    if (side === "buy" || orderType === "market") {
      const delta = side === "buy" ? -amount : amount;
      if (asset.id === "USD") setBalance(b => Math.round((b + delta) * 100) / 100);
      else setAssetBalances(b => ({ ...b, [asset.id]: Math.max(0, b[asset.id] + delta) }));
    }
    const outcomeLabel = outcomeObj.label;

    const newTrade: TradeHistoryItem = {
      id: `WS-${Math.floor(1000 + Math.random() * 9000)}`,
      marketId: market.id,
      outcomeId,
      funding: { assetId: asset.id, amount, usdRate: asset.usdRate },
      marketTitle: market.question,
      outcomeLabel,
      side,
      orderType,
      shares,
      price,
      total: totalCost,
      status: orderType === "market" ? "filled" : "pending",
      timestamp: new Date().toISOString()
    };

    setTradeHistory(prev => [newTrade, ...prev]);

    if (side === "buy" && orderType === "market") {
      setPositions(prev => {
        const existing = prev.find(p => p.marketId === market.id && p.outcomeId === outcomeId);
        if (existing) {
          const newShares = existing.shares + shares;
          const newAvg = Math.round(((existing.shares * existing.avgPrice + totalCost) / newShares) * 100) / 100;
          return prev.map(p => p.id === existing.id ? { ...p, shares: newShares, avgPrice: newAvg } : p);
        }
        return [
          {
            id: `pos-${Date.now()}`,
            marketId: market.id,
            marketTitle: market.question,
            outcomeId,
            outcomeLabel,
            shares,
            avgPrice: price,
            currentPrice: price,
            side: "buy",
            timestamp: new Date().toISOString()
          },
          ...prev
        ];
      });
    }
    if (side === "sell" && orderType === "market") {
      setPositions(prev => { let remaining = shares; return prev.map(p => {
        if (p.marketId !== market.id || p.outcomeId !== outcomeId) return p;
        const sold = Math.min(p.shares, remaining); remaining -= sold;
        return { ...p, shares: p.shares - sold };
      }).filter(p => p.shares > 0); });
    }

    setToast({
      key: Date.now(),
      message: orderType === "limit" ? `Limit order pending: ${shares} ${outcomeLabel} shares` : `${side === "buy" ? "Bought" : "Sold"} ${shares} ${outcomeLabel} shares for $${totalCost.toFixed(2)}`,
      tone: "success"
    });
  };

  const claimWinnings = (_marketId: string, amount: number) => {
    setBalance(b => Math.round((b + amount) * 100) / 100);
    setClaimableWinnings(0);
    setToast({
      key: Date.now(),
      message: `Claimed $${amount.toFixed(2)} payout into wallet!`,
      tone: "success"
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <PredictionContext.Provider
      value={{
        balance,
        setBalance,
        savedMarkets,
        toggleSaveMarket,
        positions,
        fundingAssets,
        tradeHistory,
        executeTrade,
        claimWinnings,
        claimableWinnings,
        toast,
        setToast
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
}
