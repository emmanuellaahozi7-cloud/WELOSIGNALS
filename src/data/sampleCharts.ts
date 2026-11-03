export interface SampleChart {
  id: string;
  name: string;
  asset: string;
  timeframe: string;
  expectedTrend: string;
  expectedRecommendation: string;
  description: string;
  dataUrl: string;
}

// Generate realistic TradingView dark-theme chart images as clean SVG data URIs
function createTradingViewSvg(options: {
  pair: string;
  tf: string;
  price: string;
  candles: Array<{ x: number; o: number; h: number; l: number; c: number; v?: number }>;
  annotations?: Array<{ text: string; x: number; y: number; color: string; type?: 'box' | 'line' | 'label' }>;
}): string {
  const width = 1100;
  const height = 650;
  const chartTop = 80;
  const chartBottom = 540;
  const chartLeft = 50;
  const chartRight = 980;

  // Find min and max price for scaling
  let minP = Infinity;
  let maxP = -Infinity;
  options.candles.forEach(c => {
    if (c.l < minP) minP = c.l;
    if (c.h > maxP) maxP = c.h;
  });
  const padding = (maxP - minP) * 0.12;
  const rangeMin = minP - padding;
  const rangeMax = maxP + padding;
  const priceRange = rangeMax - rangeMin || 1;

  const getY = (val: number) => {
    return chartBottom - ((val - rangeMin) / priceRange) * (chartBottom - chartTop);
  };

  const candleElements = options.candles.map((c, i) => {
    const isBull = c.c >= c.o;
    const color = isBull ? '#089981' : '#f23645';
    const x = chartLeft + 35 + i * 28;
    const yOpen = getY(c.o);
    const yClose = getY(c.c);
    const yHigh = getY(c.h);
    const yLow = getY(c.l);
    const topY = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);

    return `
      <g key="${i}">
        <!-- Wick -->
        <line x1="${x + 8}" y1="${yHigh}" x2="${x + 8}" y2="${yLow}" stroke="${color}" stroke-width="1.6" />
        <!-- Candle Body -->
        <rect x="${x}" y="${topY}" width="16" height="${bodyHeight}" fill="${color}" rx="1" />
        <!-- Volume bar at bottom -->
        <rect x="${x}" y="${600 - (c.v || 20) * 1.5}" width="16" height="${(c.v || 20) * 1.5}" fill="${color}" opacity="0.3" />
      </g>
    `;
  }).join('');

  // Price scale ticks
  const priceTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const p = rangeMin + priceRange * pct;
    const y = getY(p);
    return `
      <line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}" stroke="#1e222d" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${chartRight + 12}" y="${y + 4}" fill="#787b86" font-size="12" font-family="'Fira Code', monospace">${p.toFixed(options.pair.includes('EUR') ? 4 : 2)}</text>
    `;
  }).join('');

  const annotationsSvg = (options.annotations || []).map(a => {
    if (a.type === 'box') {
      return `
        <rect x="${a.x}" y="${a.y}" width="240" height="42" fill="${a.color}" fill-opacity="0.18" stroke="${a.color}" stroke-width="1.5" stroke-dasharray="4,2" rx="3" />
        <text x="${a.x + 8}" y="${a.y + 25}" fill="${a.color}" font-weight="600" font-size="12" font-family="sans-serif">${a.text}</text>
      `;
    }
    return `
      <g>
        <circle cx="${a.x}" cy="${a.y}" r="4" fill="${a.color}" />
        <rect x="${a.x + 8}" y="${a.y - 12}" width="160" height="24" fill="#131722" stroke="${a.color}" stroke-width="1" rx="4" opacity="0.9" />
        <text x="${a.x + 16}" y="${a.y + 4}" fill="${a.color}" font-size="11" font-weight="bold" font-family="sans-serif">${a.text}</text>
      </g>
    `;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#131722" />
    
    <!-- Header TradingView Bar -->
    <rect width="${width}" height="48" fill="#1e222d" />
    <text x="24" y="30" fill="#f0f3fa" font-size="16" font-weight="700" font-family="sans-serif">${options.pair}</text>
    <rect x="140" y="14" width="42" height="22" rx="3" fill="#2a2e39" />
    <text x="148" y="29" fill="#2962ff" font-size="12" font-weight="700" font-family="sans-serif">${options.tf}</text>
    
    <text x="200" y="29" fill="#787b86" font-size="12" font-family="sans-serif">O <tspan fill="#f0f3fa">${options.candles[options.candles.length - 1]?.o || ''}</tspan></text>
    <text x="270" y="29" fill="#787b86" font-size="12" font-family="sans-serif">H <tspan fill="#f0f3fa">${options.candles[options.candles.length - 1]?.h || ''}</tspan></text>
    <text x="340" y="29" fill="#787b86" font-size="12" font-family="sans-serif">L <tspan fill="#f0f3fa">${options.candles[options.candles.length - 1]?.l || ''}</tspan></text>
    <text x="410" y="29" fill="#787b86" font-size="12" font-family="sans-serif">C <tspan fill="#089981">${options.candles[options.candles.length - 1]?.c || ''}</tspan></text>
    
    <text x="960" y="30" fill="#2962ff" font-size="13" font-weight="bold" font-family="sans-serif">TradingView</text>
    
    <!-- Chart Grid Lines -->
    ${priceTicks}
    
    <!-- Candles -->
    ${candleElements}
    
    <!-- Annotations & Zones (SMC / FVG / BOS) -->
    ${annotationsSvg}
    
    <!-- Watermark background -->
    <text x="420" y="350" fill="#ffffff" fill-opacity="0.03" font-size="70" font-weight="900" font-family="sans-serif">${options.pair}</text>
    
    <!-- Sub-indicators footer -->
    <line x1="50" y1="550" x2="980" y2="550" stroke="#2a2e39" stroke-width="1" />
    <text x="60" y="570" fill="#787b86" font-size="11" font-family="sans-serif">Vol (20): 14.82K</text>
    <text x="180" y="570" fill="#787b86" font-size="11" font-family="sans-serif">RSI (14): 42.6 (Bullish Divergence)</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Sample 1: BTC/USDT 4H Bullish FVG & Demand Order Block
const btcCandles = [
  { x: 1, o: 66200, h: 66800, l: 65900, c: 66600, v: 18 },
  { x: 2, o: 66600, h: 67400, l: 66400, c: 67200, v: 24 },
  { x: 3, o: 67200, h: 67600, l: 66800, c: 67000, v: 22 },
  { x: 4, o: 67000, h: 67100, l: 65200, c: 65400, v: 45 }, // Drop creating OB
  { x: 5, o: 65400, h: 65600, l: 64100, c: 64300, v: 55 }, // Liquidity sweep below 64.5k
  { x: 6, o: 64300, h: 65900, l: 64050, c: 65800, v: 70 }, // Huge bullish engulfing
  { x: 7, o: 65800, h: 67100, l: 65700, c: 66900, v: 62 }, // Explosive impulse leaving FVG
  { x: 8, o: 66900, h: 68300, l: 66800, c: 68100, v: 58 }, // Break of Structure (BOS)
  { x: 9, o: 68100, h: 68400, l: 67500, c: 67600, v: 25 }, // Pullback
  { x: 10, o: 67600, h: 67800, l: 66500, c: 66700, v: 22 }, // Retest into FVG
  { x: 11, o: 66700, h: 66800, l: 65900, c: 66100, v: 20 }, // Touch of Bullish Order Block
  { x: 12, o: 66100, h: 67200, l: 65850, c: 67100, v: 48 }, // Pin bar rejection + bounce
];

// Sample 2: EUR/USD 15m Bearish CHoCH Liquidity Grab
const eurusdCandles = [
  { x: 1, o: 1.0820, h: 1.0845, l: 1.0815, c: 1.0840, v: 20 },
  { x: 2, o: 1.0840, h: 1.0865, l: 1.0835, c: 1.0860, v: 25 },
  { x: 3, o: 1.0860, h: 1.0890, l: 1.0855, c: 1.0885, v: 30 },
  { x: 4, o: 1.0885, h: 1.0920, l: 1.0880, c: 1.0895, v: 60 }, // Liquidity Sweep wick at 1.0920
  { x: 5, o: 1.0895, h: 1.0900, l: 1.0835, c: 1.0840, v: 55 }, // Bearish displacement (CHoCH)
  { x: 6, o: 1.0840, h: 1.0850, l: 1.0810, c: 1.0815, v: 45 },
  { x: 7, o: 1.0815, h: 1.0845, l: 1.0810, c: 1.0842, v: 18 }, // Retest into Bearish Supply
  { x: 8, o: 1.0842, h: 1.0858, l: 1.0838, c: 1.0846, v: 16 },
  { x: 9, o: 1.0846, h: 1.0850, l: 1.0812, c: 1.0818, v: 38 }, // Rejection candle
];

// Sample 3: XAU/USD (Gold) 1H Bullish Momentum Breakout
const goldCandles = [
  { x: 1, o: 2610.0, h: 2618.5, l: 2608.0, c: 2615.0, v: 25 },
  { x: 2, o: 2615.0, h: 2622.0, l: 2613.0, c: 2620.5, v: 28 },
  { x: 3, o: 2620.5, h: 2625.0, l: 2618.0, c: 2623.0, v: 30 },
  { x: 4, o: 2623.0, h: 2642.0, l: 2622.0, c: 2640.0, v: 65 }, // Huge expansion candle
  { x: 5, o: 2640.0, h: 2648.0, l: 2638.0, c: 2645.0, v: 55 },
  { x: 6, o: 2645.0, h: 2647.0, l: 2636.0, c: 2638.0, v: 22 }, // Healthy pullback to prior high
  { x: 7, o: 2638.0, h: 2642.0, l: 2635.5, c: 2641.5, v: 35 }, // Demand retest hold
];

// Sample 4: ETH/USDT 1D Range Bound (Neutral / No clear trade)
const ethCandles = [
  { x: 1, o: 2450, h: 2520, l: 2410, c: 2480, v: 20 },
  { x: 2, o: 2480, h: 2510, l: 2440, c: 2460, v: 18 },
  { x: 3, o: 2460, h: 2540, l: 2430, c: 2490, v: 22 },
  { x: 4, o: 2490, h: 2530, l: 2450, c: 2470, v: 19 },
  { x: 5, o: 2470, h: 2515, l: 2445, c: 2485, v: 15 },
  { x: 6, o: 2485, h: 2525, l: 2455, c: 2475, v: 16 },
];

export const SAMPLE_CHARTS: SampleChart[] = [
  {
    id: 'btc-4h-smc',
    name: 'BTC/USDT - 4H',
    asset: 'BTC/USDT',
    timeframe: '4H',
    expectedTrend: 'BULLISH',
    expectedRecommendation: 'BUY',
    description: 'Balayage de liquidité basse (Sweep 64k) + Rejet Order Block + FVG haussier avec BOS.',
    dataUrl: createTradingViewSvg({
      pair: 'BTC/USDT',
      tf: '4H',
      price: '67,100',
      candles: btcCandles,
      annotations: [
        { text: 'Bullish Order Block (Demand)', x: 180, y: 380, color: '#089981', type: 'box' },
        { text: 'FVG (Fair Value Gap)', x: 240, y: 310, color: '#00bcd4', type: 'box' },
        { text: 'Liquidity Sweep (Low Grasp)', x: 190, y: 460, color: '#f23645' },
        { text: 'BOS (Break of Structure)', x: 280, y: 220, color: '#2962ff' },
      ],
    }),
  },
  {
    id: 'eurusd-15m-choch',
    name: 'EUR/USD - 15m',
    asset: 'EUR/USD',
    timeframe: '15m',
    expectedTrend: 'BEARISH',
    expectedRecommendation: 'SELL',
    description: 'Prise de liquidité au-dessus de 1.0920, CHoCH baissier et rejet zone Premium Supply.',
    dataUrl: createTradingViewSvg({
      pair: 'EUR/USD',
      tf: '15m',
      price: '1.0818',
      candles: eurusdCandles,
      annotations: [
        { text: 'Buy-Side Liquidity Swept', x: 150, y: 140, color: '#f23645' },
        { text: 'CHoCH Baissier', x: 190, y: 300, color: '#f23645' },
        { text: 'Supply Zone (Order Block)', x: 230, y: 260, color: '#ff9800', type: 'box' },
      ],
    }),
  },
  {
    id: 'xauusd-1h-breakout',
    name: 'XAU/USD (Gold) - 1H',
    asset: 'XAU/USD',
    timeframe: '1H',
    expectedTrend: 'BULLISH',
    expectedRecommendation: 'BUY',
    description: 'Cassure impulsive de résistance, création de zone de demande et retest réussi.',
    dataUrl: createTradingViewSvg({
      pair: 'XAU/USD',
      tf: '1H',
      price: '2,641.50',
      candles: goldCandles,
      annotations: [
        { text: 'Impulsive Breakout', x: 150, y: 260, color: '#089981' },
        { text: 'Demand Zone Retest', x: 210, y: 280, color: '#089981', type: 'box' },
      ],
    }),
  },
  {
    id: 'eth-1d-range',
    name: 'ETH/USDT - 1D (Range)',
    asset: 'ETH/USDT',
    timeframe: '1D',
    expectedTrend: 'NEUTRAL',
    expectedRecommendation: 'NO_TRADE',
    description: 'Consolidation sans momentum au centre du range. Risque élevé, aucune confluence directionnelle.',
    dataUrl: createTradingViewSvg({
      pair: 'ETH/USDT',
      tf: '1D',
      price: '2,475.00',
      candles: ethCandles,
      annotations: [
        { text: 'Mid-Range No-Trade Zone', x: 100, y: 310, color: '#787b86', type: 'box' },
      ],
    }),
  },
];
