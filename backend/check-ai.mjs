import {aiSettings,generateContent} from './gemini.mjs';
try{
  const settings=aiSettings();
  const result=await generateContent({contents:[{role:'user',parts:[{text:'Reply with exactly READY. This is a connection test.'}]}],generationConfig:{maxOutputTokens:128,thinkingConfig:{thinkingLevel:'LOW'}}},{settings});
  const reply=result.content.parts.filter(p=>!p.thought).map(p=>p.text||'').join('').trim();
  if(reply!=='READY')throw new Error('Unexpected connection-test response.');
  console.log(`Gemini generation verified with ${settings.model}. No credentials were logged.`);
}catch(error){console.error(error?.name==='AIError'?error.message:'The AI connection test did not finish successfully.');process.exitCode=1}
