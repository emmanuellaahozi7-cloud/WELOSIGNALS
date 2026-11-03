export interface TradeSetup {
  entry_price: string | number;
  stop_loss: string | number;
  take_profit_1: string | number;
  take_profit_2: string | number;
  risk_reward_ratio: string;
}

export interface TradeAnalysis {
  id?: string;
  timestamp?: number;
  asset: string;
  timeframe: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recommendation: 'BUY' | 'SELL' | 'NO_TRADE';
  win_probability: number;
  confidence_level: 'HAUTE' | 'MOYENNE' | 'FAIBLE';
  trade_setup: TradeSetup;
  key_confluences: string[];
  technical_justification: string;
  risk_warning: string;
  imageUrl?: string;
  userNotes?: string;
}

export interface ConfluenceBreakdownItem {
  name: string;
  description: string;
  detected: boolean;
  score: number;
}
