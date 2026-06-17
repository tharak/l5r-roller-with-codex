(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();const H=10,b=10,O=2;function z(e){const t=M(e),n=G(t.amount,t.keep),a=Array.from({length:n.amount},()=>q({explodesOn:t.explodesOn,rerollOnOne:t.rerollOnOne})).sort(t.keepHigh?ee:te),o=Q(a,n.keep,n.bonus+t.bonus);return{id:crypto.randomUUID(),createdAt:new Date().toISOString(),original:{amount:t.amount,keep:t.keep,bonus:t.bonus},applied:n,settings:t,rolls:a,total:o}}function G(e,t){const n=Math.min(e,b),a=e<=b?0:e-b,o=Math.floor(a/2);let i=a%2*O,s=t,p;return s>b?(i=a*O,p=(s-b)*O,s=b):s+o>b?(s=b,p=(s+o-b)*O):(s+=o,p=0),{amount:n,keep:s,bonus:i+p}}function q(e={}){const t=e.explodesOn===void 0?H:e.explodesOn,n=e.testValue??Y(e.rerollOnOne??!1);return t!==null&&n>=t?n+q({explodesOn:t,rerollOnOne:!1}):n}function Q(e,t,n){return e.slice(0,t).reduce((a,o)=>a+o,0)+n}function B(e){const t=e.original.bonus,n=t===0?"":t>0?`+${t}`:`${t}`;return`${e.original.amount}k${e.original.keep}${n}`}function M(e){const t=C(e.amount,1,30),n=C(e.keep,1,t),a=e.explodesOn===null?null:C(e.explodesOn,2,H);return{amount:t,keep:n,bonus:C(e.bonus,-99,99),keepHigh:e.keepHigh,explodesOn:a,rerollOnOne:e.rerollOnOne}}function Y(e){const t=e?2:1;return t+Math.floor(Math.random()*(H-t+1))}function C(e,t,n){const a=Number.isFinite(e)?Math.trunc(e):t;return Math.min(Math.max(a,t),n)}function ee(e,t){return t-e}function te(e,t){return e-t}const L="l5r-roller-history",R="l5r-characters",T=20,ne="https://raw.githubusercontent.com/tharak/LegendOfTheFiveRings/main/Sources/LegendOfTheFiveRings/Resources",D=[{id:"characters",label:"Characters",icon:"people"},{id:"dice",label:"Dice",icon:"die"},{id:"book",label:"Book",icon:"book"},{id:"history",label:"Rolls",icon:"scroll"}],c=j("#app");let r={amount:5,keep:2,bonus:0,keepHigh:!0,explodesOn:10,rerollOnOne:!1},k=qe(),A=k[0]??null,d=Re(),l=J(),$=[],K=!1;function y(){r=M(r),(l.tab==="book"||l.tab==="characters")&&!K&&Ae(),c.innerHTML=`
    <header class="masthead app-shell-head">
      <div>
        <p class="eyebrow">Legend of the Five Rings</p>
        <h1>${ae()}</h1>
      </div>
      ${l.tab==="characters"?'<button class="ghost-button" id="new-character" type="button">New Character</button>':""}
      ${l.tab==="history"?'<button class="ghost-button" id="clear-history" type="button">Clear History</button>':""}
    </header>

    <nav class="tab-bar" aria-label="Primary">
      ${D.map(ie).join("")}
    </nav>

    <main>${oe()}</main>
  `,ce(),l.tab==="dice"&&de(),l.tab==="history"&&ue(),l.tab==="characters"&&fe(),l.tab==="book"&&pe()}function ae(){var e;if(l.tab==="characters"){if(l.editing&&!l.characterId)return"New Character";const t=l.characterId?d.find(n=>n.id===l.characterId):null;if(t)return l.editing?`Edit ${t.name}`:t.name}return((e=D.find(t=>t.id===l.tab))==null?void 0:e.label)??"Characters"}function oe(){return l.tab==="dice"?se():l.tab==="history"?P(!0):l.tab==="book"?re():le()}function ie(e){return`<a class="tab-link${l.tab===e.id?" active":""}" href="#${e.id}" aria-current="${l.tab===e.id?"page":"false"}">${Te(e.icon)}<span>${e.label}</span></a>`}function se(){return`
    <section class="roller-grid" aria-label="Dice roller">
      <form class="control-panel" id="roller-form">
        ${x("amount","Roll",r.amount,1,30)}
        ${x("keep","Keep",r.keep,1,r.amount)}
        ${x("bonus","Bonus",r.bonus,-99,99)}

        <fieldset class="option-group">
          <legend>Keep</legend>
          <label class="segmented-option">
            <input type="radio" name="keepHigh" value="true" ${r.keepHigh?"checked":""} />
            <span>High</span>
          </label>
          <label class="segmented-option">
            <input type="radio" name="keepHigh" value="false" ${r.keepHigh?"":"checked"} />
            <span>Low</span>
          </label>
        </fieldset>

        <label class="field">
          <span>Explodes</span>
          <select id="explodesOn" name="explodesOn">
            <option value="none" ${r.explodesOn===null?"selected":""}>None</option>
            <option value="9" ${r.explodesOn===9?"selected":""}>9 and 10</option>
            <option value="10" ${r.explodesOn===10?"selected":""}>10</option>
          </select>
        </label>

        <label class="toggle-row">
          <input id="rerollOnOne" name="rerollOnOne" type="checkbox" ${r.rerollOnOne?"checked":""} />
          <span>Re-roll on 1</span>
        </label>

        <button class="roll-button" type="submit">Roll ${_(r)}</button>
      </form>

      <section class="result-panel" aria-live="polite">
        ${A?je(A):Ie()}
      </section>
    </section>

    <section class="preset-row" aria-label="Preset rolls">
      ${S(1,1)}
      ${S(2,2)}
      ${S(3,3)}
      ${S(4,4)}
      ${S(5,5)}
    </section>

    ${P(!1)}
  `}function P(e){return`
    <section class="${e?"history-panel full-panel":"history-panel"}" aria-label="Roll history">
      <h2>${e?"Rolls":"History"}</h2>
      ${k.length===0?'<p class="muted">No rolls yet.</p>':`<ol>${k.map(Fe).join("")}</ol>`}
    </section>
  `}function le(){const e=l.characterId?d.find(t=>t.id===l.characterId):d[0]??null;return l.editing?me(e??void 0):`
    <section class="split-page">
      <aside class="list-panel">
        ${d.length===0?ke():`<div class="character-list">${d.map(ge).join("")}</div>`}
      </aside>
      <section class="detail-panel">
        ${e?$e(e):ye()}
      </section>
    </section>
  `}function re(){const e=l.sectionId?$.find(t=>t.id===l.sectionId):null;return e?`
      <section class="book-detail full-panel">
        <div class="panel-title-row">
          <h2>${e.label}</h2>
          <a class="ghost-link" href="#book">All Sections</a>
        </div>
        ${Se(e)}
        <div class="book-items">${e.items.map(we).join("")}</div>
      </section>
    `:`
    <section class="book-grid" aria-label="Book sections">
      ${$.map(ve).join("")}
    </section>
  `}function ce(){var e;(e=c.querySelector("#new-character"))==null||e.addEventListener("click",()=>{location.hash="characters/new"})}function de(){j("#roller-form").addEventListener("submit",e=>{e.preventDefault(),E(),F()});for(const e of c.querySelectorAll("#roller-form input, #roller-form select"))e.addEventListener("change",()=>{E(),y()});for(const e of c.querySelectorAll("[data-preset]"))e.addEventListener("click",()=>{const t=Number(e.dataset.preset);r=M({...r,amount:t,keep:t,bonus:0}),F()})}function ue(){var e;(e=c.querySelector("#clear-history"))==null||e.addEventListener("click",()=>{k=[],A=null,localStorage.removeItem(L),y()})}function fe(){var e,t,n;(e=c.querySelector("#character-form"))==null||e.addEventListener("submit",a=>{a.preventDefault();const o=a.currentTarget,i=new FormData(o),s=he(i,o.dataset.characterId||void 0);location.hash=`characters/${s.id}`}),(t=c.querySelector("#cancel-character"))==null||t.addEventListener("click",()=>{var o;const a=(o=c.querySelector("#character-form"))==null?void 0:o.dataset.characterId;location.hash=a?`characters/${a}`:"characters"}),(n=c.querySelector("#delete-character"))==null||n.addEventListener("click",()=>{var o;const a=(o=c.querySelector("#delete-character"))==null?void 0:o.dataset.characterId;a&&(d=d.filter(i=>i.id!==a),X(),location.hash="characters",y())});for(const a of c.querySelectorAll("#clan, #family"))a.addEventListener("change",be)}function pe(){for(const e of c.querySelectorAll("[data-book-filter]"))e.addEventListener("input",()=>{var n;const t=e.value.trim().toLowerCase();for(const a of c.querySelectorAll(".book-item"))a.hidden=t.length>0&&!((n=a.textContent)!=null&&n.toLowerCase().includes(t))})}function E(){const e=j("#roller-form"),t=new FormData(e);r=M({amount:Number(t.get("amount")),keep:Number(t.get("keep")),bonus:Number(t.get("bonus")),keepHigh:t.get("keepHigh")!=="false",explodesOn:t.get("explodesOn")==="none"?null:Number(t.get("explodesOn")),rerollOnOne:t.get("rerollOnOne")==="on"})}function F(){A=z(r),k=[A,...k].slice(0,T),Be(),y()}function me(e){var s,p;const t=(e==null?void 0:e.clan)??"Crab",n=Z(t),a=V(t),o=(e==null?void 0:e.family)??((s=n[0])==null?void 0:s.name)??"Hida",i=(e==null?void 0:e.school)??((p=a[0])==null?void 0:p.name)??"Hida Bushi";return`
    <form class="editor-panel full-panel" id="character-form" data-character-id="${(e==null?void 0:e.id)??""}">
      <div class="form-grid">
        ${De("name","Name",(e==null?void 0:e.name)??"")}
        ${Le("xp","Initial XP",(e==null?void 0:e.xp)??40,0,999)}
        <label class="field">
          <span>Clan</span>
          <select id="clan" name="clan">${Ce().map(m=>w(m,t)).join("")}</select>
        </label>
        <label class="field">
          <span>Family</span>
          <select id="family" name="family">${n.map(m=>w(m.name,o,m.benefit)).join("")}</select>
        </label>
        <label class="field">
          <span>School</span>
          <select id="school" name="school">${a.map(m=>w(m.name,i,m.benefit)).join("")}</select>
        </label>
      </div>
      <div class="button-row">
        <button class="roll-button" type="submit">Save</button>
        <button class="ghost-button" id="cancel-character" type="button">Cancel</button>
      </div>
    </form>
  `}function be(){var a;const e=((a=c.querySelector("#clan"))==null?void 0:a.value)??"Crab",t=c.querySelector("#family"),n=c.querySelector("#school");!t||!n||(t.innerHTML=Z(e).map(o=>w(o.name,t.value,o.benefit)).join(""),n.innerHTML=V(e).map(o=>w(o.name,n.value,o.benefit)).join(""))}function he(e,t){var m,I;const n=String(e.get("family")||"Hida"),a=String(e.get("school")||"Hida Bushi"),o=(m=$.find(f=>f.id==="families"))==null?void 0:m.items.find(f=>f.name===n),i=(I=$.find(f=>f.id==="schools"))==null?void 0:I.items.find(f=>f.name===a),s=t?d.find(f=>f.id===t):void 0,p={id:(s==null?void 0:s.id)??crypto.randomUUID(),name:String(e.get("name")||"Unnamed Samurai"),xp:Number(e.get("xp")||40),clan:String(e.get("clan")||"Crab"),family:n,school:a,honor:He(i==null?void 0:i.honor),glory:i&&String(i.discipline).toLowerCase()==="monk"?0:1,status:1,taint:(s==null?void 0:s.taint)??0,traits:Me([String((o==null?void 0:o.benefit)??""),String((i==null?void 0:i.benefit)??"")]),skills:xe(String((i==null?void 0:i.skills)??"")),createdAt:(s==null?void 0:s.createdAt)??new Date().toISOString()};return d=s?d.map(f=>f.id===s.id?p:f):[p,...d],X(),p}function ge(e){var n;return`
    <a class="character-row${(l.characterId??((n=d[0])==null?void 0:n.id))===e.id?" active":""}" href="#characters/${e.id}">
      <strong>${u(e.name)}</strong>
      <span>${u(e.clan)} - ${u(e.school)}</span>
    </a>
  `}function $e(e){return`
    <div class="panel-title-row">
      <div>
        <h2>${u(e.name)}</h2>
        <p class="muted">${u(e.family)} family, ${u(e.school)}</p>
      </div>
      <div class="button-row compact">
        <a class="ghost-link" href="#characters/${e.id}/edit">XP ${e.xp}</a>
        <button class="ghost-button danger" id="delete-character" data-character-id="${e.id}" type="button">Delete</button>
      </div>
    </div>

    <section class="stat-strip">
      ${h("Honor",e.honor.toFixed(1))}
      ${h("Glory",e.glory.toFixed(1))}
      ${h("Status",e.status.toFixed(1))}
      ${h("Taint",e.taint.toFixed(1))}
    </section>

    <section class="ring-grid">
      ${v("Earth",g(e,"earth"),"Stamina",e.traits.stamina,"Willpower",e.traits.willpower)}
      ${v("Air",g(e,"air"),"Reflexes",e.traits.reflexes,"Awareness",e.traits.awareness)}
      ${v("Water",g(e,"water"),"Strength",e.traits.strength,"Perception",e.traits.perception)}
      ${v("Fire",g(e,"fire"),"Agility",e.traits.agility,"Intelligence",e.traits.intelligence)}
      ${v("Void",g(e,"void"),"Void",e.traits.void,"Insight Rank",N(e),!0)}
    </section>

    <section class="combat-grid">
      ${h("Initiative",`${N(e)}k${e.traits.reflexes}`)}
      ${h("Insight",String(W(e)))}
      ${h("Wounds / Rank",String(g(e,"earth")*2))}
      ${h("Healthy",String(g(e,"earth")*5))}
    </section>

    <section class="skills-panel">
      <h2>Skills</h2>
      <div class="chip-row">${e.skills.length?e.skills.map(t=>`<span class="chip">${u(t)}</span>`).join(""):'<span class="muted">No school skills listed.</span>'}</div>
    </section>
  `}function ke(){return'<div class="empty-panel"><p class="muted">No characters yet.</p><a class="roll-button link-button" href="#characters/new">Create your first character</a></div>'}function ye(){return'<div class="empty-panel"><h2>Create your first character</h2><p class="muted">Pick a clan, family, and school from the original book data.</p><a class="roll-button link-button" href="#characters/new">New Character</a></div>'}function ve(e){return`
    <a class="book-card" href="#book/${e.id}">
      <span>${e.label}</span>
      <strong>${e.items.length}</strong>
      <small>${e.loaded?"Loaded":e.failed?"Fallback":"Loading"}</small>
    </a>
  `}function Se(e){return`
    <label class="field search-field">
      <span>Search ${e.label}</span>
      <input data-book-filter="${e.id}" type="search" placeholder="Filter by name or text" />
    </label>
    ${e.failed?'<p class="muted">Showing fallback data because the original resource could not be loaded.</p>':""}
  `}function we(e){const t=[e.clan,e.benefit,e.honor?`Honor ${e.honor}`:null].filter(Boolean).join(" - ");return`
    <article class="book-item">
      <h3>${u(e.name)}</h3>
      ${t?`<p class="book-meta">${u(t)}</p>`:""}
      <p>${u(String(e.description??e.skills??"No description."))}</p>
    </article>
  `}async function Ae(){K=!0,await Promise.all($.map(async e=>{try{const t=await fetch(`${ne}/${e.file}`);if(!t.ok)throw new Error(`Failed to load ${e.file}`);const n=await t.json();e.items=n.filter(a=>typeof a.name=="string"),e.loaded=!0}catch{e.failed=!0}})),(l.tab==="book"||l.tab==="characters")&&y()}function Oe(){return[{id:"advantages",label:"Advantages",file:"Advantages.json",items:Ze,loaded:!1,failed:!1},{id:"ancestors",label:"Ancestors",file:"Ancestors.json",items:Ve,loaded:!1,failed:!1},{id:"armors",label:"Armors",file:"Armors.json",items:Ue,loaded:!1,failed:!1},{id:"clans",label:"Clans",file:"Clans.json",items:We,loaded:!1,failed:!1},{id:"disadvantages",label:"Disadvantages",file:"Disadvantages.json",items:_e,loaded:!1,failed:!1},{id:"families",label:"Families",file:"Families.json",items:Ke,loaded:!1,failed:!1},{id:"katas",label:"Katas",file:"Katas.json",items:Je,loaded:!1,failed:!1},{id:"kihos",label:"Kihos",file:"Kihos.json",items:Xe,loaded:!1,failed:!1},{id:"schools",label:"Schools",file:"Schools.json",items:Pe,loaded:!1,failed:!1},{id:"shadowlands",label:"Shadowlands Powers",file:"ShadowlandsPowers.json",items:ze,loaded:!1,failed:!1},{id:"skills",label:"Skills",file:"Skills.json",items:Ge,loaded:!1,failed:!1},{id:"spells",label:"Spells",file:"Spells.json",items:Qe,loaded:!1,failed:!1},{id:"tattoos",label:"Tattoos",file:"Tattoos.json",items:Ye,loaded:!1,failed:!1},{id:"weapons",label:"Weapons",file:"Weapons.json",items:et,loaded:!1,failed:!1}]}function Z(e){return U("families",e)}function V(e){return U("schools",e)}function U(e,t){const n=$.find(o=>o.id===e),a=(n==null?void 0:n.items.filter(o=>String(o.clan??"").toLowerCase()===t.toLowerCase()))??[];return a.length?a:(n==null?void 0:n.items.slice(0,8))??[]}function Ce(){const e=new Set;for(const t of["families","schools"]){const n=$.find(a=>a.id===t);for(const a of(n==null?void 0:n.items)??[])a.clan&&e.add(String(a.clan))}return[...e].sort()}function Me(e){const t={stamina:2,willpower:2,reflexes:2,awareness:2,strength:2,perception:2,agility:2,intelligence:2,void:2};for(const n of e)for(const a of Object.keys(t))n.toLowerCase().includes(a)&&(t[a]+=1);return t}function xe(e){return e.split(",").map(t=>t.trim().replace(/\s+\d+$/,"")).filter(Boolean).slice(0,12)}function He(e){const t=Number(e);return Number.isFinite(t)?t:2.5}function g(e,t){return t==="earth"?Math.min(e.traits.stamina,e.traits.willpower):t==="air"?Math.min(e.traits.reflexes,e.traits.awareness):t==="water"?Math.min(e.traits.strength,e.traits.perception):t==="fire"?Math.min(e.traits.agility,e.traits.intelligence):e.traits.void}function W(e){return e.skills.length+["earth","air","water","fire","void"].reduce((t,n)=>t+g(e,n),0)*10}function N(e){return Math.min(10,Math.max(1,Math.floor((W(e)-125)/25)+1))}function v(e,t,n,a,o,i,s=!1){return`
    <article class="ring-card${s?" compact":""}">
      <strong>${t}</strong>
      <span>${e}</span>
      <small>${n} ${a}</small>
      <small>${o} ${i}</small>
    </article>
  `}function h(e,t){return`<div class="stat"><span>${e}</span><strong>${t}</strong></div>`}function x(e,t,n,a,o){return`
    <label class="field">
      <span>${t}</span>
      <input id="${e}" name="${e}" type="number" min="${a}" max="${o}" value="${n}" inputmode="numeric" />
    </label>
  `}function Le(e,t,n,a,o){return`<label class="field"><span>${t}</span><input id="${e}" name="${e}" type="number" min="${a}" max="${o}" value="${n}" /></label>`}function De(e,t,n){return`<label class="field"><span>${t}</span><input id="${e}" name="${e}" type="text" value="${u(n)}" required /></label>`}function w(e,t,n=""){return`<option value="${u(e)}" ${e===t?"selected":""}>${u(n?`${e} ${n}`:e)}</option>`}function je(e){const t=e.applied.bonus===0?"":` Rule bonus ${Ne(e.applied.bonus)}.`;return`
    <div class="result-total">
      <span>${B(e)}</span>
      <strong>${e.total}</strong>
    </div>
    <div class="dice-row">${e.rolls.map(Ee).join("")}</div>
    <p class="muted">Rolled ${e.applied.amount}, kept ${e.applied.keep}.${t}</p>
  `}function Ie(){return`
    <div class="result-total empty">
      <span>Ready</span>
      <strong>${_(r)}</strong>
    </div>
    <p class="muted">Choose a pool and roll.</p>
  `}function Ee(e){return`<span class="die${e>10?" exploded":""}" aria-label="Die result ${e}">${e}</span>`}function Fe(e){const t=new Intl.DateTimeFormat(void 0,{hour:"2-digit",minute:"2-digit"}).format(new Date(e.createdAt));return`
    <li>
      <span>${B(e)}</span>
      <strong>${e.total}</strong>
      <small>${e.rolls.join(" + ")} - ${t}</small>
    </li>
  `}function S(e,t){return`<button type="button" data-preset="${e}">${e}k${t}</button>`}function _(e){const t=e.bonus===0?"":e.bonus>0?`+${e.bonus}`:`${e.bonus}`;return`${e.amount}k${e.keep}${t}`}function Ne(e){return e>0?`+${e}`:`${e}`}function J(){const e=location.hash.replace(/^#\/?/,"").split("/").filter(Boolean),t=D.some(n=>n.id===e[0])?e[0]:"characters";return t==="characters"&&e[1]==="new"?{tab:t,editing:!0}:t==="characters"&&e[1]?{tab:t,characterId:e[1],editing:e[2]==="edit"}:t==="book"&&e[1]?{tab:t,sectionId:e[1]}:{tab:t}}function qe(){const e=localStorage.getItem(L);if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t.slice(0,T):[]}catch{return[]}}function Be(){localStorage.setItem(L,JSON.stringify(k))}function Re(){const e=localStorage.getItem(R);if(!e)return[];try{const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function X(){localStorage.setItem(R,JSON.stringify(d))}function Te(e){return{people:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-3.3-6.3A5 5 0 0 1 14 8a5 5 0 0 1-1.3 3.3A4 4 0 0 0 16 11Zm-8 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Zm8-.5c-.9 0-1.8.2-2.6.5 1.6.9 2.6 2.3 2.6 4v1h6v-1c0-2.5-2.7-4.5-6-4.5Z"/></svg>',die:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-4 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-4 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Zm2.5-.5a.5.5 0 0 0-.5.5v12.6c.2-.1.3-.1.5-.1H18V4H7.5Z"/></svg>',scroll:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h11a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm11 16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10ZM8 8h8v2H8V8Zm0 4h8v2H8v-2Z"/></svg>'}[e]??""}function u(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function j(e){const t=document.querySelector(e);if(!t)throw new Error(`Missing element: ${e}`);return t}const Ke=[{name:"Hida",clan:"Crab",benefit:"+1 Strength",description:"Powerful Crab defenders trained for endurance and brutal force."},{name:"Doji",clan:"Crane",benefit:"+1 Awareness",description:"Masters of courtly influence, culture, and political grace."},{name:"Mirumoto",clan:"Dragon",benefit:"+1 Agility",description:"Dragon samurai known for practical rule and two-sword technique."},{name:"Akodo",clan:"Lion",benefit:"+1 Agility",description:"Lion tacticians and battle leaders with a calm martial tradition."},{name:"Bayushi",clan:"Scorpion",benefit:"+1 Agility",description:"Scorpion courtiers and duelists trained in secrets and misdirection."}],Pe=[{name:"Hida Bushi",clan:"Crab",benefit:"+1 Stamina",honor:"3.5",skills:"Athletics, Defense, Heavy Weapons, Intimidation, Kenjutsu, Lore: Shadowlands",description:"A heavy infantry school built around endurance and crushing attacks."},{name:"Doji Courtier",clan:"Crane",benefit:"+1 Awareness",honor:"6.5",skills:"Courtier, Etiquette, Sincerity, Calligraphy, Lore: Heraldry",description:"A school focused on alliances, etiquette, and social advantage."},{name:"Mirumoto Bushi",clan:"Dragon",benefit:"+1 Agility",honor:"4.5",skills:"Defense, Kenjutsu, Lore: Shugenja, Meditation, Theology",description:"The Dragon two-sword bushi tradition."},{name:"Akodo Bushi",clan:"Lion",benefit:"+1 Agility",honor:"6.5",skills:"Battle, Defense, Kenjutsu, Kyujutsu, Lore: History",description:"A disciplined battlefield command and weapon school."},{name:"Bayushi Courtier",clan:"Scorpion",benefit:"+1 Awareness",honor:"2.5",skills:"Courtier, Etiquette, Intimidation, Sincerity, Temptation",description:"A manipulative court school built around pressure and leverage."}],Ze=[{name:"Ally",description:"A useful social connection with influence and devotion."}],Ve=[{name:"Ancestral Guidance",description:"A remembered ancestor whose legacy shapes the character."}],Ue=[{name:"Light Armor",description:"Common battlefield protection with modest penalties."}],We=[{name:"Crab",description:"Defenders of the Empire against the Shadowlands."}],_e=[{name:"Bad Fortune",description:"An ill omen or recurring trouble in the character's life."}],Je=[{name:"Striking as Fire",description:"A martial kata focused on decisive attacks."}],Xe=[{name:"Ki Protection",description:"A monk technique that channels inner energy defensively."}],ze=[{name:"Dark Paragon",description:"A corrupt power associated with Shadowlands influence."}],Ge=[{name:"Kenjutsu",description:"The sword skill used for katana and wakizashi attacks."}],Qe=[{name:"Commune",description:"A basic spell used to speak with the kami."}],Ye=[{name:"Dragon Tattoo",description:"A mystical tattoo of the Togashi orders."}],et=[{name:"Katana",description:"The signature samurai sword."}];$=Oe();window.addEventListener("hashchange",()=>{l=J(),y()});y();
