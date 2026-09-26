export type PerpGroup = "Metals" | "Crypto" | "Stocks" | "Indices" | "Commodities";
export type PerpDirection = "up" | "down";
export interface PerpAsset { symbol: string; name: string; group: PerpGroup; price: number; change: number; volume: number; interest: number; funding: number; maxLeverage: number; description: string; exchange?:string; referenceCurrency?:string; referencePrice?:number }
// Fixed illustrative quotes. No exchange or execution service is connected.
export const perpAssets: PerpAsset[] = [
  { symbol:"GOLD", name:"Gold", group:"Metals", price:4318.9, change:-.3, volume:39467235, interest:3900000, funding:.0289, maxLeverage:15, description:"A perpetual contract tracking the US-dollar price of gold per troy ounce." },
  { symbol:"SILVER", name:"Silver", group:"Metals", price:65.251, change:-.53, volume:30173871, interest:2200000, funding:.0111, maxLeverage:9, description:"A perpetual contract tracking the US-dollar price of silver per troy ounce." },
  { symbol:"BTC", name:"Bitcoin", group:"Crypto", price:85836, change:.81, volume:653746211, interest:13000000, funding:.0187, maxLeverage:20, description:"A perpetual contract tracking Bitcoin, a digital asset on a decentralized proof-of-work network." },
  { symbol:"ETH", name:"Ethereum", group:"Crypto", price:2734, change:-.27, volume:609412566, interest:10500000, funding:.0102, maxLeverage:20, description:"A perpetual contract tracking Ether, the native asset of the Ethereum network." },
  { symbol:"SOL", name:"Solana", group:"Crypto", price:117.497, change:.59, volume:14318029, interest:1830000, funding:.006, maxLeverage:10, description:"A perpetual contract tracking SOL, the native asset of the Solana network." },
  { symbol:"XRP", name:"XRP", group:"Crypto", price:1.5931, change:4.11, volume:41510927, interest:4900000, funding:.0304, maxLeverage:10, description:"A perpetual contract tracking the XRP digital asset." },
  { symbol:"META", name:"Meta Platforms", group:"Stocks", exchange:"NASDAQ", price:742.08, change:.81, volume:2778069, interest:837266, funding:.0021, maxLeverage:5, description:"A sample derivative tracking Meta Platforms shares. This contract does not confer stock ownership or voting rights." },
  { symbol:"NVDA", name:"NVIDIA", group:"Stocks", exchange:"NASDAQ", price:184.62, change:1.32, volume:17489042, interest:2474000, funding:.0082, maxLeverage:5, description:"A sample derivative tracking NVIDIA shares. This contract does not confer stock ownership or voting rights." },
  { symbol:"SPX", name:"S&P 500", group:"Indices", price:6641.8, change:.43, volume:51423890, interest:8421000, funding:.005, maxLeverage:10, description:"A sample perpetual contract tracking the S&P 500 equity index." },
  { symbol:"NDX", name:"Nasdaq-100", group:"Indices", price:24612.4, change:.72, volume:28941762, interest:4912000, funding:.0064, maxLeverage:10, description:"A sample perpetual contract tracking the Nasdaq-100 equity index." },
];
// Catalog fixtures describe hypothetical USD-settled contracts, not listed products
// offered by the reference exchanges. Native references use fixed illustrative FX.
const extraCrypto:[string,string,number,number][] = [
  ["BNB","BNB",645.2,1.24],["DOGE","Dogecoin",.1842,2.18],["ADA","Cardano",.7213,-.84],
  ["AVAX","Avalanche",28.4,1.72],["LINK","Chainlink",18.65,.92],["TON","Toncoin",3.48,-1.12],
  ["DOT","Polkadot",4.72,.64],["LTC","Litecoin",108.6,-.52],["UNI","Uniswap",8.91,2.44],
];
extraCrypto.forEach(([symbol,name,price,change],i)=>perpAssets.push({symbol,name,price,change,group:"Crypto",volume:42000000-i*3200000,interest:3200000-i*180000,funding:.004+i*.001,maxLeverage:i<3?10:5,description:`A hypothetical USD-settled perpetual tracking ${name}. Prices, liquidity and leverage limits are illustrative.`}));

const extraStocks:[string,string,string,number,string,number][] = [
  ["AAPL","Apple","NASDAQ",242.5,"USD",1],["MSFT","Microsoft","NASDAQ",512.3,"USD",1],
  ["AMZN","Amazon","NASDAQ",224.8,"USD",1],["GOOGL","Alphabet","NASDAQ",208.6,"USD",1],
  ["TSLA","Tesla","NASDAQ",348.2,"USD",1],["JPM","JPMorgan Chase","NYSE",298.4,"USD",1],
  ["DANGCEM","Dangote Cement","NGX",900,"NGN",1/1500],["MTNN","MTN Nigeria","NGX",600,"NGN",1/1500],
  ["GTCO","Guaranty Trust Holding Company","NGX",90,"NGN",1/1500],["ZENITHBANK","Zenith Bank","NGX",75,"NGN",1/1500],
  ["AIRTELAFRI","Airtel Africa","NGX",2250,"NGN",1/1500],["SEPLAT","Seplat Energy","NGX",6000,"NGN",1/1500],
  ["HSBA","HSBC Holdings","LSE",8.65,"GBP",1.3],["NPN","Naspers","JSE",5700,"ZAR",.055],
  ["0700","Tencent Holdings","HKEX",540,"HKD",.128],
];
extraStocks.forEach(([symbol,name,exchange,referencePrice,referenceCurrency,rate],i)=>perpAssets.push({symbol,name,exchange,referencePrice,referenceCurrency,price:referencePrice*rate,change:[1.24,-.62,.84,2.1,-1.42,.55][i%6],group:"Stocks",volume:18000000-i*950000,interest:2100000-i*95000,funding:.003+(i%5)*.001,maxLeverage:exchange==="NGX"?3:5,description:`A hypothetical USD-settled contract referencing ${name} on ${exchange}. Native-currency reference and FX are fixed demo values. This is not an exchange-listed perpetual and confers no share ownership or voting rights.`}));

const extraIndices:[string,string,string,number][] = [
  ["NGXASI","NGX All-Share","NGX",148500],["NGX30","NGX 30","NGX",5450],
  ["FTSE","FTSE 100","United Kingdom",9200],["DAX","DAX 40","Germany",24150],
  ["N225","Nikkei 225","Japan",43200],["HSI","Hang Seng","Hong Kong",25600],["JTOP40","FTSE/JSE Top 40","South Africa",94500],
];
extraIndices.forEach(([symbol,name,exchange,price],i)=>perpAssets.push({symbol,name,exchange,price,change:[.75,1.02,-.38,.82,-.61,.93,.45][i],group:"Indices",volume:28000000-i*2100000,interest:3400000-i*230000,funding:.0035+i*.0005,maxLeverage:5,description:`A hypothetical USD-settled perpetual referencing the ${name} index. One demo contract uses a $1 notional multiplier per index point. Index levels and contract specifications are illustrative, not an offering by the index provider.`}));

const extraCommodities:[string,string,PerpGroup,number,string][] = [
  ["PLATINUM","Platinum","Metals",1450,"troy ounce"],["PALLADIUM","Palladium","Metals",1180,"troy ounce"],["COPPER","Copper","Metals",4.62,"pound"],
  ["BRENT","Brent crude oil","Commodities",78.4,"barrel"],["WTI","WTI crude oil","Commodities",74.8,"barrel"],
  ["NATGAS","Natural gas","Commodities",3.24,"MMBtu"],["COCOA","Cocoa","Commodities",8450,"metric tonne"],
  ["WHEAT","Wheat","Commodities",5.62,"bushel"],["CORN","Corn","Commodities",4.28,"bushel"],
];
extraCommodities.forEach(([symbol,name,group,price,unit],i)=>perpAssets.push({symbol,name,group,price,change:[.82,-.45,1.24,.61,-.38,2.14,-1.42,.53,-.27][i],volume:24000000-i*1600000,interest:2300000-i*130000,funding:.002+i*.001,maxLeverage:group==="Metals"?8:5,description:`A hypothetical cash-settled perpetual referencing ${name.toLowerCase()}, quoted in USD per ${unit}. No physical delivery. Prices and contract specifications are illustrative.`}));

export const perpGroups: PerpGroup[] = ["Metals","Crypto","Stocks","Indices","Commodities"];
perpAssets.forEach(asset=>{asset.funding=Number(asset.funding.toFixed(4));});
export const perpReference = (asset:PerpAsset) => asset.referencePrice!==undefined&&asset.referenceCurrency&&asset.referenceCurrency!=="USD" ? new Intl.NumberFormat("en-US",{style:"currency",currency:asset.referenceCurrency,maximumFractionDigits:2}).format(asset.referencePrice) : undefined;
export const perpMoney = (value:number) => value.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:Math.abs(value)<10?4:2});
export const compactPerpMoney = (value:number) => value.toLocaleString("en-US",{style:"currency",currency:"USD",notation:"compact",maximumFractionDigits:1});
export function perpCandles(asset:PerpAsset, range:string, interval:number) {
  const hours = ({"1H":1,"1D":24,"1W":168,"1M":720} as Record<string,number>)[range] ?? 24;
  const count = Math.min(180,Math.max(2,Math.round(hours*60/interval)));
  const step = hours*3600000/count;
  const end = Date.UTC(2026,8,23,12);
  const seed = [...asset.symbol].reduce((s,c)=>s+c.charCodeAt(0),0);
  const start=asset.price/(1+asset.change/100*Math.sqrt(hours/24));
  const curve = (i:number) => {
    const p=i/count;
    return start+(asset.price-start)*p+asset.price*Math.sin(Math.PI*p)*(Math.sin(p*18+seed)*.005+Math.sin(p*57+seed)*.0015+Math.sin(p*129)*.0006);
  };
  return Array.from({length:count},(_,i)=>{
    const open=curve(i), close=curve(i+1);
    const wick=asset.price*(.0004+Math.abs(Math.sin(i*1.7+seed))*.0018);
    return {time:end-(count-i)*step,open,close,high:Math.max(open,close)+wick,low:Math.min(open,close)-wick};
  });
}

export interface PerpPosition { id:string; symbol:string; direction:PerpDirection; collateral:string; margin:number; rate:number; entry:number; leverage:number; quantity:number; takeProfit?:number; stopLoss?:number }
export interface PerpOrder extends PerpPosition { type:"market"|"limit"; fee:number }
export interface PerpRecord { id:string; symbol:string; direction:PerpDirection; action:string; size:number; time:string }
export interface PerpAccount { balances:Record<string,number>; positions:PerpPosition[]; orders:PerpOrder[]; history:PerpRecord[] }
export const demoPerpAccount:PerpAccount = {balances:{USD:5000,NGN:1500000,EUR:500,GBP:250,BTC:.025,ETH:.75,USDC:300,SOL:4,PAXG:.1},positions:[],orders:[],history:[]};
export type PerpAction = {type:"open"; order:PerpOrder} | {type:"cancel"; id:string} | {type:"close"; id:string; fraction:number; mark:number; time:string};
export const perpFeeRate = .0005;
export const liquidationEstimate = (entry:number, leverage:number, direction:PerpDirection) => entry*(1+(direction==="up"?-1:1)*.95/leverage);
export function perpAccountReducer(state:PerpAccount,action:PerpAction):PerpAccount {
  if(action.type==="open") {
    const o=action.order,asset=perpAssets.find(a=>a.symbol===o.symbol);
    if(!asset || ![o.margin,o.rate,o.entry,o.leverage,o.quantity,o.fee].every(Number.isFinite) || o.margin<=0 || o.rate<=0 || o.entry<=0 || o.quantity<=0 || o.leverage<1 || o.leverage>asset.maxLeverage || o.fee<0 || state.history.some(h=>h.id===o.id)) return state;
    const notional=o.margin*o.rate*o.leverage;
    if(Math.abs(o.quantity*o.entry-notional)>Math.max(1e-8,notional*1e-10) || Math.abs(o.fee-notional*perpFeeRate)>1e-8) return state;
    const debit=o.margin+o.fee/o.rate;
    if(debit>(state.balances[o.collateral]??0)+1e-10) return state;
    return {...state,balances:{...state.balances,[o.collateral]:state.balances[o.collateral]-debit},positions:o.type==="market"?[...state.positions,o]:state.positions,orders:o.type==="limit"?[...state.orders,o]:state.orders,history:[{id:o.id,symbol:o.symbol,direction:o.direction,action:o.type==="limit"?"Limit placed":"Opened",size:o.quantity*o.entry,time:new Date().toISOString()},...state.history]};
  }
  if(action.type==="cancel") {
    const o=state.orders.find(o=>o.id===action.id);if(!o) return state;
    return {...state,orders:state.orders.filter(item=>item.id!==o.id),balances:{...state.balances,[o.collateral]:state.balances[o.collateral]+o.margin+o.fee/o.rate},history:[{id:o.id+"-cancel",symbol:o.symbol,direction:o.direction,action:"Cancelled",size:o.quantity*o.entry,time:new Date().toISOString()},...state.history]};
  }
  const p=state.positions.find(p=>p.id===action.id);
  if(!p || !Number.isFinite(action.fraction) || action.fraction<=0 || action.fraction>1 || !Number.isFinite(action.mark) || action.mark<=0) return state;
  const quantity=p.quantity*action.fraction,margin=p.margin*action.fraction;
  const pnl=(action.mark-p.entry)*quantity*(p.direction==="up"?1:-1);
  const credit=Math.max(0,margin+(pnl-quantity*action.mark*perpFeeRate)/p.rate);
  return {...state,balances:{...state.balances,[p.collateral]:state.balances[p.collateral]+credit},positions:action.fraction===1?state.positions.filter(item=>item.id!==p.id):state.positions.map(item=>item.id===p.id?{...p,margin:p.margin-margin,quantity:p.quantity-quantity}:item),history:[{id:p.id+"-close-"+action.time,symbol:p.symbol,direction:p.direction,action:"Closed",size:quantity*action.mark,time:action.time},...state.history]};
}
