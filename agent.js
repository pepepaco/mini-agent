'use strict';const express=require('express'),crypto=require('crypto'),cookieParser=require('cookie-parser'),{exec}=require('child_process'),os=require('os'),fs=require('fs');
const app=express(),CK='c1',WIN=os.platform()==='win32',ASSETS=__dirname+'/assets';
if(!fs.existsSync(ASSETS))fs.mkdirSync(ASSETS);
app.use(express.urlencoded({extended:true,limit:'5mb'}));
app.use(express.json({limit:'5mb'}));
app.use(cookieParser());
app.use('/assets',express.static(ASSETS));
const DEF={urlBase:'https://api.openai.com/v1',apiKey:'',model:'gpt-4.1',systemPrompt:`You are a helpful assistant with shell access (${os.platform()}).\nSHELL: use run_shell. Copy files to ${ASSETS} → /assets/.\nIMAGES: ![d](/assets/f.jpg) FILES: [n](/assets/f.pdf)\nPROMPT: use update_prompt to update this prompt.`,shellEnabled:true,maxShellTurns:10,mcpServers:[]};
const CSS=`.ts{color:#484f58;font-size:10px}.si{font-size:11px;color:#8b949e;margin-bottom:6px}:root{--b:1px solid #30363d;--bg:#161b22;--fg:#c9d1d9;--r:3px}*{box-sizing:border-box;margin:0;padding:0}body{font:13px/1.4 monospace;background:#0d0d0d;color:var(--fg);height:100dvh;display:flex;flex-direction:column;overflow:hidden}a{color:#58a6ff}h{padding:7px 10px;border-bottom:var(--b);display:flex;align-items:center;gap:4px;flex-shrink:0;flex-wrap:wrap}h .t{color:#e6edf3;font-weight:bold;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button{cursor:pointer;border:var(--b);background:var(--bg);color:var(--fg);padding:3px 7px;border-radius:var(--r);font:inherit;font-size:12px;touch-action:manipulation}button:hover{background:#1c2128}#cfg{background:#0d1117;border-bottom:var(--b);padding:8px 10px;display:none;overflow-y:auto;max-height:55vh}#cfg.on{display:block}label{display:block;color:#8b949e;font-size:11px;margin:5px 0 2px}input,textarea,#inp{width:100%;background:var(--bg);border:var(--b);color:var(--fg);padding:4px 7px;border-radius:var(--r);font:inherit;font-size:14px}#inp{flex:1;width:auto;font-size:16px}input[type=checkbox]{width:auto;font-size:12px}textarea{font-size:12px;resize:vertical}input[type=number]{font-size:12px}#msgs{flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:5px;-webkit-overflow-scrolling:touch}#msgs:empty::before{content:'_';color:#484f58}.u,.a{display:flex;gap:6px}.u{flex-direction:row-reverse}.b{padding:5px 10px;border-radius:var(--r);max-width:85%;word-break:break-word;white-space:pre-wrap;line-height:1.5}.u .b{background:#1a3a6e;color:#e6edf3}.a .b{background:var(--bg);border:var(--b)}img{max-width:min(200px,100%);display:block}.a .b pre{background:#0d1117;border:var(--b);padding:5px;border-radius:var(--r);overflow-x:auto}details{font-size:11px;color:#8b949e;margin:1px 0}summary{cursor:pointer;list-style:none;padding:2px 0}summary::before{content:'▶ '}[open]>summary::before{content:'▼ '}.tc,.tr,.te{padding-left:5px;border-left:2px solid}.tc{color:#3fb950;border-color:#3fb950}.tr{color:#8b949e;border-color:#58a6ff;white-space:pre-wrap}.te{color:#f85149;border-color:#f85149;white-space:pre-wrap}#bar{display:flex;gap:6px;padding:7px 10px;border-top:var(--b);flex-shrink:0}#inp:focus{outline:none;border-color:#58a6ff}#send{background:#1a3a6e;border-color:#1a3a6e;color:#fff;padding:5px 14px;flex-shrink:0}.mr{display:flex;gap:4px;margin-bottom:3px}.mr input{flex:1;font-size:12px}.meter{height:5px;background:#21262d;border-radius:var(--r);overflow:hidden;margin-top:3px}.mf{height:100%;border-radius:var(--r)}@media(max-width:480px){button{padding:2px 5px;font-size:11px}.b{max-width:95%}}`
const KEY=crypto.scryptSync('your-secret-password-that-is-long-enough','salt-for-the-key',32);
const enc=t=>{const v=crypto.randomBytes(16),c=crypto.createCipheriv('aes-256-cbc',KEY,v);return v.toString('hex')+':'+Buffer.concat([c.update(t),c.final()]).toString('hex')};
const dec=t=>{try{const[a,b]=t.split(':'),d=crypto.createDecipheriv('aes-256-cbc',KEY,Buffer.from(a,'hex'));return Buffer.concat([d.update(Buffer.from(b,'hex')),d.final()]).toString()}catch{return null}};
const sh=(cmd,ms=30000)=>new Promise(r=>exec(cmd,{shell:WIN?process.env.SHELL||'powershell':'/bin/sh',timeout:ms,maxBuffer:4<<20,env:{...process.env}},(e,o,s)=>r({stdout:o?.trim()||'',stderr:s?.trim()||'',exitCode:e?.code??0})));
const BT=[
{type:'function',function:{name:'run_shell',description:`Shell (${WIN?'pwsh':'sh'}), copy files→${ASSETS}`,parameters:{type:'object',properties:{command:{type:'string'},reason:{type:'string'}},required:['command']}}},
{type:'function',function:{name:'update_prompt',description:'Update system prompt.',parameters:{type:'object',properties:{prompt:{type:'string'}},required:['prompt']}}}
];
const CO={httpOnly:true,secure:app.get('env')==='production',maxAge:365*24*3600*1000,sameSite:'Strict'};
const CH=3800,MC=10,BG=CH*MC;
const sc=(res,cfg)=>{const f=enc(JSON.stringify(cfg)),cs=[];for(let i=0;i<f.length;i+=CH)cs.push(f.slice(i,i+CH));if(cs.length>MC)return false;cs.forEach((c,i)=>res.cookie(CK+'_'+i,c,CO));for(let i=cs.length;i<MC;i++)res.clearCookie(CK+'_'+i);return f.length};
const lc=req=>{const p=[];for(let i=0;i<MC;i++){const c=req.cookies?.[CK+'_'+i];if(!c)break;p.push(c)}if(p.length){const d=dec(p.join(''));if(d)try{const x=JSON.parse(d);if(x.systemPrompt)x.systemPrompt=x.systemPrompt.replace(/\r\n?/g,'\n');x.mcpServers??=[];return x}catch{}}return{}};
const ckSz=req=>{let u=0,v;for(let i=0;i<MC&&(v=req.cookies?.[CK+'_'+i]);i++)u+=v.length;return u};
const gs=req=>{let s={};const v=req.body?.__V||req.query?.__V;if(v){const d=dec(v);if(d)try{s=JSON.parse(d)}catch{}}s.config={...DEF,...s.config,...lc(req)};s.messages??=[];s.chatId??=Date.now().toString(36);s.title??='';s.showConfig??=false;return s};
const hd=cfg=>({'Content-Type':'application/json',...(cfg?.apiKey?(cfg.urlBase?.includes('openai.azure.com')?{'api-key':cfg.apiKey}:{Authorization:`Bearer ${cfg.apiKey}`}):{})});
// Generic MCP client — works with any MCP-over-HTTP server (local npx, LiteLLM, Exa, etc.)
const mcpH=s=>({'Content-Type':'application/json','Accept':'application/json, text/event-stream',...(s.apiKey?{Authorization:`Bearer ${s.apiKey}`}:{})});
// Parse response: handle both plain JSON and SSE (data: {...} lines)
const mcpParse=async r=>{const t=await r.text();if(t.includes('\ndata:')||t.startsWith('data:')){const l=t.split('\n').find(l=>l.startsWith('data:'));return l?JSON.parse(l.slice(5)):{}}return JSON.parse(t)};
// Send one JSON-RPC request, get parsed response
const mcpRpc=async(s,m,p,i)=>{const r=await fetch(s.url,{method:'POST',headers:mcpH(s),body:JSON.stringify({jsonrpc:'2.0',method:m,...(p?{params:p}:{}),id:i})});if(!r.ok)throw new Error('HTTP '+r.status);return mcpParse(r)};
const mcpInit=s=>mcpRpc(s,'initialize',{protocolVersion:'2024-11-05',capabilities:{}},0);
const mcpList=async(s,errs)=>{try{await mcpInit(s);const d=await mcpRpc(s,'tools/list',null,1);return(d.result?.tools||[]).map(t=>({type:'function',function:{name:s.name+'__'+t.name,description:(t.description||t.name).slice(0,100),parameters:t.inputSchema||{type:'object',properties:{}}}}));}catch(ex){errs.push(s.name+": "+ex.message);return[]}};
const mcpCall=async(s,name,args)=>{try{await mcpInit(s);const d=await mcpRpc(s,'tools/call',{name,arguments:args},2);const c=d.result?.content;return Array.isArray(c)?c.map(x=>x.text||x.data||JSON.stringify(x)).join('\n'):JSON.stringify(d.result??d.error??`no result from ${name}`);}catch(ex){return"[mcp]"+ex.message}};
const ai=async(state,msgs)=>{
  const cfg=state.config,url=`${cfg.urlBase.replace(/\/+$/,'')}/chat/completions`,H=hd(cfg),max=cfg.maxShellTurns??10,ut=cfg.shellEnabled!==false,log=[],conv=[...msgs];
  let pu=null;
  // Build tools: builtins + all MCP server tools
  const srvs=(cfg.mcpServers||[]).filter(s=>s?.url);
  const mcpErrs=[];
  const mcpFlat=(await Promise.all(srvs.map(s=>mcpList(s,mcpErrs)))).flat();
  if(mcpErrs.length)log.push({cmd:'mcp-init',reason:mcpErrs.join(' | '),stdout:'',stderr:'failed',exitCode:1});
  const tools=ut?[...BT,...mcpFlat]:[...mcpFlat];
  for(let t=0;t<max;t++){
    let r,d;
    try{r=await fetch(url,{method:'POST',headers:H,body:JSON.stringify({model:cfg.model,messages:conv,...(tools.length?{tools,tool_choice:'auto'}:{})})});
      if(!r.ok){const x=await r.text().catch(()=>'');return{ok:false,status:r.status,text:x}}d=await r.json()}catch(ex){return{ok:false,status:0,text:String(ex)}}
    const ch=d.choices?.[0],m=ch?.message;if(!m)return{ok:false,status:0,text:'Empty'};
    if(ch.finish_reason==='tool_calls'&&m.tool_calls?.length){
      conv.push(m);
      for(const tc of m.tool_calls){let a={};try{a=JSON.parse(tc.function.arguments)}catch{}const cp=c=>conv.push({role:'tool',tool_call_id:tc.id,content:c});
        const fn=tc.function.name;
        if(fn==='update_prompt'){const e2=enc(JSON.stringify({...cfg,systemPrompt:a.prompt}));if(e2.length>BG)cp(`ERR:too large ${e2.length}/${BG}`);else{pu=a.prompt;cp(`OK ${e2.length}/${BG}`)}log.push({cmd:'update_prompt',reason:'',stdout:'ok',stderr:'',exitCode:0})}
        else if(fn==='run_shell'){const res=await sh(a.command||'');log.push({cmd:a.command,reason:a.reason,...res});cp([res.stdout&&'OUT:\n'+res.stdout,res.stderr&&'ERR:\n'+res.stderr,'x:'+res.exitCode].filter(Boolean).join('\n\n')||'(none)')}
        else{// MCP tool: srv.name__tool_name
          const sep=fn.indexOf('__');const srvName=fn.slice(0,sep),toolName=fn.slice(sep+2);
          const ms=srvs.find(x=>x.name===srvName)||srvs[0];
          const out=ms?await mcpCall(ms,toolName,a):'unknown tool';
          log.push({cmd:`${srvName}:${toolName}`,reason:JSON.stringify(a).slice(0,80),stdout:out,stderr:'',exitCode:0});
          cp(out)
        }
      }
      continue
    }
    return{ok:true,reply:m.content??'',log,usage:d.usage,pu}
  }
  const r=await fetch(url,{method:'POST',headers:H,body:JSON.stringify({model:cfg.model,messages:conv})});
  if(r.ok){const d=await r.json();return{ok:true,reply:d.choices?.[0]?.message?.content??'Limit reached.',log,pu}}
  return{ok:true,reply:'⚠️ turn limit.',log,pu}
};
const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const gm=async()=>{if(!gm._m){const m=await import('marked');gm._m=m?.marked||m?.default?.marked||m?.default||m}return gm._m};
const pm=b=>{const s=[];for(let i=0;i<20;i++){const u=b[`mu_${i}`]?.trim();if(!u)continue;s.push({name:b[`mn_${i}`]?.trim()||'',url:u,apiKey:b[`mk_${i}`]?.trim()||''})}const nu=b.mu_new?.trim();if(nu)s.push({name:b.mn_new?.trim()||'',url:nu,apiKey:b.mk_new?.trim()||''});return s};
const mR=sv=>(sv||[]).map((s,i)=>`<div class=mr><input name=mn_${i} value="${e(s.name||'')}" style=max-width:90px><input name=mu_${i} value="${e(s.url||'')}"><input type=password name=mk_${i} value="${e(s.apiKey||'')}"></div>`).join('')+`<div class=mr><input name=mn_new style=max-width:90px><input name=mu_new><input type=password name=mk_new></div>`
const render=async(state,req=null,dl=false)=>{
  const mk=await gm(),{config:cfg,messages:msgs,chatId,showConfig}=state,vs=enc(JSON.stringify(state));
  const used=req?ckSz(req):0,pct=Math.round(used/BG*100),free=BG-used,mc=pct>90?'#f85149':pct>70?'#d29922':'#3fb950';
  const mn=(cfg.mcpServers||[]).filter(s=>s?.url).length;
  const bubbles=msgs.map(msg=>{
    if(msg.role==='user')return`<div class=u><div class=b>${e(msg.content)}</div></div>`;
    if(msg.role==='tool-call')return`<details><summary>$ ${e((msg.reason||msg.content).slice(0,70))}</summary><div class=tc>${e(msg.content)}</div></details>`;
    if(msg.role==='tool-result')return`<details><summary>out ${e(msg.content.split('\n')[0].slice(0,70))}</summary><div class=tr>${e(msg.content)}</div></details>`;
    if(msg.role==='tool-error')return`<details open><summary>err ${e(msg.content.split('\n')[0].slice(0,70))}</summary><div class=te>${e(msg.content)}</div></details>`;
    return`<div class=a><div class=b>${mk.parse(msg.content)}</div></div>`;
  });
  return`<!DOCTYPE html><html><head><meta charset=UTF-8>${dl&&req?`<base href="${req.protocol}://${req.get('host')}">`:''}<title>${e(state.title||'chat')}</title><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${CSS}</style></head><body><form action=/ method=post style=display:contents><input name=__V value="${vs}"><button name=action value=sendMessage style=display:none></button><h><span class=t>${e(state.title||'chat')} <small class=ts>${chatId}</small></span><button name=action value=downloadChat>save</button><button name=action value=compress>zip</button><button name=action value=refreshTitle>ttl</button><button name=action value=newChat formaction=/newchat target=_blank>new</button><button name=action value=toggleConfig>⚙</button></h><div id=cfg${showConfig?' class=on':''}><div class=si>🍪 <b style="color:${mc}">${used.toLocaleString()}/${BG.toLocaleString()} (${pct}%)</b> — <span style="color:${mc}">${free.toLocaleString()} free</span><div class=meter><div class=mf style="width:${Math.min(pct,100)}%;background:${mc}"></div></div></div><label>url<input name=urlBase value="${e(cfg.urlBase)}"></label><label>key<input name=apiKey value="${e(cfg.apiKey)}"></label><label>model<input name=model value="${e(cfg.model)}"></label><label><input type=checkbox name=shellEnabled value=true ${cfg.shellEnabled!==false?'checked':''}> shell · turns<input type=number name=maxShellTurns value="${cfg.maxShellTurns??10}" min=1 max=50></label><label>prompt<textarea name=systemPrompt rows=3>${e(cfg.systemPrompt||'')}</textarea></label><label>🔌 mcp (name·url·token)${mn?` <b style="color:#3fb950">[${mn}]</b>`:''}<div style="margin-top:3px">${mR(cfg.mcpServers)}</div></label><button name=action value=saveSettings style="width:100%;margin-top:6px;padding:6px">save</button></div><div id=msgs>${bubbles.join('')}</div><div id=bar><input id=inp name=userInput placeholder="message..." autofocus autocomplete=off><button id=send name=action value=sendMessage>→</button></div></form><script>document.getElementById('msgs').scrollTop=9e9</script></body></html>`;
};
const pushTool=(M,ev)=>{M.push({role:'tool-call',content:ev.cmd,reason:ev.reason});M.push({role:ev.exitCode?'tool-error':'tool-result',content:[ev.stdout,ev.stderr&&'STDERR: '+ev.stderr,'x:'+ev.exitCode].filter(Boolean).join('\n')||'(none)'})};
app.get('/',async(req,res)=>res.send(await render(gs(req),req)));
app.post('/',async(req,res)=>{
  const state=gs(req),cfg=state.config,M=state.messages,{userInput,action,urlBase,apiKey,model,systemPrompt,maxShellTurns}=req.body;
  const fl2=m=>m.role==='user'||m.role==='assistant',fl3=m=>fl2(m)||m.role==='system';
  switch(action){
    case'sendMessage':{
      if(!userInput)break;
      M.push({role:'user',content:userInput});
      const am=M.filter(fl3).map(m=>({role:m.role,content:m.content}));
      if(cfg.systemPrompt&&am[0]?.role!=='system')am.unshift({role:'system',content:cfg.systemPrompt});
      const R=await ai(state,am);
      if(R.ok){
        if(R.pu){cfg.systemPrompt=R.pu;sc(res,cfg)}
        for(const ev of R.log??[])pushTool(M,ev);
        M.push({role:'assistant',content:R.reply+(R.usage?`\n\n<small class=ts>tokens:${R.usage.total_tokens}${R.log?.length?` calls:${R.log.length}`:''}</small>`:'')})
      }else M.push({role:'assistant',content:`err ${R.status}: ${R.text}`});
      break
    }
    case'toggleConfig':state.showConfig=!state.showConfig;break;
    case'saveSettings':{
      if(systemPrompt!==undefined)cfg.systemPrompt=systemPrompt;
      Object.assign(cfg,{urlBase:urlBase??cfg.urlBase,apiKey:apiKey??cfg.apiKey,model:model??cfg.model,shellEnabled:req.body.shellEnabled==='true',maxShellTurns:parseInt(maxShellTurns)||10,mcpServers:pm(req.body)});
      state.showConfig=false;
      if(sc(res,cfg)===false)M.push({role:'assistant',content:'⚠️ config too large'});
      break
    }
    case'downloadChat':res.setHeader('Content-Disposition',`attachment;filename="${(state.title||'chat').replace(/[^a-z0-9]/gi,'_')}.html"`);res.setHeader('Content-Type','text/html');return res.send(await render(state,req,true));
    case'refreshTitle':if(M.length){const am=M.filter(fl2).map(m=>({role:m.role,content:m.content}));const r=await ai({...state,config:{...cfg,shellEnabled:false,mcpServers:[]}},[...am,{role:'user',content:'5-word title, emoji first.'}]);state.title=r.ok?(r.reply?.trim()||'chat').slice(0,50):'chat'}break;
    case'compress':{const ua=M.filter(fl2);const keep=ua.slice(-2),rest=ua.slice(0,-2);if(rest.length){const r=await ai({...state,config:{...cfg,shellEnabled:false,mcpServers:[]}},[...rest,{role:'user',content:'Bullet summary.'}]);if(r.ok)M.splice(0,M.length,{role:'assistant',content:`📝 **summary:**\n`+r.reply},...keep)}break}
    case'newChat':return res.send(await render({config:cfg,messages:[],chatId:Date.now().toString(36),title:'',showConfig:false},req));
  }
  res.send(await render(state,req))
});
app.post('/newchat',async(req,res)=>{const o=gs(req);res.send(await render({config:o.config,messages:[],chatId:Date.now().toString(36),title:'',showConfig:false},req))});
const P=process.env.PORT||3001;app.listen(P,()=>console.log('http://localhost:'+P));
