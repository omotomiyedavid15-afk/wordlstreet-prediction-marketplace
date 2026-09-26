import { createContext, useContext, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { demoPerpAccount, perpAccountReducer, type PerpAccount, type PerpAction } from "./perpsData";
const Context=createContext<{account:PerpAccount;dispatch:Dispatch<PerpAction>;watchlist:string[];toggleWatch:(symbol:string)=>void}|null>(null);
export function PerpsProvider({children}:{children:ReactNode}) {
  const [account,dispatch]=useReducer(perpAccountReducer,demoPerpAccount);
  const [watchlist,setWatchlist]=useState<string[]>(["BTC","GOLD"]);
  return <Context.Provider value={{account,dispatch,watchlist,toggleWatch:symbol=>setWatchlist(prev=>prev.includes(symbol)?prev.filter(s=>s!==symbol):[...prev,symbol])}}>{children}</Context.Provider>;
}
export function usePerps(){const context=useContext(Context);if(!context)throw new Error("Perps provider required");return context;}
