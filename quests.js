/* ---------- Retos automáticos y recompensas ----------
   Todo se genera en el navegador a partir de la fecha, las asignaturas, las misiones y el historial.
   No hace falta administración: los retos diarios cambian a las 4:00 y los semanales, el sábado a las 4:00.
   S.q = { done:{idDeReto:'AAAA-MM-DD'}, bg:{logro:'AAAA-MM-DD'} }
   Las recompensas se acreditan solas (XP + chispas) y los logros se desbloquean al cumplir su condición. */

const QLVL=[
  {xp:0,n:'Semilla de π',d:'Todo gran teorema empieza con una idea pequeña.'},
  {xp:120,n:'Aprendiz de lemas',d:'Ya distingues una hipótesis de una conclusión.'},
  {xp:320,n:'Cazador de teoremas',d:'Hueles las demostraciones a distancia.'},
  {xp:650,n:'Domador de demostraciones',d:'Los cuantificadores ya no te asustan.'},
  {xp:1100,n:'Arquitecto de estructuras',d:'Construyes conocimiento con cimientos firmes.'},
  {xp:1800,n:'Oráculo de axiomas',d:'Ves la estructura detrás de cada problema.'},
  {xp:2800,n:'Leyenda de MatEstudi',d:'Tu constancia ya es materia de estudio.'}
];
/* [XP, chispas] por tipo de reto. Los ids llevan el tipo en la tercera posición: d:fecha:tipo[:asignatura] */
const QREW={warmup:[30,1],focus:[35,2],session:[40,2],dual:[45,2],triple:[50,3],goal:[60,3],pomo:[35,2],
  marathon:[100,5],missions:[120,6],journey:[130,6],days:[90,4]};
const QBADGES=[
  {id:'first',icon:'🌱',n:'Primer trazo',d:'Tu primera sesión de estudio.',xp:30,sp:2,ck:()=>stats().total>0||(S.sess||[]).length>0},
  {id:'spark',icon:'✨',n:'Chispa de foco',d:'Completa tu primer reto.',xp:40,sp:3,ck:()=>Object.keys(qState().done).length>0},
  {id:'ternary',icon:'🔥',n:'Ritmo ternario',d:'Racha de 3 días estudiando 1 h o más.',xp:80,sp:5,ck:()=>streakBest(streakCur().n)>=3},
  {id:'perfect',icon:'🗓️',n:'Semana perfecta',d:'Racha de 7 días estudiando 1 h o más.',xp:180,sp:10,ck:()=>streakBest(streakCur().n)>=7},
  {id:'firemonth',icon:'🌙',n:'Mes de fuego',d:'30 días seguidos de estudio.',xp:500,sp:25,ck:()=>streakBest(streakCur().n)>=30},
  {id:'marathon',icon:'🏔️',n:'Ultramaratón',d:'Completa una sesión de 2 h o más.',xp:100,sp:6,ck:()=>qMarathon()},
  {id:'dawn',icon:'🌅',n:'Madrugador',d:'Empieza una sesión de 30 min antes de las 7:00.',xp:60,sp:4,ck:()=>qSess(30).some(x=>new Date(x.at-x.d*1000).getHours()<7)},
  {id:'owl',icon:'🦉',n:'Búho de medianoche',d:'Termina una sesión de 30 min entre la 1:00 y las 5:00.',xp:60,sp:4,ck:()=>qSess(30).some(x=>{const h=new Date(x.at).getHours();return h>=1&&h<5})},
  {id:'explorer',icon:'🧭',n:'Explorador',d:'Estudia 3 asignaturas distintas.',xp:90,sp:5,ck:()=>IDS.filter(i=>i!=='otros'&&S.tot[i]>0).length>=3},
  {id:'poly',icon:'🧮',n:'Polímata',d:'Estudia 5 asignaturas distintas.',xp:250,sp:15,ck:()=>IDS.filter(i=>i!=='otros'&&S.tot[i]>0).length>=5},
  {id:'hunter',icon:'🎯',n:'Cazador de misiones',d:'Marca 10 tareas de misión.',xp:100,sp:6,ck:()=>qMissionTasks()>=10},
  {id:'clock',icon:'🍅',n:'Relojero',d:'Completa 10 pomodoros.',xp:80,sp:5,ck:()=>qSess(1).filter(x=>x.n==='Pomodoro').length>=10},
  {id:'round',icon:'💯',n:'Día redondo',d:'Alcanza tu meta diaria de estudio.',xp:80,sp:5,ck:()=>Object.keys(S.hist||{}).some(k=>day(k)>=(S.goalD||3)*3600)},
  {id:'century',icon:'🏛️',n:'Centurión',d:'100 h de estudio acumuladas.',xp:200,sp:12,ck:()=>stats().total>=100*3600},
  {id:'five',icon:'🏆',n:'Coleccionista de retos',d:'Completa 5 retos.',xp:80,sp:5,ck:()=>Object.keys(qState().done).length>=5},
  {id:'qweek',icon:'📅',n:'Semana de retos',d:'Completa un reto diario 7 días seguidos.',xp:150,sp:8,ck:()=>qDayStreak()>=7}
];

const qAddD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const qWeekStart=(d=lnow())=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+1)%7));return x};
const qRound5=s=>Math.max(300,Math.round(s/300)*300);
const qClamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function qState(){
  if(!S.q||typeof S.q!=='object')S.q={done:{},bg:{}};
  if(!S.q.done||typeof S.q.done!=='object')S.q.done={};
  if(!S.q.bg||typeof S.q.bg!=='object')S.q.bg={};
  return S.q;
}
const qIsDone=id=>!!qState().done[id];
const qDisplayDone=x=>qIsDone(x.id)||x.cur>=x.goal;
const qReward=id=>{const r=QREW[String(id).split(':')[2]]||[30,1];return{xp:r[0],sp:r[1]}};
function qMark(id){qState().done[id]=dk()}
function qTotals(){
  let xp=0,sp=0,n=0;
  Object.keys(qState().done).forEach(id=>{const r=qReward(id);xp+=r.xp;sp+=r.sp;n++});
  Object.keys(qState().bg).forEach(id=>{const b=QBADGES.find(x=>x.id===id);if(b){xp+=b.xp;sp+=b.sp}});
  return{xp,sp,quests:n,badges:Object.keys(qState().bg).length};
}
function qLevel(xp){let i=0;while(i<QLVL.length-1&&xp>=QLVL[i+1].xp)i++;return i}
const qPct=x=>x.goal?Math.min(100,Math.max(0,x.cur/x.goal*100)):0;
const qSubjectPool=()=>(S.subs&&S.subs.length?S.subs:['fonaments']).filter(i=>SUBJ[i]);
function qSubject(seed,off=0){const p=qSubjectPool();return p[(seed+off)%p.length]||'fonaments'}
function qSessionStart(x){return x.at-x.d*1000}
function qSess(min=0){return (S.sess||[]).filter(x=>x.d>=min)}
function qMarathon(){return (S.sess||[]).some(x=>x.d>=7200)||S.cur>=7200}
function qMissionTasks(){
  let n=0;Object.values(S.md||{}).forEach(d=>Object.values(d||{}).forEach(v=>{if(mv(v))n++}));return n;
}
function qDayStreak(){
  const days=new Set();
  Object.keys(qState().done).forEach(id=>{if(id.indexOf('d:')===0)days.add(id.split(':')[1])});
  const d=lnow();if(!days.has(dk(d)))d.setDate(d.getDate()-1);
  let n=0;while(n<36500&&days.has(dk(d))){n++;d.setDate(d.getDate()-1)}
  return n;
}
function qSubjectStreak(sub){
  const f=k=>(S.hist[k]?.[sub]||0);
  const d=lnow();if(f(dk(d))<3600)d.setDate(d.getDate()-1);
  let n=0;while(n<36500&&f(dk(d))>=3600){n++;d.setDate(d.getDate()-1)}
  return n;
}
function qWeekSessions(){
  const a=dk(qWeekStart()),b=dk(qAddD(qWeekStart(),7));
  return (S.sess||[]).filter(x=>{const k=dk(lnow(x.at));return k>=a&&k<b});
}
function qMissionDone(x,a,b){
  const d=S.md?.[x.id]||{},v=mIts(x).map(i=>mv(d[i]));
  if(!v.length||v.some(x=>!x))return false;
  const last=v.slice().sort().pop();
  return last>=a&&last<b;
}
function qWeekDays(a,b){
  const s=new Set();Object.keys(S.hist||{}).forEach(k=>{if(k>=a&&k<b&&day(k)>=3600)s.add(k)});return s.size;
}

/* Retos de hoy: siempre hay 3. El tercero rota según la fecha y tus ajustes. */
function qDaily(){
  const k=dk(),seed=cgHash('retos-dia:'+k),sub=qSubject(seed);
  const gd=S.goalD||3;
  const warm=qClamp(qRound5(gd*900),900,5400);
  const focus=qClamp(qRound5(gd*1080),1200,5400);
  const L=[
    {id:`d:${k}:warmup`,tpl:'warmup',icon:'⚡',name:'Calentamiento mental',desc:`Estudia hoy al menos ${hm(warm)}.`,xp:QREW.warmup[0],sp:QREW.warmup[1],cur:day(k),goal:warm,unit:'time'},
    {id:`d:${k}:focus:${sub}`,tpl:'focus',icon:'🧭',name:`Expedición a ${SUBJ[sub].sh||SUBJ[sub].n}`,desc:`Estudia ${hm(focus)} de ${SUBJ[sub].n} hoy.`,xp:QREW.focus[0],sp:QREW.focus[1],cur:(S.hist[k]?.[sub]||0),goal:focus,unit:'time'}
  ];
  const pool=['session','dual','triple'];
  if(S.pomo)pool.push('pomo');
  if(gd<=8)pool.push('goal');
  const pick=pool[(seed>>>5)%pool.length];
  if(pick==='session'){
    const goal=qClamp(qRound5(gd*720)+(seed%3)*300,1500,3600);
    const cur=Math.max(0,...qSess().filter(x=>dk(lnow(x.at))===k).map(x=>x.d),S.run?S.cur:0);
    L.push({id:`d:${k}:session`,tpl:'session',icon:'⏱️',name:'Sprint de acero',desc:`Completa una sesión de ${hm(goal)} o más.`,xp:QREW.session[0],sp:QREW.session[1],cur,goal,unit:'time'});
  }else if(pick==='dual'){
    const cur=IDS.filter(i=>(S.hist[k]?.[i]||0)>=1200).length;
    L.push({id:`d:${k}:dual`,tpl:'dual',icon:'🔀',name:'Doble salto mortal',desc:'Estudia al menos 20 min en dos asignaturas distintas.',xp:QREW.dual[0],sp:QREW.dual[1],cur,goal:2,unit:'subjects'});
  }else if(pick==='triple'){
    const cur=IDS.filter(i=>(S.hist[k]?.[i]||0)>=600).length;
    L.push({id:`d:${k}:triple`,tpl:'triple',icon:'🎪',name:'Triple salto mortal',desc:'Estudia al menos 10 min en tres asignaturas distintas.',xp:QREW.triple[0],sp:QREW.triple[1],cur,goal:3,unit:'subjects'});
  }else if(pick==='pomo'){
    const goal=2+(seed%2),cur=qSess(60).filter(x=>x.n==='Pomodoro'&&dk(lnow(x.at))===k).length;
    L.push({id:`d:${k}:pomo`,tpl:'pomo',icon:'🍅',name:'Pomodoro perfecto',desc:`Completa ${goal} pomodoros hoy.`,xp:QREW.pomo[0],sp:QREW.pomo[1],cur,goal,unit:'pomos'});
  }else{
    const goal=gd*3600;
    L.push({id:`d:${k}:goal`,tpl:'goal',icon:'🎯',name:'Día redondo',desc:`Llega a tu meta diaria de ${gd} h.`,xp:QREW.goal[0],sp:QREW.goal[1],cur:day(k),goal,unit:'time'});
  }
  return L;
}

/* Retos de la semana: una sesión larga, misiones activas (o días de constancia) y una travesía por asignatura. */
function qWeekly(){
  const ws=qWeekStart(),a=dk(ws),b=dk(qAddD(ws,7)),seed=cgHash('retos-semana:'+a);
  const max=Math.max(0,...qWeekSessions().map(x=>x.d),S.run?S.cur:0);
  const marathon={id:`w:${a}:marathon`,tpl:'marathon',icon:'🏔️',name:'Maratón de teoremas',desc:'Completa una sesión de 2 h o más esta semana.',xp:QREW.marathon[0],sp:QREW.marathon[1],cur:max,goal:7200,unit:'time'};
  const L=(typeof fb!=='undefined'&&Array.isArray(fb.missions))?fb.missions:[];
  let third;
  if(L.length){
    const goal=Math.min(2,L.length),cur=Math.min(goal,L.filter(x=>qMissionDone(x,a,b)).length);
    third={id:`w:${a}:missions`,tpl:'missions',icon:'🎯',name:L.length===1?'Misión relámpago':'Misiones imposibles',
      desc:L.length===1?'Completa la misión activa esta semana.':`Completa ${goal} misiones activas esta semana.`,xp:QREW.missions[0],sp:QREW.missions[1],cur,goal,unit:'missions'};
  }else{
    const goal=4,cur=Math.min(goal,qWeekDays(a,b));
    third={id:`w:${a}:days`,tpl:'days',icon:'🛡️',name:'Constancia de acero',desc:'Estudia 1 h o más en 4 días distintos esta semana.',xp:QREW.days[0],sp:QREW.days[1],cur,goal,unit:'days'};
  }
  const sub=qSubject(seed,1),run=qSubjectStreak(sub);
  const marks=[];const d0=lnow();
  for(let i=6;i>=0;i--){const d=qAddD(d0,-i),k=dk(d),t=S.hist[k]?.[sub]||0;marks.push({k,t,ok:t>=3600})}
  const journey={id:`w:${a}:journey:${sub}`,tpl:'journey',icon:'🧗',name:`La travesía de ${SUBJ[sub].sh||SUBJ[sub].n}`,
    desc:`Estudia ${SUBJ[sub].n} 1 h al día durante 3 días seguidos.`,xp:QREW.journey[0],sp:QREW.journey[1],cur:Math.min(3,run),goal:3,unit:'days',marks,real:run};
  return[marathon,third,journey];
}

function qProgressText(x){
  if(x.unit==='time')return `${hm(Math.min(x.cur,x.goal))} / ${hm(x.goal)}`;
  if(x.unit==='subjects')return `${Math.min(x.cur,x.goal)} / ${x.goal} asignaturas`;
  if(x.unit==='pomos')return `${Math.min(x.cur,x.goal)} / ${x.goal} pomodoros`;
  if(x.unit==='missions')return `${Math.min(x.cur,x.goal)} / ${x.goal} misiones`;
  if(x.unit==='days')return `${Math.min(x.cur,x.goal)} / ${x.goal} días`;
  return `${Math.min(x.cur,x.goal)} / ${x.goal}`;
}

/* Recompensas automáticas. Devuelve los retos y logros nuevos para que quien llama actualice la pantalla. */
let qLastCheck=0,qBoot=true;
function questsCheck(force){
  if(!S)return{newQ:[],newB:[]};
  const now=Date.now();
  if(!force&&now-qLastCheck<1200)return{newQ:[],newB:[]};
  qLastCheck=now;
  const before=qTotals(),all=[...qDaily(),...qWeekly()];
  const newQ=all.filter(x=>!qIsDone(x.id)&&x.cur>=x.goal);
  newQ.forEach(x=>qMark(x.id));
  const newB=QBADGES.filter(b=>!qState().bg[b.id]&&b.ck());
  newB.forEach(b=>{qState().bg[b.id]=dk()});
  if(newQ.length||newB.length){
    save(true);
    try{if(typeof sync==='function')sync(true)}catch(e){}
    const after=qTotals(),names=[...newQ.map(x=>x.name),...newB.map(x=>x.n)];
    const xp=after.xp-before.xp,sp=after.sp-before.sp,tot=newQ.length+newB.length;
    let m=qBoot&&tot>2?`✨ +${xp} XP y +${sp} chispas por ${tot} recompensas pendientes.`
      :`${newQ.length?'⚡ ':'🏅 '}${names.slice(0,2).join(' · ')}${names.length>2?' +'+(names.length-2):''} · +${xp} XP`;
    const la=qLevel(after.xp),lb=qLevel(before.xp);
    if(la>lb)m+=` · ¡Nivel ${la+1}: ${QLVL[la].n}!`;
    toast(m,5200);
  }
  qBoot=false;
  return{newQ,newB};
}

/* Tarjeta compacta en la pantalla de estudiar */
function qMiniInner(){
  const L=qDaily(),done=L.filter(qDisplayDone).length,t=qTotals(),lv=QLVL[qLevel(t.xp)];
  return `<div class="qmh"><div><span class="qk">Retos de hoy</span><b>${done} / ${L.length}</b></div><button type="button" class="qall" data-qgo="1">Ver retos <span>›</span></button></div>
  <div class="qmbar"><i style="width:${L.length?done/L.length*100:0}%"></i></div>
  <div class="qml">${L.map(x=>{const dn=qDisplayDone(x);return `<div class="qmr${dn?' done':''}"><span class="qmi">${dn?'✓':x.icon}</span><span class="qmn"><b>${esc(x.name)}</b><small>${qProgressText(x)}</small></span><span class="qmx">+${x.xp} XP</span></div>`}).join('')}</div>
  <div class="qmf"><span>Nivel ${qLevel(t.xp)+1} · ${esc(lv.n)}</span><span>✦ ${t.sp} chispas</span></div>`;
}
function questCard(){return `<div class="card qmini" id="qmini">${qMiniInner()}</div>`}
function questMiniRefresh(){
  const e=document.getElementById('qmini');if(!e)return;
  const h=qMiniInner();if(e._qh!==h){e._qh=h;e.innerHTML=h}
}

/* Pantalla de retos */
function qCardHtml(x){
  const done=qDisplayDone(x),pct=qPct(x);
  return `<div class="card qc${done?' done':''}">
  <div class="qch"><span class="qico">${done?'✓':x.icon}</span><div class="qcn"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></div><span class="qrw"><b>+${x.xp}</b> XP<small>+${x.sp} ✦</small></span></div>
  <div class="qpr"><i style="width:${pct.toFixed(1)}%"></i></div>
  <div class="qft"><span>${qProgressText(x)}</span><span>${done?'Completado':Math.floor(pct)+'%'}</span></div>
  ${x.marks?`<div class="qdays" title="Últimos 7 días">${x.marks.map(m=>`<span class="${m.ok?'ok':''}${m.k===dk()?' hoy':''}" title="${m.k}: ${hm(m.t)}"><i>${m.ok?'✓':''}</i>${'DLMXJVS'[new Date(m.k+'T00:00:00').getDay()]}</span>`).join('')}</div>`:''}
  </div>`;
}
function qBadgeHtml(b){
  const u=!!qState().bg[b.id];
  return `<div class="card qb${u?' on':''}"><span class="qbi">${b.icon}</span><div><b>${esc(b.n)}${u?' ✓':''}</b><small>${esc(b.d)}</small><span class="qbr">+${b.xp} XP · +${b.sp} ✦</span></div></div>`;
}
function questsView(){
  const D=qDaily(),W=qWeekly(),t=qTotals(),li=qLevel(t.xp),lv=QLVL[li],nx=QLVL[li+1];
  const prev=lv.xp,pr=nx?Math.min(100,(t.xp-prev)/(nx.xp-prev)*100):100;
  const nb=QBADGES.filter(b=>qState().bg[b.id]).length;
  const qSub=S.qsub||'objetivo';
  const all=members(),g=curG(),ms=all.filter(m=>m.grp[g]).map(m=>({...m,...m.grp[g]}));
  
  // Objetivo subtab: EXACTLY like old commView (today's objective + Aportación de hoy)
  const objHtml=typeof commView==='function'?commView(ms):'';
  
  // Misiones subtab: hero + missions + ranking + daily + weekly + achievements
  const hero=`<div class="card qhero">
  <div class="qh-top"><span class="qh-lv">Nivel ${li+1} de ${QLVL.length}</span><span class="qh-sp">✦ ${t.sp} chispas</span></div>
  <div class="qh-title">${esc(lv.n)}</div><div class="qh-sub">${esc(lv.d)}</div>
  <div class="qh-bar"><i style="width:${pr.toFixed(1)}%"></i></div>
  <div class="qh-sub">${nx?`${t.xp} XP · te faltan ${nx.xp-t.xp} XP para ${esc(nx.n)}`:`${t.xp} XP · nivel máximo alcanzado`}</div>
  <div class="qh-stats"><span>🔥 Racha de retos: ${qDayStreak()} ${qDayStreak()===1?'día':'días'}</span><span>🏅 Logros: ${nb} / ${QBADGES.length}</span></div></div>`;
  const tabs=pill('qsub',[['objetivo','Objetivo'],['misiones','Misiones']],qSub,'data-qsub','full');
  const misHtml=qMissionsHtml();
  const misContent=`<div class="hd"><h2>Retos de hoy</h2><span class="qhint">Se renuevan a las 4:00</span></div>
  <div class="qlist">${D.map(qCardHtml).join('')}</div>
  <div class="hd"><h2>Retos de la semana</h2><span class="qhint">Se renuevan el sábado a las 4:00</span></div>
  <div class="qlist">${W.map(qCardHtml).join('')}</div>
  <div class="hd"><h2>Logros</h2><span class="qhint">${nb} de ${QBADGES.length}</span></div>
  <div class="qbg">${QBADGES.map(qBadgeHtml).join('')}</div>`;
  
  const content=qSub==='objetivo'?tabs+objHtml:tabs+hero+misHtml+misContent;
  return content;
}
function qMissionsHtml(){
  const L=fb.missions;if(!L||!L.length)return '';
  const k0=dk(),fin=x=>mDone(x)===mIts(x).length,ord=[...L].sort((a,b)=>fin(a)-fin(b)||(a.dl||'9').localeCompare(b.dl||'9'));
  const bdg=x=>{if(!x.dl||fin(x))return '';const n=Math.round((kd(x.dl)-kd(k0))/864e5);
    return `<span class="mdl${n<0?' late':n<=2?' soon':''}">${n<0?'Vencida':n===0?'Hoy':n===1?'Mañana':'En '+n+' días'}</span>`};
  let h=`<div class="hd"><h2>Misiones</h2></div><div class="qlist">`+ord.map(x=>{const d=S.md[x.id]||{},its=mIts(x),n=mDone(x);
    return `<div class="card mis${fin(x)?' fin':''}"><div class="mh"><b style="color:${SUBJ[x.s].c}">${esc(x.title)}</b>${bdg(x)}</div>
    <div class="cap" style="margin-top:2px">${esc(SUBJ[x.s].n)}${x.items.length?' · '+n+'/'+its.length:fin(x)?' · Hecha':''}</div>
    <div class="mit">${its.map(i=>`<button type="button" class="${mv(d[i])?'on':''}" data-mi="${esc(x.id)}|${esc(i)}">${mv(d[i])?'✓ ':''}${i==='_'?'Marcar como hecha':esc(i)}</button>`).join('')}</div></div>`}).join('');
  const R=Object.values(fb.users||{}).filter(m=>m.ms&&m.ms.n>0).sort((a,b)=>b.ms.n-a.ms.n||b.ms.m-a.ms.m||(a.nick||'').localeCompare(b.nick||''));
  h+=`<div class="hd"><h2>Ranking de misiones</h2></div>`+(R.length?`<div class="qlist">${R.map((m,i)=>`<div class="m ${m.me?'me1':''}"><div class="pos">${['🥇','🥈','🥉'][i]||i+1}</div>
  <div class="av ${m.on?'on':''}" style="background:${m.color}">${bb(m.nick)}</div><div class="n"><b>${esc(m.nick)}${m.me?' (tú)':''}</b><small>${m.ms.m} ${m.ms.m===1?'misión completa':'misiones completas'}</small></div><div class="t">${m.ms.n} ✓</div></div>`).join('')}</div>`
    :`<div class="empty">Nadie ha completado tareas todavía.</div>`);
  return h+'</div>';
}

/* Actualización suave mientras la pantalla de retos está abierta */
let qViewSig='';
function qViewSignature(){
  const L=[...qDaily(),...qWeekly()];
  return L.map(x=>{const v=Math.min(x.cur,x.goal);return x.id+':'+(x.unit==='time'?Math.floor(v/30):v)}).join('|')+'|'+Object.keys(qState().done).length+'|'+Object.keys(qState().bg).length;
}
function qViewLive(){
  if(S.view!=='quests'||document.hidden)return;
  if(typeof typing==='function'&&typing())return;
  const s=qViewSignature();if(s!==qViewSig){qViewSig=s;render()}
}

document.addEventListener('click',e=>{
  const t=e.target;
  if(t&&t.closest&&t.closest('[data-qgo]')){S.view='quests';save();render()}
});

/* Primero se deja arrancar la app (load/render) y después se revisan las recompensas pendientes. */
setTimeout(()=>{
  try{
    const r=questsCheck(true);
    if(S.view==='quests')render();else questMiniRefresh();
    if(r.newQ.length||r.newB.length)qViewSig=qViewSignature();
  }catch(e){console.warn('Retos:',e)}
},0);
setInterval(()=>{
  try{
    const r=questsCheck();
    if(S.view==='quests'){
      const s=qViewSignature();
      if(r.newQ.length||r.newB.length||s!==qViewSig){qViewSig=s;render()}
    }else if(S.view==='study')questMiniRefresh();
  }catch(e){console.warn('Retos:',e)}
},5000);
