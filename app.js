/* ---------- Interfaz ---------- */
const DARKQ=matchMedia('(prefers-color-scheme: dark)');DARKQ.addEventListener('change',()=>setAcc());
function setAcc(){const r=document.documentElement;r.dataset.t=DARKQ.matches?'dark':'light';r.style.setProperty('--acc',SUBJ[S.sel].c)}
function paint(){
  const st=stats(),gD=S.goalD*3600,gW=S.goalW*3600,t=$('#tm');if(!t)return;
  t.textContent=clock(S.mode==='free'?S.cur:S.rem);
  const circ=2*Math.PI*45,frac=ringFrac(),pg=$('#pg');
  if(frac<ringPrev){pg.style.transition='none';pg.style.strokeDashoffset=circ*(1-frac);pg.getBoundingClientRect();pg.style.transition=''}
  else pg.style.strokeDashoffset=circ*(1-frac);
  pg.style.strokeOpacity=frac>.002?1:0;ringPrev=frac;
  $('#sub').textContent=S.mode==='pomo'&&S.phase?'Descanso':(S.run?'Estudiando '+SUBJ[S.run].n:'Sesión de hoy');
  const pd=Math.min(100,st.today/gD*100),pw=Math.min(100,st.week/gW*100);
  $('#v-today').textContent=hm(st.today);$('#gbar').style.width=pd+'%';$('#gtxt').textContent=`${Math.round(pd)}% de ${S.goalD} h`;
  $('#v-week').textContent=hm(st.week);$('#wbar').style.width=pw+'%';$('#wtxt').textContent=`${Math.round(pw)}% de ${S.goalW} h`;
  const sk=streakCur();
  $('#v-streak').textContent=dias(sk.n);$('#stk-ico').classList.toggle('off',!sk.n);
  $('#stk-card').style.cssText=fireVar(sk.n);
  $('#stk-note').textContent=st.today>=QUAL?'':`Faltan ${Math.ceil((QUAL-st.today)/60)} min`;
  const ck=$('#stk-chk');if(ck){const mo=monday(),tk=dk(),hh=[...Array(7)].map((_,i)=>{const d=new Date(mo);d.setDate(mo.getDate()+i);const ok=day(dk(d))>=QUAL;return `<span class="${ok?'ok':''}${dk(d)===tk?' hoy':''}" title="${ok?'Racha cumplida':'Sin racha'}"><i>${ok?'✓':''}</i>${'DLMXJVS'[d.getDay()]}</span>`}).join('');if(ck._h!==hh){ck._h=hh;ck.innerHTML=hh}}
  if(((S.view==='group'&&S.gv!=='chat')||S.view==='stats')&&tick5%10===0&&document.activeElement.tagName!=='INPUT')render();
}
const ringFrac=()=>S.mode==='free'?(S.cur%3600)/3600:1-S.rem/POMO[S.phase];
/* Selector segmentado con indicador deslizante (el índice activo va en --i) */
const pill=(id,items,cur,attr,cls='')=>`<div class="seg pill ${cls}" data-sg="${id}" style="--n:${items.length};--i:${Math.max(0,items.findIndex(x=>x[0]===cur))}">${items.map(([k,l])=>`<button type="button" ${attr}="${k}" class="${k===cur?'on':''}">${l}</button>`).join('')}</div>`;
const segPrev={};
function segAnim(){document.querySelectorAll('.pill[data-sg]').forEach(e=>{const id=e.dataset.sg,i=+e.style.getPropertyValue('--i'),p=segPrev[id];segPrev[id]=i;if(p!==undefined&&p!==i){e.style.setProperty('--i',p);void e.offsetWidth;e.style.setProperty('--i',i)}})}
function study(){
  const circ=2*Math.PI*45,f0=ringFrac();ringPrev=f0;
  return `<div class="card focus${S.run?' run':''}">
  <div class="chips">${studyIds().map(i=>`<button class="chip ${i===S.sel?'on':''}" data-sub="${i}"><b style="background:${SUBJ[i].c}"></b>${SUBJ[i].sh||SUBJ[i].n}</button>`).join('')}</div>
  <div class="ring"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="45" style="stroke-width:5"/><circle class="pg" id="pg" cx="50" cy="50" r="45" style="stroke-width:5;stroke-dasharray:${circ};stroke-dashoffset:${circ*(1-f0)};stroke-opacity:${f0>.002?1:0}"/></svg>
  <div class="clock"><b id="tm"></b><span id="sub"></span></div></div>
  <div class="ctl"><button class="go" id="go">${S.run?'Pausar':(S.cur>0||(S.mode==='pomo'&&S.rem<POMO[S.phase]))?'Reanudar':'Empezar'}</button>${S.cur>0||S.run?'<button class="sec" id="fin">Terminar</button>':''}</div>
  ${S.pomo?pill('mode',[['free','Libre'],['pomo',`Pomodoro ${S.pw}/${S.pb}`]],S.mode,'data-mode'):''}</div>
  <div class="row"><div class="card st"><span class="lb">Hoy</span><b id="v-today"></b><div class="bar"><i id="gbar"></i></div><small id="gtxt"></small></div>
  <div class="card st"><span class="lb">Esta semana</span><b id="v-week"></b><div class="bar"><i id="wbar"></i></div><small id="wtxt"></small></div>
  <div class="card st fire" id="stk-card"><svg class="bgf" viewBox="0 0 24 24" aria-hidden="true"><use href="#flame"/></svg><span class="lb"><svg class="fl" id="stk-ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#flame"/></svg></span><b id="v-streak"></b><small id="stk-note"></small><div class="chk" id="stk-chk"></div></div></div>`;
}
function statsView(){
  const st=stats(),n=S.range,gD=S.goalD*3600;
  const td=lnow();td.setHours(0,0,0,0);
  const ds=n===30?[...Array(new Date(td.getFullYear(),td.getMonth()+1,0).getDate())].map((_,i)=>new Date(td.getFullYear(),td.getMonth(),i+1))
    :[...Array(7)].map((_,i)=>{const d=n?weekFri():new Date(td);d.setDate(d.getDate()+i-(n?0:6));return d});
  const vals=ds.map(d=>day(dk(d))),pastN=ds.filter(d=>d<=td).length,dm1=d=>d.toLocaleDateString('es',{day:'numeric',month:'short'});
  const rl=n===30?ds[0].toLocaleDateString('es',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase()):`${n?'Semana':'Últimos 7 días:'} del ${dm1(ds[0])} al ${dm1(ds[6])}`.replace('días: del','días:');
  const mx=Math.max(gD,...vals),act=vals.filter(v=>v>0),avg=act.length?act.reduce((a,b)=>a+b,0)/act.length:0,hit=vals.filter(v=>v>=gD).length;
  const rec=Object.values(S.hist).reduce((m,v)=>Math.max(m,v.t),0),tot=Math.max(1,st.total);
  const lbl=(d,i)=>n<30?'DLMXJVS'[d.getDay()]:(d.getDate()===1||d.getDate()%5===0||d.getTime()===td.getTime()?d.getDate():'');
  const w0=dk(addD(td,-6)),sx=Object.fromEntries(IDS.map(i=>[i,{d:0,b:0,w:0}]));
  Object.entries(S.hist).forEach(([k,v])=>IDS.forEach(i=>{const t=v[i]||0;if(t>0){const x=sx[i];x.d++;if(t>x.b)x.b=t;if(k>=w0)x.w+=t}}));
  const sxt=i=>{const x=sx[i];return `<small class="sx">${x.d?`${x.d} ${x.d===1?'día':'días'} · media ${hm(S.tot[i]/x.d)} por día · mejor día ${hm(x.b)} · últimos 7 días ${hm(x.w)}`:'Sin estudio todavía'}</small>`};
  return rankCard()+(rkOpen?ranksList():'')+`<div class="hd"><h2>Constancia</h2>${pill('range',[[0,'Últimos 7 días'],[7,'Semanal'],[30,'Mensual']],n,'data-range')}</div>
  <div class="card"><div class="hint" style="margin:0 0 12px;text-align:left;font-weight:600">${rl}</div><div class="week" style="gap:${n>7?3:8}px">${ds.map((d,i)=>`<div class="${d.getTime()===td.getTime()?'td':''}" title="${DAYN[d.getDay()]} ${d.getDate()}: ${hm(vals[i])}"><p><i style="height:${vals[i]/mx*100}%;opacity:${d>td?.12:vals[i]>=gD?1:.55}">${IDS.map(s=>{const v=S.hist[dk(d)]?.[s]||0;return v?`<b style="flex:${v} 1 0;background:${SUBJ[s].c}"></b>`:''}).join('')}</i></p><span>${lbl(d,i)}</span></div>`).join('')}</div>
  <div class="hint">Las barras intensas alcanzaron tu meta diaria (${hit} de ${pastN} ${pastN===1?'día':'días'} hasta hoy).</div></div>
  <h2>Resumen</h2>
  <div class="kv"><div class="card st"><b>${hm(st.total)}</b><span>Tiempo total</span></div><div class="card st"><b>${act.length?hm(avg):'0 min'}</b><span>Media por día activo</span></div><div class="card st"><b>${hm(rec)}</b><span>Mejor día</span></div></div>
  ${hoursCard()}<h2>Por asignatura</h2><div class="card dist">${statIds().map(i=>`<div><div><span>${SUBJ[i].n}</span><small>${hm(S.tot[i])} (${Math.round(S.tot[i]/tot*100)}%)</small></div><div class="bar"><i style="width:${S.tot[i]/tot*100}%;background:${SUBJ[i].c}"></i></div>${sxt(i)}</div>`).join('')}</div>${sessCard()}`;
}
function hoursCard(){
  const h=Array(24).fill(0);Object.values(S.wk||{}).forEach(w=>(w.h||[]).forEach((v,i)=>h[i]+=v));
  const mx=Math.max(...h);if(!mx)return '';
  const pk=h.indexOf(mx),p2=n=>String(n%24).padStart(2,'0')+':00',tot=h.reduce((a,b)=>a+b,0);
  return `<h2>Horas del día</h2><div class="card"><div class="hrs" style="height:90px">${h.map((v,i)=>`<i class="${i===pk?'on':''}" style="height:${Math.max(3,v/mx*100)}%;opacity:${i===pk?1:(.35+.4*v/mx).toFixed(2)}" title="${p2(i)} · ${hm(v)}"></i>`).join('')}</div><div class="hrl"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div><div class="hint" style="margin-top:8px;text-align:left">Tu hora más fuerte: ${p2(pk)}–${p2(pk+1)} (${Math.round(h[pk]/tot*100)}% de tu tiempo). Últimas 12 semanas.</div></div>`;
}
function sessCard(){
  const L=S.sess.slice(0,10),tk=dk(),yk=dk(addD(lnow(),-1));
  return `<h2>Sesiones recientes</h2><div class="card">${L.length?L.map(x=>{const k=dk(lnow(x.at)),dy=k===tk?'Hoy':k===yk?'Ayer':new Date(x.at).toLocaleDateString('es',{weekday:'short',day:'numeric',month:'short'});
    return `<div class="ses"><span><b style="color:${SUBJ[x.s].c}">${esc(SUBJ[x.s].n)}</b><br><small>${dy} · ${hhmm(x.at-x.d*1000)}–${hhmm(x.at)} · ${esc(x.n||'Libre')}</small></span><b>${hm(x.d)}</b></div>`}).join(''):'<div class="empty" style="padding:10px">Aún no hay sesiones. Se guardan al terminar una de al menos 10 s.</div>'}</div>`;
}
const sNow=()=>Date.now()+off;
const ago=t=>{if(!t)return 'hace tiempo';const x=Math.max(0,(sNow()-t)/1000);if(x<60)return 'hace un momento';if(x<3600)return 'hace '+Math.floor(x/60)+' min';if(x<86400)return 'hace '+Math.floor(x/3600)+' h';return 'hace '+Math.floor(x/86400)+' d'};
function friend(m){
  const st=m.act?`<small class="live">Estudiando ${esc(m.act)}</small>`:m.on?'<small class="live">En línea</small>':`<small>Última conexión ${ago(m.seen)}</small>`;
  const sk=m.streak?`<span class="stk" title="Racha: ${dias(m.streak)} seguidos (mín. 1 h al día)">${FL}${m.streak}</span>`:'';
  return `<div class="card fc ${m.me?'me1':''}${rcCls(m)}${fireCls(m.streak)}" style="${fireVar(m.streak)}">${fireBg(m.streak)}<div class="m0"><div class="av ${m.on?'on':''}" style="background:${m.color}">${bb(m.nick)}</div>
  <div class="n"><b>${esc(m.nick)}${rkT(m.total)}${m.me?' (tú)':''}</b>${st}</div>${sk}${m.act&&m.since?`<div class="el" data-s="${m.since}" title="Tiempo en esta sesión">${clock((sNow()-m.since)/1000)}</div>`:''}</div>
  <div class="fs"><div><b>${hm(m.daily)}</b><span>Hoy</span></div><div><b>${hm(m.weekly)}</b><span>Semana</span></div><div><b>${hm(m.total)}</b><span>Total</span></div></div></div>`;
}

/* ---------- Tren: quien estudia Anàlisi va en un vagón; el top 1 semanal conduce (a la derecha) y lleva sombrero.
   Los vagones se ordenan por tiempo total: más tiempo, más cerca de la locomotora. ---------- */
const HAT='<svg class="hat" viewBox="0 0 34 24" aria-label="Sombrero de maquinista"><path d="M5 15C5 6 11 2 17 2s12 4 12 13z" fill="#1e293b"/><rect x="4" y="12" width="26" height="4" rx="1.5" fill="#fbbf24"/><path d="M3 16h28c0 4-4 6-14 6S3 20 3 16z" fill="#0f172a"/><circle cx="17" cy="8" r="2.4" fill="#fbbf24"/></svg>';
const WHEEL=c=>`<svg class="wl ${c}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/><path d="M12 2v20M2 12h20" stroke="#94a3b8" stroke-width="1.4"/><circle cx="12" cy="12" r="3" fill="#94a3b8"/><circle cx="12" cy="4.5" r="1.8" fill="#fbbf24"/></svg>`;
let trainR=0;
function fixTrain(){const t=document.querySelector('.train');if(!t)return;t.scrollLeft=Math.max(0,t.scrollWidth-t.clientWidth-trainR);try{t.getAnimations({subtree:true}).forEach(a=>{a.startTime=0})}catch(e){}}
document.addEventListener('scroll',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('train'))trainR=Math.max(0,t.scrollWidth-t.clientWidth-t.scrollLeft)},true);
function trainBlock(ms,all){
  const AN=SUBJ.analisi.n,top=[...all].sort((a,b)=>b.weekly-a.weekly)[0],topId=top&&top.weekly>0?top.id:null;
  const pas=ms.filter(m=>m.act===AN);if(!pas.length)return '';
  const drv=pas.find(m=>m.id===topId),rest=pas.filter(m=>m!==drv).sort((a,b)=>a.total-b.total);
  const cell=(m,d,x)=>`<div class="av ${m.on?'on':''}" style="background:${m.color}">${bb(m.nick)}${d?HAT:''}</div>
    <b>${esc(m.nick)}${rkT(m.total)}${m.me?' (tú)':''}</b>${m.since?`<div class="el" data-s="${m.since}">${clock((sNow()-m.since)/1000)}</div>`:''}<small>${x}</small>`;
  const wagons=rest.map((m,k)=>`<div class="car" style="--i:${k}"><div class="cb"><div class="cw">${cell(m,false,'Total '+hm(m.total))}</div></div><i class="ch"></i>${WHEEL('w1')}${WHEEL('w2')}</div>`).join('');
  const dn=top&&topId?`${esc(top.nick)}${rkT(top.total)}${top.me?' (tú)':''}`:'';
  const cab=drv?cell(drv,true,'Maquinista · top 1'):`<div class="seat">🎩</div><small>Asiento vacío</small>`;
  const loco=`<div class="car loco" style="--i:${rest.length}"><div class="smk"><i class="pf"></i><i class="pf"></i><i class="pf"></i></div><div class="cab"><div class="cw">${cab}</div></div><div class="boiler"></div><i class="chim"></i><i class="dome"></i><i class="lamp"></i><i class="catch"></i><i class="ch"></i><i class="rod"></i>${WHEEL('w1')}${WHEEL('w2')}${WHEEL('w3')}</div>`;
  return `<div class="card train"><h3><span>🚆 Tren de ${esc(AN)}</span><span>${pas.length} a bordo</span></h3>${drv?`<div class="hint" style="text-align:left;margin:4px 0 0">🎩 Maquinista: <b>${dn}</b></div>`:''}<div class="trk">${wagons}${loco}</div><div class="hint">Más tiempo total, más cerca de la locomotora. Conduce el top 1 semanal.</div></div>`;
}
/* ---------- Más: rangos por horas totales estudiadas (ℕ → ℤ → ℚ → 𝕀 → ℝ → ℂ) ---------- */
const RANKS=[
  {s:'ℕ',n:'Naturales',h:0,d:'Todo empieza contando: 1, 2, 3…'},
  {s:'ℤ',n:'Enteros',h:24,d:'Ya cuentas hacia los dos lados de la recta.'},
  {s:'ℚ',n:'Racionales',h:50,d:'Todo encaja en una fracción.'},
  {s:'𝕀',n:'Irracionales',h:100,d:'Decimales infinitos que nunca se repiten: π, e, √2…'},
  {s:'ℝ',n:'Reales',h:160,d:'La recta completa. Sin huecos.'},
  {s:'ℂ',n:'Complejos',h:260,d:'Ya no cabes en una recta: saltas al plano. Aquí √−1 existe.'}];
const rkT=sec=>{const i=rankOf(sec);return `<span class="rkt r${i}" title="Rango: ${RANKS[i].n}">${RANKS[i].s}</span>`};
const rcCls=m=>{const i=rankOf(m.total);return ' rc rc'+i+(i?' rcx':'')};
const rankOf=sec=>RANKS.reduce((a,r,i)=>sec>=r.h*3600?i:a,0);
/* Decoración de la tarjeta de cada rango (el índice coincide con RANKS; ℕ no lleva) */
const RKDECO=['',
  `<svg class="dc" viewBox="0 0 360 48" aria-hidden="true"><g stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".9"><path d="M10 18H350"/><path d="M16 11L9 18l7 7"/><path d="M344 11l7 7-7 7"/><path d="M30 14v8M80 14v8M130 14v8M230 14v8M280 14v8M330 14v8"/><path d="M180 9v18" stroke-width="3"/></g><circle cx="180" cy="18" r="5" fill="#fff"/><g fill="#fff" text-anchor="middle" style="font:600 13px var(--f1)"><text x="30" y="42">\u22123</text><text x="80" y="42">\u22122</text><text x="130" y="42">\u22121</text><text x="180" y="42">0</text><text x="230" y="42">1</text><text x="280" y="42">2</text><text x="330" y="42">3</text></g></svg>`,
  `<svg class="dc" viewBox="0 0 360 64" aria-hidden="true"><g fill="#fff" fill-opacity=".24"><rect x="10.0" y="0" width="340.0" height="13" rx="3"/><rect x="10.0" y="17" width="168.5" height="13" rx="3"/><rect x="181.5" y="17" width="168.5" height="13" rx="3"/><rect x="10.0" y="34" width="111.3" height="13" rx="3"/><rect x="124.3" y="34" width="111.3" height="13" rx="3"/><rect x="238.7" y="34" width="111.3" height="13" rx="3"/><rect x="10.0" y="51" width="82.8" height="13" rx="3"/><rect x="95.8" y="51" width="82.8" height="13" rx="3"/><rect x="181.5" y="51" width="82.8" height="13" rx="3"/><rect x="267.2" y="51" width="82.8" height="13" rx="3"/></g><g fill="#fff" fill-opacity=".95" text-anchor="middle" style="font:600 10px var(--f1)"><text x="180.0" y="10">1</text><text x="94.2" y="27">\u00BD</text><text x="265.8" y="27">\u00BD</text><text x="65.7" y="44">\u2153</text><text x="180.0" y="44">\u2153</text><text x="294.3" y="44">\u2153</text><text x="51.4" y="61">\u00BC</text><text x="137.1" y="61">\u00BC</text><text x="222.9" y="61">\u00BC</text><text x="308.6" y="61">\u00BC</text></g></svg>`,
  `<div class="dc pi" aria-hidden="true"><div class="mv"><div>3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196</div><div>3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196</div></div></div>`,
  `<div class="dc gr"></div><svg class="dc" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M-10 120H370" stroke="#fff" stroke-width="2" opacity=".4"/><path class="cv" pathLength="1" d="M-10 120C20 50 60 50 90 120S150 190 180 120 240 50 270 120 330 190 370 120" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".42"/><path class="cv2" pathLength="1" d="M-10 120C20 50 60 50 90 120S150 190 180 120 240 50 270 120 330 190 370 120" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`,
  `<svg class="dc" viewBox="0 0 250 250" aria-hidden="true"><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"><path d="M10 125H240M125 10V240" stroke-opacity=".5" stroke-width="1.5"/><path d="M233 119l7 6-7 6M119 17l6-7 6 7" stroke-opacity=".6" stroke-width="1.5"/><circle cx="125" cy="125" r="82" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 5"/></g><g fill="#fff" fill-opacity=".85" style="font:italic 600 13px var(--f1)"><text x="226" y="114">Re</text><text x="133" y="22">Im</text></g><g class="orb"><path d="M125 125H207" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="207" cy="125" r="9" fill="#fff" fill-opacity=".25"/><circle cx="207" cy="125" r="5" fill="#fff"/></g></svg>`];
let rkOpen=false;
function rankCard(){
  const tot=stats().total,ri=rankOf(tot),r=RANKS[ri],nx=RANKS[ri+1];
  const pr=nx?Math.min(100,(tot-r.h*3600)/((nx.h-r.h)*3600)*100):100;
  return `<div class="card rk k${ri} bg${ri}" data-s="${r.s}" data-rk="1">${RKDECO[ri]}<small class="k">Tu rango</small><div class="sym">${r.s}</div><div class="big">${r.n}</div><div class="cap">${r.d}</div>
    <div class="rkp"><i style="width:${pr}%"></i></div>
    <div class="cap" style="margin-top:8px">${nx?`${hm(tot)} de ${nx.h} h · te faltan ${hm(nx.h*3600-tot)} para ${nx.s} ${nx.n}`:`${hm(tot)} estudiadas · has llegado al rango máximo`}</div><div class="cap" style="margin-top:6px;opacity:.75">${rkOpen?'▴ Ocultar rangos':'▾ Ver todos los rangos'}</div></div>`;
}
function ranksList(){
  const ri=rankOf(stats().total);
  return `<div class="rkl">${RANKS.map((x,i)=>`<div class="card rkr${i>ri?' rlk':''}${i===ri?' cu':''}"><div class="rkb bg${i}">${x.s}</div><div class="n"><b>${x.n}</b><small>${x.h?x.h+' h de estudio':'Rango inicial'}</small></div><span class="rks">${i<ri?'✓ Conseguido':i===ri?'Actual':'🔒'}</span></div>`).join('')}</div>`;
}
/* ---------- Recap: semana de sábado a viernes; se desbloquea el viernes a las 13:50 ---------- */
const DAYN=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'],cap1=s=>s[0].toUpperCase()+s.slice(1);
const wkStart=(d=lnow())=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+1)%7));return x};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
function wkRec(k,mk){
  S.wk=S.wk||{};let w=S.wk[k];
  if(!w&&mk){w=S.wk[k]={h:Array(24).fill(0),f:0,p:0,l:null};const ks=Object.keys(S.wk).sort();while(ks.length>12)delete S.wk[ks.shift()]}
  return w;
}
const EQ=[
  ['📺',s=>s/1320,(f)=>`ver ${f} ${f==='1'?'episodio':'episodios'} de Los Simpson seguidos (22 min cada uno)`],
  ['🥚',s=>s/600,(f)=>`cocer ${f} huevos duros uno detrás de otro (10 min cada uno)`],
  ['🍕',s=>s/90,(f)=>`hornear ${f} pizzas napolitanas en horno de leña (unos 90 s cada una)`],
  ['⚽',s=>s/5400,(f)=>`ver ${f} ${f==='1'?'partido':'partidos'} de fútbol completos, sin prórroga`],
  ['🎤',s=>s/355,(f)=>`cantar ${f} ${f==='1'?'vez':'veces'} «Bohemian Rhapsody» entera`],
  ['🐌',s=>s/3600*47,(f)=>`que un caracol de jardín recorriera unos ${f} metros (a ~47 m/h)`],
  ['🏃',s=>s/9.58,(f)=>`ver ${f} ${f==='1'?'vez':'veces'} el récord mundial de Usain Bolt en los 100 m (9,58 s)`]
];
const fmtN=n=>(n<10?Math.round(n*10)/10:Math.round(n)).toLocaleString('es');
const WRAP_SECS=0; // pon 5 para probar con una cuenta atrás de 5 segundos; 0 = desbloqueo real los viernes a las 13:50
let wrapOff=0,wrapT0=0,wrapReveal=false;
setInterval(()=>{document.querySelectorAll('[data-cd]').forEach(e=>{
  const r=Math.floor((+e.dataset.cd-Date.now())/1000);
  if(r<=0){if(S.view==='group'&&S.gv==='wrap')render();return}
  const d=Math.floor(r/86400),p=n=>String(n).padStart(2,'0');
  e.textContent=(d?d+'d ':'')+p(Math.floor(r%86400/3600))+'h '+p(Math.floor(r%3600/60))+'m '+p(r%60)+'s'})},1000);
function wrapData(st,g){const ids=g?grpIds(g):IDS,gd=g?k=>dayG(g,k):day;
  const days=[...Array(7)].map((_,i)=>{const d=addD(st,i);return{d,n:DAYN[d.getDay()],t:gd(dk(d))}});
  const total=days.reduce((a,x)=>a+x.t,0),k=dk(st),w=S.wk&&S.wk[k],end=addD(st,7);
  const sub=ids.map(i=>({id:i,t:days.reduce((a,x)=>a+(S.hist[dk(x.d)]?.[i]||0),0)}));
  const ss=S.sess.filter(x=>x.at>=st.getTime()+DAY_OFF&&x.at<end.getTime()+DAY_OFF);
  let hrs=w&&w.h.some(v=>v>0)?w.h:null,f=w?w.f:0,p=w?w.p:0;
  if(f+p===0){ss.forEach(x=>{x.n==='Pomodoro'?p+=x.d:f+=x.d})}
  let lg=w&&w.l?{d:w.l.d,s:w.l.s}:null;
  ss.forEach(x=>{if(!lg||x.d>lg.d)lg={d:x.d,s:x.s,at:x.at}});
  if(lg&&!lg.at&&ss.length){const m=ss.find(x=>x.d===lg.d&&x.s===lg.s);if(m)lg.at=m.at}
  const pdays=[...Array(7)].map((_,i)=>addD(st,-7+i)),psub=ids.map(i=>({id:i,t:pdays.reduce((a,d)=>a+(S.hist[dk(d)]?.[i]||0),0)})),prev=psub.reduce((a,x)=>a+x.t,0);
  const wt={};Object.keys(S.hist).forEach(h=>{const[y,m,d]=h.split('-').map(Number),wk=dk(wkStart(new Date(y,m-1,d)));wt[wk]=(wt[wk]||0)+gd(h)});
  return{days,total,sub,hrs,f,p,lg,k,ss,prev,psub,wt};
}
/* ---------- Recap: comunidad. Cada perfil publica ww = resumen de sus últimas 9 semanas (sábado a viernes) ---------- */
function wkSnap(st){
  const ks=[...Array(7)].map((_,i)=>dk(addD(st,i))),sb=IDS.map(i=>ks.reduce((a,k)=>a+(S.hist[k]?.[i]||0),0));
  const sn=sb.map(v=>num(v,604800));return{k:dk(st),t:sn.reduce((a,b)=>a+b,0),s:sn,d:ks.map(k=>num(day(k),86400)),dg:Object.fromEntries(Object.keys(GR).map(g=>[g,ks.map(k=>num(dayG(g,k),86400))]))};
}
const wkSnaps=()=>{const c=wkStart(lnow());return[...Array(9)].map((_,i)=>wkSnap(addD(c,-7*i)))};
function commParts(st,g){
  const ids=g?grpIds(g):IDS,k=dk(st),rows=[];
  members().forEach(m=>{if(g&&!m.grp[g])return;
    const w=m.me?wkSnap(st):(Array.isArray(fb.users[m.id]?.ww)?fb.users[m.id].ww.find(x=>x&&x.k===k):null);
    if(!w||!Array.isArray(w.s))return;
    const sb=IDS.map((id,i)=>ids.includes(id)?num(w.s[i],604800):0);
    rows.push({id:m.id,me:m.me,nick:m.nick,color:m.color,s:sb,t:sb.reduce((a,b)=>a+b,0),d:[...Array(7)].map((_,i)=>num(((g&&w.dg?w.dg[g]:w.d)||[])[i],86400))});
  });
  if(!fb.ok||!rows.some(r=>!r.me))return null;
  const N=rows.length,tot=rows.reduce((a,r)=>a+r.t,0),act=rows.filter(r=>r.t>0),zero=N-act.length;
  if(!act.length)return null;
  const avg=tot/act.length,by=[...act].sort((a,b)=>b.t-a.t||a.nick.localeCompare(b.nick)),top=by[0],low=by[by.length-1];
  const pc=(l,r,cap)=>`<div class="card wc"><small class="k">${l}</small><div class="pw"><div class="av" style="background:${r.color}">${bb(r.nick)}</div><b>${esc(r.nick)}${r.me?' (tú)':''}</b></div><div class="cap">${cap}</div></div>`;
  let h='';
  h+=`<div class="card wc hero"><span class="em">🌍</span><small class="k">Horas de toda la comunidad</small><div class="big" style="font-size:34px">${hm(tot)}</div><div class="cap">${act.length} de ${N} ${N===1?'persona estudió':'personas estudiaron'} · media de ${hm(avg)} por estudiante${tot>=86400?`<br>Son ${fmtN(tot/86400)} días seguidos sin parar`:''}</div></div>`;
  /* quién más y menos */
  h+=act.length>1?`<div class="w2">${pc('Comunidad · quien más estudió',top,hm(top.t))}${pc('Comunidad · quien menos estudió',low,hm(low.t)+(zero?`<br>${zero} ${zero===1?'persona no estudió':'personas no estudiaron'} nada`:''))}</div>`
    :pc('Comunidad · quien más estudió',top,hm(top.t)+(zero?` · ${zero} ${zero===1?'persona no estudió':'personas no estudiaron'} nada`:''));
  /* tu puesto */
  const me=rows.find(r=>r.me);
  if(me){
    const pos=1+rows.filter(r=>r.t>me.t).length,md=pos<=3&&me.t>0?['🥇','🥈','🥉'][pos-1]+' ':'',df=me.t>0?Math.round((me.t-avg)/avg*100):0;
    h+=`<div class="card wc"><span class="em">📍</span><small class="k">Tu puesto en la comunidad</small><div class="big">${md}${pos}.º de ${N}</div><div class="cap">${me.t?(Math.abs(df)<3?'Justo en la media de la comunidad':`Estudiaste un ${Math.abs(df)}% ${df>0?'más':'menos'} que la media`)+` · aportaste el ${fmtN(me.t/tot*100)}% de las horas`:'Esta semana no estudiaste: te toca remontar'}</div></div>`;
  }
  h+='\u0001';
  /* asignaturas */
  const sb=IDS.map((id,i)=>({id,i,t:rows.reduce((a,r)=>a+r.s[i],0)})).filter(x=>ids.includes(x.id)),so=[...sb].sort((a,b)=>b.t-a.t),sr=so.filter(x=>x.id!==NOWRAP),st1=sr[0],st2=sr[sr.length-1],pr=x=>fmtN(x.t/tot*100)+'%';
  if(st1)h+=`<div class="w2"><div class="card wc"><small class="k">Comunidad · más estudiada</small><div class="big" style="font-size:18px;color:${SUBJ[st1.id].c}">${esc(SUBJ[st1.id].n)}</div><div class="cap">${hm(st1.t)} · ${pr(st1)}</div></div><div class="card wc"><small class="k">Comunidad · menos estudiada</small><div class="big" style="font-size:18px;color:${SUBJ[st2.id].c}">${esc(SUBJ[st2.id].n)}</div><div class="cap">${hm(st2.t)} · ${pr(st2)}</div></div></div>`;
  h+=`<div class="card wc"><small class="k">Comunidad · reparto por asignatura</small><div class="split">${sb.filter(x=>x.t>0).map(x=>`<i style="width:${x.t/tot*100}%;background:${SUBJ[x.id].c}"></i>`).join('')}</div><div class="cap" style="margin-top:8px">${so.map(x=>`<span style="color:${SUBJ[x.id].c}">●</span> ${esc(SUBJ[x.id].n)} ${pr(x)}`).join(' · ')}</div></div>`;
  /* campeones por asignatura */
  h+=`<div class="card wc"><span class="em">🏅</span><small class="k">Comunidad · campeones por asignatura</small>${sb.map(x=>{const b=[...rows].sort((p,q)=>q.s[x.i]-p.s[x.i]||p.nick.localeCompare(q.nick))[0];return `<div class="chr"><span style="color:${SUBJ[x.id].c};font-weight:600">${esc(SUBJ[x.id].n)}</span><span>${b.s[x.i]>0?esc(b.nick)+(b.me?' (tú)':'')+' · '+hm(b.s[x.i]):'Nadie'}</span></div>`}).join('')}</div>`;
  h+='\u0001';
  /* días */
  const dd=[...Array(7)].map((_,i)=>({n:DAYN[addD(st,i).getDay()],t:rows.reduce((a,r)=>a+r.d[i],0)})),dso=[...dd].sort((a,b)=>b.t-a.t),dz=dd.filter(x=>!x.t),dlo=dso[dso.length-1];
  h+=`<div class="w2"><div class="card wc"><small class="k">Comunidad · día más fuerte</small><div class="big" style="font-size:20px">${cap1(dso[0].n)}</div><div class="cap">${hm(dso[0].t)} entre todos</div></div><div class="card wc"><small class="k">Comunidad · día más flojo</small><div class="big" style="font-size:20px">${dz.length>1?dz.length+' días':cap1(dlo.n)}</div><div class="cap">${dz.length>1?'Sin estudiar: '+dz.map(x=>x.n).join(', '):dz.length?'Nadie estudió':hm(dlo.t)+' entre todos'}</div></div></div>`;
  const[a,b,c]=h.split('\u0001');return{a,b,c};
}
function wrapView(g){
  wrapLast=null;
  const now=new Date(),cs=wkStart(lnow()),ut=addD(cs,6);ut.setHours(13,50,0,0);if(WRAP_SECS){wrapT0=wrapT0||Date.now()+WRAP_SECS*1000;ut.setTime(wrapT0)}const unl=now>=ut,latest=unl?cs:addD(cs,-7);
  wrapOff=Math.min(7,Math.max(0,wrapOff));
  const st=addD(latest,-7*wrapOff),en=addD(st,6),dm=d=>d.toLocaleDateString('es',{day:'numeric',month:'short'});
  let h='';
  if(!unl){
    wrapReveal=true; /* si el contador estaba en marcha, al llegar a cero toca el botón Comenzar aunque la semana ya se hubiera visto */
    const ce=addD(cs,6),pr=WRAP_SECS?Math.min(1,Math.max(0,1-(ut-now)/(WRAP_SECS*1000))):Math.min(1,Math.max(0,(now-cs-DAY_OFF)/(ut-cs-DAY_OFF)));
    h+=`<div class="card lockc"><div class="lkc">🔒</div><small class="k">Semana del ${dm(cs)} al ${dm(ce)}</small><div class="big">Tu semana tiene algo que contarte</div><div class="cd" data-cd="${ut.getTime()}">--</div><div class="bar"><i style="width:${pr*100}%"></i></div><div class="cap">${WRAP_SECS?'Se revela en unos segundos…':'Se revela el viernes a las 13:50. Hasta entonces, sigue estudiando…'}</div></div>`;
  }
  h+=`<div class="wnav"><button data-wo="1" aria-label="Semana anterior" ${wrapOff>=7?'disabled':''}>‹</button><div style="text-align:center"><b>Semana del ${dm(st)} al ${dm(en)}</b><div class="hint" style="margin:0">Sábado a viernes</div></div><button data-wo="-1" aria-label="Semana siguiente" ${wrapOff<=0?'disabled':''}>›</button></div>`;
  const D=wrapData(st,g);
  if(!D.total)return h+`<div class="card empty">No estudiaste esta semana, así que no hay Recap.<br>La próxima será.</div>`;
  const act=D.days.filter(x=>x.t>0).length,C=commParts(st,g);
  const pend=unl&&wrapOff===0&&(wrapReveal||!(S.ws&&S.ws[D.k])); /* listo pero aún sin ver: solo el botón, el resumen sale al terminar las tarjetas */
  if(pend)h=`<div class="card lockc"><div class="lkc">🎬</div><small class="k">Semana del ${dm(st)} al ${dm(en)}</small><div class="big">Tu Recap ya está listo</div><button type="button" class="mini" data-wrep="1">Comenzar</button></div>`+h;
  else h+=`<div style="text-align:center;margin:0 0 12px"><button type="button" class="ghost" data-wrep="1">▶ Ver las tarjetas una a una</button></div>`;
  const i0=h.length;
  h+=`<div class="wr"><div class="card wc hero"><span class="em">🎓</span><small class="k">Tu semana en números</small><div class="big" style="font-size:34px">${hm(D.total)}</div><div class="cap">Estudiaste ${act} de 7 días · media de ${hm(D.total/7)} al día</div></div>`;
  if(C)h+=C.a;
  /* franja del día más activa */
  if(D.hrs){
    let bs=0,bv=-1;for(let s=0;s<=21;s++){const v=D.hrs[s]+D.hrs[s+1]+D.hrs[s+2];if(v>bv){bv=v;bs=s}}
    const mid=bs+1,tag=mid<6?'🦉 Búho nocturno':mid<12?'🌅 Madrugador':mid<18?'☀️ Currante de tardes':'🌙 Noctámbulo',p2=n=>String(n%24).padStart(2,'0')+':00',mx=Math.max(...D.hrs);
    h+=`<div class="card wc"><small class="k">Tu franja más activa</small><div class="big">${p2(bs)} – ${p2(bs+3)}</div><div class="cap">${tag} · ${hm(bv)} en esas tres horas</div><div class="hrs">${D.hrs.map((v,i)=>`<i class="${i>=bs&&i<bs+3?'on':''}" style="height:${Math.max(4,v/mx*100)}%" title="${String(i).padStart(2,'0')}:00 · ${hm(v)}"></i>`).join('')}</div><div class="hrl"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div></div>`;
  }else h+=`<div class="card wc"><small class="k">Tu franja más activa</small><div class="big">Sin datos</div><div class="cap">La hora de estudio se registra desde esta versión; esta semana aún no tiene.</div></div>`;
  /* pomodoro vs libre */
  const pf=D.p+D.f;
  if(pf){
    const pp=Math.round(D.p/pf*100),win=D.p>D.f?'🍅 Pomodoro':D.p<D.f?'⏱️ Temporizador libre':'⚖️ Empate';
    h+=`<div class="card wc"><small class="k">Tu método favorito</small><div class="big">${win}</div><div class="cap">Pomodoro ${hm(D.p)} (${pp}%) · Libre ${hm(D.f)} (${100-pp}%)</div><div class="split"><i style="width:${pp}%;background:#f43f5e"></i><i style="width:${100-pp}%;background:var(--acc)"></i></div></div>`;
  }
  /* asignaturas */
  const so=D.sub.filter(x=>x.id!==NOWRAP).sort((a,b)=>b.t-a.t),top=so[0],low=so[so.length-1];
  if(top)h+=`<div class="w2"><div class="card wc"><small class="k">Más estudiada</small><div class="big" style="font-size:18px;color:${SUBJ[top.id].c}">${esc(SUBJ[top.id].n)}</div><div class="cap">${hm(top.t)}</div></div><div class="card wc"><small class="k">Menos estudiada</small><div class="big" style="font-size:18px;color:${SUBJ[low.id].c}">${esc(SUBJ[low.id].n)}</div><div class="cap">${hm(low.t)}</div></div></div>`;
  if(C)h+=C.b;
  /* días */
  const ds=[...D.days].sort((a,b)=>b.t-a.t),bd=ds[0],zero=D.days.filter(x=>!x.t),wd=ds[ds.length-1];
  const lowBig=zero.length>1?zero.length+' días':cap1(wd.n),lowCap=zero.length>1?'Sin estudiar: '+zero.map(x=>x.n).join(', '):zero.length?'Descanso total (0 min)':hm(wd.t);
  h+=`<div class="w2"><div class="card wc"><small class="k">Día más productivo</small><div class="big" style="font-size:20px">${cap1(bd.n)}</div><div class="cap">${hm(bd.t)}</div></div><div class="card wc"><small class="k">Día menos productivo</small><div class="big" style="font-size:20px">${lowBig}</div><div class="cap">${lowCap}</div></div></div>`;
  if(C)h+=C.c;
  /* sesión más larga */
  if(D.lg){
    const dt=D.lg.at?new Date(D.lg.at):null;
    h+=`<div class="card wc"><span class="em">🏔️</span><small class="k">Sesión más larga</small><div class="big">${hm(D.lg.d)}</div><div class="cap">${esc(SUBJ[D.lg.s].n)}${dt?' · '+cap1(DAYN[dt.getDay()]):''}</div></div>`;
  }
  {const W=msWeek(st);if(W.n)h+=`<div class="card wc"><span class="em">🎯</span><small class="k">Misiones</small><div class="big">${W.n} ${W.n===1?'tarea hecha':'tareas hechas'}</div><div class="cap">${W.t.map(esc).join(' · ')}</div></div>`}
  /* más datos: comparativas, hábitos y tipo de estudiante */
  const sc=(k,b,c,fs=18,col='')=>`<div class="card wc"><small class="k">${k}</small><div class="big" style="font-size:${fs}px${col?';color:'+col:''}">${b}</div><div class="cap">${c}</div></div>`,sm=[];
  const dif=D.total-D.prev;
  if(D.prev>0){const pc=Math.round(Math.abs(dif)/D.prev*100);sm.push(sc('Vs. semana pasada',`${dif>=0?'▲':'▼'} ${pc}%`,`${dif>=0?'+':'−'}${hm(Math.abs(dif))} frente a ${hm(D.prev)}`,22))}
  else sm.push(sc('Vs. semana pasada','Estreno','La semana anterior no tiene estudio registrado',22));
  const wl=Object.values(D.wt).filter(v=>v>0);
  if(wl.length>=2){const rk=1+wl.filter(v=>v>D.total).length;sm.push(sc('Ranking histórico',rk===1?'🏆 Tu mejor semana':`${rk}.ª mejor semana`,`de ${wl.length} semanas con estudio`,18))}
  const we=D.days.filter(x=>x.d.getDay()===0||x.d.getDay()===6).reduce((a,x)=>a+x.t,0),wp=Math.round(we/D.total*100);
  sm.push(sc('Entre semana o finde',wp>40?'🏖️ Guerrero del finde':wp<15?'💼 De lunes a viernes':'📅 Bien repartido',`Fin de semana ${wp}% · Lunes a viernes ${100-wp}%`,17));
  const mean=D.total/7,sd=Math.sqrt(D.days.reduce((a,x)=>a+(x.t-mean)**2,0)/7),cv=sd/mean,mxd=Math.max(...D.days.map(x=>x.t));
  sm.push(sc('Regularidad',cv<.45?'⚖️ Constante como un reloj':cv<.9?'🌊 Con sus altibajos':'🎢 Montaña rusa',`Tu mejor día fue ${fmtN(mxd/mean)}× tu media diaria`,17));
  const ch=D.sub.map((x,i)=>({id:x.id,d:x.t-D.psub[i].t})).filter(x=>x.d!==0&&x.id!==NOWRAP).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d))[0];
  if(D.prev>0&&ch)sm.push(sc(ch.d>0?'Asignatura en alza':'Asignatura en caída',esc(SUBJ[ch.id].n),`${ch.d>0?'+':'−'}${hm(Math.abs(ch.d))} frente a la semana pasada`,17,SUBJ[ch.id].c));
  sm.push(sc('Tiempo despierto',fmtN(D.total/403200*100)+'%','de tus horas despierto (a 16 h al día) fueron para las mates',24));
  for(let i=0;i<sm.length;i+=2)h+=sm[i+1]?`<div class="w2">${sm[i]}${sm[i+1]}</div>`:sm[i];
  if(D.ss.length){
    const n=D.ss.length,avg=D.ss.reduce((a,x)=>a+x.d,0)/n,pom=D.ss.filter(x=>x.n==='Pomodoro').length;
    h+=`<div class="card wc"><span class="em">🧠</span><small class="k">Tu tipo de estudiante</small><div class="big">${avg<1500?'⚡ Velocista':avg<3600?'🎯 Equilibrado':'🏃 Corredor de fondo'}</div><div class="cap">${n} ${n===1?'sesión':'sesiones'} · media de ${hm(avg)} · ${pom} ${pom===1?'pomodoro':'pomodoros'}</div></div>`;
    const tm=t=>{const d=new Date(t);return d.getHours()*60+d.getMinutes()},f2=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),hc={};
    D.ss.forEach(x=>{const hr=new Date(x.at-x.d*1000).getHours();hc[hr]=(hc[hr]||0)+1});
    const fav=Object.keys(hc).sort((a,b)=>hc[b]-hc[a]||a-b)[0],early=Math.min(...D.ss.map(x=>tm(x.at-x.d*1000))),late=Math.max(...D.ss.map(x=>tm(x.at))),odd=D.hrs?[0,1,2,3,4,5,23].reduce((a,i)=>a+D.hrs[i],0):0;
    h+=`<div class="card wc"><span class="em">⏰</span><small class="k">Tu reloj de estudio</small><div class="big" style="font-size:22px">Sueles arrancar sobre las ${String(fav).padStart(2,'0')}:00</div><div class="cap">Lo más temprano: ${f2(early)} · lo más tarde: ${f2(late)}${odd>0?' · En horas intempestivas (23:00–06:00): '+hm(odd):''}</div></div>`;
  }
  /* equivalencia absurda */
  const cand=EQ.filter(e=>e[1](D.total)>=1);
  if(cand.length){
    const hash=[...D.k].reduce((a,c)=>a+c.charCodeAt(0),0),e=cand[hash%cand.length],n=e[1](D.total);
    h+=`<div class="card wc"><span class="em">${e[0]}</span><small class="k">Equivalencia absurda</small><div class="big" style="font-size:19px">Estudiar ${hm(D.total)} equivale a ${e[2](fmtN(n))}.</div></div>`;
  }
  wrapLast={k:D.k,wo:wrapOff,html:h.slice(i0)+'</div>',label:`Semana del ${dm(st)} al ${dm(en)}`};
  if(pend)return h.slice(0,i0);
  return h+'</div><div class="hint">El Recap se desbloquea cada viernes a las 13:50 y cuenta de sábado a viernes.'+(C?' Los datos de la comunidad se actualizan cuando cada persona pausa el cronómetro o cierra la app.':'')+'</div>';
}

/* ---------- Recap: modo tarjetas. La primera vez que se ve una semana salen una a una y al final queda el resumen completo ---------- */
let wrapLast=null,stOpen=false,stI=0,stSl=[],stK='',stLabel='';
function openStory(){
  if(stOpen||!wrapLast)return;
  const t=document.createElement('div');t.innerHTML=wrapLast.html;
  const cards=[...(t.firstElementChild?t.firstElementChild.children:[])].map(c=>c.outerHTML);
  if(!cards.length)return;
  stLabel=wrapLast.label;stK=wrapLast.k;stI=0;stOpen=true;
  stSl=[`<div class="card wc hero" style="text-align:center;padding:38px 24px"><span class="em">✨</span><small class="k" style="padding:0">Recap</small><div class="big" style="font-size:30px;margin:10px 0 8px">Tu semana tiene algo que contarte</div><div class="cap">${esc(stLabel)}</div></div>`,...cards];
  const v=document.createElement('div');v.className='stv';v.id='stv';v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.setAttribute('aria-label','Recap');
  document.body.appendChild(v);document.body.style.overflow='hidden';
  stDraw();
}
function stDraw(){
  const v=$('#stv');if(!v)return;const last=stI===stSl.length-1;
  v.innerHTML=`<div class="stp">${stSl.map((_,i)=>`<i class="${i<=stI?'on':''}"></i>`).join('')}</div>
  <div class="stt"><span>${esc(stLabel)}</span><button type="button" data-stx="1">${last?'Cerrar':'Saltar'}</button></div>
  <div class="sts" data-stnext="1"><div class="stc">${stSl[stI]}</div></div>
  <div class="stn">${stI?'<button type="button" class="ghost" data-stprev="1" aria-label="Tarjeta anterior">‹</button>':''}<button type="button" class="mini" id="stnb" data-stnext="1">${stI===0?'Empezar':last?'Ver resumen':'Siguiente'}</button></div>`;
  const b=$('#stnb');if(b)b.focus({preventScroll:true});
}
function stNext(){stI<stSl.length-1?(stI++,stDraw()):stClose()}
function stClose(){
  const v=$('#stv');if(v)v.remove();
  document.body.style.overflow='';stOpen=false;wrapReveal=false;
  if(stK){S.ws=S.ws||{};if(!S.ws[stK]){S.ws[stK]=1;Object.keys(S.ws).sort().slice(0,-12).forEach(k=>delete S.ws[k]);save(true);syncProgress(true)}}
  render();scrollTo(0,0);
}
document.addEventListener('click',e=>{
  const t=e.target;if(!stOpen||!t.closest||!t.closest('#stv'))return;
  if(t.closest('[data-stprev]')){if(stI>0){stI--;stDraw()}return}
  if(t.closest('[data-stx]'))return stClose();
  if(t.closest('[data-stnext]'))stNext();
});
document.addEventListener('keydown',e=>{
  if(!stOpen)return;
  if(e.key==='ArrowRight')stNext();
  else if(e.key==='ArrowLeft'){if(stI>0){stI--;stDraw()}}
  else if(e.key==='Escape'){e.preventDefault();stClose()}
});

function commView(ms){
  const k0=dk(),G=cgGoal(k0),T=G*3600,cs=commStats(ms),rem=Math.max(0,T-cs.today),pct=Math.min(100,cs.today/T*100),done=cs.done;
  const hmc=x=>hm(Math.ceil(x/60)*60),vnear=!done&&rem<=T*.05,near=!done&&!vnear&&rem<=T*.15,st=done?'full':vnear?'vnear':near?'near':'';
  const e=lnow();e.setHours(24,0,0,0);const late=(e-lnow())/1000<=3*3600;
  const rows=[...ms].sort((a,b)=>b.daily-a.daily||a.nick.localeCompare(b.nick));
  const segs=rows.filter(m=>m.daily>0).map(m=>`<b title="${esc(m.nick)}" style="flex:${m.daily} 1 0;background:${m.color}"></b>`).join('');
  const msg=done?'🎉 ¡Objetivo cumplido!':vnear?`🔥 ¡Solo faltan ${hmc(rem)}!`:near?`⚡ ¡Casi! Faltan ${hmc(rem)}`:`Faltan ${hmc(rem)} entre todos`;
  let h=`<div class="card cmg ${st}"><div class="cmk">Objetivo de hoy</div>
  <div class="cmv">${hm(cs.today)} <small>de ${G} h</small></div>
  <div class="cmbar ${st}"><div class="cmfill" style="width:${pct.toFixed(1)}%">${segs}</div>${pct>0?`<svg class="fl cmhead" style="left:${Math.min(97,Math.max(3,pct)).toFixed(1)}%" viewBox="0 0 24 24" aria-hidden="true"><use href="#flameB"/></svg>`:''}</div>
  <div class="cmmsg ${st}">${msg}</div></div>`;
  const risk=!done&&cs.n>0&&late,mo=monday(),nTxt=cs.n>=CG_LOOK?CG_LOOK+'+':cs.n;
  const chk=[...Array(7)].map((_,i)=>{const d=new Date(mo);d.setDate(mo.getDate()+i);const k=dk(d),fut=k>k0,ok=!fut&&cs.ok(k);
    return `<span class="${ok?'ok':''}${k===k0?' hoy':''}${fut?' fut':''}" title="${fut?'Objetivo: '+cgGoal(k)+' h':ok?'Objetivo cumplido':'Objetivo sin cumplir'}"><i>${ok?'✓':''}</i>${'DLMXJVS'[d.getDay()]}</span>`}).join('');
  h+=`<div class="card fire cm${cs.n?' lit':''}${cs.n>=7?' hot':''}${risk?' risk':''}" style="--fo:${cs.n?.18:.08}"><svg class="bgf" viewBox="0 0 24 24" aria-hidden="true"><use href="#flameB"/></svg>
  <div class="cmbig"><svg class="fl${cs.n?'':' off'}" viewBox="0 0 24 24" aria-hidden="true"><use href="#flameB"/></svg><span>${nTxt}</span><small>${cs.n===1?'día':'días'} de racha comunitaria</small></div>
  <div class="cmsub${risk?' warn':''}">${done?'Hoy ya suma a la racha.':risk?'⚠️ Se rompe si no llegáis hoy.':'Llegad al objetivo hoy para '+(cs.n?'mantenerla':'empezarla')+'.'}</div>
  <div class="chk cmchk">${chk}</div></div>`;
  h+=`<div class="gh">Aportación de hoy</div>`;
  h+=rows.length?`<div class="list">${rows.map((m,i)=>{const p=m.daily/T*100;return `<div class="m ${m.me?'me1':''}"><div class="pos">${m.daily>0&&['🥇','🥈','🥉'][i]||i+1}</div>
  <div class="av ${m.on?'on':''}" style="background:${m.color}">${bb(m.nick)}</div>
  <div class="n"><b>${esc(m.nick)}${m.me?' (tú)':''}</b>${m.act?'<small class="live">Estudiando ahora</small>':''}<div class="bar"><i style="width:${Math.min(100,p).toFixed(1)}%;background:${m.color}"></i></div></div><div class="t">${hm(m.daily)}</div></div>`}).join('')}</div>`
    :`<div class="empty">Todavía no hay nadie en la comunidad.</div>`;
  return h+missView(ms);
}
const GV=[['friends','Amigos'],['rank','Ranking'],['comm','Objetivo'],['chat','Chat'],['wrap','Recap'],['glob','Global']];
const gview=(all,g)=>all.filter(m=>m.grp[g]).map(m=>({...m,...m.grp[g]}));
function group(){
  const all=members(),g=curG(),glob=S.gv==='glob',ms=glob?all:gview(all,g);
  let h=glob||userGroups().length<2?'':pill('cg',userGroups().map(k=>[k,GR[k].n]),g,'data-cg','full cg');
  h+=pill('gv',GV,S.gv,'data-gv','full');
  if(S.gv==='wrap')return h+wrapView(g);
  if(!S.nick)h+=`<div class="card" style="margin-bottom:14px;text-align:center">Crea una cuenta para aparecer en la comunidad: tu nombre de usuario será tu nombre en el ranking.<div class="ctl"><button class="mini" data-reg="1">Crear cuenta</button></div></div>`;
  if(!fb.ok)h+=`<div class="hint" style="margin-bottom:10px">Sin conexión: la comunidad no está disponible, pero tu cronómetro funciona igual.</div>`;
  if(glob)return h+globView(all);
  if(S.gv==='comm')return h+commView(ms);
  if(S.gv==='chat')return h+chatView();
  if(S.gv==='friends'){
    const by=(a,k)=>a.sort((x,y)=>y[k]-x[k]),act=by(ms.filter(m=>m.act),'daily'),onl=by(ms.filter(m=>m.on&&!m.act),'daily'),off=by(ms.filter(m=>!m.on),'seen');
    const sec=(t,a,x='')=>a.length?`<div class="gh">${t} (${a.length})</div>`+x+a.filter(m=>!(m.act===SUBJ.analisi.n&&x)).map(friend).join(''):'';
    h+=sec('Estudiando ahora',act,g==='primero'?trainBlock(act,ms):'')+sec('En línea',onl)+sec('Desconectados',off);
    if(ms.filter(m=>!m.me).length===0)h+=`<div class="empty">Aún no hay amigos aquí.<br>Comparte el enlace de la app: aparecerán en cuanto pongan su nombre.</div>`;
    return h;
  }
  return h+rankView(ms);
}
function globView(all){
  const tk=all.reduce((a,m)=>a+m.daily,0),on=all.filter(m=>m.act).length;
  const gs=Object.keys(GR).map(g=>{const v=gview(all,g);return{g,n:v.length,t:v.reduce((a,m)=>a+m.daily,0)}});
  return `<div class="row"><div class="card st"><span class="lb">Hoy</span><b>${hm(tk)}</b><small class="push">entre todos</small></div>
  <div class="card st"><span class="lb">Estudiando</span><b>${on}</b><small class="push">ahora mismo</small></div>
  <div class="card st"><span class="lb">Personas</span><b>${all.length}</b><small class="push">en la comunidad</small></div></div>
  <h2>Por grupo</h2><div class="card">${gs.map(x=>`<div class="ses"><span>${GR[x.g].n}<br><small>${x.n} ${x.n===1?'persona':'personas'}</small></span><b>${hm(x.t)} hoy</b></div>`).join('')}</div>
  <h2>Ranking global</h2>${rankView([...all])}`;
}
function rankView(ms){
  let h='';
  const tabs=[['daily','Hoy'],['weekly','Semana'],['total','Total'],['streak','Racha']],sr=S.rank==='streak';
  ms.sort((a,b)=>sr?(b.streak-a.streak||b.best-a.best||b.total-a.total):b[S.rank]-a[S.rank]);
  h+=pill('rank',tabs,S.rank,'data-rank','full');
  h+=ms.length?`<div class="list">${ms.map((m,i)=>`<div class="m ${m.me?'me1':''}${rcCls(m)}${fireCls(m.streak)}" style="${fireVar(m.streak)}">${fireBg(m.streak)}<div class="pos">${(!sr||m.streak>0)&&['🥇','🥈','🥉'][i]||i+1}</div>
  <div class="av ${m.on?'on':''}" style="background:${m.color}">${bb(m.nick)}</div>
  <div class="n"><b>${esc(m.nick)}${rkT(m.total)}${m.me?' (tú)':''}</b><small class="${!sr&&m.act?'live':''}">${sr?'Récord: '+dias(m.best):m.act?'Estudiando '+esc(m.act):m.on?'En línea':'Visto '+ago(m.seen)}</small></div><div class="t">${sr?FL+' '+dias(m.streak):hm(m[S.rank])}</div></div>`).join('')}</div>${sr?'<div class="hint">Ranking por racha actual. Un día suma si estudias 1 h o más. El borde de fuego aparece en el día 5 y llega al máximo en el día 30.</div>':''}`
    :`<div class="empty">Todavía no hay nadie en el ranking.<br>Empieza a estudiar y serás el primero.</div>`;
  return h;
}
function hdr(){const e=$('#mename');if(e)e.innerHTML=esc(S.nick||'Tu nombre')+(S.nick?rkT(stats().total):'')}
const NAVV=['study','stats','group'];let lastKey='';
function render(){
  setAcc();
  const nv=$('#nav');nv.style.setProperty('--i',Math.max(0,NAVV.indexOf(S.view)));
  nv.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.view));
  $('#meav').textContent=S.nick?bb(S.nick):'?';$('#meav').style.background=S.color;hdr();
  syncListeners();
  const mn=$('#main');
  mn.innerHTML=S.view==='study'?study():S.view==='stats'?statsView():group();
  segAnim();
  if(S.view==='study')paint();
  if(S.view==='group'&&S.gv==='friends')fixTrain();
  if(S.view==='group'&&S.gv==='chat'){const ci=$('#ci'),cl=$('#cl');if(ci)ci.value=draft;if(cl)cl.scrollTop=cl.scrollHeight}
}

/* ---------- Chat (Supabase Realtime; solo se escucha con el chat abierto; últimos 50 mensajes) ---------- */
let draft='',lastMsg=0;
const hhmm=t=>{const d=new Date(t||Date.now());return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function bubble(m){
  const me=m.uid===fb.uid,col=COLORS.includes(m.color)?m.color:COLORS[0],nk=NICK_RE.test(String(m.nick))?String(m.nick):'Anónimo';
  return `<div class="msg ${me?'mine':''}" id="m_${esc(m.k)}"><div class="av" style="background:${col}">${bb(nk)}</div>
  <div class="bb"><small>${me?'Tú':esc(nk)}${rkT(me?stats().total:num(fb.users[m.uid]?.totalSeconds))} ${hhmm(m.ts)}${me?`<button class="lk" data-delm="${esc(m.k)}">borrar</button>`:''}</small><p>${esc(m.text)}</p></div></div>`;
}
function chatView(){
  const ms=fb.msgs||[];
  return `<div class="card chat"><div class="cl" id="cl">${ms.length?ms.map(bubble).join(''):'<div class="empty" id="ce">Aún no hay mensajes. Escribe el primero.</div>'}</div>
  <div class="cin"><input type="text" id="ci" maxlength="300" placeholder="Escribe un mensaje" autocomplete="off"><button class="mini" id="cs">Enviar</button></div></div>
  <div class="hint">Lo ven todos los usuarios de la app. Se muestran los últimos 50 mensajes.</div>`;
}
function chatAdd(m){
  const l=document.getElementById('cl');if(!l||S.view!=='group'||S.gv!=='chat')return;
  const near=l.scrollHeight-l.scrollTop-l.clientHeight<80||m.uid===fb.uid;
  document.getElementById('ce')?.remove();l.insertAdjacentHTML('beforeend',bubble(m));
  while(l.children.length>80)l.firstChild.remove();
  if(near)l.scrollTop=l.scrollHeight;
}
let chatCh=null;
const rowMsg=r=>({k:String(r.id),uid:r.uid,nick:r.nick,color:r.color,text:r.text,ts:Date.parse(r.ts)||Date.now()});
function addMsg(r){
  const m=rowMsg(r);if(fb.msgs.some(x=>x.k===m.k))return false;
  fb.msgs.push(m);if(fb.msgs.length>80)fb.msgs.shift();chatAdd(m);return true;
}
let AC;
function ding(){try{AC=AC||new(window.AudioContext||webkitAudioContext)();AC.resume();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.frequency.setValueAtTime(988,t);o.frequency.setValueAtTime(1319,t+.12);o.connect(g);g.connect(AC.destination);g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.start(t);o.stop(t+.5)}catch(e){}}
function notifyMsg(r){
  if(!S.nt||r.uid===fb.uid||(!document.hidden&&S.view==='group'&&S.gv==='chat'))return;
  const nk=NICK_RE.test(String(r.nick))?String(r.nick):'Anónimo',t=String(r.text||'').slice(0,300);ding();
  try{if(document.hidden&&'Notification' in window&&Notification.permission==='granted')return void new Notification(nk,{body:t,tag:'chat'})}catch(e){}
  toast(nk+': '+t,4000);
}
function enableNotif(){ding();try{if(!('Notification' in window)||Notification.permission==='denied')toast('Avisos del navegador no disponibles: solo sonará dentro de la app.',4000);else if(Notification.permission==='default')Notification.requestPermission()}catch(e){}}
let chatG='',noGrp=false;
async function loadMsgs(){
  let q=sb.from('chat_messages').select('*').order('ts',{ascending:false}).limit(50);if(!noGrp)q=q.eq('grp',chatG);
  const{data,error}=await q;
  if(error){if(!noGrp&&/grp/.test(error.message||'')){noGrp=true;return loadMsgs()}return console.warn('Chat:',error.message)}
  const mp=new Map();[...(data||[]).map(rowMsg),...fb.msgs].forEach(m=>mp.set(m.k,m));
  fb.msgs=[...mp.values()].sort((a,b)=>a.ts-b.ts);
  if(S.view==='group'&&S.gv==='chat')render();
}
function listenChat(on){
  if(!fb.ok)return;
  const g=curG();
  if(chatCh&&(!on||chatG!==g)){const c=chatCh;chatCh=null;try{Promise.resolve(sb.removeChannel(c)).catch(()=>{})}catch(e){}}
  if(on&&!chatCh){
    chatG=g;fb.msgs=[];
    chatCh=sb.channel('mathstudy:chat:'+g)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',...(noGrp?{}:{filter:'grp=eq.'+g})},p=>{if(addMsg(p.new))notifyMsg(p.new)})
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'chat_messages'},p=>{const k=String(p.old.id);fb.msgs=fb.msgs.filter(m=>m.k!==k);const e=document.getElementById('m_'+k);if(e)e.remove()})
      .subscribe(s=>{if(s==='SUBSCRIBED')loadMsgs()});
  }
}
async function sendMsg(){
  const i=$('#ci'),t=(i?i.value:'').trim().slice(0,300);
  if(!t)return;if(!S.nick||!fb.acct)return settings();if(!fb.ok)return toast('Sin conexión con la comunidad');
  if(Date.now()-lastMsg<1500)return toast('Espera un segundo antes de enviar otro mensaje');
  lastMsg=Date.now();i.value='';draft='';
  const{data,error}=await sb.from('chat_messages').insert({uid:fb.uid,nick:S.nick,k:nickKey(S.nick),color:S.color,text:t,...(noGrp?{}:{grp:curG()})}).select().single();
  if(error){console.warn('Chat:',error.message);if(!noGrp&&/grp/.test(error.message||'')){noGrp=true;return toast('Vuelve a enviar el mensaje.')}return toast('No se pudo enviar el mensaje.')}
  addMsg(data);
}
async function delMsg(id){
  if(!fb.ok)return;
  const{error}=await sb.from('chat_messages').delete().eq('id',id);
  if(error)return toast('No se pudo borrar');
  fb.msgs=fb.msgs.filter(m=>m.k!==String(id));const e=document.getElementById('m_'+id);if(e)e.remove();
}

/* ---------- Ajustes ---------- */
function settings(){
  const d=$('#dlg'),acc=fb.acct;
  d.onkeydown=null;
  const subs=new Set(S.subs),crs=new Set(S.crs);
  d.innerHTML=`<h2>Perfil y ajustes</h2>
  <div class="acct">${acc
    ?`<b>Sesión iniciada</b><div class="hint" style="text-align:left;margin:2px 0 0">Tu progreso se guarda en tu cuenta y se restaura al entrar desde cualquier dispositivo.</div>
    <div class="acts"><button class="ghost" id="cpw">Cambiar contraseña</button><button class="ghost" id="lo">Cerrar sesión</button></div>`
    :`<b>Sin cuenta</b><div class="hint" style="text-align:left;margin:2px 0 0">Crea una cuenta para guardar tu progreso y recuperarlo en cualquier dispositivo.</div>
    <div class="acts"><button class="mini" id="reg">Crear cuenta</button><button class="ghost" id="log">Entrar</button></div>`}</div>
  ${S.nick?`<label for="pn">Nombre de usuario</label><input type="text" id="pn" value="${esc(S.nick)}" readonly><small class="sm">${acc?'Es tu nombre en el ranking y el que usas para entrar. No se puede cambiar.':'Es tu nombre en el ranking.'}</small>`:`<div class="hint" style="text-align:left;margin-top:12px">Tu nombre en el ranking es tu nombre de usuario: crea una cuenta para aparecer en la comunidad.</div>`}
  <label>Curso</label><div class="sjs">${Object.keys(GR).map(g=>`<button type="button" class="sj${crs.has(g)?' on':''}" data-cr="${g}" style="--c:var(--acc)">${GR[g].n}</button>`).join('')}</div>
  <label>Asignaturas</label><div class="subs">${Object.keys(GR).map(g=>`<div data-sgp="${g}"${crs.has(g)?'':' hidden'}><div class="sgh"><span>${GR[g].n}</span><button type="button" class="tgl" data-gt="${g}">Marcar todas</button></div><div class="sjs">${IDS.filter(i=>SUBJ[i].g===g).map(i=>`<button type="button" class="sj${subs.has(i)?' on':''}" data-sj="${i}" style="--c:${SUBJ[i].c}">${SUBJ[i].n}</button>`).join('')}</div></div>`).join('')}</div>
  <label>Color</label><div class="cols">${SPECTRUM.map(c=>`<button type="button" data-col="${c}" class="${c===S.color?'on':''}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}</div>
  <div class="gr2"><div><label for="gd">Meta diaria (h)</label><input type="number" id="gd" min="1" max="24" value="${S.goalD}"></div><div><label for="gw">Meta semanal (h)</label><input type="number" id="gw" min="1" max="168" value="${S.goalW}"></div></div>
  <label>Pomodoro</label><div class="trow"><span>Activar temporizador Pomodoro</span><button type="button" class="swt${S.pomo?' on':''}" data-tg="po" role="switch" aria-checked="${S.pomo}"></button></div>
  <div class="gr2" id="pms"${S.pomo?'':' hidden'}><div><label for="pw">Estudio (min)</label><input type="number" id="pw" min="1" max="180" value="${S.pw}"></div><div><label for="pb">Descanso (min)</label><input type="number" id="pb" min="1" max="60" value="${S.pb}"></div></div>
  <label>Notificaciones</label><div class="trow"><span>Aviso con sonido de mensajes del chat</span><button type="button" class="swt${S.nt?' on':''}" data-tg="nt" role="switch" aria-checked="${S.nt}"></button></div>
  <div class="acts"><button class="ghost" id="dcl">Cerrar</button><button class="mini" id="ok">Guardar</button></div>`;
  d.open||d.showModal();
  let col=S.color,po=S.pomo,nt=S.nt;
  const sync2=()=>d.querySelectorAll('[data-sj]').forEach(b=>b.classList.toggle('on',subs.has(b.dataset.sj)));
  d.onclick=e=>{
    const tg=e.target.closest('[data-tg]');if(tg){const v=tg.dataset.tg==='po'?(po=!po):(nt=!nt);tg.classList.toggle('on',v);tg.setAttribute('aria-checked',v);if(tg.dataset.tg==='po')$('#pms').hidden=!po;else if(v)enableNotif();return}
    const c=e.target.closest('[data-col]');if(c){col=c.dataset.col;d.querySelectorAll('[data-col]').forEach(b=>b.classList.toggle('on',b===c));return}
    const cr=e.target.closest('[data-cr]');if(cr){const g=cr.dataset.cr,ids=IDS.filter(i=>SUBJ[i].g===g);
      if(crs.has(g)){if(crs.size>1){crs.delete(g);ids.forEach(i=>subs.delete(i))}else toast('Debes tener al menos un curso')}else{crs.add(g);ids.forEach(i=>subs.add(i))}
      d.querySelectorAll('[data-cr]').forEach(b=>b.classList.toggle('on',crs.has(b.dataset.cr)));d.querySelectorAll('[data-sgp]').forEach(b=>b.hidden=!crs.has(b.dataset.sgp));sync2();return}
    const j=e.target.closest('[data-sj]');if(j){const i=j.dataset.sj;if(subs.has(i)){if(subs.size>1)subs.delete(i);else toast('Debes tener al menos una asignatura')}else subs.add(i);sync2();return}
    const t=e.target.closest('[data-gt]');if(t){const ids=IDS.filter(i=>SUBJ[i].g===t.dataset.gt),all=ids.every(i=>subs.has(i));ids.forEach(i=>all?subs.delete(i):subs.add(i));if(!subs.size)ids.forEach(i=>subs.add(i));sync2()}
  };
  $('#dcl').onclick=()=>d.close();
  if(acc){$('#cpw').onclick=pwDlg;$('#lo').onclick=logout}
  else{$('#reg').onclick=()=>authDlg('reg');$('#log').onclick=()=>authDlg('log')}
  $('#ok').onclick=()=>{const np=Math.min(180,Math.max(1,num($('#pw').value)||50)),nb=Math.min(60,Math.max(1,num($('#pb').value)||10)),chg=np!==S.pw||nb!==S.pb;S.pomo=po;S.pw=np;S.pb=nb;S.nt=nt;applyPomo();
    if(S.mode==='pomo'&&(!po||chg)){finish();if(!po)S.mode='free'}else if(S.mode!=='pomo'){S.phase=0;S.rem=POMO[0]}
    S.crs=Object.keys(GR).filter(g=>crs.has(g));S.subs=IDS.filter(i=>subs.has(i)&&crs.has(SUBJ[i].g));if(!S.subs.includes(S.sel)&&S.sel!=='otros'&&!S.run)S.sel=S.subs[0];if(!userGroups().includes(S.cg))S.cg='';S.color=col;S.goalD=Math.min(24,num($('#gd').value)||3);S.goalW=Math.min(168,num($('#gw').value)||15);save(true);d.close();render();sync(true);toast('Guardado')};
}

/* ---------- Eventos ---------- */
document.addEventListener('click',e=>{
  const t=e.target,q=s=>t.closest(s);let x;
  if((x=q('#nav button')))return S.view=x.dataset.v,render();
  if((x=q('[data-sub]'))){if(S.run)return toast('Pausa el cronómetro para cambiar de asignatura');S.sel=x.dataset.sub;save();return render()}
  if(q('#go'))return toggle();
  if(q('#fin'))return finish();
  if(q('[data-rk]'))return rkOpen=!rkOpen,render();
  if((x=q('[data-mode]'))){if(S.run)return toast('Pausa el cronómetro para cambiar de modo');S.mode=x.dataset.mode;S.cur=0;S.phase=0;S.rem=POMO[0];save();return render()}
  if((x=q('[data-range]')))return S.range=+x.dataset.range,save(),render();
    if((x=q('[data-wo]')))return wrapOff+=+x.dataset.wo,render();
  if(q('[data-wrep]'))return openStory();
  if((x=q('[data-mi]'))){const[a,b]=x.dataset.mi.split('|');(S.md[a]=S.md[a]||{})[b]=String(Date.now()).padStart(13,'0')+':'+(mv(S.md[a][b])?'':dk());save(true);sync(true);render();return}
  if((x=q('[data-cg]')))return S.cg=x.dataset.cg,save(),render();
  if((x=q('[data-gv]')))return S.gv=x.dataset.gv,render();
  if(q('#cs'))return sendMsg();
  if((x=q('[data-delm]')))return delMsg(x.dataset.delm);
  if((x=q('[data-rank]')))return S.rank=x.dataset.rank,render();
  if(q('[data-reg]'))return authDlg('reg');
  if(q('[data-open]')||q('#me'))return settings();
});
document.addEventListener('change',e=>{const g=e.target.id;if(g==='qd'||g==='qw'){const mx=g==='qd'?24:168,v=Math.min(mx,Math.max(1,num(e.target.value)||1));g==='qd'?S.goalD=v:S.goalW=v;save(true);return render()}
  });
document.addEventListener('input',e=>{if(e.target.id==='ci')draft=e.target.value;});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='ci')sendMsg()});
/* Espacio: iniciar/pausar el cronómetro (solo en la vista Estudiar, sin diálogos abiertos ni escribiendo en un campo) */
const spaceOk=e=>e.code==='Space'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&S.view==='study'&&!$('#dlg').open&&!e.target.closest('input,textarea,select,[contenteditable]');
document.addEventListener('keydown',e=>{if(!spaceOk(e))return;e.preventDefault();if(!e.repeat)toggle()});
document.addEventListener('keyup',e=>{if(spaceOk(e))e.preventDefault()}); // evita que un botón enfocado también se "pulse" al soltar la barra
document.addEventListener('visibilitychange',()=>{if(S.run){last=Date.now()-Math.min(Date.now()-last,864e5)}});

setInterval(()=>{if(S.view==='group'&&S.gv!=='chat'&&!S.run)render()},15000); // refresca 'hace X min' aunque tu cronómetro esté parado
setInterval(()=>document.querySelectorAll('.el[data-s]').forEach(e=>e.textContent=clock((sNow()-e.dataset.s)/1000)),1000);
/* Cerrar cualquier diálogo al pulsar en el fondo difuminado (fuera de la caja) */
(function(){
  const d=$('#dlg');let down=false;
  const out=e=>{const r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
  d.addEventListener('pointerdown',e=>{down=e.target===d&&out(e)});
  d.addEventListener('click',e=>{if(down&&e.target===d&&out(e))d.close();down=false});
})();
load();render();initFb();

/* ---------- Misiones (dentro de «Objetivo») ---------- */
function msWeek(st){
  const a=dk(st),b=dk(addD(st,7));let n=0;const t=[];
  (fb.missions||[]).forEach(x=>{const c=Object.values(S.md[x.id]||{}).map(mv).filter(v=>v>=a&&v<b).length;if(c){n+=c;t.push(x.title)}});
  return{n,t:t.slice(0,3)};
}
function missView(ms){
  const L=fb.missions;if(!L||!L.length)return '';
  const k0=dk(),fin=x=>mDone(x)===mIts(x).length,ord=[...L].sort((a,b)=>fin(a)-fin(b)||(a.dl||'9').localeCompare(b.dl||'9'));
  const bdg=x=>{if(!x.dl||fin(x))return '';const n=Math.round((kd(x.dl)-kd(k0))/864e5);
    return `<span class="mdl${n<0?' late':n<=2?' soon':''}">${n<0?'Vencida':n===0?'Hoy':n===1?'Mañana':'En '+n+' días'}</span>`};
  let h=`<div class="gh">Misiones</div>`+ord.map(x=>{const d=S.md[x.id]||{},its=mIts(x),n=mDone(x);
    return `<div class="card mis${fin(x)?' fin':''}"><div class="mh"><b style="color:${SUBJ[x.s].c}">${esc(x.title)}</b>${bdg(x)}</div>
    <div class="cap" style="margin-top:2px">${esc(SUBJ[x.s].n)}${x.items.length?' · '+n+'/'+its.length:fin(x)?' · Hecha':''}</div>
    <div class="mit">${its.map(i=>`<button type="button" class="${mv(d[i])?'on':''}" data-mi="${esc(x.id)}|${esc(i)}">${mv(d[i])?'✓ ':''}${i==='_'?'Marcar como hecha':esc(i)}</button>`).join('')}</div></div>`}).join('');
  const R=ms.filter(m=>m.ms&&m.ms.n>0).sort((a,b)=>b.ms.n-a.ms.n||b.ms.m-a.ms.m||a.nick.localeCompare(b.nick));
  h+=`<div class="gh">Ranking de misiones</div>`+(R.length?`<div class="list">${R.map((m,i)=>`<div class="m ${m.me?'me1':''}"><div class="pos">${['🥇','🥈','🥉'][i]||i+1}</div>
  <div class="av ${m.on?'on':''}" style="background:${m.color}">${bb(m.nick)}</div><div class="n"><b>${esc(m.nick)}${m.me?' (tú)':''}</b><small>${m.ms.m} ${m.ms.m===1?'misión completa':'misiones completas'}</small></div><div class="t">${m.ms.n} ✓</div></div>`).join('')}</div>`
    :`<div class="empty">Nadie ha completado tareas todavía.</div>`);
  return h;
}
