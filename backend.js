/* ---------- Supabase (comunidad) ----------
   - Presencia (quién está online / estudiando): Supabase Realtime Presence, abierto mientras la app está visible (o el cronómetro corre).
   - Perfiles, progreso: tablas Postgres (profiles, progress) con RLS.
   - Chat: tabla chat_messages + Realtime (postgres_changes), solo con la pestaña Chat abierta. */
let sb=null,fb={ok:false,uid:'',users:{},pres:{},presReady:false,acct:false,token:'',msgs:[]},
  lastProfAt=0,lastProfSig='',lastPrSig='',off=0,ringPrev=0,presCh=null,hideT=null,usersAt=0,usersBusy=false,noGs=false,noMs=false,msAt=0;
const typing=()=>['INPUT','TEXTAREA'].includes(document.activeElement&&document.activeElement.tagName);
async function initFb(){
  try{
    if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)throw new Error('Falta la librería de Supabase o config.js');
    sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    sb.auth.onAuthStateChange((_ev,ses)=>{fb.token=ses?.access_token||'';if(ses?.user){fb.uid=ses.user.id;fb.acct=!ses.user.is_anonymous}});
    let{data:{session}}=await sb.auth.getSession();
    if(session){const{error:ue}=await sb.auth.getUser();if(ue&&[401,403,404].includes(ue.status)){await sb.auth.signOut();session=null}} /* cuenta borrada desde admin */
    if(!session){const r=await sb.auth.signInAnonymously();if(r.error)throw r.error;session=r.data.session}
    fb.uid=session.user.id;fb.token=session.access_token;fb.acct=!session.user.is_anonymous;fb.ok=true;
    if(fb.acct){await syncProgress(true);render();if(S.nick)await checkNick()}
    syncListeners();
  }catch(e){fb.ok=false;console.warn('Modo local:',e)}
}
/* Nombres únicos: nicks(key = nombre en minúsculas sin acentos ni espacios). Un nombre sin tocar durante 30 días queda libre. */
async function claimNick(n){
  const key=nickKey(n);
  const{data:cur,error:se}=await sb.from('nicks').select('uid,ts').eq('key',key).maybeSingle();
  if(se)return 'error';
  const iso=new Date().toISOString();
  if(cur){
    const age=Date.now()-(Date.parse(cur.ts)||0);
    if(cur.uid!==fb.uid&&age<30*864e5)return 'taken';
    if(cur.uid===fb.uid&&age<7*864e5)return 'ok';
    const{error}=await sb.from('nicks').update({uid:fb.uid,nick:n,ts:iso}).eq('key',key);
    if(error)return error.code==='23505'?'taken':'error';
    return 'ok';
  }
  const{error}=await sb.from('nicks').insert({key,uid:fb.uid,nick:n,ts:iso});
  if(error)return error.code==='23505'?'taken':'error';
  return 'ok';
}
function releaseNick(old,keep){
  if(!fb.ok||!old)return;const k=nickKey(old);
  if(!/^[a-z0-9]{3,20}$/.test(k)||(keep&&nickKey(keep)===k))return;
  sb.from('nicks').delete().eq('key',k).eq('uid',fb.uid).then(()=>{});
}
async function checkNick(){
  let bad=nickErr(S.nick);
  if(!bad&&await claimNick(S.nick)==='taken')bad='uso';
  if(!bad)return;
  S.nick='';save(true);lastPrSig='';lastProfSig='';
  sb.from('profiles').update({nickname:''}).eq('id',fb.uid).then(()=>{});
  render();toast('Tu nombre no es válido o ya está en uso. Elige otro.');settings();
}
/* Perfiles de la comunidad: se leen con la pestaña Comunidad abierta (máx. 1 vez cada 40 s) y solo los activos en 30 días. */
async function fetchUsers(){
  if(!fb.ok||usersBusy)return;usersBusy=true;
  try{
    const cut=new Date(Date.now()-30*864e5).toISOString();
    const{data,error}=await sb.from('profiles').select('*').gt('updated_at',cut);
    if(error)throw error;
    const n={};
    (data||[]).forEach(r=>{
      n[r.id]={nickname:r.nickname,avatarColor:r.avatar_color,totalSeconds:r.total_seconds,todaySeconds:r.today_seconds,todayDateKey:r.today_date_key,
        weeklySeconds:r.weekly_seconds,weekStartKey:r.week_start_key,streak:r.streak,streakEnd:r.streak_end,bestStreak:r.best_streak,ww:r.ww,gs:r.gs,ms:r.ms,
        online:false,active:null,since:0,lastSeen:Date.parse(r.last_seen)||0,updatedAt:Date.parse(r.updated_at)||0};
    });
    fb.users=n;
    if(S.view==='group'&&S.gv!=='chat'&&!typing())render();
  }catch(e){console.warn('Perfiles:',e.message||e)}
  finally{usersBusy=false}
}
/* Presencia en tiempo real */
function openPres(){
  clearTimeout(hideT);hideT=null;
  if(presCh||!fb.ok)return;
  const ch=presCh=sb.channel('mathstudy:presence',{config:{presence:{key:fb.uid}}});
  ch.on('presence',{event:'sync'},()=>{
    if(presCh!==ch)return;
    const st=ch.presenceState(),m={};
    Object.entries(st).forEach(([uid,metas])=>{const p=metas&&metas[metas.length-1];
      if(p&&p.nickname)m[uid]={online:true,nickname:p.nickname,avatarColor:p.avatarColor,active:p.active||null,since:+p.since||0,lastSeen:Date.now()}});
    fb.pres=m;fb.presReady=true;
    if(S.view==='group'&&S.gv!=='chat'&&!typing())render();
  }).subscribe(s=>{if(s==='SUBSCRIBED'&&presCh===ch){lastPrSig='';trackPres()}});
}
function closePres(){
  if(!presCh)return;const c=presCh;presCh=null;fb.pres={};fb.presReady=false;lastPrSig='';
  try{Promise.resolve(sb.removeChannel(c)).catch(()=>{})}catch(e){}
}
function trackPres(){
  if(!presCh||!S.nick||!fb.acct)return;
  const a=S.run?SUBJ[S.run].n:null,sig=JSON.stringify([S.nick,S.color,a]);
  if(sig===lastPrSig)return;lastPrSig=sig;
  presCh.track({nickname:S.nick,avatarColor:S.color,active:a,since:S.run?Date.now()-S.cur*1000:null}).catch(()=>{});
}
/* Qué escuchar según la pantalla (se llama en cada render) */
function syncListeners(){
  if(!fb.ok)return;
  const vis=!document.hidden,g=S.view==='group'&&vis;
  if(vis||S.run){clearTimeout(hideT);hideT=null;openPres()}
  else if(!hideT)hideT=setTimeout(()=>{hideT=null;if(document.hidden&&!S.run){closePres();sync(true,true)}},8000);
  if(g){
    if(S.gv!=='chat'&&Date.now()-usersAt>40000){usersAt=Date.now();fetchUsers()}
    if(S.gv!=='chat'&&Date.now()-msAt>40000){msAt=Date.now();fetchMissions()}
  }
  listenChat((g&&S.gv==='chat')||(S.nt&&fb.acct));
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&fb.ok&&fb.acct&&S.nick)sync(true)});
/* Para cerrar la pestaña: fetch con keepalive sigue vivo aunque la página se descargue */
function keepalivePatch(table,col,val,body){
  if(!fb.ok||!fb.token||!val)return;
  try{fetch(`${window.SUPABASE_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`,{method:'PATCH',keepalive:true,
    headers:{apikey:window.SUPABASE_ANON_KEY,Authorization:'Bearer '+fb.token,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(body)})}catch(e){}
}
/* Escrituras mínimas: el perfil solo se escribe al pausar, al cerrar, o cada 5 min mientras estudias; y nunca si no ha cambiado. */
function sync(force,final){
  if(!fb.ok||!fb.acct||!S.nick)return;
  if(final&&freeze)return;
  trackPres();
  const now=Date.now(),iso=new Date(now).toISOString(),st=stats(),a=S.run?SUBJ[S.run].n:null,sk=streakCur(),bs=streakBest(sk.n);
  let ww=[];try{ww=wkSnaps()}catch(e){}
  const gs=gsOut(),ms=msOut();
  const online=!final&&!(document.hidden&&!S.run);
  const row=()=>({nickname:S.nick,avatar_color:S.color,total_seconds:st.total,today_seconds:num(st.today,86400),today_date_key:st.todayKey,
    weekly_seconds:num(st.week,604800),week_start_key:st.weekKey,streak:num(sk.n,36500),streak_end:sk.end,best_streak:num(bs,36500),ww,...(noGs?{}:{gs}),...(noMs||!ms?{}:{ms}),
    online,active:online?a:null,since:online&&S.run?new Date(now-S.cur*1000).toISOString():null,last_seen:iso,updated_at:iso});
  const sig=JSON.stringify([S.nick,S.color,online,a,Math.floor(st.total/60),Math.floor(st.today/60),Math.floor(st.week/60),sk.n,sk.end,bs,ww.map(w=>[w.k,Math.floor(w.t/60)]),Object.entries(gs).map(([g,x])=>[g,Math.floor(x.t/60),Math.floor(x.d/60),Math.floor(x.w/60),x.s,x.dl[0]]),ms&&[ms.n,ms.m]]);
  if(final){
    syncProgress(false,true);
    if(sig!==lastProfSig){lastProfSig=sig;lastProfAt=now;keepalivePatch('profiles','id',fb.uid,row())}
    return;
  }
  syncProgress(force);
  if(sig===lastProfSig)return;
  const due=lastProfAt===0||force||!S.run||now-lastProfAt>=300000;
  if(!due)return;
  lastProfAt=now;lastProfSig=sig;
  /* Si aún no has ejecutado supabase/schema_v4.sql (columna dl), reintenta sin ella para no romper el perfil. */
  const put=()=>sb.from('profiles').upsert({id:fb.uid,...row()},{onConflict:'id'}).then(({error})=>{
    if(error){if(!noMs&&/\bms\b/.test(error.message||'')){noMs=true;return put()}if(!noGs&&/\bgs\b/.test(error.message||'')){noGs=true;return put()}console.warn('Perfil:',error.message)}});
  put();
}
/* ---------- Cuentas: nombre de usuario (único) + contraseña ----------
   Supabase Auth con un correo interno <nombre>@mathstudy.app (nunca se envía nada a esa dirección; "Confirm email" debe estar desactivado).
   El progreso se guarda en la tabla progress y al entrar se restaura. */
const MAIL='@mathstudy.app',loginEmail=n=>nickKey(n)+MAIL;
function authMsg(e,ctx){
  const msg=String((e&&(e.message||e.error_description))||'').toLowerCase(),c=(e&&e.code)||'';
  if(c==='nick-taken'||msg.includes('already registered')||msg.includes('already been registered')||c==='user_already_exists')return 'Ese nombre ya está en uso. Elige otro.';
  if(c==='nick-error')return 'No se pudo comprobar el nombre. ¿Ejecutaste el SQL de supabase/schema.sql (y schema_v2.sql)?';
  if(c==='weak_password'||(msg.includes('password')&&(msg.includes('weak')||msg.includes('short')||msg.includes('at least'))))return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
  if(c==='invalid_credentials'||msg.includes('invalid login credentials'))return ctx==='pw'?'La contraseña actual no es correcta.':'Nombre o contraseña incorrectos.';
  if(c==='over_request_rate_limit'||c==='over_email_send_rate_limit'||msg.includes('rate limit')||(e&&e.status===429))return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
  if(msg.includes('signups not allowed')||msg.includes('signup is disabled')||msg.includes('email signups are disabled'))return 'El registro con email está desactivado en Supabase (Authentication › Sign In / Providers › Email).';
  if(msg.includes('failed to fetch')||msg.includes('network'))return 'Sin conexión. Inténtalo de nuevo.';
  return 'No se pudo completar la operación'+(msg?' ('+msg+')':'')+'.';
}
/* Fusión segura del progreso: el tiempo solo crece, así que se queda el máximo de cada campo.
   Evita que un dispositivo con datos viejos pise lo que otro ya guardó. */
function mergeProg(a,b){
  const r={tot:{},hist:{},wk:{},ws:{},md:{}};
  IDS.forEach(i=>r.tot[i]=Math.max(a.tot[i]||0,b.tot[i]||0));
  new Set([...Object.keys(a.hist),...Object.keys(b.hist)]).forEach(k=>{
    const x=a.hist[k]||{},y=b.hist[k]||{},e={t:0};IDS.forEach(i=>{e[i]=Math.max(x[i]||0,y[i]||0);e.t+=e[i];const q=Math.max((x.q&&x.q[i])||0,(y.q&&y.q[i])||0);if(q)(e.q||(e.q={}))[i]=q});if(e.t)r.hist[k]=e});
  const wa=a.wk||{},wb=b.wk||{};
  new Set([...Object.keys(wa),...Object.keys(wb)]).forEach(k=>{const x=wa[k],y=wb[k];r.wk[k]=(!y||(x&&x.f+x.p>=y.f+y.p))?x:y});
  Object.keys(r.wk).sort().slice(0,-12).forEach(k=>delete r.wk[k]);
  r.ws={...(a.ws||{}),...(b.ws||{})};Object.keys(r.ws).sort().slice(0,-12).forEach(k=>delete r.ws[k]);
  [a.md||{},b.md||{}].forEach(s=>Object.keys(s).forEach(m=>Object.keys(s[m]).forEach(i=>{const e=r.md[m]||(r.md[m]={});if(!e[i]||s[m][i]>e[i])e[i]=s[m][i]})));
  const seen=new Set();
  r.sess=[...a.sess,...b.sess].filter(x=>{const q=x.at+'|'+x.s+'|'+x.d;if(seen.has(q))return false;seen.add(q);return true}).sort((p,q)=>q.at-p.at).slice(0,50);
  return r;
}
/* Progreso en la nube: como mucho una escritura cada 5 min mientras estudias, y al instante al pausar, terminar o cambiar ajustes. */
let pgQ=Promise.resolve(),lastPg='',lastPgAt=0;
const progObj=()=>({tot:S.tot,hist:S.hist,sess:S.sess,wk:S.wk,ws:S.ws,goalD:S.goalD,goalW:S.goalW,nick:S.nick,color:S.color,subs:S.subs,crs:S.crs,md:S.md,pomo:S.pomo,pw:S.pw,pb:S.pb});
const syncProgress=(force,keepalive)=>{
  if(keepalive){
    if(!fb.ok||!fb.acct||!S.nick)return;
    const o=progObj(),js=JSON.stringify(o);
    if(js===lastPg||js.length>55000)return; // keepalive admite ~64 KB
    lastPg=js;lastPgAt=Date.now();
    keepalivePatch('progress','uid',fb.uid,{data:o,updated_at:new Date().toISOString()});return;
  }
  return pgQ=pgQ.then(()=>pushProg(force));
};
async function pushProg(force){
  if(!fb.ok||!fb.acct)return true;
  const now=Date.now();
  if(!force&&now-lastPgAt<3e5)return true;
  if(!force&&JSON.stringify(progObj())===lastPg)return true;
  lastPgAt=now;
  try{
    const{data:row,error:se}=await sb.from('progress').select('data,rev').eq('uid',fb.uid).maybeSingle();
    if(se)throw se;
    if(row&&row.data){
      const c=clean(row.data),cr=Math.max(0,Math.floor(Number(row.rev))||0);
      if(cr>(S.rev||0)){ /* ajuste manual desde Supabase (rev + 1): la nube manda, se sustituye lo local */
        S.tot=c.tot;S.hist=c.hist;S.sess=c.sess;S.wk=c.wk;S.ws={...S.ws,...c.ws};S.md=c.md;S.rev=cr;stop();render()}
      else{const m=mergeProg(S,c);S.tot=m.tot;S.hist=m.hist;S.sess=m.sess;S.wk=m.wk;S.ws=m.ws;S.md=m.md;
        if(!S.nick){S.nick=c.nick;S.color=c.color;S.subs=c.subs;S.crs=c.crs;S.goalD=c.goalD;S.goalW=c.goalW}}
    }
    if(!S.nick)return true;
    const o=progObj(),js=JSON.stringify(o);
    if(js!==lastPg){
      const{error}=await sb.from('progress').upsert({uid:fb.uid,data:o,updated_at:new Date().toISOString()},{onConflict:'uid'});
      if(error)throw error;
    }
    lastPg=js;save(true);return true;
  }catch(e){console.warn('Progreso:',e.message||e);return false}
}
function authDlg(mode,keep){
  const d=$('#dlg'),reg=mode==='reg';
  d.onclick=null;
  d.innerHTML=`<h2 style="margin-top:0">${reg?'Crear cuenta':'Entrar a tu cuenta'}</h2>
  <div class="seg" style="margin:0"><button type="button" id="t-log" class="${reg?'':'on'}">Entrar</button><button type="button" id="t-reg" class="${reg?'on':''}">Crear cuenta</button></div>
  <label for="an">Nombre de usuario</label><input type="text" id="an" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(keep??(reg?S.nick:''))}" placeholder="Tu nombre">
  <label for="ap">Contraseña</label><input type="password" id="ap" autocomplete="${reg?'new-password':'current-password'}" placeholder="${reg?'Mínimo 6 caracteres':'Tu contraseña'}">
  ${reg?`<label for="ap2">Repite la contraseña</label><input type="password" id="ap2" autocomplete="new-password">`:''}
  <small id="aerr" style="display:block;color:#ef4444;margin-top:8px;min-height:1.4em"></small>
  <small style="display:block;color:var(--mut);margin-top:2px">${reg
    ?'Será tu nombre en el ranking. 3–20 caracteres (letras, números y espacios), único y no se podrá cambiar después. El progreso de este dispositivo pasará a tu cuenta.'
    :'Al entrar, el progreso de este dispositivo se sustituye por el de tu cuenta.'}</small>
  <div class="acts"><button class="mini" id="aok">${reg?'Crear cuenta':'Entrar'}</button><button class="ghost" id="ab">Volver</button></div>`;
  d.open||d.showModal();
  d.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();$('#aok').click()}};
  $('#an').oninput=e=>{const v=e.target.value.replace(new RegExp('[^'+NCH+' ]','g'),'');if(v!==e.target.value)e.target.value=v};
  $('#t-log').onclick=()=>authDlg('log',$('#an').value);
  $('#t-reg').onclick=()=>authDlg('reg',$('#an').value);
  $('#ab').onclick=()=>settings();
  $('#aok').onclick=()=>reg?doRegister():doLogin();
}
async function doRegister(){
  const b=$('#aok'),er=$('#aerr'),raw=$('#an').value.trim().replace(/\s+/g,' '),p=$('#ap').value,p2=$('#ap2').value;er.textContent='';
  const m=nickErr(raw);if(m)return er.textContent=m;
  if(p.length<6)return er.textContent='La contraseña debe tener al menos 6 caracteres.';
  if(p!==p2)return er.textContent='Las contraseñas no coinciden.';
  if(!fb.ok)return er.textContent='Sin conexión con el servidor. Inténtalo de nuevo más tarde.';
  b.disabled=true;
  try{
    /* 1) comprobar que el nombre está libre ANTES de crear el usuario */
    const{data:ex,error:ce}=await sb.from('nicks').select('uid,ts').eq('key',nickKey(raw)).maybeSingle();
    if(ce)throw{code:'nick-error'};
    if(ex&&Date.now()-(Date.parse(ex.ts)||0)<30*864e5)throw{code:'nick-taken'};
    /* 2) crear la cuenta (con "Confirm email" desactivado devuelve sesión al instante) */
    const{data,error}=await sb.auth.signUp({email:loginEmail(raw),password:p});
    if(error)throw error;
    if(!data.session)throw new Error('Desactiva "Confirm email" en Supabase › Authentication › Sign In / Providers › Email');
    fb.uid=data.session.user.id;fb.token=data.session.access_token;fb.acct=true;
    /* 3) reservar el nombre */
    const r=await claimNick(raw);
    if(r!=='ok'){
      try{await sb.auth.signOut();await sb.auth.signInAnonymously()}catch(x){}
      throw{code:r==='taken'?'nick-taken':'nick-error'};
    }
    S.nick=raw;lastPrSig='';lastProfSig='';lastProfAt=0;lastPg='';lastPgAt=0;save(true);
    closePres();
    await syncProgress(true);sync(true);$('#dlg').close();render();toast('Cuenta creada. Tu progreso ya se guarda en la nube.');
  }catch(e){er.textContent=authMsg(e)}
  b.disabled=false;
}
async function doLogin(){
  const b=$('#aok'),er=$('#aerr'),raw=$('#an').value.trim().replace(/\s+/g,' '),p=$('#ap').value;er.textContent='';
  if(!raw||!p)return er.textContent='Escribe tu nombre y tu contraseña.';
  if(nickErr(raw))return er.textContent='Nombre o contraseña incorrectos.';
  if(!fb.ok)return er.textContent='Sin conexión con el servidor. Inténtalo de nuevo más tarde.';
  if(!fb.acct&&stats().total>0&&!confirm('Este dispositivo tiene progreso que no está en ninguna cuenta. Si entras, se sustituirá por el progreso de la cuenta. ¿Continuar?'))return;
  b.disabled=true;
  try{
    const{data,error}=await sb.auth.signInWithPassword({email:loginEmail(raw),password:p});
    if(error)throw error;
    const uid=data.user.id,{data:pr,error:pe}=await sb.from('progress').select('data,rev').eq('uid',uid).maybeSingle();
    if(pe)throw pe;
    const ns=clean(pr&&pr.data);ns.rev=Math.max(0,Math.floor(Number(pr&&pr.rev))||0);
    if(!ns.nick){const{data:pf}=await sb.from('profiles').select('nickname').eq('id',uid).maybeSingle();ns.nick=String((pf&&pf.nickname)||'').slice(0,20)}
    if(!ns.nick)ns.nick=raw;
    stop();clearTimeout(saveT);freeze=true;
    localStorage.setItem(KEY,JSON.stringify({...ns,run:null}));localStorage.removeItem(OLD);
    toast('Progreso restaurado');setTimeout(()=>location.reload(),400);
  }catch(e){er.textContent=authMsg(e);b.disabled=false}
}
function pwDlg(){
  const d=$('#dlg');d.onclick=null;
  d.innerHTML=`<h2 style="margin-top:0">Cambiar contraseña</h2>
  <label for="p0">Contraseña actual</label><input type="password" id="p0" autocomplete="current-password">
  <label for="p1">Nueva contraseña</label><input type="password" id="p1" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
  <label for="p2">Repite la nueva contraseña</label><input type="password" id="p2" autocomplete="new-password">
  <small id="aerr" style="display:block;color:#ef4444;margin-top:8px;min-height:1.4em"></small>
  <div class="acts"><button class="mini" id="aok">Guardar</button><button class="ghost" id="ab">Volver</button></div>`;
  d.open||d.showModal();
  d.onkeydown=e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();$('#aok').click()}};
  $('#ab').onclick=()=>settings();
  $('#aok').onclick=async()=>{
    const b=$('#aok'),er=$('#aerr'),p0=$('#p0').value,p1=$('#p1').value,p2=$('#p2').value;er.textContent='';
    if(!p0)return er.textContent='Escribe tu contraseña actual.';
    if(p1.length<6)return er.textContent='La nueva contraseña debe tener al menos 6 caracteres.';
    if(p1!==p2)return er.textContent='Las contraseñas nuevas no coinciden.';
    b.disabled=true;
    try{
      const{data:{user}}=await sb.auth.getUser();
      if(!user||!user.email)throw new Error('Sesión no encontrada.');
      const{error:re}=await sb.auth.signInWithPassword({email:user.email,password:p0});if(re)throw re;
      const{error:ue}=await sb.auth.updateUser({password:p1});if(ue)throw ue;
      settings();toast('Contraseña cambiada');
    }catch(e){er.textContent=authMsg(e,'pw');b.disabled=false}
  };
}
async function logout(){
  if(!confirm('¿Cerrar sesión? Tu progreso queda guardado en tu cuenta y se restaura al volver a entrar.'))return;
  const b=$('#lo');if(b)b.disabled=true;
  if(S.run||S.cur>0)finish();
  const ok=await syncProgress(true);
  if(!ok&&!confirm('No se pudo guardar tu último progreso en la nube. Si cierras sesión ahora, se perderá lo que no esté guardado. ¿Cerrar sesión igualmente?')){if(b)b.disabled=false;return}
  try{await Promise.race([sb.from('profiles').update({online:false,active:null,since:null,last_seen:new Date().toISOString()}).eq('id',fb.uid),new Promise(r=>setTimeout(r,1500))])}catch(e){}
  closePres();freeze=true;clearTimeout(saveT);
  try{localStorage.removeItem(KEY);localStorage.removeItem(OLD)}catch(e){}
  try{await sb.auth.signOut()}catch(e){}
  location.reload();
}


function members(){
  const tk=dk(),wk=dk(weekFri()),now=Date.now(),out=[];
  new Set([...Object.keys(fb.users),...Object.keys(fb.pres),...(S.nick&&fb.uid?[fb.uid]:[])]).forEach(id=>{
    const me=id===fb.uid,u={...fb.users[id],...fb.pres[id]};
    if(me&&S.nick){const st=stats(),sk=streakCur();Object.assign(u,{streak:sk.n,streakEnd:sk.end,bestStreak:streakBest(sk.n),nickname:S.nick,avatarColor:S.color,totalSeconds:st.total,todaySeconds:st.today,todayDateKey:tk,weeklySeconds:st.week,weekStartKey:wk,gs:gsOut(),ms:msOut(),online:fb.ok,active:S.run?SUBJ[S.run].n:null,since:S.run?now+off-S.cur*1000:null,lastSeen:now,updatedAt:now})}
    if(!u.nickname||!NICK_RE.test(String(u.nickname)))return;
    if(!u.online&&now-(u.updatedAt||0)>30*864e5)return;           // usuarios fantasma
    const extra=(!me&&u.online&&u.active)?Math.min(600,Math.max(0,(now+off-(Math.max(+u.updatedAt||0,+u.since||0)||now+off))/1000)):0; // frescura de datos ajenos
    const mk=(d,w,t,sk,se,b,dl)=>{const lv=liveStreak({streak:sk,streakEnd:se});return{daily:(u.todayDateKey===tk?num(d,86400):0)+extra,weekly:(u.weekStartKey===wk?num(w):0)+extra,total:num(t)+extra,streak:lv,best:Math.max(num(b,36500),lv),dl:parseDl(dl)}};
    const grp={},um=u.ms&&typeof u.ms==='object'?u.ms:{},mm={n:num(um.n,9999),m:num(um.m,9999)};
    if(u.gs&&typeof u.gs==='object')Object.keys(GR).forEach(g=>{const x=u.gs[g];if(x&&typeof x==='object')grp[g]=mk(x.d,x.w,x.t,x.s,x.e,x.b,x.dl)});
    else grp.primero=mk(u.todaySeconds,u.weeklySeconds,u.totalSeconds,u.streak,u.streakEnd,u.bestStreak,null); // perfiles antiguos = Primero
    out.push({id,me,nick:String(u.nickname).slice(0,20),color:COLORS.includes(u.avatarColor)?u.avatarColor:COLORS[0],on:!!u.online,act:u.online?u.active:null,since:+u.since||0,seen:+u.lastSeen||+u.updatedAt||0,
      daily:(u.todayDateKey===tk?num(u.todaySeconds,86400):0)+extra,weekly:(u.weekStartKey===wk?num(u.weeklySeconds):0)+extra,total:num(u.totalSeconds)+extra,
      streak:liveStreak(u),best:Math.max(num(u.bestStreak,36500),liveStreak(u)),grp,ms:mm});
  });return out;
}

/* Misiones activas (tabla missions, solo lectura). Si la tabla no existe o está vacía, no se muestra nada. */
async function fetchMissions(){
  if(!fb.ok)return;
  try{
    const{data,error}=await sb.from('missions').select('id,subject,title,items,deadline').eq('active',true).order('sort').order('created_at');
    if(error)throw error;
    fb.missions=(data||[]).map(r=>({id:String(r.id).slice(0,40),s:IDS.includes(r.subject)?r.subject:'otros',title:String(r.title||'').slice(0,120),
      dl:/^\d{4}-\d{2}-\d{2}$/.test(r.deadline||'')?r.deadline:'',
      items:(Array.isArray(r.items)?r.items:[]).slice(0,60).map(i=>String(i).replace(/[|]/g,'').trim().slice(0,40)).filter(i=>i&&i!=='_')}));
    if(S.view==='group'&&(S.gv==='comm'||S.gv==='wrap')&&!typing())render();
  }catch(e){console.warn('Misiones:',e.message||e)}
}
