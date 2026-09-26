import assert from "node:assert/strict";
import test from "node:test";
import { demoPerpAccount, perpAccountReducer, perpCandles, perpAssets, perpGroups, perpReference, liquidationEstimate } from "../src/prediction-app/perpsData.ts";

test("expanded catalog has unique assets, complete groups and explicit native references",()=>{
  assert.equal(perpAssets.length,50);
  assert.equal(new Set(perpAssets.map(a=>a.symbol)).size,50);
  for(const group of perpGroups)assert(perpAssets.some(a=>a.group===group));
  const ng=perpAssets.filter(a=>a.group==="Stocks"&&a.exchange==="NGX");
  assert.equal(ng.length,6);
  for(const a of ng){assert.equal(a.referenceCurrency,"NGN");assert(Math.abs(a.price-a.referencePrice/1500)<1e-10);assert(perpReference(a));}
});

const order={id:"first",symbol:"BTC",direction:"up",collateral:"USD",margin:100,rate:1,entry:85836,leverage:5,quantity:500/85836,fee:.25,type:"market"};
test("market open debits margin and fee, then partial and full close release collateral",()=>{
  const opened=perpAccountReducer(demoPerpAccount,{type:"open",order});
  assert.equal(opened.balances.USD,4899.75);assert.equal(opened.positions.length,1);
  const half=perpAccountReducer(opened,{type:"close",id:order.id,fraction:.5,mark:85836,time:"now"});
  assert.equal(half.positions[0].margin,50);assert.equal(half.balances.USD,4949.625);
  const closed=perpAccountReducer(half,{type:"close",id:order.id,fraction:1,mark:85836,time:"later"});
  assert.equal(closed.positions.length,0);assert.equal(closed.balances.USD,4999.5);
});
test("limit orders reserve collateral without creating a position; cancel refunds exactly once",()=>{
  const pending=perpAccountReducer(demoPerpAccount,{type:"open",order:{...order,type:"limit"}});
  assert.equal(pending.positions.length,0);assert.equal(pending.orders.length,1);
  const cancelled=perpAccountReducer(pending,{type:"cancel",id:order.id});
  assert.equal(cancelled.balances.USD,5000);assert.equal(cancelled.orders.length,0);
  assert.equal(perpAccountReducer(cancelled,{type:"cancel",id:order.id}),cancelled);
});
test("NGN and crypto collateral use their own balances",()=>{
  const ngn=perpAccountReducer(demoPerpAccount,{type:"open",order:{...order,collateral:"NGN",margin:150000,rate:1/1500}});
  assert.equal(ngn.balances.NGN,1349625);assert.equal(ngn.balances.USD,5000);
  const btc=perpAccountReducer(demoPerpAccount,{type:"open",order:{...order,collateral:"BTC",margin:.001,rate:60000,quantity:300/85836,fee:.15}});
  assert(Math.abs(btc.balances.BTC-.0239975)<1e-10);
});
test("invalid or duplicate orders cannot debit balances",()=>{
  for(const patch of [{margin:-1},{margin:Infinity},{margin:6000},{leverage:21},{entry:0},{quantity:NaN},{quantity:99},{fee:0},{fee:-1},{collateral:"UNKNOWN"}])assert.equal(perpAccountReducer(demoPerpAccount,{type:"open",order:{...order,...patch}}),demoPerpAccount);
  const opened=perpAccountReducer(demoPerpAccount,{type:"open",order});
  assert.equal(perpAccountReducer(opened,{type:"open",order}),opened);
  for(const fraction of [0,-1,2,NaN])assert.equal(perpAccountReducer(opened,{type:"close",id:order.id,fraction,mark:85836,time:"now"}),opened);
});
test("sample candles have valid OHLC and terminate at the mark",()=>{
  for(const a of perpAssets)for(const range of ["1H","1D","1W","1M"]){
    const candles=perpCandles(a,range,15);
    assert(Math.abs(candles.at(-1).close-a.price)<1e-8);
    assert(candles.every(c=>c.low<=Math.min(c.open,c.close)&&c.high>=Math.max(c.open,c.close)));
  }
  assert(liquidationEstimate(100,5,"up")<100);assert(liquidationEstimate(100,5,"down")>100);
});
