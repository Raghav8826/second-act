import test from 'node:test';
import assert from 'node:assert/strict';
import {availableStock,parseSearch} from './availability.mjs';
const booking=(id,startDate,endDate,quantity=1)=>({id,startDate,endDate,quantity,status:'confirmed'});
test('separate bookings use peak occupancy, not the sum across the whole range',()=>{
  assert.equal(availableStock(2,[booking('a','2026-10-25','2026-10-25'),booking('b','2026-10-27','2026-10-27')],'2026-10-25','2026-10-27'),1);
});
test('overlapping bookings consume stock together and end dates are inclusive',()=>{
  assert.equal(availableStock(3,[booking('a','2026-10-25','2026-10-26'),booking('b','2026-10-26','2026-10-27')],'2026-10-26','2026-10-26'),1);
  assert.equal(availableStock(1,[booking('a','2026-10-25','2026-10-27')],'2026-10-28','2026-10-28'),1);
});
test('cancelled bookings and null optional matches do not consume stock',()=>{
  assert.equal(availableStock(2,[{id:null},{...booking('a','2026-10-25','2026-10-27'),status:'cancelled'}],'2026-10-25','2026-10-27'),2);
});
test('invalid calendar dates, reversed ranges and fractional stock are rejected',()=>{
  for(const query of [
    'start=2026-02-30&end=2026-03-01',
    'start=2026-10-27&end=2026-10-25',
    'start=2026-10-25&quantity=1.5'
  ])assert.throws(()=>parseSearch(new URLSearchParams(query)));
});
test('a zero budget remains a real budget and a one-day request costs one day',()=>{
  const parsed=parseSearch(new URLSearchParams('start=2026-10-25&budget=0'));
  assert.equal(parsed.budget,0);assert.equal(parsed.days,1);
});
