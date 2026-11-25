/* ---------- Datos base ---------- */
const KEY='mathstudy_hub_v2',OLD='mathstudy_hub_v1',POMO=[50*60,10*60];
const GR={primero:{n:'GMIN 1er'},segundo:{n:'GMIN 2n'},gmif1er:{n:'GMIF 1er'}};
const SUBJ={fonaments:{n:'Fonaments',c:'#6366f1',g:'primero'},algebra:{n:'Àlgebra Lineal I',c:'#10b981',g:'primero'},analisi:{n:'Anàlisi Matemàtica I',c:'#f43f5e',g:'primero'},programacio:{n:'Programació',c:'#f97316',g:'primero'},empresa:{n:'Empresa',c:'#eab308',g:'primero'},
  calcul:{n:'Càlcul Diferencial',sh:'Càlcul Diferencial',c:'#0ea5e9',g:'segundo'},topologia:{n:'Topologia',c:'#8b5cf6',g:'segundo'},digitals:{n:'Sistemes Digitals',c:'#f59e0b',g:'segundo'},
  algorismia:{n:'Algorísmia',sh:'Algorísmia',c:'#14b8a6',g:'segundo'},discreta:{n:'Discreta',sh:'Discreta',c:'#ec4899',g:'segundo'},abstracta:{n:'Àlgebra Abstracta I',c:'#84cc16',g:'segundo'},
  adde:{n:'AdDE',c:'#a855f7',g:'gmif1er'},fisica:{n:'Física',c:'#ef4444',g:'gmif1er'},
  otros:{n:'Otros',c:'#64748b'}};
const DEFAULT_SUBS=['fonaments','algebra','analisi'];
const NOWRAP='otros'; // no cuenta para «más/menos estudiada» ni «asignatura en alza/caída» del Recap
const IDS=Object.keys(SUBJ),COLORS=['#6366f1','#10b981','#f43f5e','#f59e0b','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];
const SYM=['∀','∃','∈','⊂','∪','∩','ℝ','ℕ','ℤ','∑','∫','∞','⇒','⇔','≠','≤','≥','λ','ϵ','δ'];
const blank=()=>({rev:0,theme:'light',view:'study',sel:'fonaments',mode:'free',pomo:false,pw:50,pb:10,nt:false,rank:'daily',gv:'friends',range:0,nick:'',color:COLORS[0],goalD:3,goalW:15,qsub:'objetivo',
  tot:Object.fromEntries(Object.keys(SUBJ).map(i=>[i,0])),subs:[...DEFAULT_SUBS],crs:['primero'],cg:'',hist:{},sess:[],wk:{},ws:{},md:{},q:{done:{},bg:{}},dq:{},
  run:null,cur:0,curAt:0,phase:0,rem:POMO[0]});
let S=blank(),last=0,loop=null,tick5=0,saveT=0;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NCH='A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ',NICK_RE=new RegExp('^['+NCH+']+(?: ['+NCH+']+)*$');
const nickKey=n=>String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ /g,'');
function nickErr(n){
  if(n.length<3||n.length>20)return 'El nombre debe tener entre 3 y 20 caracteres';
  if(!NICK_RE.test(n))return 'Solo letras, números y espacios (sin emojis ni símbolos)';
  if(!/^[a-z0-9]{3,20}$/.test(nickKey(n)))return 'Mínimo 3 caracteres sin contar los espacios';
  return '';
}
const num=(v,max=1e9)=>Math.min(max,Math.max(0,Math.floor(+v||0)));
/* El día empieza a las 4:00 y termina a las 4:00 del siguiente: lnow() devuelve la fecha 'lógica' (hora actual − 4 h). */
const DAY_OFF=4*36e5,lnow=(t=Date.now())=>new Date(t-DAY_OFF);
const dk=(d=lnow())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monday=()=>{const d=lnow();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
/* Semana de estudio: del viernes 14:00 al siguiente viernes 14:00 (como en la app anterior). El tiempo del viernes antes de las 14:00 se guarda en hist[día].q y cuenta para la semana anterior. */
const CUT=10*60; // 14:00 reales = 10:00 en lnow (día desplazado 4 h)
const isPre=(d=lnow())=>d.getDay()===5&&d.getHours()*60+d.getMinutes()<CUT;
const weekFri=()=>{const d=lnow(),s=new Date(d);s.setHours(0,0,0,0);s.setDate(s.getDate()-(d.getDay()+2)%7-(isPre(d)?7:0));return s};
const qOf=(v,ids)=>ids.reduce((a,i)=>a+((v.q&&v.q[i])||0),0);
function wkSecs(ids){
  const s=weekFri(),a=dk(s),z=dk(new Date(s.getFullYear(),s.getMonth(),s.getDate()+7));let w=0;
  Object.entries(S.hist).forEach(([d,v])=>{if(d<a||d>z)return;const t=ids.reduce((x,i)=>x+(v[i]||0),0),q=qOf(v,ids);w+=d===a?t-q:d===z?q:t});
  return Math.max(0,w);
}
const hm=s=>{s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h} h ${m} min`:`${m} min`};
const clock=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,p=n=>String(n).padStart(2,'0');return (h?h+':':'')+p(m)+':'+p(x)};
const day=k=>S.hist[k]?.t||0;
function toast(m,ms=2600){
  const t=$('#toast');t.textContent=m;clearTimeout(t._t);clearTimeout(t._h);
  try{if(!t.matches(':popover-open'))t.showPopover()}catch(e){}   // capa superior: queda por encima de los diálogos
  void t.offsetWidth;t.classList.add('show');
  t._t=setTimeout(()=>{t.classList.remove('show');t._h=setTimeout(()=>{try{t.hidePopover()}catch(e){}},350)},ms)}

/* ---------- Persistencia (con migración de la v1 y validación) ---------- */
function clean(p){
  const b=blank(),o=p&&typeof p==='object'?p:{};
  b.rev=Math.max(0,Math.floor(Number(o.rev))||0);
  b.theme=o.theme==='dark'?'dark':'light';
  b.nick=String(o.nick??o.userProfile?.nickname??'').trim().slice(0,20);
  b.color=COLORS.includes(o.color??o.userProfile?.avatarColor)?(o.color??o.userProfile.avatarColor):COLORS[0];
  b.goalD=Math.min(24,num(o.goalD??o.dailyGoalHours)||3);b.goalW=Math.min(168,num(o.goalW??o.weeklyGoalHours)||15);
  b.pomo=!!o.pomo;b.nt=!!o.nt;b.pw=Math.min(180,Math.max(1,num(o.pw)||50));b.pb=Math.min(60,Math.max(1,num(o.pb)||10));
  b.sel=IDS.includes(o.sel)?o.sel:'fonaments';b.range=o.range===30?30:o.range===7?7:0;b.mode=o.mode==='pomo'&&b.pomo?'pomo':'free';
  {const sb=[...new Set((Array.isArray(o.subs)?o.subs:[]).filter(i=>SUBJ[i]&&SUBJ[i].g))];
    let cr=(Array.isArray(o.crs)?o.crs:[]).filter(g=>GR[g]);if(!cr.length)cr=Object.keys(GR).filter(g=>sb.some(i=>SUBJ[i].g===g));if(!cr.length)cr=['primero'];
    b.crs=Object.keys(GR).filter(g=>cr.includes(g));
    let sx=sb.filter(i=>b.crs.includes(SUBJ[i].g));if(!sx.length)sx=IDS.filter(i=>SUBJ[i].g===b.crs[0]);
    b.subs=sx;b.cg=GR[o.cg]?o.cg:'';if(!b.subs.includes(b.sel)&&b.sel!=='otros')b.sel=b.subs[0]}
  /* Sesión en curso: se recupera al recargar o reabrir (queda en pausa, lista para «Reanudar» o «Terminar»). */
  b.phase=o.phase===1?1:0;b.cur=num(o.cur,86400);b.curAt=b.cur>0?num(o.curAt,1e13):0;
  {const L=(b.phase?b.pb:b.pw)*60,r=num(o.rem,L);b.rem=r>0&&r<=L?r:L}
  IDS.forEach(i=>{
    b.tot[i]=num(o.tot?.[i]??o.subjects?.[i]?.totalSeconds);
  });
  const h=o.hist??o.dailyHistory;
  if(h&&typeof h==='object')Object.keys(h).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).forEach(k=>{
    const e={t:0};IDS.forEach(i=>{e[i]=num(h[k]?.[i],86400);e.t+=e[i]});const q0=h[k]?.q,q=Array.isArray(q0)?Object.fromEntries(['fonaments','algebra','analisi','otros'].map((i,j)=>[i,num(q0[j],86400)])):q0&&typeof q0==='object'?q0:null;
    if(q){const o={};IDS.forEach(i=>{const v=Math.min(num(q[i],86400),e[i]);if(v)o[i]=v});if(Object.keys(o).length)e.q=o}if(e.t)b.hist[k]=e});
  const wk=o.wk;if(wk&&typeof wk==='object')Object.keys(wk).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-12).forEach(k=>{const v=wk[k]||{},h=(Array.isArray(v.h)?v.h:[]).slice(0,24).map(n=>num(n,86400));while(h.length<24)h.push(0);
    const l=v.l&&IDS.includes(v.l.s)&&num(v.l.d,86400)>0?{d:num(v.l.d,86400),s:v.l.s}:null;b.wk[k]={h,f:num(v.f,604800),p:num(v.p,604800),l}});
  if(o.md&&typeof o.md==='object'){let c=0;Object.keys(o.md).forEach(m=>{const v=o.md[m];if(!/^[\w-]{1,40}$/.test(m)||!v||typeof v!=='object')return;
    const e={};Object.keys(v).forEach(i=>{const z=String(v[i]),y=/^\d{4}-\d{2}-\d{2}$/.test(z)?'0000000000000:'+z:z;if(c<3000&&i.length<=40&&/^\d{13}:(\d{4}-\d{2}-\d{2})?$/.test(y)){e[i]=y;c++}});if(Object.keys(e).length)b.md[m]=e})}
  const ws=o.ws;if(ws&&typeof ws==='object')Object.keys(ws).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&ws[k]).sort().slice(-12).forEach(k=>{b.ws[k]=1});
  b.sess=(Array.isArray(o.sess??o.sessions)?(o.sess??o.sessions):[]).map(x=>({s:x.s??x.subjectId,d:num(x.d??x.durationSeconds,86400),at:x.at??(Date.parse(x.dateISO)||0),n:String(x.n??x.note??'').slice(0,60)})).filter(x=>IDS.includes(x.s)&&x.d>0).slice(0,50);
  /* Retos: done = {idDeReto:'AAAA-MM-DD'}, bg = {logro:'AAAA-MM-DD'}. Se validan y se limitan para no crecer sin control. */
  {const qs=o.q&&typeof o.q==='object'?o.q:{},qd={},qb={};
    Object.keys(qs.done||{}).filter(k=>typeof k==='string'&&k.length<=80&&/^[dwb]:/.test(k)).slice(-2000).forEach(k=>{const v=String(qs.done[k]||'');if(/^\d{4}-\d{2}-\d{2}$/.test(v))qd[k]=v});
    Object.keys(qs.bg||{}).filter(k=>/^[a-z0-9_-]{1,30}$/.test(k)).slice(-100).forEach(k=>{const v=String(qs.bg[k]||'');if(/^\d{4}-\d{2}-\d{2}$/.test(v))qb[k]=v});
    b.q={done:qd,bg:qb}}
  /* Quiz diario: dq = {'AAAA-MM-DD':'rej'|'win'|'lose'} (últimos 400 días) */
  if(o.dq&&typeof o.dq==='object')Object.keys(o.dq).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&['rej','win','lose'].includes(o.dq[k])).sort().slice(-400).forEach(k=>{b.dq[k]=o.dq[k]});
  return b;
}
const applyPomo=()=>{POMO[0]=S.pw*60;POMO[1]=S.pb*60};
function load(){let r;try{r=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD))}catch(e){}S=clean(r);applyPomo()}
/* Guardado con límite de frecuencia (throttle): como mucho una escritura cada 3 s.
   Antes era un debounce: tick() llama a save() cada segundo y cada llamada reiniciaba el temporizador de 3 s,
   así que mientras el cronómetro corría NUNCA se escribía nada en localStorage (solo al pausar o cerrar). */
let saveAt=0,saveWarned=false;
function save(now){
  clearTimeout(saveT);
  const go=()=>{saveAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify({...S,run:null}))}catch(e){
    if(!saveWarned){saveWarned=true;toast('No se puede guardar en este navegador (almacenamiento lleno o bloqueado). Tu progreso podría perderse.',6000)}}};
  if(now)go();else saveT=setTimeout(go,Math.max(0,3000-(Date.now()-saveAt)));
}
let freeze=false; // true mientras se cambia de cuenta: evita que el cierre de la página pise los datos
addEventListener('pagehide',()=>{if(freeze)return;save(true);sync(true,true)});
/* En móvil el navegador suele matar la pestaña sin lanzar pagehide: se guarda también al pasar a segundo plano. */
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!freeze)save(true)});
document.addEventListener('visibilitychange',()=>syncListeners());
/* Varias pestañas: la que arranca el cronómetro manda; las demás se actualizan y se pausan. */
addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;const v=S.view,g=S.gv,r=S.rank,c=S.cur,ca=S.curAt,ph=S.phase,rm=S.rem;load();S.view=v;S.gv=g;S.rank=r;S.cur=c;S.curAt=ca;S.phase=ph;S.rem=rm;stop();render();sync()});

/* ---------- Tiempo ---------- */
function addTime(id,d){
  S.tot[id]+=d;const k=dk(),e=S.hist[k]||(S.hist[k]={t:0,...Object.fromEntries(IDS.map(i=>[i,0]))});e[id]+=d;e.t+=d;if(isPre()){const q=e.q||(e.q={});q[id]=(q[id]||0)+d}
  const w=wkRec(dk(wkStart()),true);w.h[new Date().getHours()]+=d;w[S.mode==='pomo'?'p':'f']+=d;
}
function tick(){
  const now=Date.now(),d=Math.floor((now-last)/1000);if(d<1||!S.run)return;last+=d*1000;
  if(S.mode==='free'){S.cur+=d;S.curAt=now;addTime(S.run,d)}
  else{S.rem-=d;if(S.phase===0){S.cur+=d;S.curAt=now;addTime(S.run,d)}
    if(S.rem<=0){bell();if(S.phase===0){endSession('Pomodoro');S.phase=1;S.rem=POMO[1];toast('Pomodoro completado. Descansa '+S.pb+' minutos.')}
      else{S.phase=0;S.rem=POMO[0];S.run=null;stop();toast('Descanso terminado.');render()}}}
  paint();if(++tick5%30===0)sync();save();
}
function start(){if(!loop){last=Date.now();loop=setInterval(tick,300)}}
function stop(){clearInterval(loop);loop=null;S.run=null}
function toggle(){
  if(S.run){stop();toast('Pausado')}
  else{load2();S.run=S.sel;start()}
  render();sync(true);save(true);
}
/* Fusión del Quiz Diario: una respuesta (win/lose) gana a un rechazo; si hay dos respuestas distintas, se queda la de a. */
const qzMerge=(a,b)=>{const r={};[a,b].forEach(o=>Object.keys(o||{}).forEach(k=>{const v=o[k],c=r[k];if(!c||(c==='rej'&&v!=='rej'))r[k]=v}));return r};
function load2(){try{const r=JSON.parse(localStorage.getItem(KEY));if(r){const o=clean(r);S.tot=o.tot;S.hist=o.hist;S.sess=o.sess;S.wk=o.wk;S.ws={...S.ws,...o.ws};
  const d={...(S.q?.done||{})},b={...(S.q?.bg||{})};
  Object.keys(o.q?.done||{}).forEach(k=>{if(!d[k]||o.q.done[k]<d[k])d[k]=o.q.done[k]});
  Object.keys(o.q?.bg||{}).forEach(k=>{if(!b[k]||o.q.bg[k]<b[k])b[k]=o.q.bg[k]});
  S.q={done:d,bg:b};S.dq=qzMerge(S.dq,o.dq)}}catch(e){}}
function endSession(note){if(S.cur>=10){const at=S.curAt||Date.now();S.sess.unshift({s:S.run||S.sel,d:S.cur,at,n:note});S.sess=S.sess.slice(0,50);const w=wkRec(dk(wkStart(lnow(at))),true);if(!w.l||S.cur>w.l.d)w.l={d:S.cur,s:S.run||S.sel}}S.cur=0;S.curAt=0}
function finish(){const had=S.cur;stop();endSession(S.mode==='pomo'?'Pomodoro':'Libre');if(had>=10)toast('Sesión guardada: '+hm(had));S.phase=0;S.rem=POMO[0];render();sync(true);save(true)}
function bell(){try{const a=new(window.AudioContext||webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.2,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+1.4);o.start();o.stop(a.currentTime+1.5)}catch(e){}}

/* ---------- Estadísticas ---------- */
function stats(){
  const k=dk();
  return{total:IDS.reduce((a,i)=>a+S.tot[i],0),today:day(k),todayKey:k,week:wkSecs(IDS),weekKey:dk(weekFri())};
}
/* Racha: un día suma si se estudia al menos 1 hora (QUAL, ajustada por el Quiz Diario con qual(k)). Si hoy aún no llegas a 1 h, la racha no se pierde: cuenta hasta ayer. */
const QUAL=3600,QZ_MIN=300,dias=n=>n+(n===1?' día':' días');
/* Segundos necesarios para que el día k sume a la racha: 1 h, 5 min menos si hoy acertaste el Quiz Diario, 5 min más si fallaste. */
const qual=k=>{const r=S.dq&&S.dq[k];return QUAL+(r==='win'?-QZ_MIN:r==='lose'?QZ_MIN:0)};
const dayF=g=>g?k=>dayG(g,k):day;
function streakCur(g){
  const f=dayF(g);let n=0;const d=lnow();if(f(dk(d))<qual(dk(d)))d.setDate(d.getDate()-1);
  const end=dk(d);while(f(dk(d))>=qual(dk(d))){n++;d.setDate(d.getDate()-1)}
  return{n,end:n?end:''};
}
function streakBest(cur,g){
  const f=dayF(g);let best=0,run=0,prev=null;
  Object.keys(S.hist).filter(k=>f(k)>=qual(k)).sort().forEach(k=>{
    const[y,m,d]=k.split('-').map(Number),t=Date.UTC(y,m-1,d);
    run=prev!==null&&t-prev===864e5?run+1:1;prev=t;if(run>best)best=run});
  return Math.max(best,cur);
}
/* La racha guardada de otra persona solo vale si su último día contado es hoy o ayer. */
function liveStreak(u){
  const y=lnow();y.setDate(y.getDate()-1);
  return u.streakEnd===dk()||u.streakEnd===dk(y)?num(u.streak,36500):0;
}
const FL='<svg class="fl" viewBox="0 0 24 24" aria-hidden="true"><use href="#flame"/></svg>';
const fireBg=n=>n>0?'<svg class="bgf" viewBox="0 0 24 24" aria-hidden="true"><use href="#flame"/></svg>':'';
/* Fuego: de 1 a 4 días solo una llama tenue; desde el día 5 aparece el borde brillante y crece hasta el máximo en el día 30. */
const FIRE_MIN=5,FIRE_MAX=30;
const fireLv=n=>n<FIRE_MIN?0:Math.min(1,.25+.75*(n-FIRE_MIN)/(FIRE_MAX-FIRE_MIN));
const fireCls=n=>n>0?' fire'+(n>=FIRE_MIN?' fb':'')+(n>=FIRE_MAX?' max':''):'';
const fireVar=n=>n>0?`--fo:${(n<FIRE_MIN?.08:.12+.2*fireLv(n)).toFixed(2)};--fl:${fireLv(n).toFixed(2)}`:'';

/* ---------- Colores en orden de espectro (selector de ajustes) ---------- */
const SPECTRUM=['#f43f5e','#f59e0b','#10b981','#14b8a6','#0ea5e9','#6366f1','#8b5cf6','#ec4899'];

/* ---------- Letras de pizarra (𝔸 𝕓 ℂ…) para los avatares ---------- */
const BBX={C:'ℂ',H:'ℍ',N:'ℕ',P:'ℙ',Q:'ℚ',R:'ℝ',Z:'ℤ'};
function bb(n){
  const c=(String(n||'?').normalize('NFD').toUpperCase()[0]||'?');
  if(c>='A'&&c<='Z')return BBX[c]||String.fromCodePoint(0x1D538+c.charCodeAt(0)-65);
  if(c>='0'&&c<='9')return String.fromCodePoint(0x1D7D8+c.charCodeAt(0)-48);
  return c;
}

/* ---------- Objetivo y racha comunitarios ----------
   Cada día la comunidad tiene un objetivo de horas distinto entre CG_MIN y CG_MAX, igual para todos (sale de la fecha).
   El día cuenta si la suma de todos llega al objetivo; los días seguidos forman la racha comunitaria (fuego azul).
   Para saber los días pasados cada perfil publica dl = minutos de sus últimos días ("AAAA-MM-DD:min"). */
const CG_MIN=16,CG_MAX=25,CG_LOOK=45;
function cgHash(t){let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;return h>>>0}
const cgGoal=k=>CG_MIN+cgHash('mates-'+k)%(CG_MAX-CG_MIN+1);   // horas
function dayLogArr(g){const f=dayF(g),o=[],d=lnow();for(let i=0;i<CG_LOOK;i++){const k=dk(d),t=f(k);if(t>0)o.push(k+':'+Math.min(1440,Math.floor(t/60)));d.setDate(d.getDate()-1)}return o}
function parseDl(a){const o={};(Array.isArray(a)?a:[]).slice(0,CG_LOOK+5).forEach(x=>{const p=String(x).split(':');if(/^\d{4}-\d{2}-\d{2}$/.test(p[0]))o[p[0]]=num(p[1],1440)});return o}
function commStats(ms){
  const k0=dk(),secOf=k=>ms.reduce((a,m)=>a+(k===k0?m.daily:((m.dl||{})[k]||0)*60),0);
  const today=secOf(k0),done=today>=cgGoal(k0)*3600;
  let n=0;const d=lnow();if(!done)d.setDate(d.getDate()-1);
  while(n<CG_LOOK&&secOf(dk(d))>=cgGoal(dk(d))*3600){n++;d.setDate(d.getDate()-1)}
  return{today,done,n,secOf,ok:k=>secOf(k)>=cgGoal(k)*3600};
}

/* ---------- Grupos (cursos): cada grupo cuenta sus asignaturas + «Otros» ---------- */
const grpIds=g=>IDS.filter(i=>SUBJ[i].g===g||i==='otros');
const dayG=(g,k)=>{const e=S.hist[k];return e?grpIds(g).reduce((a,i)=>a+(e[i]||0),0):0};
const userGroups=()=>Object.keys(GR).filter(g=>S.crs.includes(g));
const curG=()=>userGroups().includes(S.cg)?S.cg:(userGroups()[0]||'primero');
const studyIds=()=>[...IDS.filter(i=>i!=='otros'&&S.subs.includes(i)),'otros'];
const statIds=()=>[...IDS.filter(i=>i!=='otros'&&(S.subs.includes(i)||S.tot[i]>0)),'otros'];
function gStats(g){
  const ids=grpIds(g),w=wkSecs(ids);
  const sk=streakCur(g);
  return{total:ids.reduce((a,i)=>a+S.tot[i],0),today:dayG(g,dk()),week:w,streak:sk.n,streakEnd:sk.end,best:streakBest(sk.n,g),dl:dayLogArr(g)};
}
/* Lo que se publica en el perfil: estadísticas de cada grupo al que pertenece la persona */
const gsOut=()=>Object.fromEntries(userGroups().map(g=>{const x=gStats(g);return[g,{t:x.total,d:x.today,w:x.week,s:x.streak,e:x.streakEnd,b:x.best,dl:x.dl}]}));

/* ---------- Misiones ----------
   Las crea admin.html en la tabla missions (items = lista de textos; vacía = misión de un solo paso '_').
   S.md = {idMisión:{item:'AAAA-MM-DD'}} (día en que se completó). Cada valor es 'ts13:día' (hecha) o 'ts13:' (desmarcada); en la fusión con la nube gana el más reciente. */
const mIts=x=>x.items.length?x.items:['_'];
const mv=v=>v?v.slice(14):'';
const mDone=x=>mIts(x).filter(i=>mv(S.md[x.id]?.[i])).length;
const kd=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
function msOut(){
  const L=fb.missions;if(!L)return null;let n=0,m=0;const w={};
  L.forEach(x=>{const d=S.md[x.id]||{};mIts(x).forEach(i=>{const v=mv(d[i]);if(v){n++;const k=dk(wkStart(kd(v)));w[k]=(w[k]||0)+1}});if(mDone(x)===mIts(x).length)m++});
  return{n,m,w:Object.fromEntries(Object.keys(w).sort().slice(-9).map(k=>[k,w[k]]))};
}
