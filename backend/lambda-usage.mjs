import {createHash} from 'node:crypto';
import {DynamoDBClient,UpdateItemCommand} from '@aws-sdk/client-dynamodb';
export class UsageLimit extends Error {constructor(message,retryAfter=60){super(message);this.retryAfter=retryAfter}}
export function createUsageLimiter({client=new DynamoDBClient({maxAttempts:2}),table=process.env.USAGE_TABLE,now=Date.now,dailyLimit=Number(process.env.PLAN_DAILY_LIMIT||30)}={}){
 if(!table||!Number.isInteger(dailyLimit)||dailyLimit<1)throw new Error('Configure the private Lambda usage counter.');
 async function consume(key,limit,expires,retryAfter,message){
  try{await client.send(new UpdateItemCommand({
   TableName:table,Key:{id:{S:key}},
   UpdateExpression:'SET expires = :expires ADD #count :one',
   ConditionExpression:'attribute_not_exists(#count) OR #count < :limit',
   ExpressionAttributeNames:{'#count':'count'},
   ExpressionAttributeValues:{':expires':{N:String(expires)},':one':{N:'1'},':limit':{N:String(limit)}}
  }))}
  catch(error){if(error.name==='ConditionalCheckFailedException')throw new UsageLimit(message,retryAfter);throw new Error('The usage counter is unavailable.')}
 }
 return async address=>{
  const stamp=now(),minute=Math.floor(stamp/60000),day=Math.floor(stamp/86400000),expires=Math.floor(stamp/1000)+259200;
  const hash=createHash('sha256').update(address||'unknown').digest('hex');
  await consume(`minute:${minute}:${hash}`,4,expires,60,'A few plans were requested recently. Wait a minute before trying again.');
  await consume(`day:${day}`,dailyLimit,expires,Math.ceil((86400000-stamp%86400000)/1000),'Today’s demo planning limit has been reached. Resource search is still available. Please try again tomorrow.');
 };
}
