import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════
   THE WORDEN STANDARD v3 — LINEAR STYLE
   ═══════════════════════════════════════════ */

const TG = {
  "Paving & Asphalt": {
    asphalt_res:{l:"Asphalt — Residential",d:145,u:"sqft",du:"in",cl:"$/ton"},
    asphalt_com:{l:"Asphalt — Commercial",d:148,u:"sqft",du:"in",cl:"$/ton"},
    sealcoat:{l:"Sealcoating",d:0,u:"sqft",du:null,cl:"$/sqft"},
    crack:{l:"Crack Filling",d:0,u:"lnft",du:null,cl:"$/lnft"},
    mill:{l:"Milling",d:0,u:"sqft",du:"in",cl:"$/sqft"},
    stripe:{l:"Striping",d:0,u:"lnft",du:null,cl:"$/lnft"},
    chip:{l:"Chip Seal",d:0,u:"sqft",du:null,cl:"$/sqft"},
  },
  "Concrete": {
    conc_flat:{l:"Flatwork",d:150,u:"sqft",du:"in",cl:"$/yard"},
    conc_struct:{l:"Structural",d:150,u:"sqft",du:"in",cl:"$/yard"},
    conc_stamp:{l:"Stamped / Decorative",d:0,u:"sqft",du:null,cl:"$/sqft"},
    conc_curb:{l:"Curb & Gutter",d:0,u:"lnft",du:null,cl:"$/lnft"},
  },
  "Sitework": {
    grade:{l:"Grading",d:0,u:"sqft",du:null,cl:"$/sqft"},
    excav:{l:"Excavation",d:0,u:"cuyd",du:null,cl:"$/cuyd"},
    demo:{l:"Demolition",d:0,u:"sqft",du:null,cl:"$/sqft"},
    drain:{l:"Drainage",d:0,u:"lnft",du:null,cl:"$/lnft"},
    retain:{l:"Retaining Walls",d:0,u:"sqft",du:null,cl:"$/sqft"},
  },
  "Roofing": {
    roof_shin:{l:"Shingle",d:0,u:"sqft",du:null,cl:"$/square"},
    roof_metal:{l:"Metal",d:0,u:"sqft",du:null,cl:"$/sqft"},
    roof_flat:{l:"Flat / TPO",d:0,u:"sqft",du:null,cl:"$/sqft"},
    gutter:{l:"Gutters",d:0,u:"lnft",du:null,cl:"$/lnft"},
  },
  "Electrical": {
    elec_rough:{l:"Rough-In",d:0,u:"sqft",du:null,cl:"$/sqft"},
    elec_panel:{l:"Panel Upgrade",d:0,u:"unit",du:null,cl:"$/panel"},
    solar:{l:"Solar Install",d:0,u:"unit",du:null,cl:"$/watt"},
    ev:{l:"EV Charger",d:0,u:"unit",du:null,cl:"$/unit"},
  },
  "Plumbing": {
    plmb_rough:{l:"Rough-In",d:0,u:"unit",du:null,cl:"$/fixture"},
    plmb_pipe:{l:"Re-Pipe",d:0,u:"lnft",du:null,cl:"$/lnft"},
    plmb_sewer:{l:"Sewer / Septic",d:0,u:"lnft",du:null,cl:"$/lnft"},
  },
  "HVAC": {
    hvac_sys:{l:"System Install",d:0,u:"unit",du:null,cl:"$/ton"},
    hvac_duct:{l:"Ductwork",d:0,u:"lnft",du:null,cl:"$/lnft"},
  },
  "Carpentry": {
    frame:{l:"Framing",d:0,u:"sqft",du:null,cl:"$/sqft"},
    deck:{l:"Decking",d:0,u:"sqft",du:null,cl:"$/sqft"},
    trim:{l:"Finish / Trim",d:0,u:"lnft",du:null,cl:"$/lnft"},
  },
  "Masonry": {
    brick:{l:"Brick / Block",d:0,u:"sqft",du:null,cl:"$/sqft"},
    stone:{l:"Stone",d:0,u:"sqft",du:null,cl:"$/sqft"},
    paver:{l:"Pavers",d:0,u:"sqft",du:null,cl:"$/sqft"},
  },
  "Painting": {
    paint_in:{l:"Interior",d:0,u:"sqft",du:null,cl:"$/sqft"},
    paint_ex:{l:"Exterior",d:0,u:"sqft",du:null,cl:"$/sqft"},
  },
  "Landscaping": {
    land:{l:"Full Install",d:0,u:"sqft",du:null,cl:"$/sqft"},
    sod:{l:"Sod",d:0,u:"sqft",du:null,cl:"$/sqft"},
    fence:{l:"Fencing",d:0,u:"lnft",du:null,cl:"$/lnft"},
    tree:{l:"Tree Removal",d:0,u:"unit",du:null,cl:"$/tree"},
  },
  "Interior": {
    drywall:{l:"Drywall",d:0,u:"sqft",du:null,cl:"$/sqft"},
    floor_hw:{l:"Hardwood Floor",d:0,u:"sqft",du:null,cl:"$/sqft"},
    floor_tile:{l:"Tile",d:0,u:"sqft",du:null,cl:"$/sqft"},
    insul:{l:"Insulation",d:0,u:"sqft",du:null,cl:"$/sqft"},
  },
  "Specialty": {
    weld:{l:"Welding / Steel",d:0,u:"hr",du:null,cl:"$/hr"},
    pool:{l:"Pool Construction",d:0,u:"sqft",du:null,cl:"$/sqft"},
    epoxy:{l:"Epoxy Floor",d:0,u:"sqft",du:null,cl:"$/sqft"},
    pressure:{l:"Pressure Wash",d:0,u:"sqft",du:null,cl:"$/sqft"},
  },
};
const T={}; Object.values(TG).forEach(g=>Object.assign(T,g));
const B=627.5,MH=0.08,MG=0.35;
const f$=n=>"$"+Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const uL=u=>({sqft:"Square feet",lnft:"Linear feet",cuyd:"Cubic yards",unit:"Units",hr:"Hours",zone:"Zones"}[u]||u);

async function ld(k,fb){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):fb}catch{return fb}}
async function sv(k,d){try{await window.storage.set(k,JSON.stringify(d))}catch(e){console.error(e)}}

export default function App(){
  const [view,setView]=useState("home");
  const [auto,setAuto]=useState("manual");
  const [now,setNow]=useState(new Date());
  const [jobs,setJobs]=useState([]);
  const [crew,setCrew]=useState([]);
  const [eqp,setEqp]=useState([]);
  const [cmdOpen,setCmdOpen]=useState(false);

  // Estimator
  const [trade,setTrade]=useState("asphalt_res");
  const [qty,setQty]=useState("");
  const [depth,setDepth]=useState("2");
  const [cost,setCost]=useState("");
  const [city,setCity]=useState("");
  const [est,setEst]=useState(null);
  const [cpd,setCpd]=useState(false);

  // Jarvis
  const [jI,setJI]=useState("");
  const [jL,setJL]=useState([{r:"j",t:`Online. ${Object.keys(T).length} trades · 51 states · Autonomy: MANUAL`}]);
  const [jW,setJW]=useState(false);
  const jRef=useRef(null);
  const cmdRef=useRef(null);

  useEffect(()=>{ld("ws3-jobs",[]).then(setJobs);ld("ws3-crew",[]).then(setCrew);ld("ws3-eqp",[]).then(setEqp);},[]);
  useEffect(()=>{if(jobs.length)sv("ws3-jobs",jobs)},[jobs]);
  useEffect(()=>{if(crew.length)sv("ws3-crew",crew)},[crew]);
  useEffect(()=>{if(eqp.length)sv("ws3-eqp",eqp)},[eqp]);
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(i)},[]);
  useEffect(()=>{jRef.current?.scrollIntoView({behavior:"smooth"})},[jL]);

  // Cmd+K
  useEffect(()=>{
    const h=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setCmdOpen(p=>!p)}if(e.key==="Escape")setCmdOpen(false)};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);
  useEffect(()=>{if(cmdOpen)setTimeout(()=>cmdRef.current?.focus(),50)},[cmdOpen]);

  const calc=()=>{
    const t=T[trade],q=parseFloat(qty)||0,d=parseFloat(depth)||0,c=parseFloat(cost)||0;
    if(!q||!c)return;
    let ton=null,mat,mh=0;
    if(t.d&&d){ton=(q/9*d*t.d)/24000;mat=ton*c;mh=ton*MH}else{mat=q*c}
    const sub=mat+mh+B,bid=sub/(1-MG);
    const pid=`WS-${now.toFullYear?now.getFullYear():2026}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000)+1000}`;
    setEst({ton,mat,mh,sub,bid,q,em:q>20000,trade:t.l,city,pid});
  };

  const saveJob=()=>{if(!est)return;setJobs(p=>[{id:est.pid,trade:est.trade,city:est.city,qty:est.q,bid:est.bid,status:"Estimated",ts:new Date().toISOString(),em:est.em},...p]);setView("jobs")};

  const sendJ=async()=>{
    const m=jI.trim();if(!m||jW)return;setJI("");setJL(p=>[...p,{r:"u",t:m}]);setJW(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are Jarvis — AI engine inside The Worden Standard, the contractor operations platform for ALL construction trades across 51 US states. Built by Gene George, 4th gen contractor.\n\n${Object.keys(T).length} trades active. Paving math: T=(sqft/9×depth×density)/24000. Res 145, Com 148. All trades: 35% margin floor. Binder $627.50. Machine health $0.08/ton.\n\n51-state: licensing, lien law, worker classification, prevailing wage, OSHA.\n\nJobs: ${jobs.length}. Crew: ${crew.length}. Equipment: ${eqp.length}. Autonomy: ${auto.toUpperCase()}.\n\nBe concise. Be precise. Mission control.`,
          messages:[{role:"user",content:m}]})});
      const d=await r.json();
      setJL(p=>[...p,{r:"j",t:d.content?.map(b=>b.text||"").filter(Boolean).join("\n")||"Error."}]);
    }catch(e){setJL(p=>[...p,{r:"j",t:`Error: ${e.message}`}])}
    setJW(false);
  };

  const cmdExec=(q)=>{setCmdOpen(false);if(q.startsWith("/")){
    const c=q.slice(1).toLowerCase();
    if(["home","jarvis","estimate","jobs","crew","equipment"].includes(c)){setView(c);return}
  }setJI(q);setView("jarvis");setTimeout(()=>sendJ(),100)};

  const acl=auto==="auto"?"#22c55e":auto==="hybrid"?"#eab308":"#6b7280";
  const activeJ=jobs.filter(j=>!["Paid","Archived"].includes(j.status));

  // Sidebar items
  const nav=[
    {id:"home",icon:"◉",label:"Home"},
    {id:"jarvis",icon:"⚡",label:"Jarvis"},
    {id:"estimate",icon:"◇",label:"Estimate"},
    {id:"jobs",icon:"☰",label:"Jobs",badge:activeJ.length||null},
    {id:"crew",icon:"◎",label:"Crew",badge:crew.length||null},
    {id:"equipment",icon:"▣",label:"Equipment",badge:eqp.length||null},
  ];
  const navPending=[
    {icon:"◈",label:"Marketing"},
    {icon:"$",label:"Banking"},
    {icon:"☁",label:"Weather"},
    {icon:"§",label:"Legal"},
    {icon:"→",label:"Routing"},
    {icon:"°",label:"Thermal"},
  ];

  const inp={width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:6,color:"#e0e2e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,padding:"8px 12px",outline:"none",transition:"border-color 0.15s"};

  return(
    <div style={{display:"flex",height:"100vh",background:"#0a0b10",color:"#c9cdd8",fontFamily:"'IBM Plex Mono',monospace",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Serif&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::selection{background:rgba(245,166,35,0.15);color:#f5a623}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}
        select option{background:#0a0b10;color:#c9cdd8}select optgroup{color:#f5a623;font-weight:700;background:#0e1018}
        .ws-inp:focus{border-color:rgba(245,166,35,0.3)!important}
        .ws-nav:hover{background:rgba(255,255,255,0.03)!important}
        .ws-row:hover{background:rgba(255,255,255,0.02)!important}
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <div style={{width:200,minWidth:200,borderRight:"1px solid rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",padding:"12px 8px",gap:1}}>
        {/* Brand */}
        <div style={{padding:"8px 10px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#f5a623"}}>WORDEN</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.08em",marginTop:1}}>STANDARD</div>
        </div>

        {/* Command palette trigger */}
        <button onClick={()=>setCmdOpen(true)} className="ws-nav" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:5,border:"1px solid rgba(255,255,255,0.04)",background:"transparent",color:"rgba(255,255,255,0.2)",fontFamily:"inherit",fontSize:11,cursor:"pointer",marginBottom:12,textAlign:"left",width:"100%"}}>
          <span style={{fontSize:12}}>⌘</span>
          <span style={{flex:1}}>Search...</span>
          <span style={{fontSize:8,background:"rgba(255,255,255,0.04)",padding:"1px 5px",borderRadius:3}}>⌘K</span>
        </button>

        {/* Nav items */}
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} className="ws-nav"
            style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:5,border:"none",background:view===n.id?"rgba(255,255,255,0.04)":"transparent",color:view===n.id?"#e0e2e8":"rgba(255,255,255,0.35)",fontFamily:"inherit",fontSize:12,cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.1s"}}>
            <span style={{fontSize:11,width:16,textAlign:"center",color:view===n.id?"#f5a623":"rgba(255,255,255,0.2)"}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge&&<span style={{fontSize:9,color:"rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.04)",padding:"1px 6px",borderRadius:10}}>{n.badge}</span>}
          </button>
        ))}

        <div style={{height:1,background:"rgba(255,255,255,0.04)",margin:"10px 0"}}/>
        <div style={{fontSize:8,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.12)",padding:"4px 10px"}}>Coming Soon</div>
        {navPending.map((n,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",fontSize:12,color:"rgba(255,255,255,0.12)"}}>
            <span style={{fontSize:11,width:16,textAlign:"center"}}>{n.icon}</span>{n.label}
          </div>
        ))}

        {/* Bottom: Autonomy */}
        <div style={{marginTop:"auto",padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
          <div style={{fontSize:7,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.15)",marginBottom:6}}>Autonomy</div>
          <div style={{display:"flex",background:"rgba(255,255,255,0.02)",borderRadius:5,padding:2}}>
            {["manual","hybrid","auto"].map(m=>(
              <button key={m} onClick={()=>setAuto(m)} style={{flex:1,fontFamily:"inherit",fontSize:8,fontWeight:600,padding:"5px 0",borderRadius:4,border:"none",cursor:"pointer",transition:"all 0.15s",textTransform:"uppercase",letterSpacing:"0.06em",
                background:auto===m?"rgba(255,255,255,0.06)":"transparent",
                color:auto===m?acl:"rgba(255,255,255,0.15)"}}>{m}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6,justifyContent:"center"}}>
            <span style={{width:4,height:4,borderRadius:"50%",background:acl,boxShadow:`0 0 6px ${acl}`}}/>
            <span style={{fontSize:8,color:acl,fontWeight:600}}>{auto.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        {/* Header bar */}
        <div style={{padding:"10px 24px",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:40,flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#e0e2e8"}}>{
            {home:"Home",jarvis:"Jarvis",estimate:"New Estimate",jobs:"Jobs",crew:"Crew",equipment:"Equipment"}[view]
          }</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.15)"}}>{now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

          {/* ─── HOME ─── */}
          {view==="home"&&(
            <div style={{maxWidth:700}}>
              <div style={{marginBottom:32}}>
                <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:28,color:"#e0e2e8",fontWeight:400,marginBottom:4}}>Good {now.getHours()<12?"morning":now.getHours()<17?"afternoon":"evening"}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.7}}>
                  {activeJ.length} active job{activeJ.length!==1?"s":""} · {crew.length} crew · {eqp.length} equipment · Pipeline {f$(jobs.reduce((s,j)=>s+j.bid,0))}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{display:"flex",gap:8,marginBottom:28}}>
                {[
                  {l:"New Estimate",v:"estimate"},
                  {l:"Ask Jarvis",v:"jarvis"},
                  {l:"View Jobs",v:"jobs"},
                ].map(a=>(
                  <button key={a.v} onClick={()=>setView(a.v)} className="ws-nav" style={{padding:"10px 16px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",background:"transparent",color:"rgba(255,255,255,0.5)",fontFamily:"inherit",fontSize:11,cursor:"pointer"}}>
                    {a.l}
                  </button>
                ))}
              </div>

              {/* Recent jobs */}
              {jobs.length>0&&(
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.2)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Recent Jobs</div>
                  {jobs.slice(0,5).map(j=>(
                    <div key={j.id} className="ws-row" onClick={()=>setView("jobs")} style={{display:"flex",alignItems:"center",padding:"10px 12px",borderRadius:6,cursor:"pointer",gap:12,transition:"background 0.1s"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:j.status==="Paid"?"#22c55e":j.status==="In Progress"?"#f5a623":"rgba(255,255,255,0.1)",flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,color:"#c9cdd8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{j.trade}{j.city?` · ${j.city}`:""}</div>
                      </div>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontVariantNumeric:"tabular-nums"}}>{f$(j.bid)}</span>
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.15)",minWidth:70,textAlign:"right"}}>{j.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── JARVIS ─── */}
          {view==="jarvis"&&(
            <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 100px)",maxWidth:700}}>
              <div style={{flex:1,overflowY:"auto",paddingBottom:12}}>
                {jL.map((m,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:14,justifyContent:m.r==="j"?"flex-start":"flex-end"}}>
                    {m.r==="j"&&<div style={{width:22,height:22,borderRadius:5,background:"rgba(245,166,35,0.08)",border:"1px solid rgba(245,166,35,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,flexShrink:0,marginTop:2}}>⚡</div>}
                    <div style={{maxWidth:"85%",background:m.r==="j"?"rgba(255,255,255,0.02)":"rgba(245,166,35,0.04)",border:`1px solid ${m.r==="j"?"rgba(255,255,255,0.04)":"rgba(245,166,35,0.08)"}`,borderRadius:8,padding:"10px 14px",fontSize:12,lineHeight:1.75,whiteSpace:"pre-wrap",color:"#c9cdd8"}}>{m.t}</div>
                  </div>
                ))}
                {jW&&<div style={{fontSize:11,color:"rgba(255,255,255,0.15)",paddingLeft:32}}>Thinking...</div>}
                <div ref={jRef}/>
              </div>
              <div style={{display:"flex",gap:8,borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:12}}>
                <input value={jI} onChange={e=>setJI(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendJ()}}
                  placeholder="Message Jarvis..." className="ws-inp" style={{...inp,flex:1}} />
                <button onClick={sendJ} disabled={jW} style={{fontFamily:"inherit",fontSize:10,fontWeight:600,padding:"0 20px",background:jW?"rgba(255,255,255,0.02)":"#f5a623",color:jW?"rgba(255,255,255,0.15)":"#0a0b10",border:"none",borderRadius:6,cursor:jW?"wait":"pointer"}}>Send</button>
              </div>
            </div>
          )}

          {/* ─── ESTIMATOR ─── */}
          {view==="estimate"&&(
            <div style={{maxWidth:600}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <label style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>Trade</label>
                  <select value={trade} onChange={e=>{setTrade(e.target.value);setEst(null)}} className="ws-inp" style={{...inp,cursor:"pointer"}}>
                    {Object.entries(TG).map(([g,ts])=>(<optgroup key={g} label={g}>{Object.entries(ts).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</optgroup>))}
                  </select>
                </div>
                <div style={{display:"grid",gridTemplateColumns:T[trade].du?"1fr 1fr":"1fr",gap:12}}>
                  <div>
                    <label style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>{uL(T[trade].u)}</label>
                    <input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" className="ws-inp" style={inp}/>
                  </div>
                  {T[trade].du&&<div>
                    <label style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>Depth ({T[trade].du})</label>
                    <input type="number" value={depth} onChange={e=>setDepth(e.target.value)} step="0.25" className="ws-inp" style={inp}/>
                  </div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <label style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>Cost ({T[trade].cl})</label>
                    <input type="number" value={cost} onChange={e=>setCost(e.target.value)} placeholder="0" className="ws-inp" style={inp}/>
                  </div>
                  <div>
                    <label style={{fontSize:10,fontWeight:500,color:"rgba(255,255,255,0.3)",display:"block",marginBottom:5}}>Location</label>
                    <input value={city} onChange={e=>setCity(e.target.value)} placeholder="City, State" className="ws-inp" style={inp}/>
                  </div>
                </div>
                <button onClick={calc} style={{width:"100%",padding:"10px 0",background:"#f5a623",color:"#0a0b10",fontFamily:"inherit",fontSize:12,fontWeight:600,border:"none",borderRadius:6,cursor:"pointer",marginTop:4}}>
                  Calculate
                </button>
              </div>

              {est&&(
                <div style={{marginTop:24,paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                  {est.em&&<div style={{padding:"8px 12px",borderRadius:6,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.1)",fontSize:11,color:"#ef4444",marginBottom:16}}>⚠ {est.q.toLocaleString()} {T[trade].u} — exceeds threshold — owner review</div>}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:"rgba(255,255,255,0.03)",borderRadius:8,overflow:"hidden",marginBottom:16}}>
                    {est.ton!==null&&<div style={{padding:"16px",background:"#0a0b10"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:4}}>Tonnage</div><div style={{fontSize:18,fontWeight:700,color:"#f5a623",fontVariantNumeric:"tabular-nums"}}>{Number(est.ton).toFixed(2)}</div></div>}
                    <div style={{padding:"16px",background:"#0a0b10"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:4}}>Material</div><div style={{fontSize:18,fontWeight:700,color:"#e0e2e8",fontVariantNumeric:"tabular-nums"}}>{f$(est.mat)}</div></div>
                    <div style={{padding:"16px",background:"#0a0b10"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:4}}>Binder Index</div><div style={{fontSize:18,fontWeight:700,color:"#e0e2e8",fontVariantNumeric:"tabular-nums"}}>{f$(B)}</div></div>
                    <div style={{padding:"16px",background:"#0a0b10"}}><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginBottom:4}}>Final Bid · 35%</div><div style={{fontSize:22,fontWeight:700,color:"#f5a623",fontVariantNumeric:"tabular-nums"}}>{f$(est.bid)}</div></div>
                  </div>

                  <div style={{display:"flex",gap:8}}>
                    <button onClick={saveJob} style={{flex:1,padding:"9px 0",borderRadius:6,border:"1px solid rgba(34,197,94,0.15)",background:"rgba(34,197,94,0.04)",color:"#22c55e",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer"}}>Save as Job</button>
                    <button onClick={()=>{navigator.clipboard.writeText(JSON.stringify({id:est.pid,trade:est.trade,qty:est.q,bid:+est.bid.toFixed(2),margin:"35%",city:est.city},null,2));setCpd(true);setTimeout(()=>setCpd(false),1500)}}
                      style={{flex:1,padding:"9px 0",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)",color:"rgba(255,255,255,0.4)",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer"}}>{cpd?"Copied ✓":"Copy JSON"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── JOBS ─── */}
          {view==="jobs"&&(
            <div style={{maxWidth:800}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{activeJ.length} active · Pipeline {f$(jobs.reduce((s,j)=>s+j.bid,0))}</div>
                <button onClick={()=>setView("estimate")} style={{fontFamily:"inherit",fontSize:11,padding:"6px 14px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",background:"transparent",color:"rgba(255,255,255,0.4)",cursor:"pointer"}}>+ New Estimate</button>
              </div>
              {jobs.length===0?(
                <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.1)"}}>
                  <div style={{fontSize:11,marginBottom:8}}>No jobs yet</div>
                  <div style={{fontSize:10}}>Create an estimate to get started</div>
                </div>
              ):(
                <div>
                  {jobs.map((j,i)=>(
                    <div key={j.id} className="ws-row" style={{display:"flex",alignItems:"center",padding:"10px 12px",borderRadius:6,gap:12,borderBottom:"1px solid rgba(255,255,255,0.02)",transition:"background 0.1s"}}>
                      <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,
                        background:j.status==="Paid"?"#22c55e":j.status==="In Progress"?"#f5a623":j.status==="Complete"?"#3b82f6":"rgba(255,255,255,0.08)"}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,color:"#c9cdd8"}}>{j.trade}{j.city?` · ${j.city}`:""}</div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,0.12)",marginTop:1}}>{j.id}</div>
                      </div>
                      <span style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontVariantNumeric:"tabular-nums",minWidth:90,textAlign:"right"}}>{f$(j.bid)}</span>
                      <select value={j.status} onChange={e=>{const s=[...jobs];s[i]={...s[i],status:e.target.value};setJobs(s)}}
                        style={{fontFamily:"inherit",fontSize:10,background:"transparent",color:j.status==="Paid"?"#22c55e":j.status==="In Progress"?"#f5a623":"rgba(255,255,255,0.25)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:4,padding:"3px 6px",cursor:"pointer",minWidth:85}}>
                        {["Estimated","Proposed","Accepted","Scheduled","In Progress","Complete","Invoiced","Paid","Archived"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── CREW ─── */}
          {view==="crew"&&(
            <div style={{maxWidth:600}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
                <button onClick={()=>{const n=prompt("Name:");if(!n)return;const r=prompt("Role (Foreman/Operator/Laborer):")||"Laborer";setCrew(p=>[...p,{id:Date.now(),name:n,role:r,status:"Available"}])}}
                  style={{fontFamily:"inherit",fontSize:11,padding:"6px 14px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",background:"transparent",color:"rgba(255,255,255,0.4)",cursor:"pointer"}}>+ Add</button>
              </div>
              {crew.length===0?(
                <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.1)",fontSize:11}}>No crew members</div>
              ):crew.map((c,i)=>(
                <div key={c.id} className="ws-row" style={{display:"flex",alignItems:"center",padding:"10px 12px",borderRadius:6,gap:12,borderBottom:"1px solid rgba(255,255,255,0.02)"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:c.status==="Available"?"#22c55e":c.status==="On Job"?"#f5a623":"rgba(255,255,255,0.1)",flexShrink:0}}/>
                  <div style={{flex:1}}><div style={{fontSize:12,color:"#c9cdd8"}}>{c.name}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.15)"}}>{c.role}</div></div>
                  <select value={c.status} onChange={e=>{const s=[...crew];s[i]={...s[i],status:e.target.value};setCrew(s)}}
                    style={{fontFamily:"inherit",fontSize:10,background:"transparent",color:c.status==="Available"?"#22c55e":c.status==="On Job"?"#f5a623":"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:4,padding:"3px 6px",cursor:"pointer"}}>
                    {["Available","On Job","Off","Vacation","Terminated"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>setCrew(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:"rgba(255,255,255,0.1)",cursor:"pointer",fontSize:14,padding:4}}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* ─── EQUIPMENT ─── */}
          {view==="equipment"&&(
            <div style={{maxWidth:600}}>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
                <button onClick={()=>{const n=prompt("Equipment name:");if(!n)return;const t=prompt("Type (Paver/Roller/Truck/Skid Steer/Other):")||"Other";setEqp(p=>[...p,{id:Date.now(),name:n,type:t,status:"Available"}])}}
                  style={{fontFamily:"inherit",fontSize:11,padding:"6px 14px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",background:"transparent",color:"rgba(255,255,255,0.4)",cursor:"pointer"}}>+ Add</button>
              </div>
              {eqp.length===0?(
                <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,0.1)",fontSize:11}}>No equipment tracked</div>
              ):eqp.map((e,i)=>(
                <div key={e.id} className="ws-row" style={{display:"flex",alignItems:"center",padding:"10px 12px",borderRadius:6,gap:12,borderBottom:"1px solid rgba(255,255,255,0.02)"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:e.status==="Available"?"#22c55e":e.status==="On Job"?"#f5a623":e.status==="Down"?"#ef4444":"rgba(255,255,255,0.1)",flexShrink:0}}/>
                  <div style={{flex:1}}><div style={{fontSize:12,color:"#c9cdd8"}}>{e.name}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.15)"}}>{e.type}</div></div>
                  <select value={e.status} onChange={ev=>{const s=[...eqp];s[i]={...s[i],status:ev.target.value};setEqp(s)}}
                    style={{fontFamily:"inherit",fontSize:10,background:"transparent",color:e.status==="Available"?"#22c55e":e.status==="On Job"?"#f5a623":e.status==="Down"?"#ef4444":"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:4,padding:"3px 6px",cursor:"pointer"}}>
                    {["Available","On Job","Maintenance","Down","Retired"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>setEqp(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:"rgba(255,255,255,0.1)",cursor:"pointer",fontSize:14,padding:4}}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ COMMAND PALETTE ═══ */}
      {cmdOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"20vh"}} onClick={()=>setCmdOpen(false)}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}}/>
          <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:"100%",maxWidth:480,background:"#0e1018",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
            <input ref={cmdRef} value={jI} onChange={e=>setJI(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&jI.trim()){cmdExec(jI.trim())}if(e.key==="Escape")setCmdOpen(false)}}
              placeholder="Ask Jarvis or type /home, /jobs, /estimate..."
              style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.04)",color:"#e0e2e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:14,padding:"16px 20px",outline:"none"}}/>
            <div style={{padding:8}}>
              {[{l:"Go to Home",c:"/home"},{l:"New Estimate",c:"/estimate"},{l:"Ask Jarvis",c:"/jarvis"},{l:"View Jobs",c:"/jobs"},{l:"Manage Crew",c:"/crew"},{l:"Equipment",c:"/equipment"}].map(s=>(
                <button key={s.c} onClick={()=>cmdExec(s.c)} className="ws-nav" style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:5,border:"none",background:"transparent",color:"rgba(255,255,255,0.4)",fontFamily:"inherit",fontSize:12,cursor:"pointer"}}>
                  {s.l} <span style={{float:"right",fontSize:9,color:"rgba(255,255,255,0.1)"}}>{s.c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
