/* Patternworks website: page rendering, routing and the contact form.
   Content lives in assets/data.js, so you rarely need to edit this file. */
(function(){
'use strict';

var CONFIG = window.PATTERNWORKS || {};
var CONTACT_EMAIL = CONFIG.contactEmail || '';
var BOOKS = CONFIG.books || [];
function fmtRange(a,b,unit){
  var v = a===b ? String(a) : a+' to '+b;
  return unit==='%' ? v+'%' : v+' '+unit;
}
var METRICS = (CONFIG.metrics || []).map(function(m){
  return {name:m.name, max:m.max, today:m.today, pw:m.pw, fmt:function(a,b){ return fmtRange(a,b,m.unit); }};
});

var ROLES = [['developer','SME developer'],['manufacturer','Manufacturer'],['owner','Pattern book owner'],['architect','Architect'],['council','Council or public body'],['other','Something else']];

var BOOK = {};
BOOKS.forEach(function(b){ BOOK[b.slug] = b; });
var HOME_ANCHORS = ['home','how-it-works','value','supply','homes','who','pilot','faq'];

var state = {cat:{view:'books', nation:'all', beds:'all'}, selected:{}, prefill:null, role:'', form:null, heroPlayed:false, firstRoute:true};

/* ---------- Drawing ---------- */
var STOREY = 30;
function f(n){ return Math.round(n*10)/10; }
function R(x,y,w,h){ return 'M'+f(x)+' '+f(y)+'h'+f(w)+'v'+f(h)+'h'+f(-w)+'Z'; }

function roofPart(x,top,w,roof,ovL,ovR){
  if(roof==='gable'){
    var rh=w*0.42;
    return ['roof','M'+f(x-ovL)+' '+f(top)+'L'+f(x+w/2)+' '+f(top-rh)+'L'+f(x+w+ovR)+' '+f(top)+'Z'];
  }
  if(roof==='hip'){
    var rh2=20, ins=Math.min(20,w/4);
    return ['roof','M'+f(x-ovL)+' '+f(top)+'L'+f(x+w+ovR)+' '+f(top)+'L'+f(x+w-ins)+' '+f(top-rh2)+'L'+f(x+ins)+' '+f(top-rh2)+'Z'];
  }
  var rh3=19;
  return ['roof','M'+f(x-ovL)+' '+f(top)+'L'+f(x+w+ovR)+' '+f(top)+'L'+f(x+w)+' '+f(top-rh3)+'L'+f(x)+' '+f(top-rh3)+'Z'];
}

function unitParts(x,g,o,i){
  var n=o.storeys||2, w=o.w, top=g-n*STOREY;
  var parts=[['wall',R(x,top,w,n*STOREY)]];
  var slots=o.slots||Math.max(2,Math.round(w/27)), sw=w/slots;
  var door=o.door||'l';
  if(o.mirror && i%2===1){ door = door==='l'?'r':(door==='r'?'l':door); }
  var ds = door==='r'? slots-1 : (door==='c'? Math.floor(slots/2) : 0);
  for(var s=0;s<n;s++){
    var yb=g-s*STOREY;
    for(var k=0;k<slots;k++){
      var cx=x+sw*(k+0.5);
      if(s===0 && k===ds){
        parts.push(['door',R(cx-6,g-23,12,23)]);
        parts.push(['line','M'+f(cx-8)+' '+f(g-25.5)+'h16']);
        continue;
      }
      var ww=Math.min(13,sw-9), wh=16, wx=cx-ww/2, wy=yb-STOREY+7;
      parts.push(['win',R(wx,wy,ww,wh)]);
      parts.push(['line','M'+f(cx)+' '+f(wy)+'v'+wh]);
    }
  }
  return parts;
}

function rowParts(x,g,count,o){
  var n=o.storeys||2, top=g-n*STOREY, parts=[];
  for(var i=0;i<count;i++){ parts = parts.concat(unitParts(x+i*o.w,g,o,i)); }
  if(o.roof==='gable'){
    for(var j=0;j<count;j++){ parts.push(roofPart(x+j*o.w,top,o.w,'gable',4,4)); }
  } else {
    parts.push(roofPart(x,top,o.w*count,o.roof,4,4));
  }
  return {w:o.w*count, parts:parts};
}

function treeParts(cx,g,r){
  var cy=g-r-14;
  return [
    ['line','M'+f(cx)+' '+f(cy+r)+'V'+g],
    ['tree','M'+f(cx-r)+' '+f(cy)+'a'+r+' '+r+' 0 1 0 '+(2*r)+' 0a'+r+' '+r+' 0 1 0 '+(-2*r)+' 0Z']
  ];
}

function svg(groups,vb,opts){
  opts=opts||{};
  var a11y = opts.label? 'role="img" aria-label="'+opts.label+'"' : 'aria-hidden="true"';
  var cls = 'elev '+(opts.cls||'')+(opts.anim?' draw':'')+(opts.fast?' fast':'');
  var out = '<svg class="'+cls+'" viewBox="'+vb+'" preserveAspectRatio="'+(opts.par||'xMidYMid meet')+'" '+a11y+' focusable="false">';
  groups.forEach(function(ps,i){
    out += '<g style="--d:'+(i*0.075).toFixed(3)+'s">';
    ps.forEach(function(p){ out += '<path class="'+p[0]+'" d="'+p[1]+'" pathLength="1"/>'; });
    out += '</g>';
  });
  return out + '</svg>';
}

function streetSVG(anim){
  var W=1200, g=236, groups=[[['ground','M0 '+g+'H'+W]]];
  var seq=[
    ['t',15],['r',1,{w:66,roof:'gable',door:'l'}],['r',3,{w:52,roof:'eaves',door:'l'}],['t',13],
    ['r',2,{w:58,roof:'hip',door:'l',mirror:true}],['r',1,{w:66,roof:'gable',door:'r'}],['t',16],
    ['r',3,{w:52,roof:'eaves',door:'l'}],['r',1,{w:70,roof:'gable',door:'c',storeys:3}],['t',13],
    ['r',2,{w:58,roof:'hip',door:'l',mirror:true}],['r',3,{w:52,roof:'eaves',door:'l'}],['t',15]
  ];
  var x=14;
  for(var i=0;i<seq.length;i++){
    if(x>W) break;
    var s=seq[i];
    if(s[0]==='t'){ groups.push(treeParts(x+s[1],g,s[1])); x+=2*s[1]+20; }
    else { var res=rowParts(x,g,s[1],s[2]); groups.push(res.parts); x+=res.w+20; }
  }
  return svg(groups,'0 0 '+W+' 250',{cls:'street-svg',anim:anim,par:'xMidYMax slice'});
}

function coverSVG(b){
  var g=92, groups=[[['ground','M0 '+g+'H220']]];
  if(b.cover==='terrace'){
    groups.push(treeParts(34,g,9));
    groups.push(rowParts(56,g,3,{w:40,roof:'eaves',door:'l'}).parts);
  } else if(b.cover==='gables'){
    groups.push(rowParts(44,g,1,{w:46,roof:'gable',door:'l'}).parts);
    groups.push(rowParts(106,g,1,{w:46,roof:'gable',door:'r'}).parts);
    groups.push(treeParts(184,g,10));
  } else {
    groups.push(rowParts(52,g,2,{w:44,roof:'hip',door:'l',mirror:true}).parts);
    groups.push(treeParts(176,g,11));
  }
  return svg(groups,'0 0 220 100',{cls:'cover-svg'});
}

function typeSVG(t,opts){
  opts=opts||{};
  var W=180, g=118, o={};
  for(var k in t.draw){ o[k]=t.draw[k]; }
  o.storeys=t.storeys;
  var x=(W-o.w)/2;
  var groups=[[['ground','M8 '+g+'H'+(W-8)]], rowParts(x,g,1,o).parts];
  return svg(groups,'0 8 180 120',{cls:opts.cls||'thumb-svg',anim:opts.anim,fast:opts.anim,label:opts.label});
}

function flywheel(){
  var c=160, r=112;
  function pt(deg){ var a=deg*Math.PI/180; return [c+r*Math.sin(a), c-r*Math.cos(a)]; }
  function p(v){ return f(v[0])+' '+f(v[1]); }
  var s='';
  [0,90,180,270].forEach(function(d){
    var p1=pt(d+17), p2=pt(d+71);
    s+='<path class="fw-arc" d="M'+p(p1)+'A'+r+' '+r+' 0 0 1 '+p(p2)+'"/>';
    var a=(d+71)*Math.PI/180, tx=Math.cos(a), ty=Math.sin(a), nx=Math.sin(a), ny=-Math.cos(a);
    var tip=[p2[0]+tx*6,p2[1]+ty*6], b1=[p2[0]-tx*2+nx*4.5,p2[1]-ty*2+ny*4.5], b2=[p2[0]-tx*2-nx*4.5,p2[1]-ty*2-ny*4.5];
    s+='<path class="fw-head" d="M'+p(tip)+'L'+p(b1)+'L'+p(b2)+'Z"/>';
  });
  [0,90,180,270].forEach(function(d,i){
    var q=pt(d);
    s+='<circle class="fw-node" cx="'+f(q[0])+'" cy="'+f(q[1])+'" r="22"/>';
    s+='<text class="fw-num" x="'+f(q[0])+'" y="'+f(q[1])+'" dy="0.35em" text-anchor="middle">'+(i+1)+'</text>';
  });
  s+='<text class="fw-mid" x="160" y="152" text-anchor="middle">Shared</text><text class="fw-mid" x="160" y="178" text-anchor="middle">demand</text>';
  return '<svg viewBox="0 0 320 320" role="img" aria-label="A loop of four steps: more developers, one pipeline, regional production, lower costs, and back to more developers." focusable="false">'+s+'</svg>';
}

var ARROW='<svg viewBox="0 0 40 16" width="40" height="16" aria-hidden="true" focusable="false"><path d="M2 8H36M30 2L37 8L30 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CUBE='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M8 1.5L14 4.75V11.25L8 14.5L2 11.25V4.75Z M2 4.75L8 8L14 4.75 M8 8V14.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';

/* ---------- Shared pieces ---------- */
function bookCard(b){
  var n=b.types.length;
  return '<a class="book-card" href="#'+b.slug+'">'+
    '<div class="cover '+b.tint+'"><h3 class="cover-title">'+b.name+'</h3>'+coverSVG(b)+'</div>'+
    '<div class="meta-row"><span class="book-name">'+b.region+'</span><span class="chip '+b.statusKey+'">'+b.status+'</span></div>'+
    '<p class="book-sub">'+(n? n+' house types' : 'House types being added')+'</p>'+
  '</a>';
}

function typeCard(item){
  var b=item.b, t=item.t;
  return '<a class="type-card" href="#'+b.slug+'" data-select="'+b.slug+'|'+t.id+'">'+
    '<div class="thumb gridbg">'+typeSVG(t)+'</div>'+
    '<h3>'+t.name+'</h3>'+
    '<p class="sub">'+t.beds+' bed, '+t.people+' person, '+t.storeys+' storeys</p>'+
    '<p class="from">'+b.name+'</p>'+
  '</a>';
}

function barRow(m,k,label){
  var lo=m[k][0], hi=m[k][1];
  var w=hi/m.max*100, s=lo/hi*100;
  return '<div class="bar-row"><div class="track"><div class="bar '+k+'" style="width:'+w.toFixed(1)+'%;--s:'+s.toFixed(1)+'%"></div></div>'+
    '<span class="bar-val"><span class="vh">'+label+': </span>'+m.fmt(lo,hi)+'</span></div>';
}

/* ---------- Pages ---------- */
function home(){
  var anim=!state.heroPlayed;
  state.heroPlayed=true;
  return ''+
'<section class="hero gridbg" id="home">'+
  '<div class="wrap">'+
    '<h1 class="display">Pre-approved homes, matched to your site and priced by real manufacturers.</h1>'+
    '<p class="lead">Patternworks takes the house types in published pattern books, tests them against your site and prices them from manufacturers’ rates. You know what you can build, and roughly what it costs, before you spend on design.</p>'+
    '<div class="actions"><a class="btn btn-primary" href="#catalogue">Explore the catalogue</a><a class="btn btn-secondary" href="#contact" data-role="developer">Join the 2027 pilot</a></div>'+
  '</div>'+
  '<div class="wrap"><div class="street">'+streetSVG(anim)+'</div>'+
  '<p class="caption street-caption">The same few house types, repeated site after site. That repetition is what lets manufacturers plan production.</p></div>'+
'</section>'+

'<section class="section" id="problem"><div class="wrap">'+
  '<h2 class="section-title">Every scheme starts from scratch. It doesn’t have to.</h2>'+
  '<div class="cols-3">'+
    '<div class="col"><h3>A blank page on every site</h3><p>Each scheme is designed from new, so feasibility eats weeks of architect and QS time before you know whether a site works.</p></div>'+
    '<div class="col"><h3>Costs arrive too late</h3><p>Firm prices usually come after planning, so the appraisal behind your land offer rests on benchmarks.</p></div>'+
    '<div class="col"><h3>Manufacturers can’t plan</h3><p>Demand arrives one project at a time, so factories hold back from investing in capacity near your sites.</p></div>'+
  '</div>'+
'</div></section>'+

'<section class="section surface" id="how-it-works"><div class="wrap">'+
  '<h2 class="section-title wide">Pattern books already tell us how to build. Patternworks connects them to what we build with.</h2>'+
  '<div class="flow">'+
    '<div class="flow-box"><p class="kicker">How we build</p><h3>Pattern books</h3><p>Pre-approved house types, broken down into their components.</p></div>'+
    '<div class="flow-arrow">'+ARROW+'</div>'+
    '<div class="flow-box core"><p class="kicker">The matching layer</p><h3>Patternworks</h3><p>Breaks each pattern book into its components and matches them to the local supply chain.</p></div>'+
    '<div class="flow-arrow rev">'+ARROW+'</div>'+
    '<div class="flow-box"><p class="kicker">What we build with</p><h3>Manufacturers</h3><p>Products and systems made and delivered to site.</p></div>'+
  '</div>'+
  '<h3 class="journey-title">What it looks like for a developer</h3>'+
  '<ol class="steps">'+
    '<li><h4>Bring your site</h4><p>A site assessment shows what’s there and what the site can take.</p></li>'+
    '<li><h4>Match pattern books</h4><p>We find the books and house types that fit the site and are approved for the area.</p></li>'+
    '<li><h4>See the scheme</h4><p>An early capacity study lays the house types out on your plots.</p></li>'+
    '<li><h4>Know the cost</h4><p>An estimated materials quote from manufacturers’ rates, before you go for planning.</p></li>'+
    '<li><h4>Order when ready</h4><p>Once planning is granted, order through a supply chain that’s already lined up.</p></li>'+
  '</ol>'+
'</div></section>'+

'<section class="section" id="value"><div class="wrap">'+
  '<h2 class="section-title">Start from homes that are already designed.</h2>'+
  '<p class="lead lead-gap">A pattern book does the hard design work once, so you don’t pay for it again on every site.</p>'+
  '<div class="value-grid">'+
    '<div class="benefits">'+
      '<div class="benefit"><h3>Design already resolved</h3><p>Layouts, space standards and performance targets are worked out and approved by the book’s owner.</p></div>'+
      '<div class="benefit"><h3>Feasibility, faster</h3><p>House types go onto your site with an early feasibility check, before you commission a full design.</p></div>'+
      '<div class="benefit"><h3>Costs you can appraise</h3><p>Materials are priced from manufacturers’ rate cards, so your appraisal rests on real numbers.</p></div>'+
      '<div class="benefit"><h3>Your architect still leads</h3><p>They adapt the scheme and sign it off, without starting from a blank page.</p></div>'+
    '</div>'+
    '<div class="compare"><h3>Today, and with Patternworks</h3>'+
      '<div class="legend" aria-hidden="true"><span><i class="sw today"></i>Today</span><span><i class="sw pw"></i>With Patternworks</span><span><i class="sw range"></i>Range</span></div>'+
      METRICS.map(function(m){ return '<div class="metric"><p class="metric-name">'+m.name+'</p>'+barRow(m,'today','Today')+barRow(m,'pw','With Patternworks')+'</div>'; }).join('')+
      '<p class="note">These are targets we’re testing in the pilot, not results yet.</p>'+
    '</div>'+
  '</div>'+
'</div></section>'+

'<section class="section deep" id="supply"><div class="wrap">'+
  '<div class="deep-grid">'+
    '<div>'+
      '<h2 class="section-title">Shared pattern books create shared demand.</h2>'+
      '<p class="lead lead-gap">One 20-home scheme is a gamble for a factory. Fifty schemes built from the same house types are a production line.</p>'+
      '<ol class="loop">'+
        '<li>More developers build from the same pattern books.</li>'+
        '<li>Patternworks gathers their orders into one pipeline.</li>'+
        '<li>Manufacturers plan capacity and open regional production.</li>'+
        '<li>Prices fall, lead times shorten and supply gets more local, which brings in more developers.</li>'+
      '</ol>'+
    '</div>'+
    '<div class="flywheel">'+flywheel()+'</div>'+
  '</div>'+
  '<div class="points">'+
    '<div><h3>For manufacturers</h3><p>A visible pipeline by region and house type, so new capacity is a planned decision rather than a bet.</p></div>'+
    '<div><h3>For developers</h3><p>Rates agreed across many schemes, and products already specified for each house type.</p></div>'+
    '<div><h3>For the regions</h3><p>Steady demand that can support new factories and local jobs around the UK.</p></div>'+
  '</div>'+
'</div></section>'+

'<section class="section" id="homes"><div class="wrap">'+
  '<div class="head-row"><div><h2 class="section-title">Browse the homes you could build</h2><p class="lead lead-gap">The first three pattern books in the catalogue come from London, Scotland and Wales.</p></div><a class="text-link" href="#catalogue">See the full catalogue</a></div>'+
  '<div class="books">'+BOOKS.map(bookCard).join('')+'</div>'+
'</div></section>'+

'<section class="section surface" id="who"><div class="wrap">'+
  '<h2 class="section-title">Who Patternworks is for</h2>'+
  '<div class="cols-3">'+
    '<div class="col"><h3>Developers</h3><p>Use pre-approved house types on your sites, with costs you can rely on early.</p><a class="btn btn-secondary btn-sm" href="#contact" data-role="developer">Join the 2027 pilot</a></div>'+
    '<div class="col"><h3>Manufacturers</h3><p>See demand for your systems before it arrives, and get specified in pattern book house types.</p><a class="btn btn-secondary btn-sm" href="#contact" data-role="manufacturer">Register your products</a></div>'+
    '<div class="col"><h3>Pattern book owners</h3><p>Get your house types built more widely, and see where they’re used.</p><a class="btn btn-secondary btn-sm" href="#contact" data-role="owner">Publish your pattern book</a></div>'+
  '</div>'+
'</div></section>'+

'<section class="section" id="pilot"><div class="wrap">'+
  '<div class="pilot"><div><h2 class="section-title">Build with us in 2027</h2><p>We’re working with 2 to 3 SME developers on real schemes in 2027, starting in the Thames Freeport area: Thurrock, Barking &amp; Dagenham and Havering.</p></div><a class="btn btn-primary" href="#contact" data-role="developer">Talk to us about the pilot</a></div>'+
  '<div class="faq-grid" id="faq"><h2 class="section-title">Questions developers ask</h2><div class="faq">'+
    '<details><summary>What is a pattern book?</summary><p>A published set of pre-designed, pre-approved house types that share one set of design rules. They’re written by councils, housing associations and their architects.</p></details>'+
    '<details><summary>Do I lose control of the design?</summary><p>No. You choose the house types and how they’re laid out. The book sets out what can change, so the design holds together.</p></details>'+
    '<details><summary>Do I still need an architect?</summary><p>Yes. Your architect adapts the scheme to the site, leads it through planning and signs it off. They just don’t start from a blank page.</p></details>'+
    '<details><summary>Where can I use Patternworks?</summary><p>We’re starting in the Thames Freeport area in 2027, with pattern books from England, Scotland and Wales.</p></details>'+
    '<details><summary>How does Patternworks make money?</summary><p>A small commission on materials ordered through the platform, so we’re only paid when projects go ahead.</p></details>'+
    '<details><summary>I’m a manufacturer. How do I get involved?</summary><p>Register your products and capacity, and we’ll show you which pattern books your systems could serve.</p></details>'+
  '</div></div>'+
'</div></section>';
}

function controls(){
  var v=state.cat.view, chips='';
  var seg='<div class="seg" role="group" aria-label="Show"><button type="button" data-view="books" aria-pressed="'+(v==='books')+'">Pattern books</button><button type="button" data-view="types" aria-pressed="'+(v==='types')+'">House types</button></div>';
  if(v==='books'){
    var ns=['all'];
    BOOKS.forEach(function(b){ if(ns.indexOf(b.nation)<0) ns.push(b.nation); });
    chips='<div class="filters" role="group" aria-label="Filter by nation"><span class="flabel">Nation</span>'+ns.map(function(n){
      return '<button type="button" class="fchip" data-nation="'+n+'" aria-pressed="'+(state.cat.nation===n)+'">'+(n==='all'?'All':n)+'</button>';
    }).join('')+'</div>';
  } else {
    var bs=[];
    BOOKS.forEach(function(b){ b.types.forEach(function(t){ if(bs.indexOf(t.beds)<0) bs.push(t.beds); }); });
    bs.sort(function(a,b){return a-b;});
    var opts=['all'].concat(bs.map(String));
    chips='<div class="filters" role="group" aria-label="Filter by bedrooms"><span class="flabel">Bedrooms</span>'+opts.map(function(n){
      return '<button type="button" class="fchip" data-beds="'+n+'" aria-pressed="'+(state.cat.beds===n)+'">'+(n==='all'?'All':n+' bed')+'</button>';
    }).join('')+'</div>';
  }
  return seg+chips;
}

function results(){
  if(state.cat.view==='books'){
    var list=BOOKS.filter(function(b){ return state.cat.nation==='all' || b.nation===state.cat.nation; });
    return '<p class="count" aria-live="polite">'+list.length+' pattern book'+(list.length===1?'':'s')+'</p><div class="books">'+list.map(bookCard).join('')+'</div>';
  }
  var all=[];
  BOOKS.forEach(function(b){ b.types.forEach(function(t){ all.push({b:b,t:t}); }); });
  var items=all.filter(function(x){ return state.cat.beds==='all' || String(x.t.beds)===state.cat.beds; });
  var pending=BOOKS.filter(function(b){ return !b.types.length; }).map(function(b){ return b.name; });
  return '<p class="count" aria-live="polite">'+items.length+' house type'+(items.length===1?'':'s')+'</p>'+
    '<div class="types">'+items.map(typeCard).join('')+'</div>'+
    (pending.length? '<p class="more-note">More house types will appear as the '+pending.join(' and ')+' books are added.</p>' : '');
}

function catalogue(){
  return '<section class="wrap page-head"><h1 class="page-title">The pattern book catalogue</h1>'+
    '<p class="lead lead-gap">A pattern book is a published set of pre-designed, pre-approved house types that share one set of design rules. These are the books we’re bringing onto Patternworks first.</p></section>'+
    '<section class="wrap"><div class="controls" id="controls">'+controls()+'</div><div class="results" id="results">'+results()+'</div></section>';
}

function viewerInner(b,t,anim){
  return '<div class="viewer">'+
    '<div><div class="frame gridbg">'+typeSVG(t,{cls:'frame-svg',anim:anim,label:'Illustrative front elevation of '+t.name})+
      '<span class="badge">'+CUBE+'3D model to come</span></div>'+
      '<p class="frame-caption">Illustrative elevation. A 3D model of '+t.name+' will appear here once it’s built from the pattern book drawings.</p></div>'+
    '<div class="spec"><h2>'+t.name+'</h2><p class="desc">'+t.desc+'</p>'+
      '<dl><dt>Bedrooms</dt><dd>'+t.beds+'</dd><dt>People</dt><dd>'+t.people+'</dd><dt>Storeys</dt><dd>'+t.storeys+'</dd><dt>Floor area (GIA)</dt><dd>'+(t.gia||'<span class="tbc">To confirm</span>')+'</dd></dl>'+
      '<a class="btn btn-primary" href="#contact" data-prefill="'+b.slug+'|'+t.id+'">Use this house type on my site</a>'+
      (t.gia? '' : '<p class="small">Figures marked “to confirm” will come from the pattern book drawings.</p>')+
    '</div>'+
  '</div>';
}

function bookPage(b){
  var sel=state.selected[b.slug];
  if(!b.types.some(function(t){return t.id===sel;})) sel=b.types.length? b.types[0].id : null;
  var t=sel? b.types.filter(function(x){return x.id===sel;})[0] : null;
  var viewer;
  if(t){
    viewer='<h2 class="sub-title">House types in this book</h2>'+
      '<div class="tabs" role="tablist" aria-label="House types">'+b.types.map(function(x){
        var on=x.id===sel;
        return '<button class="tab" type="button" role="tab" id="tab-'+x.id+'" aria-selected="'+on+'" aria-controls="viewer" tabindex="'+(on?0:-1)+'" data-book="'+b.slug+'" data-type="'+x.id+'">'+x.name+'</button>';
      }).join('')+'</div>'+
      '<div id="viewer" role="tabpanel" aria-labelledby="tab-'+sel+'">'+viewerInner(b,t,false)+'</div>';
  } else {
    viewer='<h2 class="sub-title">House types in this book</h2>'+
      '<div class="frame empty-frame"><div><p class="t">House types from this book are being added.</p>'+
      '<p>We’re bringing this book’s house types onto Patternworks. Each one will get its own page and 3D model.</p>'+
      '<a class="btn btn-secondary" href="#contact" data-prefill="'+b.slug+'|">Ask to hear when it’s ready</a></div></div>';
  }
  return '<div class="wrap"><p class="crumb"><a href="#catalogue">Catalogue</a> <span aria-hidden="true">/</span> '+b.name+'</p>'+
    '<section class="book-head">'+
      '<div class="cover '+b.tint+'" aria-hidden="true"><p class="cover-title">'+b.name+'</p>'+coverSVG(b)+'</div>'+
      '<div class="book-info"><h1 class="page-title">'+b.name+'</h1><span class="chip '+b.statusKey+'">'+b.status+'</span>'+
        '<p class="summary">'+b.summary+'</p>'+
        '<dl class="facts"><dt>Owner</dt><dd>'+(b.owner||'To confirm')+'</dd><dt>Region</dt><dd>'+b.region+'</dd><dt>House types</dt><dd>'+(b.types.length||'Being added')+'</dd></dl>'+
        '<p class="permission">Drawings and pages from this book will be added with the owner’s permission.</p>'+
      '</div>'+
    '</section></div>'+
    '<section class="viewer-sec"><div class="wrap">'+viewer+'</div></section>'+
    '<section class="wrap gallery-sec"><h2 class="sub-title">Pages from the pattern book</h2><div class="gallery">'+
      '<div class="page-slot">Page to be added</div><div class="page-slot">Page to be added</div><div class="page-slot">Page to be added</div>'+
    '</div></section>';
}

function regardingText(){
  var p=state.prefill; if(!p) return null;
  var b=BOOK[p.book]; if(!b) return null;
  var t=p.type? b.types.filter(function(x){return x.id===p.type;})[0] : null;
  return {label: t? t.name+', '+b.name : b.name, message: t? 'I’d like to talk about using '+t.name+' from the '+b.name+' on a site.' : 'Please let me know when the '+b.name+' house types are ready.'};
}

function formMarkup(){
  var r=state.role||'';
  var reg=regardingText();
  function opt(v,l){ return '<option value="'+v+'"'+(v===r?' selected':'')+'>'+l+'</option>'; }
  return '<form id="enquiry" novalidate>'+
    '<div class="row-2">'+
      '<div class="field" data-f="name"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>'+
      '<div class="field" data-f="email"><label for="f-email">Work email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>'+
    '</div>'+
    '<div class="row-2">'+
      '<div class="field" data-f="company"><label for="f-company">Company</label><input id="f-company" name="company" autocomplete="organization" required></div>'+
      '<div class="field" data-f="role"><label for="f-role">I’m a</label><select id="f-role" name="role" required>'+opt('','Choose one')+ROLES.map(function(x){return opt(x[0],x[1]);}).join('')+'</select></div>'+
    '</div>'+
    '<div class="row-2">'+
      '<div class="field" id="homes-field"'+(r==='developer'?'':' hidden')+'><label for="f-homes">Homes you build a year</label><select id="f-homes" name="homes"><option value="">Choose one</option><option>1 to 10</option><option>11 to 50</option><option>51 to 250</option><option>More than 250</option></select></div>'+
      '<div class="field"><label for="f-region">Where you build or work</label><input id="f-region" name="region" placeholder="For example, Thurrock or South Wales"></div>'+
    '</div>'+
    (reg? '<div class="regarding"><span>About: <strong>'+reg.label+'</strong></span><button type="button" data-clear-prefill>Remove</button></div>' : '')+
    '<div class="field"><label for="f-msg">Message</label><textarea id="f-msg" name="message" placeholder="Tell us about a site, a product or a question.">'+(reg? reg.message : '')+'</textarea></div>'+
    '<button class="btn btn-primary" type="submit">Continue to email</button>'+
    '<p class="form-foot">This opens a pre-filled email in your email app. Nothing is sent until you press send.</p>'+
  '</form>';
}

function contact(){
  return '<div class="wrap contact-grid">'+
    '<div class="contact-aside"><h1 class="page-title">Talk to us</h1>'+
      '<p class="lead">Tell us a little about yourself and your sites, and we’ll get back to you. We’d especially like to hear from SME developers interested in the 2027 pilot.</p>'+
      '<h2>What happens next</h2><p>We’ll reply to arrange a short call. Talking to us costs nothing and commits you to nothing.</p>'+
      '<h2>Prefer email?</h2><p><a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a></p>'+
    '</div>'+
    '<div class="form-card" id="form-card">'+formMarkup()+'</div>'+
  '</div>';
}

/* ---------- Router ---------- */
var app=document.getElementById('app');
var nav=document.getElementById('site-nav');
var menuBtn=document.querySelector('.menu-btn');

function closeMenu(){ nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); }

function route(){
  var h=decodeURIComponent(location.hash.replace(/^#/,''));
  var html, title='Patternworks', key='home', anchor=null;
  if(h==='catalogue'){ key='catalogue'; html=catalogue(); title='Catalogue | Patternworks'; }
  else if(h==='contact'){ key='contact'; html=contact(); title='Talk to us | Patternworks'; }
  else if(BOOK[h]){ key='catalogue'; html=bookPage(BOOK[h]); title=BOOK[h].name+' | Patternworks'; }
  else { html=home(); if(HOME_ANCHORS.indexOf(h)>=0 && h!=='home') anchor=h; }
  app.innerHTML=html;
  document.title=title;
  Array.prototype.forEach.call(document.querySelectorAll('.navlink'),function(a){
    var k=a.getAttribute('href').slice(1);
    if(k===key && key!=='home') a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  closeMenu();
  if(anchor){
    requestAnimationFrame(function(){ var el=document.getElementById(anchor); if(el) el.scrollIntoView(); });
  } else {
    window.scrollTo(0,0);
    if(!state.firstRoute){ try{ app.focus({preventScroll:true}); }catch(e){ app.focus(); } }
  }
  state.firstRoute=false;
}

function refreshCatalogue(focusSel){
  var c=document.getElementById('controls'), r=document.getElementById('results');
  if(!c||!r) return;
  c.innerHTML=controls();
  r.innerHTML=results();
  if(focusSel){ var el=document.querySelector(focusSel); if(el) el.focus(); }
}

function selectTab(tab){
  var b=BOOK[tab.dataset.book], id=tab.dataset.type;
  state.selected[b.slug]=id;
  Array.prototype.forEach.call(tab.parentNode.querySelectorAll('[role="tab"]'),function(x){
    var on=x===tab; x.setAttribute('aria-selected',on?'true':'false'); x.tabIndex=on?0:-1;
  });
  var panel=document.getElementById('viewer');
  panel.setAttribute('aria-labelledby',tab.id);
  panel.innerHTML=viewerInner(b,b.types.filter(function(x){return x.id===id;})[0],true);
  tab.focus();
}

document.addEventListener('click',function(e){
  var t=e.target;
  if(t.closest('.menu-btn')){
    var open=!nav.classList.contains('open');
    nav.classList.toggle('open',open); menuBtn.setAttribute('aria-expanded',open?'true':'false');
    return;
  }
  var tab=t.closest('[role="tab"]'); if(tab){ selectTab(tab); return; }
  var vbtn=t.closest('[data-view]'); if(vbtn){ state.cat.view=vbtn.dataset.view; refreshCatalogue('[data-view="'+vbtn.dataset.view+'"]'); return; }
  var nbtn=t.closest('[data-nation]'); if(nbtn){ state.cat.nation=nbtn.dataset.nation; refreshCatalogue('[data-nation="'+nbtn.dataset.nation+'"]'); return; }
  var bbtn=t.closest('[data-beds]'); if(bbtn){ state.cat.beds=bbtn.dataset.beds; refreshCatalogue('[data-beds="'+bbtn.dataset.beds+'"]'); return; }
  if(t.closest('[data-clear-prefill]')){
    state.prefill=null;
    var reg=document.querySelector('.regarding'); if(reg) reg.remove();
    var msg=document.getElementById('f-msg'); if(msg) msg.focus();
    return;
  }
  if(t.closest('[data-edit]')){ renderForm(true); return; }

  var sel=t.closest('[data-select]');
  if(sel){ var ps=sel.dataset.select.split('|'); state.selected[ps[0]]=ps[1]; }
  var pre=t.closest('[data-prefill]');
  if(pre){ var pp=pre.dataset.prefill.split('|'); state.prefill={book:pp[0],type:pp[1]||null}; if(!state.role) state.role='developer'; }
  else { var rl=t.closest('[data-role]'); if(rl){ state.role=rl.dataset.role; state.prefill=null; } }

  var a=t.closest('a[href^="#"]');
  if(a){
    var href=a.getAttribute('href'), cur=location.hash||'#home';
    if(href===cur || (href==='#home' && (cur==='' || cur==='#'))){ e.preventDefault(); route(); }
  }
});

document.addEventListener('keydown',function(e){
  var tab=e.target.closest && e.target.closest('[role="tab"]');
  if(!tab) return;
  var tabs=Array.prototype.slice.call(tab.parentNode.querySelectorAll('[role="tab"]'));
  var i=tabs.indexOf(tab), next=null;
  if(e.key==='ArrowRight') next=tabs[(i+1)%tabs.length];
  else if(e.key==='ArrowLeft') next=tabs[(i-1+tabs.length)%tabs.length];
  else if(e.key==='Home') next=tabs[0];
  else if(e.key==='End') next=tabs[tabs.length-1];
  if(next){ e.preventDefault(); selectTab(next); }
});

document.addEventListener('change',function(e){
  if(e.target.id==='f-role'){
    var hf=document.getElementById('homes-field');
    if(hf) hf.hidden = e.target.value!=='developer';
    state.role=e.target.value;
  }
});

/* ---------- Form ---------- */
var ERRORS={name:'Enter your name.',email:'Enter a work email, like name@company.co.uk.',company:'Enter your company name.',role:'Choose the option that fits you best.'};

function renderForm(restore){
  var card=document.getElementById('form-card'); if(!card) return;
  card.innerHTML=formMarkup();
  if(restore && state.form){
    var fm=document.getElementById('enquiry');
    Object.keys(state.form).forEach(function(k){ if(fm.elements[k]) fm.elements[k].value=state.form[k]; });
    var hf=document.getElementById('homes-field'); if(hf) hf.hidden = state.form.role!=='developer';
  }
  var first=document.getElementById('f-name'); if(first) first.focus();
}

document.addEventListener('submit',function(e){
  if(e.target.id!=='enquiry') return;
  e.preventDefault();
  var fm=e.target, data={};
  ['name','email','company','role','homes','region','message'].forEach(function(k){ data[k]=(fm.elements[k].value||'').trim(); });
  Array.prototype.forEach.call(fm.querySelectorAll('.err'),function(x){ x.remove(); });
  Array.prototype.forEach.call(fm.querySelectorAll('.invalid'),function(x){ x.classList.remove('invalid'); });
  Array.prototype.forEach.call(fm.querySelectorAll('[aria-invalid]'),function(x){ x.removeAttribute('aria-invalid'); x.removeAttribute('aria-describedby'); });
  var bad=[];
  if(!data.name) bad.push('name');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) bad.push('email');
  if(!data.company) bad.push('company');
  if(!data.role) bad.push('role');
  bad.forEach(function(k){
    var wrap=fm.querySelector('[data-f="'+k+'"]'); var input=fm.elements[k];
    wrap.classList.add('invalid');
    var p=document.createElement('p'); p.className='err'; p.id='err-'+k; p.textContent=ERRORS[k];
    wrap.appendChild(p);
    input.setAttribute('aria-invalid','true'); input.setAttribute('aria-describedby','err-'+k);
  });
  if(bad.length){ fm.elements[bad[0]].focus(); return; }

  state.form=data;
  var roleLabel=(ROLES.filter(function(x){return x[0]===data.role;})[0]||['',''])[1];
  var reg=regardingText();
  var lines=['Name: '+data.name,'Email: '+data.email,'Company: '+data.company,'Role: '+roleLabel];
  if(data.role==='developer' && data.homes) lines.push('Homes a year: '+data.homes);
  if(data.region) lines.push('Where: '+data.region);
  if(reg) lines.push('About: '+reg.label);
  lines.push('', data.message||'');
  var subject='Patternworks enquiry from '+data.company+' ('+roleLabel+')';
  var href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(subject)+'&amp;body='+encodeURIComponent(lines.join('\n'));
  var card=document.getElementById('form-card');
  card.innerHTML='<div class="done" tabindex="-1"><h2>Your email is ready</h2>'+
    '<p>We’ve written it up with your details. Open it in your email app and press send.</p>'+
    '<div class="actions"><a class="btn btn-primary" href="'+href+'" target="_blank" rel="noopener">Open in email app</a><button class="btn btn-secondary" type="button" data-edit>Edit details</button></div>'+
    '<p class="form-foot">If nothing opens, email us at <a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a>.</p></div>';
  var done=card.querySelector('.done'); if(done) done.focus();
});

/* ---------- Start ---------- */
var fe=document.getElementById('foot-email');
fe.textContent=CONTACT_EMAIL; fe.setAttribute('href','mailto:'+CONTACT_EMAIL);
window.addEventListener('hashchange',route);
route();
})();
