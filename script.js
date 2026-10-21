'use strict';
/* ================= 統計計算(画面に依存しない) ================= */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),eq=(a,b)=>Math.abs(a-b)<1e-9,mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const med=s=>{const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
// 四分位数：昇順に並べ、下半分・上半分それぞれの中央値(奇数個のときは全体の中央値を含めない)。分散はnで割る
function stats(a){const s=[...a].sort((x,y)=>x-y),n=s.length,m=n>>1,mu=mean(s),va=mean(s.map(x=>(x-mu)**2)),q1=med(s.slice(0,m)),q3=med(s.slice(n%2?m+1:m));
 return{n,min:s[0],q1,med:med(s),q3,max:s[n-1],mean:mu,var:va,sd:Math.sqrt(va),range:s[n-1]-s[0],iqr:q3-q1};}
const f=x=>Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
const five=s=>[s.min,s.q1,s.med,s.q3,s.max],same5=(a,b)=>five(a).every((v,i)=>eq(v,five(b)[i]));
const sameSet=(a,b)=>{const x=[...a].sort((p,q)=>p-q),y=[...b].sort((p,q)=>p-q);return x.length===y.length&&x.every((v,i)=>v===y[i])};
const DEF={7:[30,40,45,50,55,60,70],11:[20,30,40,45,50,50,55,60,65,70,80],18:[20,25,30,35,40,45,45,50,50,55,55,60,60,65,70,75,80,85]};
/* 教材データ(箱ひげ図の双子・箱ひげ探偵) */
const TWINS=[{d:[10,30,40,50,60,70,90],ex:[10,30,35,50,65,70,90]},{d:[0,10,20,30,40,50,60,70,80,90,100],ex:[0,15,20,25,45,50,55,75,80,90,100]},
 {d:[10,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100],ex:[10,22,25,30,35,41,45,50,55,60,66,70,75,80,85,90,95,100]}];
const DS={q1:[10,30,40,55,60,70,90],q2x:[20,30,40,50,60,70,80],q2y:[10,30,40,50,60,80,100],q3x:[20,30,40,50,60,70,80],q3y:[10,35,40,50,60,65,100],
 q4y:[10,30,40,50,60,70,100],q5y:[0,40,45,50,55,60,100],q7a:[10,30,45,50,55,70,90],q7b:[10,30,31,50,69,70,90],q8a:[10,30,50,50,50,70,90],q8b:[10,30,30,50,60,70,90],
 q9x:[0,45,48,50,52,55,100],q9y:[20,20,20,50,80,80,80],q10:[10,30,40,50,60,70,90],q10b:[10,30,30,50,60,70,90],q10c:[10,30,45,55,70,90]};
const mode=d=>{const c={};d.forEach(v=>c[v]=(c[v]||0)+1);const m=Math.max(...Object.values(c));return Object.keys(c).filter(k=>c[k]===m).join('と')};
// 自己テスト(既知のデータで計算関数と教材データを検証)
function selfTest(){const T=[],t=(n,c)=>T.push([n,!!c]);let s=stats([1,2,3,4,5,6,7]);
 t('奇数個の四分位数・分散',s.q1===2&&s.med===4&&s.q3===6&&eq(s.var,4));s=stats([1,2,3,4,5,6]);t('偶数個',s.q1===2&&s.med===3.5&&s.q3===5);
 s=stats([5,5,5,5,5,5,5]);t('全て同じ値',s.var===0&&s.iqr===0&&s.range===0);s=stats(Array.from({length:11},(_,i)=>i));t('11個',s.q1===2&&s.q3===8);
 s=stats(Array.from({length:18},(_,i)=>i+1));t('18個',s.q1===5&&s.q3===14&&s.med===9.5);
 TWINS.forEach((w,i)=>t('双子の例'+(i+1),same5(stats(w.d),stats(w.ex))&&!sameSet(w.d,w.ex)));
 const S=d=>stats(d),D=DS;t('問1',S(D.q1).med===55);t('問2',S(D.q2y).range>S(D.q2x).range);t('問3',S(D.q3x).iqr>S(D.q3y).iqr&&S(D.q3y).range>S(D.q3x).range);
 t('問4',eq(S(D.q2x).med,S(D.q4y).med)&&!eq(S(D.q2x).mean,S(D.q4y).mean));t('問5',S(D.q2x).iqr>S(D.q5y).iqr&&S(D.q2x).range<S(D.q5y).range);
 t('問6',same5(S(TWINS[0].d),S(TWINS[0].ex)));t('問7',same5(S(D.q7a),S(D.q7b)));t('問8',same5(S(D.q8a),S(D.q8b))&&mode(D.q8a)==='50'&&mode(D.q8b)==='30');
 t('問9',S(D.q9x).range>S(D.q9y).range&&S(D.q9x).var<S(D.q9y).var);t('問10',same5(S(D.q10),S(D.q10b))&&!eq(S(D.q10).mean,S(D.q10b).mean)&&same5(S(D.q10),S(D.q10c))&&!D.q10c.includes(50)&&S(D.q10).min===10&&S(D.q10).iqr===40);
 return T;}
/* ================= 描画(SVG) ================= */
function histSVG(d){const c=Array(10).fill(0);d.forEach(v=>c[Math.min(9,Math.floor(v/10))]++);const m=Math.max(...c,1);
 return `<g>${c.map((k,i)=>`<rect x="${40+i*46}" y="${170-k/m*140}" width="44" height="${k/m*140}" fill="#6b8cff"/><text x="${62+i*46}" y="${166-k/m*140}" font-size="12" text-anchor="middle">${k||''}</text><text x="${40+i*46}" y="188" font-size="10" text-anchor="middle">${i*10}</text>`).join('')}<text x="500" y="188" font-size="10" text-anchor="middle">100</text><line x1="40" y1="170" x2="500" y2="170" stroke="#333"/></g>`.replace('<g>','<g>')+'';}
const HV='0 0 520 200';
function boxSVG(rows){const X=v=>70+v/100*430,H=rows.length*56+24;let g='';for(let v=0;v<=100;v+=10)g+=`<line x1="${X(v)}" y1="4" x2="${X(v)}" y2="${H-18}" stroke="#e5e7eb"/><text x="${X(v)}" y="${H-5}" font-size="10" text-anchor="middle">${v}</text>`;
 rows.forEach(([nm,s],r)=>{const y=8+r*56,cl=['#1d4ed8','#d97706'][r%2];g+=`<text x="4" y="${y+30}" font-size="12">${nm}</text><line x1="${X(s.min)}" y1="${y+26}" x2="${X(s.max)}" y2="${y+26}" stroke="${cl}" stroke-width="2"/><line x1="${X(s.min)}" y1="${y+16}" x2="${X(s.min)}" y2="${y+36}" stroke="${cl}" stroke-width="2"/><line x1="${X(s.max)}" y1="${y+16}" x2="${X(s.max)}" y2="${y+36}" stroke="${cl}" stroke-width="2"/><rect x="${X(s.q1)}" y="${y+12}" width="${Math.max(X(s.q3)-X(s.q1),1)}" height="28" fill="${cl}" fill-opacity=".18" stroke="${cl}" stroke-width="2"/><line x1="${X(s.med)}" y1="${y+12}" x2="${X(s.med)}" y2="${y+40}" stroke="${cl}" stroke-width="4"/>`;
  [[s.min,y+10],[s.med,y+8],[s.max,y+10]].forEach(([v,yy])=>g+=`<text x="${X(v)}" y="${yy}" font-size="10" text-anchor="middle">${f(v)}</text>`);[s.q1,s.q3].forEach(v=>g+=`<text x="${X(v)}" y="${y+50}" font-size="10" text-anchor="middle">${f(v)}</text>`);});
 return `<g>${g}</g>`;}
const setSvg=(el,h,vb)=>{el.setAttribute('viewBox',vb);el.innerHTML=h};
/* ================= 数値入力欄(▲▼は枠の内側、5刻み、0〜100) ================= */
function editor(box,vals,onch){const v=vals.slice();box.innerHTML='';
 v.forEach((x,i)=>{const c=document.createElement('div');c.className='cell';c.innerHTML='<input type="number" min="0" max="100" step="1" inputmode="numeric"><span class="ar"><button type="button" aria-label="5増やす">▲</button><button type="button" aria-label="5減らす">▼</button></span>';
  const inp=c.querySelector('input'),[u,d]=c.querySelectorAll('button');inp.value=x;const set=n=>{v[i]=clamp(Math.round(n),0,100);inp.value=v[i];onch()};
  inp.addEventListener('input',()=>{if(inp.value==='')return;const n=parseFloat(inp.value);if(!isNaN(n)){v[i]=clamp(Math.round(n),0,100);if(String(v[i])!==inp.value)inp.value=v[i];onch()}});
  inp.addEventListener('change',()=>{inp.value=v[i]});u.onclick=()=>set(v[i]+5);d.onclick=()=>set(v[i]-5);box.appendChild(c)});return v;}
/* ================= ミッション定義 ================= */
const U=['大きく','小さく'],sl=(b,c)=>[['平均値','mean'],['中央値','med'],['分散','var'],['最大値','max'],['最小値','min'],['四分位範囲','iqr']].map(([l,k])=>`${l} ${f(b[k])}→${f(c[k])}`).join('／');
const diff=(b,c,x)=>x?c<b-1e-9:c>b+1e-9;
const M5={n:'ミッション5：平均値と中央値を変えずに、データを変えよ',t:'平均値と中央値を保ったまま、元のデータとは違うデータを作ります。',c:(b,c,x,bd,cd)=>[['平均値が基準と等しい',eq(b.mean,c.mean)],['中央値が基準と等しい',eq(b.med,c.med)],['元のデータから値が1つ以上変化している',cd.some((v,i)=>v!==bd[i])]],
 hint:'1つの値を増やしたら、別の値を同じだけ減らします。ただし並べたときの真ん中の値は動かさないように。',why:'平均値は合計、中央値は真ん中の順位の値で決まります。両方が同じでも、それ以外の値が違えば別のデータです。'};
const LAB=[{n:'ミッション1：平均値を変えずに、分散を変えよ',t:'平均値を保ったまま、分散を「大きく」または「小さく」します（別々の挑戦）。',dirs:1,c:(b,c,x)=>[['平均値が基準と等しい',eq(b.mean,c.mean)],[`分散が基準より${x?'小さい':'大きい'}`,diff(b.var,c.var,x)]],hint:'1つの値を増やしたら、別の値を同じだけ減らすと平均値は変わりません。大きい値をより大きく・小さい値をより小さくすると散らばりは増えます。',why:'合計を変えずに、値を平均から遠ざける（近づける）と偏差平方の平均＝分散が大きく（小さく）なります。'},
{n:'ミッション2：分散を変えずに、平均値を変えよ',t:'分散を保ったまま、平均値を「大きく」または「小さく」します。',dirs:1,c:(b,c,x)=>[['分散が基準と等しい',eq(b.var,c.var)],[`平均値が基準より${x?'小さい':'大きい'}`,diff(b.mean,c.mean,x)]],hint:'すべての値に同じ数を足す（引く）とどうなるでしょう。',why:'すべての値に同じ数を加減すると、平均値も同じだけ動き、偏差は変わらないので分散は変わりません。'},
{n:'ミッション3：平均値を変えずに、中央値を変えよ',t:'平均値を保ったまま、中央値を「大きく」または「小さく」します。データによっては難しい場合があります。',dirs:1,c:(b,c,x)=>[['平均値が基準と等しい',eq(b.mean,c.mean)],[`中央値が基準より${x?'小さい':'大きい'}`,diff(b.med,c.med,x)]],hint:'真ん中あたりの値を動かし、その分を端の値で調整します。',why:'平均値は合計で、中央値は並べたときの真ん中の値で決まるため、一方を保って他方を動かせる場合があります。'},
{n:'ミッション4：最大値と最小値を変えずに、四分位範囲を大きくせよ',t:'最大値と最小値を固定して、四分位範囲を大きくします。',c:(b,c)=>[['最大値が基準と等しい',c.max===b.max],['最小値が基準と等しい',c.min===b.min],['四分位範囲が基準より大きい',c.iqr>b.iqr+1e-9]],can:b=>b.iqr<b.range-1e-9||'この基準データは四分位範囲がすでに範囲と等しい（Q1＝最小値、Q3＝最大値）ため、最大値・最小値を変えずに四分位範囲を大きくすることはできません。',hint:'Q1やQ3の位置にある値を、最小値・最大値の方へ動かしてみましょう。',why:'範囲は両端だけで決まり、四分位範囲は中央の約半分の値の幅で決まるため、端を固定しても箱の幅は変えられます。'},M5];
const TRICK=[{n:'トリック1：中央値を保ちながら、最大値を変えよ',t:'中央値を変えずに、最大値だけを変えます。',c:(b,c)=>[['中央値が基準と等しい',eq(b.med,c.med)],['最大値が基準と異なる',c.max!==b.max]],hint:'真ん中の順位の値は動かさず、いちばん大きい値だけを動かします。',why:'中央値は真ん中の順位の値で決まるので、最大値を（中央値より大きい範囲で）変えても動きません。'},
{n:'トリック2：平均値を保ちながら、分散を変えよ',t:'平均値を変えずに、分散を変えます。',c:(b,c)=>[['平均値が基準と等しい',eq(b.mean,c.mean)],['分散が基準と異なる',!eq(b.var,c.var)]],hint:'ある値を増やし、別の値を同じだけ減らします。',why:'合計を変えずに値を平均から遠ざけたり近づけたりすると、平均はそのままで分散が変わります。'},{...M5,n:'トリック3：平均値と中央値を保ちながら、データを変えよ'}];
// 達成例の探索(全体シフト→1つ変更→2値の増減の順に、判定関数で検証)
function findExample(M,bd,x){const b=stats(bd),n=bd.length,ok=d=>d.every(v=>v>=0&&v<=100)&&M.c(b,stats(d),x,bd,d).every(r=>r[1]);
 for(let k=30;k>=1;k--)for(const e of [k,-k]){const d=bd.map(v=>v+e);if(ok(d))return d}
 for(let i=0;i<n;i++)for(let v=0;v<=100;v++){const d=bd.slice();d[i]=v;if(ok(d))return d}
 for(let k=30;k>=1;k--)for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j){const d=bd.slice();d[i]+=k;d[j]-=k;if(ok(d))return d}
 for(let k=30;k>=1;k--)for(const e of [1,-1])for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let l=0;l<n;l++)if(l!==i&&l!==j){const d=bd.slice();d[i]-=e*k;d[j]-=e*k;d[l]+=2*e*k;if(ok(d))return d}
 return null;}
const mark=(a,b)=>'['+a.map((v,i)=>v!==b[i]?`<b>${v}</b>`:v).join(', ')+']';
/* ================= タブ①③：データ操作ラボ／トリックメーカー ================= */
function Lab(root,o){let n=o.sizes[0],data,base=null,mi=0,x=0;const q=s=>root.querySelector(s),uid='d'+Math.random().toString(36).slice(2,6);
 root.innerHTML=`<div class="top"><label>データ数 <select class="sz"></select></label> <button class="rs">初期値に戻す</button><span class="note"> データ数を変えると、先頭から既存の値を引き継ぎ不足分は初期値で補います（課題の基準データは解除されます）。値は0〜100、▲▼は5刻み。</span></div>
 <div class="grid"></div><div class="cards"></div><div class="charts"><div><h4>ヒストグラム（階級幅10：0以上10未満…90以上100以下）</h4><svg class="hs"></svg></div><div><h4>箱ひげ図</h4><svg class="bs"></svg></div></div>
 <details><summary>計算の定義</summary><p class="note">分散＝（偏差の2乗の平均）＝各値と平均値の差を2乗して平均（データ数nで割る）。標準偏差＝√分散。四分位数＝昇順に並べて下半分・上半分に分け、それぞれの中央値（奇数個のときは全体の中央値を含めない）。範囲＝最大値−最小値、四分位範囲＝Q3−Q1。</p></details>
 <div class="ms"><div class="ml"></div><p class="mt"></p><div class="dr"></div><button class="st">この課題を始める（いまのデータを基準にする）</button><div class="stat"></div><button class="hi">ヒントを見る</button><button class="an">答えを見る</button><div class="out"></div></div>`;
 o.sizes.forEach(k=>q('.sz').add(new Option(k+'個',k)));
 const build=v=>{data=editor(q('.grid'),v,render);render()};
 function render(){const s=stats(data);q('.cards').innerHTML=[['平均値',s.mean],['中央値',s.med],['分散',s.var],['標準偏差',s.sd],['範囲',s.range],['四分位範囲',s.iqr]].map(([a,b])=>`<div class="card"><span>${a}</span><b>${f(b)}</b></div>`).join('')+`<div class="five">最小値 ${f(s.min)}／Q1 ${f(s.q1)}／中央値 ${f(s.med)}／Q3 ${f(s.q3)}／最大値 ${f(s.max)}</div>`;
  setSvg(q('.hs'),histSVG(data),HV);setSvg(q('.bs'),boxSVG([['データ',s]]),`0 0 520 ${80}`);status();}
 function status(){const M=o.missions[mi],el=q('.stat');if(!base){el.textContent='「この課題を始める」を押すと、いまのデータが基準になります。';return}
  const b=stats(base),c=stats(data),cn=M.can?M.can(b):true;if(cn!==true){el.innerHTML=`<span class="bad">${cn}</span>`;return}
  const r=M.c(b,c,x,base,data),all=r.every(v=>v[1]);el.innerHTML=`<div class="note">基準：${sl(b,b).replace(/(\S+) (\S+)→\S+/g,'$1 $2')}</div>`+r.map(v=>`<div class="${v[1]?'ok':'ng'}">${v[1]?'✔':'✗'} ${v[0]}</div>`).join('')+`<div class="res ${all?'ok':'ng'}">${all?'達成！':'未達成'}</div>`;}
 function pick(i){mi=i;x=0;base=null;const M=o.missions[i];q('.ml').innerHTML=o.missions.map((m,k)=>`<button data-i="${k}" class="${k===i?'on':''}">${m.n.split('：')[0]}</button>`).join('');
  q('.mt').innerHTML=`<b>${M.n}</b><br>${M.t}`;q('.dr').innerHTML=M.dirs?U.map((u,k)=>`<label><input type="radio" name="${uid}" value="${k}" ${k?'':'checked'}> ${u}</label>`).join(' '):'';q('.out').innerHTML='';status();}
 q('.ml').addEventListener('click',e=>{if(e.target.dataset.i!==undefined)pick(+e.target.dataset.i)});q('.dr').addEventListener('change',e=>{x=+e.target.value;status()});
 q('.st').onclick=()=>{base=data.slice();q('.out').innerHTML='';status()};q('.hi').onclick=()=>q('.out').innerHTML='ヒント：'+o.missions[mi].hint;
 q('.an').onclick=()=>{const M=o.missions[mi],o2=q('.out');if(!base){o2.textContent='先に「この課題を始める」を押して基準データを作ってください。';return}
  const b=stats(base);if(M.can&&M.can(b)!==true){o2.innerHTML=`<span class="bad">${M.can(b)}</span>`;return}
  const ex=findExample(M,base,x);if(!ex){o2.innerHTML='<span class="bad">この基準データでは、自動探索で達成例を見つけられませんでした（達成が難しいデータかもしれません）。条件は変更していません。</span>';return}
  o2.innerHTML=`<b>模範解の一例</b>（変えた値を太字で表示）<br>基準：[${base.join(', ')}]<br>例　：${mark(ex,base)}<br>${sl(b,stats(ex))}<br>${M.why}<br><span class="note">これは一例で、唯一の正解ではありません。あなたの入力データは変更していません。</span>`;};
 q('.sz').onchange=e=>{const old=data;n=+e.target.value;base=null;build(DEF[n].map((d,i)=>i<old.length?old[i]:d));pick(mi)};q('.rs').onclick=()=>build(DEF[n]);
 build(DEF[n]);pick(0);}
/* ================= タブ②：箱ひげ図の双子 ================= */
function Twins(root){let ti=0,data;const q=s=>root.querySelector(s);
 root.innerHTML=`<p class="lead">課題のデータと「箱ひげ図は同じ（5つの値が一致）なのに、データは違う」ものを作ろう。最初は課題と同じデータが入っています。</p><div class="ml"></div><div class="grid"></div><svg class="bs"></svg><div class="tb"></div><div class="stat"></div><button class="hi">ヒントを見る</button><button class="an">答えを見る</button><div class="out"></div>`;
 function render(){const a=stats(data),t=TWINS[ti],b=stats(t.d),L=['最小値','Q1','中央値','Q3','最大値'],A=five(a),B=five(b);setSvg(q('.bs'),boxSVG([['あなた',a],['課題',b]]),'0 0 520 136');
  q('.tb').innerHTML='<table><tr><th></th>'+L.map(l=>`<th>${l}</th>`).join('')+'</tr><tr><td>あなた</td>'+A.map(f).map(v=>`<td>${v}</td>`).join('')+'</tr><tr><td>課題</td>'+B.map(f).map(v=>`<td>${v}</td>`).join('')+'</tr><tr><td>一致</td>'+A.map((v,i)=>`<td class="${eq(v,B[i])?'ok':'ng'}">${eq(v,B[i])?'✔':'✗'}</td>`).join('')+'</tr></table>';
  const s5=same5(a,b),dif=!sameSet(data,t.d);q('.stat').innerHTML=`<div class="${s5?'ok':'ng'}">${s5?'✔':'✗'} 箱ひげ図の5つの値がすべて一致</div><div class="${dif?'ok':'ng'}">${dif?'✔':'✗'} 課題とは異なるデータ（並べ替えただけは不可）</div><div class="res ${s5&&dif?'ok':'ng'}">${s5&&dif?'達成！ 異なるデータなのに同じ箱ひげ図':'未達成'}</div>`;}
 function pick(i){ti=i;q('.ml').innerHTML=TWINS.map((t,k)=>`<button data-i="${k}" class="${k===i?'on':''}">課題${k+1}（${t.d.length}個）</button>`).join('');data=editor(q('.grid'),TWINS[i].d,render);q('.out').innerHTML='';render();}
 q('.ml').addEventListener('click',e=>{if(e.target.dataset.i!==undefined)pick(+e.target.dataset.i)});
 q('.hi').onclick=()=>q('.out').innerHTML='ヒント：最小値・Q1・中央値・Q3・最大値を決めている値は動かさず、それ以外の値を、順位が入れ替わらない範囲で動かしてみよう。';
 q('.an').onclick=()=>{const t=TWINS[ti];q('.out').innerHTML=`<b>一例</b><br>課題：[${t.d.join(', ')}]<br>例　：${mark(t.ex,t.d)}<br>5つの値はどちらも ${five(stats(t.ex)).map(f).join('、')}。四分位数を決める値や中央値は同じで、それ以外の値だけを変えているので、箱ひげ図は同じです。<br><span class="note">一例です。あなたの入力は変更していません。</span>`};
 pick(0);}
/* ================= タブ④：箱ひげ探偵 ================= */
const CH=[['A','必ずいえる'],['B','そうとは限らない'],['C','箱ひげ図だけでは判断できない']],S=d=>stats(d),L=d=>'['+d.join(', ')+']';
const DQ=[
{t:'問1：中央値はどこ？',rows:[['データ',DS.q1]],items:[{c:'このデータの中央値は55である。',a:'A',ex:'箱の中の太い線が中央値で、位置は55です。図の数値からそのまま読み取れるので必ずいえます。'}]},
{t:'問2：どちらの範囲が大きい？',rows:[['X',DS.q2x],['Y',DS.q2y]],items:[{c:'範囲（最大値−最小値）はYのほうがXより大きい。',a:'A',ex:`Xの範囲は${S(DS.q2x).max}−${S(DS.q2x).min}＝${S(DS.q2x).range}、Yは${S(DS.q2y).max}−${S(DS.q2y).min}＝${S(DS.q2y).range}。ひげの両端の差で比べられるので必ずいえます。`}]},
{t:'問3：中央の50％はどちらが散らばっている？',rows:[['X',DS.q3x],['Y',DS.q3y]],items:[{c:'四分位範囲（箱の長さ）はXのほうがYより大きい。',a:'A',ex:`Xの四分位範囲は${S(DS.q3x).q3}−${S(DS.q3x).q1}＝${S(DS.q3x).iqr}、Yは${S(DS.q3y).q3}−${S(DS.q3y).q1}＝${S(DS.q3y).iqr}。ひげ全体（範囲）はYのほうが長いですが、問われているのは箱の長さです。`}]},
{t:'問4：中央値が同じなら、平均値も同じ？',rows:[['X',DS.q2x],['Y',DS.q4y]],items:[{c:'中央値が同じなら、平均値も必ず同じである。',a:'B',ex:`XもYも中央値は${S(DS.q2x).med}ですが、Xの平均値は${f(S(DS.q2x).mean)}、Yの平均値は${f(S(DS.q4y).mean)}で異なります。反例があるので「そうとは限らない」です。（X=${L(DS.q2x)}、Y=${L(DS.q4y)}）`}]},
{t:'問5：箱が長いと、データ全体の範囲も大きい？',rows:[['X',DS.q2x],['Y',DS.q5y]],items:[{c:'箱（四分位範囲）が長いほうが、範囲も必ず大きい。',a:'B',ex:`Xの箱は${S(DS.q2x).iqr}でYの箱${S(DS.q5y).iqr}より長いのに、範囲はXが${S(DS.q2x).range}、Yが${S(DS.q5y).range}でYのほうが大きい。反例があるので「そうとは限らない」です。`}]},
{t:'問6：箱ひげ図が同じなら、データも同じ？',rows:[['データ',TWINS[0].d]],items:[{c:'箱ひげ図が同じなら、元のデータも必ず同じである。',a:'B',ex:`${L(TWINS[0].d)} と ${L(TWINS[0].ex)} はどちらも ${five(S(TWINS[0].ex)).map(f).join('、')} で箱ひげ図は同じですが、データは違います。`}]},
{t:'問7：データが集中している場所まで分かる？',rows:[['データ',DS.q7a]],items:[{c:'データは中央値のまわりに最も多く集まっている。',a:'C',ex:`${L(DS.q7a)}（中央付近に集中）と ${L(DS.q7b)}（中央から離れた所に集中）は、どちらも同じ箱ひげ図になります。値の集まり方は箱ひげ図には表れません。`}]},
{t:'問8：最頻値はどこにある？',rows:[['データ',DS.q8a]],items:[{c:'最頻値は中央値と等しい。',a:'C',ex:`${L(DS.q8a)} の最頻値は${mode(DS.q8a)}、${L(DS.q8b)} の最頻値は${mode(DS.q8b)}ですが、箱ひげ図はどちらも同じです。最頻値は箱ひげ図から読み取れません。`}]},
{t:'問9：どちらのデータの分散が大きい？',rows:[['X',DS.q9x],['Y',DS.q9y]],items:[{c:'範囲が大きいXのほうが、分散も必ず大きい。',a:'B',ex:`Xの範囲は${S(DS.q9x).range}でYの${S(DS.q9y).range}より大きいですが、分散はX=${f(S(DS.q9x).var)}、Y=${f(S(DS.q9y).var)}でYのほうが大きい。元データ X=${L(DS.q9x)}、Y=${L(DS.q9y)}。分散は全データの散らばりで決まるので、範囲や箱の大小だけでは決まりません。`}]},
{t:'問10：箱ひげ図だけで、どこまで言える？',rows:[['データ',DS.q10]],items:[
 {c:'(1) 最小値は10である。',a:'A',ex:'左のひげの端が最小値で、10です。'},{c:'(2) 四分位範囲は40である。',a:'A',ex:'Q3−Q1＝70−30＝40です。'},
 {c:'(3) 平均値は中央値（50）と等しい。',a:'C',ex:`平均値は箱ひげ図に表れません。${L(DS.q10)} の平均は${f(S(DS.q10).mean)}、${L(DS.q10b)} の平均は${f(S(DS.q10b).mean)}で、どちらも同じ箱ひげ図です。`},
 {c:'(4) 中央値と等しい値（50）のデータが必ず存在する。',a:'B',ex:`${L(DS.q10c)}（6個）も同じ箱ひげ図ですが、中央値は中央2値の平均で、50というデータはありません。反例があります。`}]}];
function Detective(root){let qi=0,score=0;const QS=DQ.map(q=>({done:false,ch:q.items.map(()=>null),re:'',ok:null})),md={v:'3'};
 root.innerHTML=`<p class="lead">箱ひげ図から「主張」が言えるか判断しよう。<br><b>A 必ずいえる</b>＝図の数値から確実に導ける／<b>B そうとは限らない</b>＝「必ず〜」という主張に、図と矛盾しない反例がある／<b>C 箱ひげ図だけでは判断できない</b>＝問われている量（平均値・最頻値・値の集まり方など）が図に表れていない。</p>
 <div>回答方法：<label><input type="radio" name="md" value="1">3択で判断</label> <label><input type="radio" name="md" value="2">理由を記述</label> <label><input type="radio" name="md" value="3" checked>3択＋理由</label></div><div class="q"></div>`;
 root.addEventListener('change',e=>{if(e.target.name==='md')md.v=e.target.value,draw()});
 function draw(){const Q=DQ[qi],st=QS[qi],m=md.v;const rec=QS.map(x=>x.re);
  root.querySelector('.q').innerHTML=`<h3>${Q.t}（${qi+1}/10）　選択式の正解数：${score}</h3><svg class="bs"></svg>`+Q.items.map((it,i)=>`<div class="sub"><p><b>${it.c}</b></p>${m!=='2'?CH.map(([k,l])=>`<label><input type="radio" name="c${i}" value="${k}" ${st.ch[i]===k?'checked':''} ${st.done?'disabled':''}>${k}：${l}</label>`).join(''):''}<div class="r${i}"></div></div>`).join('')+
  (m!=='1'?`<p>判断理由（自動採点はしません）</p><textarea class="re" ${st.done?'readonly':''}>${st.re}</textarea>`:'')+`<div><button class="go" ${st.done?'disabled':''}>回答する</button><button class="nx" ${st.done&&qi<9?'':'disabled'}>次の問題へ</button></div><div class="out"></div>`;
  const rows=Q.rows.map(([a,d])=>[a,S(d)]);setSvg(root.querySelector('.bs'),boxSVG(rows),`0 0 520 ${rows.length*56+24}`);if(st.done)show();}
 function show(){const Q=DQ[qi],st=QS[qi],m=md.v,o=root.querySelector('.out');let h='';
  Q.items.forEach((it,i)=>{const ch=st.ch[i],ok=ch===it.a,ex=`<br>正しい選択肢：${it.a}「${CH.find(c=>c[0]===it.a)[1]}」<br>${it.ex}`;h+=`<div class="sub"><b>${it.c.slice(0,12)}…</b> `+(m==='2'||ch===null?`<span class="note">模範解答</span>${ex}`:`<b class="${ok?'ok':'ng'}">${ok?'正解':'不正解'}</b>${ex}`)+'</div>'});
  o.innerHTML=h+(m!=='1'?'<p class="note">理由は自動採点されません。解説と見比べて、自分の説明を確かめましょう。</p>':'');}
 root.addEventListener('click',e=>{const st=QS[qi],m=md.v;
  if(e.target.classList.contains('go')){if(st.done)return;const Q=DQ[qi];if(m!=='2')Q.items.forEach((it,i)=>{const r=root.querySelector(`input[name=c${i}]:checked`);st.ch[i]=r?r.value:null});const ta=root.querySelector('.re');if(ta)st.re=ta.value;
   if(m!=='2'&&st.ch.some(c=>c===null))return void(root.querySelector('.out').innerHTML='<span class="bad">すべての主張で選択肢を選んでください。</span>');
   if(m!=='1'&&!st.re.trim())return void(root.querySelector('.out').innerHTML='<span class="bad">判断理由を書いてください。</span>');
   st.done=true;if(m!=='2'&&Q.items.every((it,i)=>st.ch[i]===it.a))score++;draw();}
  if(e.target.classList.contains('nx')&&qi<9){qi++;draw()}});
 root.addEventListener('input',e=>{if(e.target.classList.contains('re'))QS[qi].re=e.target.value});
 draw();}
/* ================= 起動 ================= */
Lab(document.getElementById('t1'),{sizes:[7,11,18],missions:LAB});Twins(document.getElementById('t2'));Lab(document.getElementById('t3'),{sizes:[7,11,18],missions:TRICK});Detective(document.getElementById('t4'));
document.getElementById('tabs').addEventListener('click',e=>{const t=e.target.dataset.t;if(!t)return;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b===e.target));document.querySelectorAll('main section').forEach(s=>s.hidden=s.id!==t)});
const TR=selfTest(),bad=TR.filter(r=>!r[1]);document.getElementById('foot').textContent=`自己テスト：${TR.length-bad.length}/${TR.length} 合格`+(bad.length?'（不合格：'+bad.map(r=>r[0]).join('、')+'）':'');
