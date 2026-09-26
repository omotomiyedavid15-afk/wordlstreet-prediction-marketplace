import assert from 'node:assert/strict';
import test from 'node:test';
import {receiptResult} from '../src/domains/finance/positionReceiptModel.ts';
const market={id:'match',question:'Who wins?',outcomes:[{id:'a',label:'Arsenal',probability:48},{id:'b',label:'City',probability:30},{id:'draw',label:'Draw',probability:22}]};
const position=(outcomeId,winner,extra={})=>({id:'receipt',market:{...market,winner},outcomeId,entryPrice:.32,shares:250,...extra});
test('Yes pays one dollar per share only when the selected outcome wins',()=>{
 assert.equal(receiptResult(position('a','a')).profit,170);
 assert.equal(receiptResult(position('a','b')).profit,-80);
 assert.equal(receiptResult(position('a','draw')).status,'lost');
});
test('No includes every other mutually exclusive outcome, including a draw',()=>{
 for(const winner of ['b','draw']) {
  const result=receiptResult(position('a::no',winner));
  assert.equal(result.status,'won'); assert.equal(result.payout,250);
 }
 assert.equal(receiptResult(position('a::no','a')).profit,-80);
});
test('binary No settles by its own winning outcome ID',()=>{
 const p={...position('no'),market:{...market,outcomes:[{id:'yes',label:'Yes',probability:60},{id:'no',label:'No',probability:40}],winner:'no'}};
 assert.equal(receiptResult(p).status,'won');
 assert.equal(receiptResult({...p,market:{...p.market,winner:'yes'}}).status,'lost');
});
test('open tickets have no realized payout; voids refund cost with zero gain',()=>{
 assert.equal(receiptResult(position('a')).payout,null);
 assert.equal(receiptResult(position('a::no')).profit,null);
 const result=receiptResult(position('a','b',{settlement:'void'}));
 assert.equal(result.status,'void'); assert.equal(result.payout,80); assert.equal(result.profit,0);
});
test('unknown contracts do not render an invented position',()=>{
 assert.equal(receiptResult(position('unknown','a')),null);
});
