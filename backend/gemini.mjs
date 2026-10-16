export class AIError extends Error {
  constructor(message,status=503){super(message);this.status=status}
}
export function aiSettings(env=process.env){
  const key=env.GEMINI_API_KEY?.trim();
  const model=env.GEMINI_MODEL?.trim()||'gemini-3.1-flash-lite';
  if(!key)throw new AIError('The creative planner needs a Gemini key in the private backend settings.');
  if(!/^gemini-[a-z0-9.-]+$/.test(model))throw new AIError('Check the Gemini model name in the private backend settings.');
  return {key,model};
}
// Keep the credential in an HTTP header, never a URL, browser response or log.
export async function generateContent(body,{signal,settings=aiSettings()}={}){
  let response;
  try{
    response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent`,{
      method:'POST',headers:{'x-goog-api-key':settings.key,'Content-Type':'application/json'},
      body:JSON.stringify(body),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000)
    });
  }catch{throw new AIError('The AI service took too long to respond. Your brief is still here; please try again.')}
  if(!response.ok){
    if(response.status===429)throw new AIError('The Gemini quota is temporarily exhausted. Wait and try again; enabling billing is optional.',429);
    if([401,403].includes(response.status))throw new AIError('Gemini rejected access. Check the key and project permissions in AI Studio.');
    if(response.status===404)throw new AIError('This Gemini model is unavailable. Check GEMINI_MODEL in the backend settings.');
    throw new AIError('Gemini is temporarily unavailable. Your brief is still here; please try again.');
  }
  let data;
  try{data=await response.json()}catch{throw new AIError('Gemini returned an unreadable response. Please try again.')}
  const candidate=data.candidates?.[0];
  if(!candidate?.content?.parts?.length||['SAFETY','RECITATION','PROHIBITED_CONTENT'].includes(candidate.finishReason))throw new AIError('The AI could not finish this brief. Try describing the creative project differently.',422);
  return {content:candidate.content,usage:data.usageMetadata||{}};
}
