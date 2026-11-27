(function(){
var PHONE='60182676500';
var wa=function(t){return 'https://wa.me/'+PHONE+'?text='+encodeURIComponent(t)};
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var mk=function(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
var rm=function(n){return 'RM'+n.toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})};

document.querySelectorAll('.wa').forEach(function(a){a.href=wa('Hi Renwick! Nak buat custom jersey.');a.target='_blank';a.rel='noopener'});
$('#yr').textContent=new Date().getFullYear();

/* ---------- mobile menu */
var menu=$('#menu'),openB=$('#menuOpen'),closeB=$('#menuClose');
function setMenu(on){menu.classList.toggle('open',on);document.body.classList.toggle('menu-open',on);openB.setAttribute('aria-expanded',on);if(on)closeB.focus();else openB.focus()}
openB.onclick=function(){setMenu(true)};closeB.onclick=function(){setMenu(false)};
menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');document.body.classList.remove('menu-open');openB.setAttribute('aria-expanded',false)})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu.classList.contains('open'))setMenu(false)});

/* ---------- ticker */
var tk=['Sports','Batik','Camo','Varsity','Modest','Polo','F1 Uniforms','Family Day','Plain'];
var s=tk.map(function(x){return '<span>'+x+'</span><i>✱</i>'}).join('');
$('#slash').innerHTML=s+s+s+s;

/* ---------- 01 collections */
var cols=[
['RW 001–055','Sports & Activewear','Sport','Sublimated','#2350FF','#F7F4EE','Sublimated athletic patterns and geometric fades. Raglan or set-in sleeves, quick-dry microfibre.'],
['RW 080–087','Streetwear & Varsity','Sport','Gridiron','#FFA36C','#08090D','NFL-style cuts with sleeve stripes, big front and back numbers and your team wordmark.'],
['RW 064–079','Tactical Camo','Sport','Outdoor','#4B5A3A','#F7F4EE','Digital, woodland, desert and urban camo for trips, adventure clubs and team-building.'],
['RW 056–063','Heritage Batik','Office','Malaysian','#8C3A22','#F7F4EE','Modern batik motifs for Batik Fridays, cultural events and institutional wear.'],
['Custom-made','Custom Polo Shirts','Office','Cut & sew','#0E1A3A','#F7F4EE','Colour-blocked, striped or tonal polos with rib collars, plackets and embroidered logos.'],
['Custom-made','Corporate F1 Uniforms','Office','Workwear','#3A3F4F','#F7F4EE','Button-downs for execs and techs. Contrast yokes, two chest pockets, piped plackets.'],
['RW 088–095','Islamic & Modest','Office','Muslimah cut','#1E5B52','#F7F4EE','Geometric arabesque and calligraphy-inspired prints, in unisex and longer Muslimah cuts.'],
['FD #001–024','Family Day & Events','Events','34 emblems','#E9B43C','#08090D','Lola, Swing, Tioman, Vacay, Jamboree and more, each carrying your family, company or trip name.'],
['Ready stock','Plain Essentials','Events','All sizes','#C9C1B3','#08090D','Blank cotton and microfibre tees in every size, ready for silkscreen, DTF or embroidery.']];
var filter='All',rows=$('#rows');
function drawCols(){
  var f=$('#filters');f.innerHTML='';
  ['All','Sport','Office','Events'].forEach(function(x){var b=mk('button',x===filter?'on':'',x);b.setAttribute('aria-pressed',x===filter);b.onclick=function(){filter=x;drawCols();rows.scrollTo({left:0})};f.appendChild(b)});
  rows.innerHTML=cols.filter(function(c){return filter==='All'||c[2]===filter}).map(function(c,i){
    return '<article class="r" style="--c:'+c[4]+';--fg:'+c[5]+'"><span class="r-no" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span><span class="r-code">'+esc(c[0])+'</span><h3 class="r-name">'+esc(c[1])+'</h3><p class="r-desc">'+esc(c[6])+'</p><div class="r-sw" aria-hidden="true"></div><span class="r-tag">'+esc(c[3])+'</span></article>'}).join('');
  rail();
}
function rail(){
  var n=rows.children.length;if(!n)return;
  var max=rows.scrollWidth-rows.clientWidth, p=max>0?rows.scrollLeft/max:0;
  var idx=Math.min(n,Math.round(p*(n-1))+1);
  $('#railNo').textContent=String(idx).padStart(2,'0')+' / '+String(n).padStart(2,'0');
  var w=Math.max(12,100/n);$('#railBar').style.width=w+'%';$('#railBar').style.left=(p*(100-w))+'%';
}
rows.addEventListener('scroll',rail,{passive:true});
drawCols();

/* ---------- 02 viewer: photos turn the kit; load 3D only when near */
document.querySelectorAll('[data-goto]').forEach(function(b){b.addEventListener('click',function(){
  var v=document.querySelector('[data-view="'+b.dataset.goto+'"]');if(v)v.click();
  var st=document.querySelector('.viewer');if(st&&window.innerWidth<=760)st.scrollIntoView({behavior:'smooth',block:'center'});
})});
var vEl=document.querySelector('[data-jersey-viewer]');
if(vEl){
  var load=function(){var sc=document.createElement('script');sc.src='assets/js/viewer.min.js?v=3';sc.async=true;document.body.appendChild(sc)};
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();load()}},{rootMargin:'800px 0px'});io.observe(vEl)}else load();
}

/* ---------- 03 maths */
var st={qty:30,collar:'Round neck',names:true,numbers:true,design:false};
var qty=$('#qty'),lastQuote='';
$('#rcno').textContent='RW-'+String(Date.now()).slice(-5);
function drawQ(){
  var q=Math.max(30,parseInt(st.qty,10)||30);
  var qk=$('#quick');qk.innerHTML='';
  [30,50,100,150].forEach(function(n){var b=mk('button',q===n?'on':'',n+' pcs');b.setAttribute('aria-pressed',q===n);b.onclick=function(){st.qty=n;qty.value=n;drawQ()};qk.appendChild(b)});
  var c=$('#collars');c.innerHTML='';
  ['Round neck','V-neck','Polo / Mandarin','Retro'].forEach(function(k){var b=mk('button','opt'+(st.collar===k?' on':''),esc(k));b.setAttribute('aria-pressed',st.collar===k);b.onclick=function(){st.collar=k;drawQ()};c.appendChild(b)});
  var a=$('#addons');a.innerHTML='';
  [['names','Player names','+RM2/pc'],['numbers','Player numbers','+RM2/pc'],['design','Design it for me','+RM75']].forEach(function(x){var on=st[x[0]];var b=mk('button','opt'+(on?' on':''),'<span>'+(on?'✓ ':'+ ')+x[1]+'</span><em>'+x[2]+'</em>');b.setAttribute('aria-pressed',on);b.onclick=function(){st[x[0]]=!on;drawQ()};a.appendChild(b)});
  var base=q*30,nm=st.names?q*2:0,nu=st.numbers?q*2:0,ds=st.design?75:0,tot=base+nm+nu+ds;
  var L=[[q+' × jersey @30',rm(base)],['Collar: '+st.collar,'—']];
  if(nm)L.push([q+' × name @2',rm(nm)]);if(nu)L.push([q+' × number @2',rm(nu)]);if(ds)L.push(['Design file prep',rm(ds)]);L.push(['Delivery · Klang Valley','FREE']);
  $('#lines').innerHTML=L.map(function(l){return '<div class="rc-line"><span>'+esc(l[0])+'</span><span>'+l[1]+'</span></div>'}).join('');
  $('#total').textContent=rm(tot);$('#dockTotal').textContent=rm(tot);
  $('#per').textContent=rm(tot/q);
  $('#dep').textContent=rm(tot*.7);
  $('#bal').textContent=rm(tot*.3);
  lastQuote=wa('Hi Renwick! Quote please: '+q+' pcs, '+st.collar+' collar'+(st.names?', names':'')+(st.numbers?', numbers':'')+(st.design?', design service':'')+'. Website estimate '+rm(tot)+'.');
  $('#waQuote').href=lastQuote;syncDock();
}
$('#dec').onclick=function(){st.qty=Math.max(30,(parseInt(st.qty,10)||30)-5);qty.value=st.qty;drawQ()};
$('#inc').onclick=function(){st.qty=(parseInt(st.qty,10)||30)+5;qty.value=st.qty;drawQ()};
qty.oninput=function(){st.qty=qty.value;drawQ()};
qty.onblur=function(){st.qty=Math.max(30,parseInt(qty.value,10)||30);qty.value=st.qty;drawQ()};

/* phone dock: Get a price / WhatsApp, turns into Total / Send quote inside the pricing section */
var dock=$('#dock'),dockWa=$('#dockWa'),inQuote=false;
function syncDock(){
  dock.classList.toggle('quote',inQuote);
  dockWa.href=inQuote?lastQuote:wa('Hi Renwick! Nak buat custom jersey.');
  dockWa.textContent=inQuote?'Send quote →':'WhatsApp →';
}
if('IntersectionObserver' in window){new IntersectionObserver(function(es){inQuote=es[0].isIntersecting;syncDock()},{rootMargin:'-30% 0px -30% 0px'}).observe($('#maths'))}
if('IntersectionObserver' in window){new IntersectionObserver(function(es){dock.classList.toggle('show',!es[0].isIntersecting)},{threshold:0.15}).observe($('#top'))}else dock.classList.add('show');
drawQ();

/* ---------- 04 steps */
$('#steps').innerHTML=[
['01','Slide in','Template code or your own idea. Plus quantity and the date you need it.'],
['02','Proforma','Clear breakdown, no surprises. Valid for 7 days.'],
['03','Mockups','Front, back, side. Revise till it\'s right.'],
['04','Deposit','70% to lock your slot. Sign off the mockup in writing.'],
['05','Production','Printed, sewn, checked. About 14 working days.'],
['06','Kit day','Pay the 30% balance. Jerseys on the way.']
].map(function(x){return '<div class="st"><b>'+x[0]+'</b><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>'}).join('');

/* ---------- 05 sizes */
var sizes={
Adult:['Unisex XS–7XL · Tees, jerseys, polos, uniforms',[['XS',16,36,7.5,25],['S',17,38,8,26],['M',18,40,8.5,27],['L',19,42,9,28],['XL',20,44,9.5,29],['2XL',21,46,10,30],['3XL',22,48,10.5,31],['5XL',24,52,11.5,33],['7XL',26,56,12,35]]],
Muslimah:['Long sleeve · Hip-covering length',[['S',16,38,21,33.5],['M',17,40,21.5,34.5],['L',18,42,22,35.5],['XL',19,44,22.5,36.5],['2XL',19.5,46,23.5,37.5],['3XL',20.5,48,24.5,38.5]]],
Kids:['Youth cut · Sizes 24–32',[['24',11.5,25,4.5,15.5],['26',12,27,5,17],['28',12.5,29,5.5,18.5],['30',13,31,6,20],['32',13.5,33,6.5,21.5]]]};
var tab='Adult';
function drawS(){
  var t=$('#tabs');t.innerHTML='';
  Object.keys(sizes).forEach(function(k){var b=mk('button',k===tab?'on':'',k);b.setAttribute('role','tab');b.setAttribute('aria-selected',k===tab);b.onclick=function(){tab=k;drawS()};t.appendChild(b)});
  $('#sizeNote').textContent=sizes[tab][0];
  $('#sizeRows').innerHTML=sizes[tab][1].map(function(r){return '<tr>'+r.map(function(v){return '<td>'+v+'</td>'}).join('')+'</tr>'}).join('');
}
drawS();

/* ---------- 07 faq */
var faqs=[
['Minimum order?','30 pieces per design. Mix any sizes inside that 30, kids 24 all the way to 7XL.'],
['How long does it take?','About 14 working days from mockup approval and deposit. Tight deadline? Ask us about rush slots.'],
['Can you design it?','Yes. Send a logo and a rough idea, or a template code. First mockup is free. Full design file prep is RM75 if you don\'t have an .ai file.'],
['How do I pay?','70% deposit to start, 30% before delivery. Proforma first, then an order form with the payment details.'],
['Outside KL?','We ship anywhere in Malaysia. Klang Valley delivery is free for first-time clients.']];
var open=0;
function drawF(){
  var w=$('#faqs');w.innerHTML='';
  faqs.forEach(function(f,i){var d=mk('div','q');var b=mk('button',null,'<span class="n">Q.0'+(i+1)+'</span><span class="t">'+esc(f[0])+'</span><span class="pm" aria-hidden="true">'+(open===i?'−':'+')+'</span>');b.setAttribute('aria-expanded',open===i);b.onclick=function(){open=open===i?-1:i;drawF()};d.appendChild(b);if(open===i)d.appendChild(mk('p',null,esc(f[1])));w.appendChild(d)});
}
drawF();
})();
