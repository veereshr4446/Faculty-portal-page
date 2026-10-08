const FOOT='<p class="foot">Built with <span class="heart" role="img" aria-label="love"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#C6532B" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span> by <b>Viresh R</b> · II Year CSE A</p>';
const API='https://script.google.com/macros/s/AKfycbyd8YHPGlBy71wieBP0JL3NtHNPiBK09wU5W4gkPzR0OjVoh4MOOkKQs0Fw5wE0Cyfr0w/exec';
const M=['','Very Poor','Poor','Needs Improvement','Below Average','Average','Satisfactory','Good','Very Good','Excellent','Outstanding'];
let T=sessionStorage.getItem('tok'),D,view='dash',F={q:'',sem:'',sub:'',rt:''},$=i=>document.getElementById(i);
const call=b=>fetch(API,{method:'POST',body:JSON.stringify(b)}).then(r=>r.json());
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avg=a=>a.length?a.reduce((s,x)=>s+Number(x.rating),0)/a.length:0;
const fmt=t=>new Date(t).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
async function signIn(){$('le').textContent='';try{const r=await call({action:'login',username:$('u').value,password:$('p').value});
 if(r.error)throw new Error(r.error);T=r.token;sessionStorage.setItem('tok',T);load()}catch(e){$('le').textContent=e.message}}
async function load(){try{const r=await call({action:'dashboard',token:T});if(r.error)throw new Error(r.error);D=r;
 $('login').classList.add('hide');$('rec').classList.add('hide');$('app').classList.remove('hide');render()}catch(e){sessionStorage.removeItem('tok');$('login').classList.remove('hide');$('app').classList.add('hide');$('le').textContent=e.message}}
function showRec(on){$('login').classList.toggle('hide',!!on);$('rec').classList.toggle('hide',!on);$('rf').classList.remove('hide');$('rd').classList.add('hide');$('re').textContent=''}
async function doReset(){$('re').textContent='';if($('rp').value!==$('rp2').value)return $('re').textContent='Passwords do not match.';
 try{const r=await call({action:'reset',username:$('ru').value,code:$('rc').value,password:$('rp').value});if(r.error)throw new Error(r.error);
  $('rm').textContent='Password updated. '+(r.left>0?'You have '+r.left+' recovery code'+(r.left>1?'s':'')+' left. Keep them safe.':'That was your last recovery code. If you forget your password again, ask the administrator for new codes.');$('rf').classList.add('hide');$('rd').classList.remove('hide');['rc','rp','rp2'].forEach(i=>$(i).value='')}catch(e){$('re').textContent=e.message}}
function signOut(){call({action:'logout',token:T});sessionStorage.removeItem('tok');location.reload()}
document.querySelectorAll('nav [data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;document.querySelectorAll('nav [data-v]').forEach(x=>x.classList.toggle('on',x===b));render()});
function render(){$('main').innerHTML=(view==='dash'?dash():view==='fb'?feed():subs())+FOOT;scrollTo(0,0)}
function greet(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function dash(){const f=D.feedback,m=new Date().getMonth(),y=new Date().getFullYear();
 const mon=f.filter(x=>{const d=new Date(x.ts);return d.getMonth()===m&&d.getFullYear()===y}).length;
 const dist=[10,9,8,7,6,5].map(n=>[n,f.filter(x=>x.rating==n).length]);dist.push(['1–4',f.filter(x=>x.rating<=4).length]);
 const mx=Math.max(1,...dist.map(d=>d[1]));
 const rq={};D.requests.forEach(r=>rq[r.cat]=(rq[r.cat]||0)+1);const rl=Object.entries(rq).sort((a,b)=>b[1]-a[1]),rm=rl[0]?rl[0][1]:1;
 return `<h2>${greet()}, ${esc(D.faculty.name)}</h2><p class="sm">${esc(D.faculty.dept)}</p>
 <div class="stats"><div class="card stat"><b>${avg(f).toFixed(1)}</b>Average rating</div><div class="card stat"><b>${f.length}</b>Responses</div>
 <div class="card stat"><b>${new Set(f.map(x=>x.subject)).size}</b>Subjects</div><div class="card stat"><b>${mon}</b>This month</div></div>
 <div class="cols"><div class="card"><h3>Rating distribution</h3>${dist.map(d=>`<div class="bar"><span>${d[0]}${d[0]>4?' ★':''}</span><i style="width:${d[1]/mx*100}%"></i><span>${d[1]}</span></div>`).join('')}</div>
 <div class="card"><h3>Rating trend</h3>${trend(f)}</div></div>
 <div class="card"><h3>What students want</h3>${rl.length?rl.map(r=>`<div class="bar w g"><span>${esc(r[0])}</span><i style="width:${r[1]/rm*100}%"></i><span>${r[1]}</span></div>`).join(''):'<p class="sm">No recurring requests yet. They appear as students write feedback.</p>'}
 ${rl.length?'<p class="sm">Open Feedback and search a keyword to read the comments behind each request.</p>':''}</div>`}
function trend(f){const g={};f.forEach(x=>{const d=new Date(x.ts),k=d.getFullYear()*12+d.getMonth();(g[k]=g[k]||[]).push(x)});
 const ks=Object.keys(g).sort((a,b)=>a-b);if(ks.length<2)return '<p class="sm">The trend appears after feedback arrives in two different months.</p>';
 const pts=ks.map((k,i)=>[40+i*(300/(ks.length-1)),10+(10-avg(g[k]))*14,avg(g[k]),new Date(Math.floor(k/12),k%12).toLocaleString('en',{month:'short'})]);
 return `<svg viewBox="0 0 360 180"><g stroke="#DED6CC" font-size="10" fill="#756E68">${[10,8,6,4].map(v=>`<line x1="30" x2="350" y1="${10+(10-v)*14}" y2="${10+(10-v)*14}"/><text x="4" y="${14+(10-v)*14}" stroke="none">${v}</text>`).join('')}</g>
 <polyline fill="none" stroke="#C6532B" stroke-width="2.5" points="${pts.map(p=>p[0]+','+p[1]).join(' ')}"/>
 ${pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#C6532B"/><text x="${p[0]}" y="172" font-size="10" text-anchor="middle" fill="#756E68">${p[3]}</text>`).join('')}</svg>`}
function filtered(){return D.feedback.filter(x=>(!F.q||(x.comment+x.subject+x.name).toLowerCase().includes(F.q.toLowerCase()))&&(!F.sem||x.sem==F.sem)&&(!F.sub||x.subject===F.sub)&&
 (!F.rt||(([lo,hi])=>x.rating>=lo&&x.rating<=hi)(F.rt.split('-').map(Number)))).sort((a,b)=>new Date(b.ts)-new Date(a.ts))}
function feed(){const subs=[...new Set(D.feedback.map(x=>x.subject))];
 return `<h2>Feedback</h2><div class="filters"><input id="fq" placeholder="Search comments" value="${esc(F.q)}">
 <select id="fs"><option value="">All semesters</option>${[1,2,3,4,5,6,7,8].map(n=>`<option ${F.sem==n?'selected':''}>${n}</option>`).join('')}</select>
 <select id="fj"><option value="">All subjects</option>${subs.map(s=>`<option ${F.sub===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
 <select id="fr"><option value="">All ratings</option>${['1-4','5-6','7-8','9-10'].map(r=>`<option ${F.rt===r?'selected':''}>${r}</option>`).join('')}</select></div><div id="fl">${items()}</div>`}
function items(){const l=filtered();return l.length?l.map(x=>`<div class="card fb" onclick="detail('${x.id}')"><b>${x.rating} / 10</b> <span class="sm">${M[x.rating]}</span>
 <p>“${esc(x.comment)}”</p><span class="sm">Sem ${esc(x.sem)} · ${esc(x.branch)} · ${esc(x.subject)} · ${fmt(x.ts)}</span></div>`).join(''):'<p class="sm">No feedback matches. Clear a filter to see more.</p>'}
document.addEventListener('input',e=>{const m={fq:'q',fs:'sem',fj:'sub',fr:'rt'}[e.target.id];if(m){F[m]=e.target.value;$('fl').innerHTML=items()}});
function detail(id){const x=D.feedback.find(f=>f.id===id);$('mc').innerHTML=`<h3>Feedback ${esc(x.id)}</h3><dl><dt>Student</dt><dd>${esc(x.name)}</dd><dt>USN / Roll</dt><dd>${esc(x.usn||'Hidden')}</dd>
 <dt>Semester</dt><dd>${esc(x.sem)}</dd><dt>Branch</dt><dd>${esc(x.branch)}</dd><dt>Subject</dt><dd>${esc(x.subject)}</dd><dt>Rating</dt><dd>${x.rating} / 10 · ${M[x.rating]}</dd><dt>Submitted</dt><dd>${fmt(x.ts)}</dd></dl>
 <p>“${esc(x.comment)}”</p><button class="btn" onclick="$('modal').classList.add('hide')">Close</button>`;$('modal').classList.remove('hide')}
function subs(){const g={};D.feedback.forEach(x=>(g[x.subject]=g[x.subject]||[]).push(x));
 return `<h2>My subjects</h2><div class="stats">${Object.entries(g).map(([s,a])=>`<div class="card fb" onclick="F={q:'',sem:'',sub:'${esc(s).replace(/'/g,"\\'")}',rt:''};view='fb';render()"><h3>${esc(s)}</h3><b>${avg(a).toFixed(1)}</b><div class="sm">${a.length} responses</div></div>`).join('')||'<p class="sm">No feedback yet.</p>'}</div>`}
if(T)load();
